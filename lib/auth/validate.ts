import { createClient, createServiceClient } from "@/lib/supabase/server";

type AdminContext = {
  user: { id: string; email: string };
  currentUser: { id: string; role: string; tenant_id: string };
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
  tenantId: string;
};

type AuthError = {
  error: string;
  status: number;
};

/**
 * Validate dat de huidige gebruiker ingelogd is en admin is voor de opgegeven tenant.
 *
 * Gebruik deze helper in ELKE API route die tenant-specifieke data verwerkt.
 * De tenantId wordt gevalideerd tegen de sessie — NOOIT blind vertrouwen vanuit body/URL.
 */
export async function getAdminContext(
  tenantId: string
): Promise<AdminContext | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: currentUser } = await serviceClient
    .from("tenant_users")
    .select("id, role, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Geen toegang", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email! },
    currentUser,
    serviceClient,
    tenantId: currentUser.tenant_id,
  };
}

/**
 * Validate dat de huidige gebruiker ingelogd is en bij de opgegeven tenant hoort.
 * Geen admin check — voor eindgebruikers (portal viewers).
 */
export async function getUserContext(
  tenantId: string
): Promise<
  | {
      user: { id: string; email: string };
      tenantUser: { id: string; role: string; tenant_id: string };
      serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
      tenantId: string;
    }
  | AuthError
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: tenantUser } = await serviceClient
    .from("tenant_users")
    .select("id, role, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!tenantUser) {
    return { error: "Geen toegang tot deze tenant", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email! },
    tenantUser,
    serviceClient,
    tenantId: tenantUser.tenant_id,
  };
}

/**
 * Validate dat de huidige gebruiker de super admin is.
 * Controleert tegen SUPER_ADMIN_EMAIL env var.
 */
export async function getSuperAdminContext(): Promise<
  | {
      user: { id: string; email: string };
      serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
    }
  | AuthError
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    console.error("[auth] SUPER_ADMIN_EMAIL env var is niet ingesteld");
    return { error: "Super admin niet geconfigureerd", status: 500 };
  }

  if (user.email !== superAdminEmail) {
    return { error: "Geen super admin toegang", status: 403 };
  }

  const serviceClient = await createServiceClient();
  return { user: { id: user.id, email: user.email! }, serviceClient };
}

/**
 * Type guard om auth errors te detecteren.
 * Werkt met elk context-type (AdminContext, UserContext, SuperAdminContext).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAuthError(result: any): result is AuthError {
  return (
    result != null &&
    typeof result === "object" &&
    "error" in result &&
    "status" in result &&
    !("serviceClient" in result)
  );
}
