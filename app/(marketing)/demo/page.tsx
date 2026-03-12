"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Sparkles,
  Palette,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { WorkspaceCard } from "@/components/portal/WorkspaceCard";
import { TileGrid } from "@/components/portal/TileGrid";
import { MockReportViewer } from "@/components/portal/MockReportViewer";
import { DEMO_TENANT, DEMO_USER, DEMO_WORKSPACES } from "@/lib/demo/data";
import { getDemoThemeCSS } from "@/lib/demo/theme";

type DemoView = "home" | "workspace" | "report";

export default function DemoPage() {
  const [view, setView] = useState<DemoView>("home");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  const selectedWorkspace = DEMO_WORKSPACES.find(
    (ws) => ws.id === selectedWorkspaceId
  );
  const selectedReport = selectedWorkspace?.reports.find(
    (r) => r.id === selectedReportId
  );

  // CTA overlay na 2 seconden in report view
  useEffect(() => {
    if (view !== "report") {
      setShowCTA(false);
      return;
    }
    const timer = setTimeout(() => setShowCTA(true), 2000);
    return () => clearTimeout(timer);
  }, [view]);

  const handleWorkspaceClick = useCallback((workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setView("workspace");
  }, []);

  const handleReportClick = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setView("report");
  }, []);

  function handleBackToHome() {
    setView("home");
    setSelectedWorkspaceId(null);
    setSelectedReportId(null);
  }

  function handleBackToWorkspace() {
    setView("workspace");
    setSelectedReportId(null);
  }

  return (
    <>
      {/* Demo theme injection — zelfde patroon als tenant layout */}
      <style dangerouslySetInnerHTML={{ __html: getDemoThemeCSS() }} />

      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Demo banner */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-[var(--color-accent)]/80 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" />
              <p className="text-sm font-medium">
                Je bekijkt een demo-omgeving van DashPortal
              </p>
            </div>
            <Link
              href="/onboarding/plan"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              Start gratis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Echte PortalHeader met demo mode */}
        <PortalHeader
          tenant={DEMO_TENANT}
          user={DEMO_USER}
          demo
          badge="DEMO"
        />

        {/* ─── VIEW: Report (fullscreen sidebar + canvas) ─── */}
        {view === "report" && selectedReport && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Compact header bar */}
            <div className="h-12 border-b border-border bg-surface flex items-center px-4 gap-3 shrink-0">
              <button
                onClick={handleBackToWorkspace}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {selectedWorkspace?.name}
                </span>
              </button>
              <span className="text-border">/</span>
              <span className="text-sm font-medium text-text-primary truncate">
                {selectedReport.title}
              </span>
            </div>

            {/* MockReportViewer (sidebar + canvas) */}
            <div className="flex-1 flex min-h-0 relative">
              <MockReportViewer reportTitle={selectedReport.title} />

              {/* CTA overlay */}
              {showCTA && (
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center z-30">
                  <div className="bg-surface border border-border rounded-2xl shadow-xl p-8 mb-8 max-w-lg w-full mx-4 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
                      Bouw je eigen dataportaal
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">
                      Dit is een demo. Maak een gratis account aan en deel je
                      eigen Power BI rapporten via een eigen branded portaal.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/onboarding/plan">
                        <Button variant="primary" size="lg">
                          <Sparkles className="w-4 h-4" />
                          Start 14 dagen gratis
                        </Button>
                      </Link>
                      <button
                        onClick={() => setShowCTA(false)}
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Sluiten en verder kijken
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW: Workspace detail (report tiles) ─── */}
        {view === "workspace" && selectedWorkspace && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Terug navigatie */}
            <button
              onClick={handleBackToHome}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Alle werkruimtes
            </button>

            {/* Workspace header */}
            <div className="mb-6">
              <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                {selectedWorkspace.name}
              </h1>
              <p className="text-text-secondary mt-1">
                {selectedWorkspace.reports.length} rapport
                {selectedWorkspace.reports.length !== 1 ? "en" : ""}
              </p>
            </div>

            {/* Report tiles (echte TileGrid component) */}
            <TileGrid
              reports={selectedWorkspace.reports}
              tenantSlug="demo"
              onReportClick={handleReportClick}
            />
          </main>
        )}

        {/* ─── VIEW: Home (workspace cards) ─── */}
        {view === "home" && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Welkom */}
            <div className="mb-8">
              <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                Werkruimtes
              </h1>
              <p className="text-text-secondary mt-1">
                Kies een werkruimte om je rapporten te bekijken.
              </p>
            </div>

            {/* Workspace cards (echte WorkspaceCard component) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEMO_WORKSPACES.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  id={ws.id}
                  name={ws.name}
                  thumbnailUrl={ws.thumbnailUrl}
                  reportCount={ws.reports.length}
                  tenantSlug="demo"
                  onClick={() => handleWorkspaceClick(ws.id)}
                />
              ))}
            </div>

            {/* Feature highlights */}
            <div className="mt-16 mb-8">
              <div className="text-center mb-8">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
                  Wat je krijgt met DashPortal
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Alles wat je nodig hebt om Power BI rapporten veilig te delen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Palette,
                    title: "Eigen branding",
                    description:
                      "Je eigen logo, kleuren en domein. Je klanten zien jouw merk, niet het onze.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Row-level security",
                    description:
                      "Elke gebruiker ziet alleen de data die voor hem bedoeld is, automatisch afgedwongen.",
                  },
                  {
                    icon: Eye,
                    title: "Volledig interactief",
                    description:
                      "Power BI rapporten volledig ingebed — klikken, filteren en exporteren werkt gewoon.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-surface border border-border rounded-xl p-6"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <div className="text-center mt-10">
                <Link href="/onboarding/plan">
                  <Button variant="primary" size="lg">
                    Start je eigen portaal — 14 dagen gratis
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-text-secondary mt-3">
                  Geen creditcard nodig — binnen 5 minuten live
                </p>
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
}
