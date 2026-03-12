"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { MobileReportFallback } from "./MobileReportFallback";

interface ReportPage {
  name: string;
  displayName: string;
  isActive: boolean;
}

interface ReportViewerProps {
  reportId: string;
  tenantId: string;
  userId?: string;
  reportTitle?: string;
}

export function ReportViewer({
  reportId,
  tenantId,
  userId,
  reportTitle,
}: ReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const powerbiRef = useRef<InstanceType<
    typeof import("powerbi-client").service.Service
  > | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [activePage, setActivePage] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Mobiel detectie (< 768px) ───
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const embedReport = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        setPages([]);
        setActivePage("");

        // ─── 1. Embed token ophalen ───
        const response = await fetch("/api/embed-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, tenantId, userId }),
          signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Server fout (${response.status})`);
        }

        const { token, embedUrl, pbiReportId } = await response.json();

        // ─── 2. Validatie ───
        if (!token)
          throw new Error(
            "Embed token is leeg. Controleer de Power BI configuratie."
          );
        if (!embedUrl) throw new Error("Embed URL ontbreekt.");
        if (!pbiReportId) throw new Error("Power BI report ID ontbreekt.");
        if (signal.aborted) return;

        // ─── 3. Power BI SDK laden ───
        const pbi = await import("powerbi-client");
        const { models, factories, service: pbiService } = pbi;
        if (signal.aborted) return;

        // ─── 4. Bestaande embed opruimen ───
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // ─── 5. Power BI service + embed ───
        const powerbi = new pbiService.Service(
          factories.hpmFactory,
          factories.wpmpFactory,
          factories.routerFactory
        );
        powerbiRef.current = powerbi;

        const config = {
          type: "report",
          tokenType: models.TokenType.Embed,
          accessToken: token,
          embedUrl,
          id: pbiReportId,
          settings: {
            navContentPaneEnabled: false,
            filterPaneEnabled: false,
            panes: {
              filters: { visible: false },
              // Verberg Power BI's eigen pagina-tabbladen
              pageNavigation: { visible: false },
            },
            background: models.BackgroundType.Transparent,
          },
        };

        if (containerRef.current && !signal.aborted) {
          const report = powerbi.embed(
            containerRef.current,
            config
          ) as InstanceType<typeof pbi.Report>;
          reportRef.current = report;

          // ─── 6. Na laden: view registreren + pagina's ophalen ───
          report.on("loaded", async () => {
            if (signal.aborted) return;

            // Report view tracken (niet-blokkend)
            fetch("/api/report-views", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId, tenantId }),
            }).catch(() => { /* View tracking is niet kritiek */ });

            try {
              const reportPages = await report.getPages();
              const visiblePages = reportPages.filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p: any) => p.visibility !== 1
              );
              setPages(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                visiblePages.map((p: any) => ({
                  name: p.name,
                  displayName: p.displayName,
                  isActive: p.isActive,
                }))
              );
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const active = visiblePages.find((p: any) => p.isActive);
              if (active) setActivePage(active.name);
            } catch (err) {
              console.error("[ReportViewer] getPages error:", err);
            }
            setLoading(false);
          });

          // ─── 7. Pagina-wissel events luisteren ───
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          report.on("pageChanged", (event: any) => {
            const newPage = event?.detail?.newPage;
            if (newPage?.name) {
              setActivePage(newPage.name);
            }
          });

          report.on("error", (event: unknown) => {
            console.error("[ReportViewer] Report error:", event);
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("[ReportViewer] Embed fout:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Er ging iets mis bij het laden."
        );
        setLoading(false);
      }
    },
    [reportId, tenantId, userId]
  );

  // Pagina wisselen
  async function navigateToPage(pageName: string) {
    if (!reportRef.current) return;
    try {
      const reportPages = await reportRef.current.getPages();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetPage = reportPages.find((p: any) => p.name === pageName);
      if (targetPage) {
        await targetPage.setActive();
        setActivePage(pageName);
      }
    } catch (err) {
      console.error("[ReportViewer] Navigatie fout:", err);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    embedReport(controller.signal);

    return () => {
      controller.abort();
      if (powerbiRef.current && containerRef.current) {
        try {
          powerbiRef.current.reset(containerRef.current);
        } catch {
          // Ignore
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [embedReport]);

  // ─── Mobile fallback ───
  if (isMobile) {
    return <MobileReportFallback reportTitle={reportTitle || "Dit rapport"} />;
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface rounded-xl border border-border p-8">
        <AlertCircle className="w-10 h-10 text-danger mb-4" />
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
          Rapport kan niet worden geladen
        </h3>
        <p className="text-sm text-text-secondary text-center max-w-lg mb-4">
          {error}
        </p>
        <button
          onClick={() => {
            const controller = new AbortController();
            embedReport(controller.signal);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // ─── Main layout: sidebar + canvas ───
  return (
    <div className="flex flex-1 min-h-0 gap-0">
      {/* ─── Pagina sidebar ─── */}
      <aside
        className={`
          bg-surface border-r border-border flex flex-col shrink-0
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? "w-56" : "w-0 overflow-hidden border-r-0"}
        `}
      >
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-text-secondary">
            <FileBarChart className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wider truncate">
              Pagina&apos;s
            </span>
          </div>
        </div>

        {/* Pagina lijst */}
        <nav className="flex-1 overflow-y-auto py-2">
          {pages.length === 0 && !loading && (
            <p className="px-4 py-2 text-xs text-text-secondary">
              Geen pagina&apos;s gevonden
            </p>
          )}
          {pages.map((page, index) => (
            <button
              key={page.name}
              onClick={() => navigateToPage(page.name)}
              className={`
                w-full text-left px-4 py-2.5 text-sm transition-all duration-150
                flex items-center gap-3 group
                ${
                  activePage === page.name
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary border-l-2 border-transparent"
                }
              `}
            >
              <span
                className={`
                  w-5 h-5 rounded text-xs flex items-center justify-center shrink-0
                  ${
                    activePage === page.name
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-secondary group-hover:bg-border"
                  }
                `}
              >
                {index + 1}
              </span>
              <span className="truncate">{page.displayName}</span>
            </button>
          ))}
        </nav>

        {/* Quick page nav */}
        {pages.length > 1 && (
          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => {
                const idx = pages.findIndex((p) => p.name === activePage);
                if (idx > 0) navigateToPage(pages[idx - 1].name);
              }}
              disabled={
                pages.findIndex((p) => p.name === activePage) === 0
              }
              className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Vorige pagina"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="text-xs text-text-secondary">
              {pages.findIndex((p) => p.name === activePage) + 1} / {pages.length}
            </span>
            <button
              onClick={() => {
                const idx = pages.findIndex((p) => p.name === activePage);
                if (idx < pages.length - 1)
                  navigateToPage(pages[idx + 1].name);
              }}
              disabled={
                pages.findIndex((p) => p.name === activePage) ===
                pages.length - 1
              }
              className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Volgende pagina"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}
      </aside>

      {/* ─── Canvas area ─── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-surface/80 backdrop-blur border border-border/50 hover:bg-surface-secondary transition-colors"
          title={sidebarOpen ? "Sidebar verbergen" : "Sidebar tonen"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-text-secondary" />
          ) : (
            <PanelLeft className="w-4 h-4 text-text-secondary" />
          )}
        </button>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-sm text-text-secondary">
                Rapport laden...
              </span>
            </div>
          </div>
        )}

        {/* Power BI embed container */}
        <div
          ref={containerRef}
          className="flex-1 [&>iframe]:!w-full [&>iframe]:!h-full"
        />
      </div>
    </div>
  );
}
