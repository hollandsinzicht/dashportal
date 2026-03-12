import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Cookie domain voor cross-subdomain auth.
 * Zelfde logica als in middleware.ts en browser.ts.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";
const COOKIE_DOMAIN = ROOT_DOMAIN.includes("localhost")
  ? undefined
  : `.${ROOT_DOMAIN.replace(/:\d+$/, "")}`;

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const next = searchParams.get("next") || "/";

  // Foutmelding opvangen — redirect terug naar tenant login als mogelijk
  if (error || errorCode) {
    const errorParam = errorCode || error || "unknown";
    // Probeer de tenant slug te extraheren uit next param (bv. /acme/home → /acme)
    const tenantSlug = next.split("/").filter(Boolean)[0];
    const errorRedirect = tenantSlug
      ? `${origin}/${tenantSlug}?error=${errorParam}`
      : `${origin}?error=${errorParam}`;
    return NextResponse.redirect(errorRedirect);
  }

  // Code omwisselen voor sessie
  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
              })
            );
          },
        },
      }
    );

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(`${origin}?error=exchange_failed`);
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/`);
}
