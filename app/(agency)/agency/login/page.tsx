import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AgencyLoginForm } from "@/components/agency/AgencyLoginForm";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Agency Login — DashPortal",
  description: "Log in op je agency dashboard.",
};

/**
 * /agency/login
 * Als de gebruiker al ingelogd is EN een agency heeft,
 * redirect direct naar het dashboard.
 * Anders toon het login formulier.
 */
export default async function AgencyLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Als al ingelogd, kijk of er een agency is
  if (user?.email) {
    const serviceClient = await createServiceClient();

    const { data: agencyUser } = await serviceClient
      .from("agency_users")
      .select("agency_id")
      .eq("email", user.email)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (agencyUser) {
      const { data: agency } = await serviceClient
        .from("agencies")
        .select("slug")
        .eq("id", agencyUser.agency_id)
        .eq("is_active", true)
        .single();

      if (agency) {
        redirect(`/agency/${agency.slug}/dashboard`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-syne)] font-bold text-lg text-text-primary">
            DashPortal
          </span>
        </div>

        {/* Login card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-1 text-center">
            Agency Login
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            Log in op je agency dashboard om klanten te beheren.
          </p>
          <AgencyLoginForm />
        </div>

        {/* Terug link */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Terug naar DashPortal
          </Link>
        </p>
      </div>
    </div>
  );
}
