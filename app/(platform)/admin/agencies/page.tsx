import { Building2, Users, Euro } from "lucide-react";
import Link from "next/link";
import { getAllAgenciesWithCounts } from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";

export default async function AdminAgenciesPage() {
  const agencies = await getAllAgenciesWithCounts();

  const totalClients = agencies.reduce((sum, a) => sum + a.client_count, 0);
  const totalUsers = agencies.reduce((sum, a) => sum + a.total_users, 0);
  const totalMRR = agencies.reduce((sum, a) => sum + a.monthly_revenue, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Agencies
        </h1>
        <p className="text-text-secondary mt-1">
          Overzicht van alle agency/reseller accounts op het platform.
        </p>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{agencies.length}</p>
            <p className="text-xs text-text-secondary">Agencies</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-accent)]/10">
            <Building2 className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalClients}</p>
            <p className="text-xs text-text-secondary">Klanten</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-success/10">
            <Users className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalUsers}</p>
            <p className="text-xs text-text-secondary">Gebruikers</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-success/10">
            <Euro className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{formatEuro(totalMRR)}</p>
            <p className="text-xs text-text-secondary">Agency MRR</p>
          </div>
        </div>
      </div>

      {/* Agencies tabel */}
      {agencies.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border text-center py-16">
          <Building2 className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
            Nog geen agencies
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Zodra agencies zich registreren verschijnen ze hier.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Agency
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Eigenaar
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Klanten
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Gebruikers
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  MRR
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-surface-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/agencies/${agency.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {agency.name}
                    </Link>
                    <p className="text-xs text-text-secondary font-mono">
                      {agency.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-text-secondary">
                      {agency.owner_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">
                      {agency.client_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-text-primary">
                      {agency.total_users}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text-primary">
                      {formatEuro(agency.monthly_revenue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        agency.is_active
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {agency.is_active ? "Actief" : "Inactief"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
