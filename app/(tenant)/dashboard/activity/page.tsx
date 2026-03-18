import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ClipboardList } from "lucide-react";

export default async function ActivityLogPage() {
  // ─── Auth + tenant context ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .limit(1)
    .maybeSingle();

  if (!tenantUser || tenantUser.role !== "admin") redirect("/");

  const tenantId = tenantUser.tenant_id;
  const serviceClient = await createServiceClient();

  // ─── Tenant plan ophalen voor feature gating ───
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("subscription_plan, subscription_status, trial_ends_at, agency_id")
    .eq("id", tenantId)
    .single();

  const plan = tenant?.subscription_plan || "starter";
  const subscriptionStatus = tenant?.subscription_status || "active";
  const trialEndsAt = tenant?.trial_ends_at || null;
  const isAgencyManaged = !!tenant?.agency_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Activiteitslog
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          Bekijk alle acties die zijn uitgevoerd binnen je organisatie.
        </p>
      </div>

      {/* Agency-managed: altijd toegang. Overige: Feature Gate (Scale+) */}
      {isAgencyManaged ? (
        <ActivityLog tenantId={tenantId} />
      ) : (
        <FeatureGate
          feature="advanced_analytics"
          plan={plan}
          subscriptionStatus={subscriptionStatus}
          trialEndsAt={trialEndsAt}
        >
          <ActivityLog tenantId={tenantId} />
        </FeatureGate>
      )}
    </div>
  );
}
