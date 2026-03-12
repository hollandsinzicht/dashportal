/**
 * Vercel Domain API — tenant subdomains beheren
 *
 * Op het Hobby plan is er geen wildcard domain. Elk tenant subdomain
 * wordt individueel geregistreerd via de Vercel API.
 * SSL wordt automatisch door Vercel geprovisioned.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "dashportal.app";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

const API_BASE = "https://api.vercel.com";

/**
 * Voegt een tenant subdomain toe aan het Vercel project.
 * Bijv. addTenantSubdomain("lyreco") → registreert lyreco.dashportal.app
 *
 * Non-blocking: logt fouten maar gooit ze niet door.
 */
export async function addTenantSubdomain(slug: string): Promise<boolean> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn(
      "[vercel/domains] VERCEL_TOKEN of VERCEL_PROJECT_ID niet geconfigureerd — subdomain niet geregistreerd"
    );
    return false;
  }

  // Niet op localhost
  if (ROOT_DOMAIN.includes("localhost")) return true;

  const domain = `${slug}.${ROOT_DOMAIN}`;

  try {
    const res = await fetch(
      `${API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    if (res.ok) {
      console.log(`[vercel/domains] Subdomain geregistreerd: ${domain}`);
      return true;
    }

    const data = await res.json().catch(() => ({}));

    // Domain bestaat al — geen probleem
    if (data.error?.code === "domain_already_in_use" || res.status === 409) {
      console.log(`[vercel/domains] Subdomain bestaat al: ${domain}`);
      return true;
    }

    console.error(
      `[vercel/domains] Kon subdomain niet registreren: ${domain}`,
      data.error || res.status
    );
    return false;
  } catch (err) {
    console.error(`[vercel/domains] API fout voor ${domain}:`, err);
    return false;
  }
}

/**
 * Verwijdert een tenant subdomain van het Vercel project.
 */
export async function removeTenantSubdomain(slug: string): Promise<boolean> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return false;
  if (ROOT_DOMAIN.includes("localhost")) return true;

  const domain = `${slug}.${ROOT_DOMAIN}`;

  try {
    const res = await fetch(
      `${API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (res.ok || res.status === 404) {
      console.log(`[vercel/domains] Subdomain verwijderd: ${domain}`);
      return true;
    }

    console.error(
      `[vercel/domains] Kon subdomain niet verwijderen: ${domain}`,
      res.status
    );
    return false;
  } catch (err) {
    console.error(`[vercel/domains] API fout voor ${domain}:`, err);
    return false;
  }
}

/**
 * Voegt een custom domain toe aan het Vercel project.
 * Bijv. addCustomDomain("data.lyreco.com")
 */
export async function addCustomDomain(domain: string): Promise<boolean> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn("[vercel/domains] VERCEL_TOKEN of VERCEL_PROJECT_ID niet geconfigureerd");
    return false;
  }

  try {
    const res = await fetch(
      `${API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    if (res.ok) {
      console.log(`[vercel/domains] Custom domain geregistreerd: ${domain}`);
      return true;
    }

    const data = await res.json().catch(() => ({}));
    if (data.error?.code === "domain_already_in_use" || res.status === 409) {
      return true;
    }

    console.error(`[vercel/domains] Kon custom domain niet registreren: ${domain}`, data.error);
    return false;
  } catch (err) {
    console.error(`[vercel/domains] API fout voor ${domain}:`, err);
    return false;
  }
}
