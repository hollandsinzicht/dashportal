import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant/queries";
import { generateTenantCSS } from "@/lib/tenant/theme";

export default async function TenantPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: generateTenantCSS(tenant) }} />
      <div className="min-h-screen bg-background">{children}</div>
    </>
  );
}
