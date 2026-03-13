"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InviteUserModal } from "./InviteUserModal";
import { UserDropdownMenu } from "./UserDropdownMenu";
import {
  Plus,
  Users as UsersIcon,
  Mail,
  Shield,
} from "lucide-react";

interface TenantUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  auth_provider: string;
  last_login: string | null;
  is_active: boolean;
  invited_at: string | null;
}

interface UsersTableProps {
  users: TenantUser[];
  tenantId: string;
  currentUserEmail: string;
  readOnly?: boolean;
}

export function UsersTable({ users, tenantId, currentUserEmail, readOnly = false }: UsersTableProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
              Gebruikers
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Beheer de gebruikers van je portaal.
            </p>
          </div>
          {!readOnly && (
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4" />
              Uitnodigen
            </Button>
          )}
        </div>

        {users.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border text-center py-16">
            <UsersIcon className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
              Nog geen gebruikers
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
              Nodig je eerste gebruikers uit om toegang te krijgen tot je
              dataportaal.
            </p>
            {!readOnly && (
              <Button onClick={() => setShowInviteModal(true)}>
                <Plus className="w-4 h-4" />
                Eerste gebruiker uitnodigen
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Stats bar */}
            <div className="px-4 py-3 border-b border-border bg-surface-secondary/30 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <UsersIcon className="w-4 h-4" />
                <span>
                  <strong className="text-text-primary">{users.length}</strong>{" "}
                  gebruiker{users.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Shield className="w-4 h-4" />
                <span>
                  <strong className="text-text-primary">
                    {users.filter((u) => u.role === "admin").length}
                  </strong>{" "}
                  admin{users.filter((u) => u.role === "admin").length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Naam
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    E-mail
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Rol
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Inlogmethode
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Laatste login
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {(user.name || user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {user.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-secondary">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          user.role === "admin" ? "accent" : "default"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Mail className="w-3.5 h-3.5" />
                        {user.auth_provider === "microsoft"
                          ? "Microsoft SSO"
                          : "E-mail"}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString(
                              "nl-NL",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "Nooit"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.is_active ? "success" : "danger"}
                      >
                        {user.is_active ? "Actief" : "Inactief"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <UserDropdownMenu
                        user={user}
                        tenantId={tenantId}
                        isCurrentUser={user.email === currentUserEmail}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <InviteUserModal
          tenantId={tenantId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}
