import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { AgencyRole } from "@/lib/agency/types";

type AgencyOwnerContext = {
  user: { id: string; email: string };
  agencyUser: { id: string; role: AgencyRole; agency_id: string };
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
  agencyId: string;
};

type AgencyMemberContext = {
  user: { id: string; email: string };
  agencyUser: { id: string; role: AgencyRole; agency_id: string };
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
  agencyId: string;
};

type AuthError = {
  error: string;
  status: number;
};

/**
 * Validate dat de huidige gebruiker ingelogd is en owner of admin is van de agency.
 * Gebruik voor mutaties (klant aanmaken, settings wijzigen, team beheren).
 */
export async function getAgencyOwnerContext(
  agencyId: string
): Promise<AgencyOwnerContext | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: agencyUser } = await serviceClient
    .from("agency_users")
    .select("id, role, agency_id")
    .eq("agency_id", agencyId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!agencyUser || (agencyUser.role !== "owner" && agencyUser.role !== "admin")) {
    return { error: "Geen agency beheerder toegang", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email! },
    agencyUser: agencyUser as AgencyOwnerContext["agencyUser"],
    serviceClient,
    agencyId: agencyUser.agency_id,
  };
}

/**
 * Validate dat de huidige gebruiker ingelogd is en lid is van de agency.
 * Geen owner/admin check — voor read-only toegang (viewers).
 */
export async function getAgencyMemberContext(
  agencyId: string
): Promise<AgencyMemberContext | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: agencyUser } = await serviceClient
    .from("agency_users")
    .select("id, role, agency_id")
    .eq("agency_id", agencyId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!agencyUser) {
    return { error: "Geen toegang tot deze agency", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email! },
    agencyUser: agencyUser as AgencyMemberContext["agencyUser"],
    serviceClient,
    agencyId: agencyUser.agency_id,
  };
}

/**
 * Haal de agency op via slug en valideer dat de gebruiker er lid van is.
 * Handig voor routes met [slug] parameter.
 */
export async function getAgencyContextBySlug(
  slug: string
): Promise<AgencyMemberContext | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();

  // Agency ophalen via slug
  const { data: agency } = await serviceClient
    .from("agencies")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!agency) {
    return { error: "Agency niet gevonden", status: 404 };
  }

  // Lidmaatschap checken
  const { data: agencyUser } = await serviceClient
    .from("agency_users")
    .select("id, role, agency_id")
    .eq("agency_id", agency.id)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!agencyUser) {
    return { error: "Geen toegang tot deze agency", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email! },
    agencyUser: agencyUser as AgencyMemberContext["agencyUser"],
    serviceClient,
    agencyId: agency.id,
  };
}
