"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  FileBarChart,
  Shield,
  Settings,
  UserPlus,
  UserMinus,
  Eye,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";

// ─── Types ───
interface ActivityItem {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ActivityLogProps {
  tenantId: string;
}

// ─── Action labels + icons ───
const ACTION_LABELS: Record<string, string> = {
  "user.invited": "Gebruiker uitgenodigd",
  "user.updated": "Gebruiker bijgewerkt",
  "user.deleted": "Gebruiker verwijderd",
  "user.activated": "Gebruiker geactiveerd",
  "user.deactivated": "Gebruiker gedeactiveerd",
  "access.granted": "Toegang verleend",
  "access.revoked": "Toegang ingetrokken",
  "report.synced": "Rapporten gesynchroniseerd",
  "report.viewed": "Rapport bekeken",
  "report.updated": "Rapport bijgewerkt",
  "tenant.updated": "Instellingen bijgewerkt",
  "workspace.updated": "Werkruimte bijgewerkt",
  "workspace.created": "Werkruimte aangemaakt",
  "rls.updated": "RLS-rollen bijgewerkt",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  "user.invited": UserPlus,
  "user.updated": User,
  "user.deleted": UserMinus,
  "user.activated": User,
  "user.deactivated": UserMinus,
  "access.granted": Shield,
  "access.revoked": Shield,
  "report.synced": FileBarChart,
  "report.viewed": Eye,
  "report.updated": FileBarChart,
  "tenant.updated": Settings,
  "workspace.updated": Settings,
  "workspace.created": Settings,
  "rls.updated": Shield,
};

// ─── Filter opties ───
const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Alle acties" },
  { value: "user.invited", label: "Gebruikers uitgenodigd" },
  { value: "user.updated", label: "Gebruikers bijgewerkt" },
  { value: "user.deactivated", label: "Gebruikers gedeactiveerd" },
  { value: "access.granted", label: "Toegang verleend" },
  { value: "access.revoked", label: "Toegang ingetrokken" },
  { value: "report.synced", label: "Rapporten gesynchroniseerd" },
  { value: "report.updated", label: "Rapporten bijgewerkt" },
  { value: "tenant.updated", label: "Instellingen bijgewerkt" },
];

export function ActivityLog({ tenantId }: ActivityLogProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const ITEMS_PER_PAGE = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) {
        // Einde van de dag meenemen
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        params.set("to", end.toISOString());
      }

      const res = await fetch(`/api/activity-log?${params}`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("[ActivityLog] Fout bij ophalen:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset pagina bij filter wijziging
  useEffect(() => {
    setPage(1);
  }, [actionFilter, dateFrom, dateTo]);

  // ─── CSV Export ───
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Haal alle items op (max 1000 voor export)
      const params = new URLSearchParams({
        tenantId,
        page: "1",
        limit: "1000",
      });
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        params.set("to", end.toISOString());
      }

      const res = await fetch(`/api/activity-log?${params}`);
      if (!res.ok) throw new Error("Export fetch failed");

      const data = await res.json();
      const exportItems = (data.items || []) as ActivityItem[];

      const csvData = exportItems.map((item) => ({
        Datum: new Date(item.created_at).toLocaleString("nl-NL"),
        Actie: ACTION_LABELS[item.action] || item.action,
        Gebruiker: item.actor?.name || item.actor?.email || "Systeem",
        Email: item.actor?.email || "",
        Doeltype: item.target_type || "",
        Details: formatMetadata(item.metadata),
      }));

      const csv = Papa.unparse(csvData, { delimiter: ";" });
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activiteitslog-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ActivityLog] Export fout:", err);
    } finally {
      setExporting(false);
    }
  };

  // ─── Helpers ───
  function formatMetadata(metadata: Record<string, unknown>): string {
    if (!metadata || Object.keys(metadata).length === 0) return "";
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Zojuist";
    if (minutes < 60) return `${minutes} min geleden`;
    if (hours < 24) return `${hours} uur geleden`;
    if (days < 7) return `${days} dagen geleden`;
    return formatDate(dateStr);
  }

  return (
    <div className="space-y-4">
      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Actie filter */}
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {ACTION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Datum filters */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Van"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Tot"
          />
        </div>

        {/* Export knop */}
        <button
          onClick={handleExportCSV}
          disabled={exporting || total === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export CSV
        </button>
      </div>

      {/* ─── Tabel ─── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-text-secondary/20 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {actionFilter || dateFrom || dateTo
                ? "Geen activiteiten gevonden met deze filters."
                : "Er zijn nog geen activiteiten geregistreerd."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">
                    Tijdstip
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">
                    Actie
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">
                    Uitgevoerd door
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const Icon =
                    ACTION_ICONS[item.action] || Clock;
                  const label =
                    ACTION_LABELS[item.action] || item.action;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-secondary/30 transition-colors"
                    >
                      {/* Tijdstip */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />
                          <div>
                            <p className="text-text-primary">
                              {formatDate(item.created_at)}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {formatTime(item.created_at)} &middot;{" "}
                              {getRelativeTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Actie */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-text-primary font-medium">
                            {label}
                          </span>
                        </div>
                      </td>

                      {/* Uitgevoerd door */}
                      <td className="px-4 py-3">
                        {item.actor ? (
                          <div>
                            <p className="text-text-primary">
                              {item.actor.name || "Onbekend"}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {item.actor.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-secondary">Systeem</span>
                        )}
                      </td>

                      {/* Details (metadata) */}
                      <td className="px-4 py-3">
                        {item.metadata &&
                        Object.keys(item.metadata).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(item.metadata).map(
                              ([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-secondary text-xs text-text-secondary"
                                >
                                  <span className="text-text-secondary/60 mr-1">
                                    {key}:
                                  </span>
                                  <span className="text-text-primary">
                                    {String(value)}
                                  </span>
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary/40">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Paginering ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {total} activiteit{total !== 1 ? "en" : ""} gevonden
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-primary font-medium px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
