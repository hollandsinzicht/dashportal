import { createBrowserClient } from "@supabase/ssr";

/**
 * Cookie domain voor cross-subdomain auth.
 * Op productie: ".dashportal.app" zodat de sessie werkt op
 * app.dashportal.app, lyreco.dashportal.app, etc.
 * Op localhost: undefined (browser default).
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";
const COOKIE_DOMAIN = ROOT_DOMAIN.includes("localhost")
  ? undefined
  : `.${ROOT_DOMAIN.replace(/:\d+$/, "")}`;

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      },
    }
  );

  return client;
}
