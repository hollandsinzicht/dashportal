import { redirect } from "next/navigation";

/**
 * /[tenant-slug]/login → redirect naar /[tenant-slug]
 * De login pagina staat op de root van de tenant slug.
 * Deze redirect vangt oude links en directe /login URLs op.
 */
export default async function TenantLoginRedirect({
  params,
}: {
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": slug } = await params;
  redirect(`/${slug}`);
}
