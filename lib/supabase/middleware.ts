import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cookie domain voor cross-subdomain auth.
 * Op productie: ".dashportal.app" zodat cookies gedeeld worden
 * tussen dashportal.app, app.dashportal.app, lyreco.dashportal.app, etc.
 * Op localhost: undefined (browser default).
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";
const COOKIE_DOMAIN = ROOT_DOMAIN.includes("localhost")
  ? undefined
  : `.${ROOT_DOMAIN.replace(/:\d+$/, "")}`;

/**
 * Supabase session refresh middleware.
 *
 * @param request  - Inkomend Next.js request
 * @param response - Optioneel: een al bestaande NextResponse (bijv. een rewrite).
 *                   Als meegegeven worden de session cookies hierop gezet.
 */
export async function updateSession(
  request: NextRequest,
  response?: NextResponse
) {
  let supabaseResponse = response || NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Alleen een nieuwe response aanmaken als we GEEN meegegeven response hebben
          if (!response) {
            supabaseResponse = NextResponse.next({ request });
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            })
          );
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
