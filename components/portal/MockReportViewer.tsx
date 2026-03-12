"use client";

import { useState } from "react";
import {
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { DEMO_REPORT_PAGES, DEMO_KPIS } from "@/lib/demo/data";

interface MockReportViewerProps {
  reportTitle: string;
}

export function MockReportViewer({ reportTitle }: MockReportViewerProps) {
  const [activePage, setActivePage] = useState(DEMO_REPORT_PAGES[0].name);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeIndex = DEMO_REPORT_PAGES.findIndex(
    (p) => p.name === activePage
  );

  function navigateToPage(pageName: string) {
    setActivePage(pageName);
  }

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
          {DEMO_REPORT_PAGES.map((page, index) => (
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
        <div className="px-3 py-2 border-t border-border flex items-center justify-between">
          <button
            onClick={() => {
              if (activeIndex > 0)
                navigateToPage(DEMO_REPORT_PAGES[activeIndex - 1].name);
            }}
            disabled={activeIndex === 0}
            className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Vorige pagina"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-xs text-text-secondary">
            {activeIndex + 1} / {DEMO_REPORT_PAGES.length}
          </span>
          <button
            onClick={() => {
              if (activeIndex < DEMO_REPORT_PAGES.length - 1)
                navigateToPage(DEMO_REPORT_PAGES[activeIndex + 1].name);
            }}
            disabled={activeIndex === DEMO_REPORT_PAGES.length - 1}
            className="p-1.5 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Volgende pagina"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
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

        {/* Mock Power BI content */}
        <div className="flex-1 bg-[#F3F2F1] p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Report titel */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {reportTitle}
              </h2>
              <span className="text-xs text-gray-500">
                Laatst bijgewerkt: vandaag, 09:30
              </span>
            </div>

            {/* KPI kaarten */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
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

            {/* Mock chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Omzet per maand
              </h3>
              <div className="h-48 flex items-end gap-2">
                {[65, 72, 58, 80, 75, 90, 85, 92, 78, 95, 88, 100].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${h}%`,
                        backgroundColor:
                          i === 11
                            ? DEMO_KPIS[0].positive
                              ? "#1E3A5F"
                              : "#ef4444"
                            : "#1E3A5F30",
                      }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                {[
                  "Jan",
                  "Feb",
                  "Mrt",
                  "Apr",
                  "Mei",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Okt",
                  "Nov",
                  "Dec",
                ].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Mock tabel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">
                  Top 5 producten
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      Product
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                      Omzet
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                      Aantal
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                      Marge
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Enterprise Suite", "€ 890K", "245", "42%"],
                    ["Professional Plan", "€ 540K", "890", "38%"],
                    ["Analytics Add-on", "€ 320K", "1.200", "65%"],
                    ["Starter Pack", "€ 280K", "2.100", "28%"],
                    ["Custom Integration", "€ 180K", "52", "55%"],
                  ].map(([product, revenue, count, margin]) => (
                    <tr key={product} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-800">{product}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700 font-medium">
                        {revenue}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        {count}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">
                        {margin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
