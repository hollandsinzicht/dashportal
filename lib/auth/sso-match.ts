import { createServiceClient } from "@/lib/supabase/server";

/**
 * Update azure_oid en auth_provider voor een tenant user na SSO login.
 *
 * Wordt aangeroepen na succesvolle Microsoft SSO login.
 * Slaat de Azure Object ID op voor toekomstige RLS matching
 * en markeert de auth provider als 'microsoft'.
 */
export async function syncAzureOID(
  tenantId: string,
  email: string,
  azureOid: string
): Promise<void> {
  const supabase = await createServiceClient();

  await supabase
    .from("tenant_users")
    .update({
      azure_oid: azureOid,
      auth_provider: "microsoft",
    })
    .eq("tenant_id", tenantId)
    .eq("email", email.toLowerCase().trim());
}

/**
 * Extract Azure OID uit Supabase user metadata.
 *
 * Na Azure SSO login bevat de Supabase user het volgende:
 * - user.app_metadata.provider: "azure"
 * - user.user_metadata.sub: Azure Object ID
 * - user.identities[].identity_data.sub: Azure Object ID
 */
export function extractAzureOID(
  user: {
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    identities?: Array<{
      provider?: string;
      identity_data?: Record<string, unknown>;
    }>;
  }
): string | null {
  // Check of het een Azure login is
  const provider = user.app_metadata?.provider;
  if (provider !== "azure") return null;

  // Azure OID uit user_metadata (meest betrouwbaar)
  const sub = user.user_metadata?.sub;
  if (typeof sub === "string" && sub.length > 0) return sub;

  // Fallback: uit identities array
  const azureIdentity = user.identities?.find(
    (id) => id.provider === "azure"
  );
  if (azureIdentity?.identity_data?.sub) {
    return azureIdentity.identity_data.sub as string;
  }

  return null;
}
