import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * DashPortal Proxy — Subdomain Routing
 *
 * Routing logica:
 *   localhost:3001          → alles normaal (geen subdomain check)
 *   www.dashportal.app      → redirect naar dashportal.app
 *   dashportal.app          → marketing routes
 *   app.dashportal.app      → platform routes (onboarding, dashboard, admin)
 *   [slug].dashportal.app   → rewrite naar /[tenant-slug]/* routes
 *   custom-domain.com       → rewrite naar /_custom-domain/* (met header)
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";

// Routes die op het platform horen (app.dashportal.app), niet op marketing
const PLATFORM_ROUTES = [
  "/dashboard",
  "/admin",
  "/onboarding",
  "/auth",
];

// Routes die bij marketing horen (dashportal.app), niet op platform
const MARKETING_ROUTES = ["/", "/pricing", "/demo", "/privacy", "/terms"];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ─── Localhost / dev: geen subdomain routing ───
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return updateSession(request);
  }

  // ─── Custom domain: niet dashportal.app ───
  if (!hostname.includes(ROOT_DOMAIN.replace(/:\d+$/, ""))) {
    const response = NextResponse.rewrite(
      new URL(`/_custom-domain${pathname}`, request.url)
    );
    response.headers.set("x-custom-domain", hostname);
    return updateSession(request, response);
  }

  // ─── Subdomain extractie ───
  // hostname = "lyreco.dashportal.app" → subdomain = "lyreco"
  // hostname = "app.dashportal.app"    → subdomain = "app"
  // hostname = "dashportal.app"        → subdomain = "" (naked)
  const domainBase = ROOT_DOMAIN.replace(/:\d+$/, ""); // strip port
  const subdomain = hostname
    .replace(`.${domainBase}`, "")
    .replace(domainBase, "");

  // ─── www redirect ───
  if (subdomain === "www") {
    const url = new URL(request.url);
    url.hostname = domainBase;
    return NextResponse.redirect(url, 301);
  }

  // ─── Naked domain: dashportal.app → marketing site ───
  if (!subdomain) {
    // Als iemand /dashboard, /admin, /onboarding bezoekt op naked domain,
    // redirect naar app.dashportal.app
    if (PLATFORM_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(
        new URL(pathname, `https://app.${domainBase}`),
        302
      );
    }

    return updateSession(request);
  }

  // ─── app subdomain: app.dashportal.app → platform ───
  if (subdomain === "app") {
    // Als iemand marketing routes bezoekt op app subdomain,
    // redirect naar naked domain
    if (MARKETING_ROUTES.includes(pathname)) {
      return NextResponse.redirect(
        new URL(pathname, `https://${domainBase}`),
        302
      );
    }

    return updateSession(request);
  }

  // ─── Tenant subdomain: [slug].dashportal.app → rewrite ───
  // lyreco.dashportal.app/home → intern rewrite naar /lyreco/home
  const rewritePath = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  const rewriteUrl = new URL(rewritePath, request.url);
  rewriteUrl.search = request.nextUrl.search; // query params meenemen

  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set("x-tenant-slug", subdomain);

  return updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
