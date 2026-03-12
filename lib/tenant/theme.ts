export interface TenantTheme {
  primary_color: string;
  accent_color: string;
  logo_url?: string | null;
  name: string;
}

export function generateTenantCSS(tenant: TenantTheme): string {
  return `
    :root {
      --primary: ${tenant.primary_color};
      --accent: ${tenant.accent_color};
    }
  `;
}
