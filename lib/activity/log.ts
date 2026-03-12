import { SupabaseClient } from "@supabase/supabase-js";

interface LogActivityParams {
  serviceClient: SupabaseClient;
  tenantId: string;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log een activiteit in de activity_log tabel.
 * Gebruik altijd de serviceClient (service role) om RLS te bypassen.
 *
 * Actions volgen het format: "resource.verb"
 * - user.invited, user.updated, user.deleted, user.activated, user.deactivated
 * - access.granted, access.revoked
 * - report.synced, report.viewed
 * - tenant.updated (branding, settings)
 */
export async function logActivity({
  serviceClient,
  tenantId,
  actorId,
  action,
  targetType,
  targetId,
  metadata = {},
}: LogActivityParams) {
  try {
    await serviceClient.from("activity_log").insert({
      tenant_id: tenantId,
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });
  } catch (err) {
    // Activity logging mag nooit de hoofdactie blokkeren
    console.error("[activity-log] Fout bij loggen:", err);
  }
}
