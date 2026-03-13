import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AgencyProvider } from "@/lib/agency/context";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { AgencyHeader } from "@/components/agency/AgencyHeader";
import type { AgencyRole } from "@/lib/agency/types";

export default async function AgencyDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // ─── 1. Sessie ophalen ───
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const userEmail = user.email!;
  const serviceClient = await createServiceClient();

  // ─── 2. Agency ophalen via slug ───
  const { data: agency } = await serviceClient
    .from("agencies")
    .select("id, slug, name, logo_url, primary_color, accent_color, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!agency) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-display font-bold text-foreground mb-2">
            Agency niet gevonden
          </h1>
          <p className="text-muted">
            Deze agency bestaat niet of is niet meer actief.
          </p>
        </div>
      </div>
    );
  }

  // ─── 3. Agency user record ophalen ───
  const { data: agencyUser } = await serviceClient
    .from("agency_users")
    .select("id, role, email, name")
    .eq("agency_id", agency.id)
    .eq("email", userEmail)
    .eq("is_active", true)
    .single();

  if (!agencyUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-display font-bold text-foreground mb-2">
            Geen toegang
          </h1>
          <p className="text-muted">
            Je hebt geen toegang tot deze agency. Neem contact op met de eigenaar.
          </p>
        </div>
      </div>
    );
  }

  // ─── 4. Dashboard renderen ───
  return (
    <AgencyProvider
      agency={agency}
      user={{ role: agencyUser.role as AgencyRole, email: userEmail }}
    >
      <div className="min-h-screen bg-background flex">
        <AgencySidebar
          role={agencyUser.role as AgencyRole}
          agency={{
            name: agency.name,
            slug: agency.slug,
            logoUrl: agency.logo_url,
          }}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <AgencyHeader
            user={{
              name: agencyUser.name || userEmail,
              email: userEmail,
              role: agencyUser.role as AgencyRole,
            }}
            agency={{ name: agency.name }}
          />

          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AgencyProvider>
  );
}
