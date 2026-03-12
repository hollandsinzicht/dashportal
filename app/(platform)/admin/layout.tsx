import { createClient } from "@/lib/supabase/server";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

/**
 * Admin layout — beschermt alle /admin routes.
 * Toont een login formulier als je niet ingelogd bent.
 * Alleen de super admin (SUPER_ADMIN_EMAIL) mag hier bij.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Niet ingelogd → login formulier tonen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-sm w-full">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-syne)] font-bold text-lg text-text-primary">
              DashPortal
            </span>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-1 text-center">
              Admin Login
            </h1>
            <p className="text-sm text-text-secondary text-center mb-6">
              Log in met je platform administrator account.
            </p>
            <AdminLoginForm />
          </div>
        </div>
      </div>
    );
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  // Wel ingelogd, maar niet de super admin
  if (!superAdminEmail || user.email !== superAdminEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
            Geen toegang
          </h1>
          <p className="text-sm text-text-secondary">
            Deze pagina is alleen toegankelijk voor de platform administrator.
          </p>
          <p className="text-xs text-text-secondary mt-4">
            Ingelogd als {user.email}
          </p>
        </div>
      </div>
    );
  }

  // Super admin → toon navigatie + children
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                  Admin
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  Overzicht
                </Link>
                <Link
                  href="/admin/billing"
                  className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  Facturatie
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">
                {user.email}
              </span>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
