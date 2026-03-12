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
  Info,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  DollarSign,
  Target,
  Clock,
  Package,
  UserCheck,
  Smile,
  AlertCircle,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { WorkspaceCard } from "@/components/portal/WorkspaceCard";
import { DEMO_TENANT, DEMO_USER, DEMO_WORKSPACES } from "@/lib/demo/data";
import { getDemoThemeCSS } from "@/lib/demo/theme";

type DemoView = "intro" | "home" | "workspace" | "report";

// ─── Report-specific mock data per report type ───
const REPORT_VISUALS: Record<
  string,
  {
    kpis: { label: string; value: string; change: string; positive: boolean; icon: React.ElementType }[];
    chartTitle: string;
    chartType: "bar" | "funnel" | "donut" | "stacked" | "timeline";
    chartData: number[];
    chartLabels: string[];
    tableTitle: string;
    tableHeaders: string[];
    tableRows: string[][];
    accent: string;
  }
> = {
  "rpt-revenue": {
    kpis: [
      { label: "Totale Omzet", value: "€ 2.4M", change: "+12%", positive: true, icon: DollarSign },
      { label: "Orders", value: "1.847", change: "+8%", positive: true, icon: Package },
      { label: "Gem. Orderwaarde", value: "€ 1.298", change: "+3%", positive: true, icon: TrendingUp },
      { label: "Retour %", value: "2.1%", change: "-0.4%", positive: true, icon: ArrowUpRight },
    ],
    chartTitle: "Omzet per maand (x €1.000)",
    chartType: "bar",
    chartData: [65, 72, 58, 80, 75, 90, 85, 92, 78, 95, 88, 100],
    chartLabels: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
    tableTitle: "Top 5 producten",
    tableHeaders: ["Product", "Omzet", "Aantal", "Marge"],
    tableRows: [
      ["Enterprise Suite", "€ 890K", "245", "42%"],
      ["Professional Plan", "€ 540K", "890", "38%"],
      ["Analytics Add-on", "€ 320K", "1.200", "65%"],
      ["Starter Pack", "€ 280K", "2.100", "28%"],
      ["Custom Integration", "€ 180K", "52", "55%"],
    ],
    accent: "#1E3A5F",
  },
  "rpt-pipeline": {
    kpis: [
      { label: "Pipeline Waarde", value: "€ 4.8M", change: "+18%", positive: true, icon: Target },
      { label: "Open Deals", value: "127", change: "+12", positive: true, icon: FileBarChart },
      { label: "Conversieratio", value: "24%", change: "+2%", positive: true, icon: TrendingUp },
      { label: "Gem. Dealgrootte", value: "€ 38K", change: "+5%", positive: true, icon: DollarSign },
    ],
    chartTitle: "Sales Funnel",
    chartType: "funnel",
    chartData: [100, 72, 45, 28, 18],
    chartLabels: ["Leads", "Gekwalificeerd", "Voorstel", "Onderhandeling", "Gewonnen"],
    tableTitle: "Deals in onderhandeling",
    tableHeaders: ["Bedrijf", "Waarde", "Fase", "Kans"],
    tableRows: [
      ["TechCorp BV", "€ 125K", "Onderhandeling", "80%"],
      ["DataFlow NL", "€ 89K", "Voorstel", "60%"],
      ["CloudFirst", "€ 67K", "Onderhandeling", "75%"],
      ["Digital Works", "€ 45K", "Gekwalificeerd", "40%"],
      ["Smart Solutions", "€ 38K", "Voorstel", "55%"],
    ],
    accent: "#059669",
  },
  "rpt-klant": {
    kpis: [
      { label: "Actieve Klanten", value: "342", change: "+15", positive: true, icon: Users },
      { label: "NPS Score", value: "72", change: "+4", positive: true, icon: Smile },
      { label: "Retentie", value: "94%", change: "+1.2%", positive: true, icon: UserCheck },
      { label: "Churn Rate", value: "1.8%", change: "-0.3%", positive: true, icon: TrendingDown },
    ],
    chartTitle: "Klantsegmentatie",
    chartType: "donut",
    chartData: [45, 30, 15, 10],
    chartLabels: ["Enterprise", "Professional", "Starter", "Free Trial"],
    tableTitle: "Top klanten op omzet",
    tableHeaders: ["Klant", "Segment", "Omzet YTD", "Groei"],
    tableRows: [
      ["Koninklijke Ahold", "Enterprise", "€ 280K", "+22%"],
      ["Bol.com", "Enterprise", "€ 195K", "+15%"],
      ["Coolblue", "Professional", "€ 120K", "+8%"],
      ["Picnic", "Professional", "€ 95K", "+31%"],
      ["Thuisbezorgd", "Enterprise", "€ 88K", "+12%"],
    ],
    accent: "#7C3AED",
  },
  "rpt-supply": {
    kpis: [
      { label: "Leveranciers", value: "48", change: "+3", positive: true, icon: Package },
      { label: "Gem. Doorlooptijd", value: "4.2d", change: "-0.8d", positive: true, icon: Clock },
      { label: "On-time Delivery", value: "96%", change: "+2%", positive: true, icon: TrendingUp },
      { label: "Backorders", value: "12", change: "-5", positive: true, icon: AlertCircle },
    ],
    chartTitle: "Leveranciersprestatie (afgelopen 6 maanden)",
    chartType: "stacked",
    chartData: [85, 88, 92, 90, 94, 96],
    chartLabels: ["Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
    tableTitle: "Top leveranciers",
    tableHeaders: ["Leverancier", "Categorie", "Score", "Doorlooptijd"],
    tableRows: [
      ["Van Dijk Logistics", "Transport", "98%", "2.1 dagen"],
      ["MakerSpace BV", "Onderdelen", "95%", "3.5 dagen"],
      ["TechSupply NL", "Elektronica", "93%", "4.0 dagen"],
      ["PackRight", "Verpakking", "91%", "1.8 dagen"],
      ["RawMaterials EU", "Grondstoffen", "88%", "6.2 dagen"],
    ],
    accent: "#0891B2",
  },
  "rpt-headcount": {
    kpis: [
      { label: "Totaal FTE", value: "247", change: "+12", positive: true, icon: Users },
      { label: "Instroom", value: "18", change: "Q4", positive: true, icon: ArrowUpRight },
      { label: "Uitstroom", value: "6", change: "Q4", positive: false, icon: TrendingDown },
      { label: "Open Vacatures", value: "14", change: "+3", positive: false, icon: Target },
    ],
    chartTitle: "FTE ontwikkeling per kwartaal",
    chartType: "bar",
    chartData: [210, 218, 225, 230, 238, 247],
    chartLabels: ["Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"],
    tableTitle: "Headcount per afdeling",
    tableHeaders: ["Afdeling", "FTE", "Open", "Budget"],
    tableRows: [
      ["Engineering", "82", "5", "€ 8.2M"],
      ["Sales & Marketing", "54", "3", "€ 4.1M"],
      ["Operations", "48", "2", "€ 3.2M"],
      ["Finance & Admin", "35", "1", "€ 2.8M"],
      ["HR & People", "28", "3", "€ 2.1M"],
    ],
    accent: "#8B5CF6",
  },
  "rpt-satisfaction": {
    kpis: [
      { label: "eNPS Score", value: "+42", change: "+6", positive: true, icon: Smile },
      { label: "Response Rate", value: "87%", change: "+4%", positive: true, icon: UserCheck },
      { label: "Tevredenheid", value: "4.2/5", change: "+0.3", positive: true, icon: TrendingUp },
      { label: "Verbeterpunten", value: "3", change: "-2", positive: true, icon: Target },
    ],
    chartTitle: "eNPS trend per kwartaal",
    chartType: "timeline",
    chartData: [28, 32, 35, 38, 36, 42],
    chartLabels: ["Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"],
    tableTitle: "Scores per categorie",
    tableHeaders: ["Categorie", "Score", "Trend", "Benchmark"],
    tableRows: [
      ["Werkomgeving", "4.5", "+0.4", "4.0"],
      ["Management", "3.9", "+0.2", "3.8"],
      ["Doorgroeimogelijkheden", "3.6", "+0.1", "3.5"],
      ["Werk-privé balans", "4.3", "+0.5", "3.9"],
      ["Teamsfeer", "4.6", "+0.3", "4.1"],
    ],
    accent: "#EC4899",
  },
};

// Fallback for reports without specific visuals
const DEFAULT_VISUALS = REPORT_VISUALS["rpt-revenue"];

// ─── Pages per report type ───
const REPORT_PAGES: Record<string, { name: string; displayName: string }[]> = {
  "rpt-revenue": [
    { name: "overview", displayName: "Overzicht" },
    { name: "detail", displayName: "Per Regio" },
    { name: "trends", displayName: "Trends" },
    { name: "products", displayName: "Producten" },
  ],
  "rpt-pipeline": [
    { name: "funnel", displayName: "Funnel" },
    { name: "deals", displayName: "Dealoverzicht" },
    { name: "forecast", displayName: "Forecast" },
  ],
  "rpt-klant": [
    { name: "overview", displayName: "Klantoverzicht" },
    { name: "segments", displayName: "Segmenten" },
    { name: "retention", displayName: "Retentie" },
  ],
  "rpt-supply": [
    { name: "dashboard", displayName: "Dashboard" },
    { name: "suppliers", displayName: "Leveranciers" },
    { name: "performance", displayName: "Prestaties" },
  ],
  "rpt-headcount": [
    { name: "overview", displayName: "Overzicht" },
    { name: "departments", displayName: "Afdelingen" },
    { name: "recruitment", displayName: "Werving" },
  ],
  "rpt-satisfaction": [
    { name: "enps", displayName: "eNPS" },
    { name: "scores", displayName: "Scores" },
    { name: "verbeterpunten", displayName: "Actiepunten" },
  ],
};

const DEFAULT_PAGES = [
  { name: "overview", displayName: "Overzicht" },
  { name: "detail", displayName: "Detail" },
  { name: "trends", displayName: "Trends" },
];

export default function DemoPage() {
  const [view, setView] = useState<DemoView>("intro");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("overview");

  const selectedWorkspace = DEMO_WORKSPACES.find((ws) => ws.id === selectedWorkspaceId);
  const selectedReport = selectedWorkspace?.reports.find((r) => r.id === selectedReportId);
  const reportVisuals = selectedReportId ? (REPORT_VISUALS[selectedReportId] || DEFAULT_VISUALS) : DEFAULT_VISUALS;
  const reportPages = selectedReportId ? (REPORT_PAGES[selectedReportId] || DEFAULT_PAGES) : DEFAULT_PAGES;

  // CTA overlay na 3 seconden in report view
  useEffect(() => {
    if (view !== "report") {
      setShowCTA(false);
      return;
    }
    const timer = setTimeout(() => setShowCTA(true), 3000);
    return () => clearTimeout(timer);
  }, [view]);

  const handleWorkspaceClick = useCallback((workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setView("workspace");
  }, []);

  const handleReportClick = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setActivePage(REPORT_PAGES[reportId]?.[0]?.name || "overview");
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

  function handleStartDemo() {
    setView("home");
  }

  const activePageIndex = reportPages.findIndex((p) => p.name === activePage);

  return (
    <>
      {/* Demo theme injection */}
      <style dangerouslySetInnerHTML={{ __html: getDemoThemeCSS() }} />

      {/* ─── INTRO VIEW ─── */}
      {view === "intro" && (
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Eye className="w-4 h-4" />
                Interactieve demo
              </div>
              <h1 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-bold text-text-primary mb-6">
                Ervaar DashPortal zelf
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed">
                DashPortal is een portaal waarmee je Power BI rapporten deelt met
                klanten en collega&apos;s. Geen Microsoft-accounts nodig, volledig in
                jouw huisstijl. Hieronder zie je hoe het er voor jouw eindgebruikers
                uitziet.
              </p>
            </div>

            {/* Wat je gaat zien */}
            <div className="max-w-4xl mx-auto mb-14">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    icon: Globe,
                    title: "Werkruimtes",
                    description:
                      "Je klanten loggen in en zien hun werkruimtes — overzichtelijk geordend met visuele tegels.",
                  },
                  {
                    step: "2",
                    icon: BarChart3,
                    title: "Rapporten",
                    description:
                      "Per werkruimte staan de beschikbare Power BI rapporten — met titel, omschrijving en thumbnail.",
                  },
                  {
                    step: "3",
                    icon: Eye,
                    title: "Interactief bekijken",
                    description:
                      "Het rapport opent volledig ingebed — inclusief filters, slicers en paginanavigatie.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="bg-surface border border-border rounded-xl p-6 text-center"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info callout */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex gap-4">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-text-primary font-medium mb-1">
                    Dit is een demo-omgeving
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    De rapporten hieronder bevatten fictieve data. In werkelijkheid
                    worden hier jouw eigen Power BI rapporten getoond, volledig
                    interactief en met Row-Level Security. Alles draait op jouw eigen
                    domein in jouw huisstijl.
                  </p>
                </div>
              </div>
            </div>

            {/* Start button */}
            <div className="text-center">
              <button
                onClick={handleStartDemo}
                className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-4 h-4" />
                Start de demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-text-secondary mt-3">
                Navigeer vrij door werkruimtes en rapporten
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── INTERACTIVE DEMO ─── */}
      {view !== "intro" && (
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

          {/* ─── VIEW: Report ─── */}
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

              {/* Report viewer with sidebar */}
              <div className="flex-1 flex min-h-0 relative">
                {/* Pagina sidebar */}
                <aside
                  className={`bg-surface border-r border-border flex flex-col shrink-0 transition-all duration-200 ease-in-out ${
                    sidebarOpen ? "w-56" : "w-0 overflow-hidden border-r-0"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <FileBarChart className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-medium uppercase tracking-wider truncate">
                        Pagina&apos;s
                      </span>
                    </div>
                  </div>
                  <nav className="flex-1 overflow-y-auto py-2">
                    {reportPages.map((page, index) => (
                      <button
                        key={page.name}
                        onClick={() => setActivePage(page.name)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center gap-3 group ${
                          activePage === page.name
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                            : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary border-l-2 border-transparent"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded text-xs flex items-center justify-center shrink-0 ${
                            activePage === page.name
                              ? "bg-primary text-white"
                              : "bg-surface-secondary text-text-secondary group-hover:bg-border"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="truncate">{page.displayName}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="px-3 py-2 border-t border-border flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (activePageIndex > 0) setActivePage(reportPages[activePageIndex - 1].name);
                      }}
                      disabled={activePageIndex <= 0}
                      className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-text-secondary" />
                    </button>
                    <span className="text-xs text-text-secondary">
                      {activePageIndex + 1} / {reportPages.length}
                    </span>
                    <button
                      onClick={() => {
                        if (activePageIndex < reportPages.length - 1) setActivePage(reportPages[activePageIndex + 1].name);
                      }}
                      disabled={activePageIndex >= reportPages.length - 1}
                      className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </aside>

                {/* Canvas area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-surface/80 backdrop-blur border border-border/50 hover:bg-surface-secondary transition-colors"
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <PanelLeft className="w-4 h-4 text-text-secondary" />
                    )}
                  </button>

                  {/* Mock Power BI content — unique per report */}
                  <div className="flex-1 bg-[#F3F2F1] p-6 overflow-auto">
                    <div className="max-w-6xl mx-auto space-y-6">
                      {/* Report titel */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {selectedReport.title}
                        </h2>
                        <span className="text-xs text-gray-500">
                          Laatst bijgewerkt: vandaag, 09:30
                        </span>
                      </div>

                      {/* KPI kaarten — unique per report */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {reportVisuals.kpis.map((kpi) => (
                          <div
                            key={kpi.label}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <kpi.icon className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-xs text-gray-500">{kpi.label}</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {kpi.value}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {kpi.positive ? (
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-500" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  kpi.positive ? "text-emerald-600" : "text-red-600"
                                }`}
                              >
                                {kpi.change}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chart — different type per report */}
                      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                          {reportVisuals.chartTitle}
                        </h3>
                        {reportVisuals.chartType === "bar" && (
                          <>
                            <div className="h-48 flex items-end gap-2">
                              {reportVisuals.chartData.map((h, i) => (
                                <div
                                  key={i}
                                  className="flex-1 rounded-t transition-all hover:opacity-80"
                                  style={{
                                    height: `${h}%`,
                                    backgroundColor:
                                      i === reportVisuals.chartData.length - 1
                                        ? reportVisuals.accent
                                        : `${reportVisuals.accent}30`,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                              {reportVisuals.chartLabels.map((l) => (
                                <span key={l}>{l}</span>
                              ))}
                            </div>
                          </>
                        )}
                        {reportVisuals.chartType === "funnel" && (
                          <div className="space-y-2 py-2">
                            {reportVisuals.chartData.map((value, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-28 text-right shrink-0">
                                  {reportVisuals.chartLabels[i]}
                                </span>
                                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                                  <div
                                    className="h-full rounded-full flex items-center justify-end pr-3 transition-all"
                                    style={{
                                      width: `${value}%`,
                                      backgroundColor: `${reportVisuals.accent}${Math.round(40 + (i / reportVisuals.chartData.length) * 60).toString(16).padStart(2, "0")}`,
                                    }}
                                  >
                                    <span className="text-xs font-medium text-white">
                                      {value}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {reportVisuals.chartType === "donut" && (
                          <div className="flex items-center gap-8">
                            <div className="relative w-44 h-44 shrink-0">
                              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                {(() => {
                                  const colors = ["#7C3AED", "#A78BFA", "#C4B5FD", "#E9D5FF"];
                                  let cumulative = 0;
                                  const total = reportVisuals.chartData.reduce((a, b) => a + b, 0);
                                  return reportVisuals.chartData.map((value, i) => {
                                    const percent = (value / total) * 100;
                                    const dashArray = `${percent * 2.51327} ${251.327}`;
                                    const dashOffset = -(cumulative / 100) * 251.327;
                                    cumulative += percent;
                                    return (
                                      <circle
                                        key={i}
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke={colors[i]}
                                        strokeWidth="20"
                                        strokeDasharray={dashArray}
                                        strokeDashoffset={dashOffset}
                                      />
                                    );
                                  });
                                })()}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-gray-900">342</p>
                                  <p className="text-[10px] text-gray-500">klanten</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 flex-1">
                              {reportVisuals.chartLabels.map((label, i) => {
                                const colors = ["#7C3AED", "#A78BFA", "#C4B5FD", "#E9D5FF"];
                                return (
                                  <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: colors[i] }}
                                      />
                                      <span className="text-sm text-gray-700">{label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {reportVisuals.chartData[i]}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {reportVisuals.chartType === "stacked" && (
                          <>
                            <div className="h-48 flex items-end gap-3">
                              {reportVisuals.chartData.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-stretch gap-0.5">
                                  <div
                                    className="rounded-t transition-all hover:opacity-80"
                                    style={{
                                      height: `${h * 0.48}%`,
                                      backgroundColor: reportVisuals.accent,
                                    }}
                                  />
                                  <div
                                    className="transition-all hover:opacity-80"
                                    style={{
                                      height: `${(100 - h) * 0.48}%`,
                                      backgroundColor: "#FCA5A5",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                              {reportVisuals.chartLabels.map((l) => (
                                <span key={l}>{l}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: reportVisuals.accent }} />
                                <span className="text-xs text-gray-500">Op tijd</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-red-300" />
                                <span className="text-xs text-gray-500">Vertraagd</span>
                              </div>
                            </div>
                          </>
                        )}
                        {reportVisuals.chartType === "timeline" && (
                          <>
                            <div className="h-48 relative">
                              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                                {/* Grid lines */}
                                {[0, 50, 100, 150, 200].map((y) => (
                                  <line
                                    key={y}
                                    x1="0" y1={y} x2="600" y2={y}
                                    stroke="#E5E7EB" strokeWidth="1"
                                  />
                                ))}
                                {/* Line */}
                                <polyline
                                  fill="none"
                                  stroke={reportVisuals.accent}
                                  strokeWidth="3"
                                  strokeLinejoin="round"
                                  points={reportVisuals.chartData
                                    .map((v, i) => {
                                      const x = (i / (reportVisuals.chartData.length - 1)) * 560 + 20;
                                      const maxVal = Math.max(...reportVisuals.chartData);
                                      const y = 180 - (v / maxVal) * 160;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                />
                                {/* Dots */}
                                {reportVisuals.chartData.map((v, i) => {
                                  const x = (i / (reportVisuals.chartData.length - 1)) * 560 + 20;
                                  const maxVal = Math.max(...reportVisuals.chartData);
                                  const y = 180 - (v / maxVal) * 160;
                                  return (
                                    <circle
                                      key={i}
                                      cx={x} cy={y} r="5"
                                      fill="white"
                                      stroke={reportVisuals.accent}
                                      strokeWidth="2.5"
                                    />
                                  );
                                })}
                              </svg>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                              {reportVisuals.chartLabels.map((l) => (
                                <span key={l}>{l}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Tabel — unique per report */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="text-sm font-medium text-gray-700">
                            {reportVisuals.tableTitle}
                          </h3>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {reportVisuals.tableHeaders.map((header, i) => (
                                <th
                                  key={header}
                                  className={`${i === 0 ? "text-left" : "text-right"} px-4 py-2 text-xs font-medium text-gray-500`}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reportVisuals.tableRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-gray-50">
                                {row.map((cell, cellIdx) => (
                                  <td
                                    key={cellIdx}
                                    className={`px-4 py-2.5 ${
                                      cellIdx === 0
                                        ? "text-gray-800"
                                        : cellIdx === row.length - 1
                                        ? "text-right text-emerald-600 font-medium"
                                        : "text-right text-gray-600"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

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
                          Dit is een demo met fictieve data. Start een gratis trial en
                          deel jouw eigen Power BI rapporten — volledig in je eigen
                          huisstijl, op je eigen domein.
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
            </div>
          )}

          {/* ─── VIEW: Workspace detail (report tiles) ─── */}
          {view === "workspace" && selectedWorkspace && (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <button
                onClick={handleBackToHome}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Alle werkruimtes
              </button>

              <div className="mb-6">
                <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                  {selectedWorkspace.name}
                </h1>
                <p className="text-text-secondary mt-1">
                  {selectedWorkspace.reports.length} rapport
                  {selectedWorkspace.reports.length !== 1 ? "en" : ""}
                </p>
              </div>

              {/* Info banner */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6 flex gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Rapporttegels:</span>{" "}
                  Elke tegel vertegenwoordigt een Power BI rapport. In het echte portaal zie je hier
                  je eigen thumbnails, titels en beschrijvingen — precies zoals je ze configureert in het
                  admin-dashboard.
                </p>
              </div>

              {/* Report tiles with custom thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedWorkspace.reports.map((report) => {
                  const vis = REPORT_VISUALS[report.id];
                  return (
                    <button
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all text-left group"
                    >
                      {/* Thumbnail with mini chart */}
                      <div
                        className="w-full h-36 p-4 flex items-end relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${vis?.accent || "#1E3A5F"}10, ${vis?.accent || "#1E3A5F"}05)`,
                        }}
                      >
                        {/* Mini bar chart in thumbnail */}
                        <div className="absolute bottom-3 left-3 right-3 h-16 flex items-end gap-1">
                          {(vis?.chartData || [65, 72, 58, 80, 75, 90])
                            .slice(0, 8)
                            .map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-t-sm"
                                style={{
                                  height: `${h}%`,
                                  backgroundColor: `${vis?.accent || "#1E3A5F"}${i === (vis?.chartData || []).slice(0, 8).length - 1 ? "60" : "25"}`,
                                }}
                              />
                            ))}
                        </div>
                        {/* Category badge */}
                        {report.category && (
                          <span
                            className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${vis?.accent || "#1E3A5F"}15`,
                              color: vis?.accent || "#1E3A5F",
                            }}
                          >
                            {report.category}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-text-primary text-sm group-hover:text-primary transition-colors">
                          {report.title}
                        </h3>
                        {report.description && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </main>
          )}

          {/* ─── VIEW: Home (workspace cards) ─── */}
          {view === "home" && (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <div className="mb-8">
                <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                  Werkruimtes
                </h1>
                <p className="text-text-secondary mt-1">
                  Kies een werkruimte om je rapporten te bekijken.
                </p>
              </div>

              {/* Info banner */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6 flex gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Zo werkt het:</span>{" "}
                  Dit is de startpagina die jouw klanten of collega&apos;s zien wanneer ze inloggen.
                  Werkruimtes komen rechtstreeks uit Power BI — je bepaalt zelf welke zichtbaar zijn.
                  Klik op een werkruimte om de rapporten te bekijken.
                </p>
              </div>

              {/* Workspace cards */}
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

              {/* Feature highlights — more concise and creative */}
              <div className="mt-16 mb-8">
                <div className="text-center mb-8">
                  <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
                    Wat je krijgt met DashPortal
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Alles wat je nodig hebt om Power BI rapporten professioneel te
                    delen
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
      )}
    </>
  );
}
