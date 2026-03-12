import { getTenantBySlug } from "@/lib/tenant/queries";
import { canUseFeature } from "@/lib/features/gates";
import { notFound } from "next/navigation";
import { TenantLoginForm } from "@/components/portal/TenantLoginForm";

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  // Microsoft SSO beschikbaar voor Business+ plans
  const ssoEnabled = canUseFeature(
    {
      subscription_plan: tenant.subscription_plan || "starter",
      subscription_status: tenant.subscription_status,
      trial_ends_at: tenant.trial_ends_at,
    },
    "microsoft_sso"
  );

  return (
    <TenantLoginForm
      slug={slug}
      tenantName={tenant.name}
      logoUrl={tenant.logo_url}
      ssoEnabled={ssoEnabled}
    />
  );
}
