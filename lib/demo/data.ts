// ============================================
// Demo Data — Mock data voor de demo pagina
// Exact dezelfde shape als de echte portal data
// ============================================

export const DEMO_TENANT = {
  name: "Acme Analytics",
  slug: "demo",
  logoUrl: null as string | null,
  primary_color: "#1E3A5F",
  accent_color: "#F59E0B",
};

export const DEMO_USER = {
  name: "Jan Demo",
  email: "jan@demo.nl",
  role: "viewer" as const,
};

interface DemoReport {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
}

interface DemoWorkspace {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  reports: DemoReport[];
}

export const DEMO_WORKSPACES: DemoWorkspace[] = [
  {
    id: "ws-sales",
    name: "Sales & Revenue",
    thumbnailUrl: null,
    reports: [
      {
        id: "rpt-revenue",
        title: "Omzet Dashboard",
        description: "Maandelijkse omzet, trends en KPI's per regio",
        category: "Finance",
      },
      {
        id: "rpt-pipeline",
        title: "Pipeline Analyse",
        description: "Sales funnel, conversie en forecast",
        category: "Sales",
      },
      {
        id: "rpt-klant",
        title: "Klantanalyse",
        description: "Top klanten, segmentatie en retentie",
        category: "Sales",
      },
    ],
  },
  {
    id: "ws-operations",
    name: "Operations",
    thumbnailUrl: null,
    reports: [
      {
        id: "rpt-supply",
        title: "Supply Chain Monitor",
        description: "Leveranciers, doorlooptijden en voorraad",
        category: "Logistiek",
      },
      {
        id: "rpt-quality",
        title: "Kwaliteitsrapportage",
        description: "Kwaliteitsmetingen, afkeurpercentages en trends",
        category: "Productie",
      },
      {
        id: "rpt-fleet",
        title: "Vlootbeheer",
        description: "Wagenpark, onderhoud en kostenanalyse",
        category: "Logistiek",
      },
      {
        id: "rpt-planning",
        title: "Capaciteitsplanning",
        description: "Bezettingsgraad, planning en forecast",
        category: "Productie",
      },
    ],
  },
  {
    id: "ws-hr",
    name: "HR & People",
    thumbnailUrl: null,
    reports: [
      {
        id: "rpt-headcount",
        title: "Headcount Overzicht",
        description: "FTE, in- en uitstroom per afdeling",
        category: "HR",
      },
      {
        id: "rpt-satisfaction",
        title: "Medewerkerstevredenheid",
        description: "eNPS scores, enqueteresultaten en trends",
        category: "HR",
      },
      {
        id: "rpt-absence",
        title: "Verzuimanalyse",
        description: "Ziekteverzuim, meldfrequentie en kosten",
        category: "HR",
      },
    ],
  },
];

// ─── Mock pages voor de ReportViewer ───
export const DEMO_REPORT_PAGES = [
  { name: "page-overview", displayName: "Overzicht" },
  { name: "page-detail", displayName: "Detailanalyse" },
  { name: "page-trends", displayName: "Trends" },
  { name: "page-source", displayName: "Brondata" },
];

// ─── Mock KPI data ───
export const DEMO_KPIS = [
  { label: "Omzet", value: "€ 2.4M", change: "+12%", positive: true },
  { label: "Orders", value: "1.847", change: "+8%", positive: true },
  { label: "Gem. orderwaarde", value: "€ 1.298", change: "+3%", positive: true },
  { label: "Retourpercentage", value: "2.1%", change: "-0.4%", positive: true },
];
