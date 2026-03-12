import { generateTenantCSS } from "@/lib/tenant/theme";
import { DEMO_TENANT } from "./data";

/**
 * Genereert CSS voor de demo omgeving.
 * Gebruikt dezelfde functie als de echte tenant theming.
 */
export function getDemoThemeCSS(): string {
  return generateTenantCSS({
    name: DEMO_TENANT.name,
    primary_color: DEMO_TENANT.primary_color,
    accent_color: DEMO_TENANT.accent_color,
    logo_url: DEMO_TENANT.logoUrl,
  });
}
