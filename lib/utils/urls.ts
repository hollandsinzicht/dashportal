/**
 * URL helpers voor cross-subdomain navigatie.
 *
 * Op localhost returnen ze relatieve paden (geen DNS setup nodig).
 * In productie returnen ze volledige subdomain URLs.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";
const IS_LOCAL = ROOT_DOMAIN.includes("localhost");
const PROTO = IS_LOCAL ? "http" : "https";

/**
 * Marketing site URL (dashportal.app)
 * @example getMarketingUrl("/pricing") → "https://dashportal.app/pricing"
 */
export function getMarketingUrl(path = "/"): string {
  if (IS_LOCAL) return path;
  return `${PROTO}://${ROOT_DOMAIN}${path}`;
}

/**
 * Platform URL (app.dashportal.app) — onboarding, dashboard, admin
 * @example getPlatformUrl("/dashboard") → "https://app.dashportal.app/dashboard"
 */
export function getPlatformUrl(path = "/"): string {
  if (IS_LOCAL) return path;
  return `${PROTO}://app.${ROOT_DOMAIN}${path}`;
}

/**
 * Tenant portaal URL ([slug].dashportal.app)
 * @example getPortalUrl("lyreco", "/home") → "https://lyreco.dashportal.app/home"
 */
export function getPortalUrl(slug: string, path = "/"): string {
  if (IS_LOCAL) return `/${slug}${path === "/" ? "" : path}`;
  return `${PROTO}://${slug}.${ROOT_DOMAIN}${path}`;
}

/**
 * Check of we in lokale ontwikkeling draaien
 */
export function isLocalDev(): boolean {
  return IS_LOCAL;
}
