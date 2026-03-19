import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * DashPortal Proxy — Subdomain Routing
 *
 * Routing logica:
 *   localhost:3001          → alles normaal (geen subdomain check)
 *   www.dashportal.app      → redirect naar dashportal.app
 *   dashportal.app          → marketing routes + agency routes + API
 *   app.dashportal.app      → platform routes (onboarding, dashboard, admin)
 *   [slug].dashportal.app   → rewrite naar /[tenant-slug]/* routes
 *   custom-domain.com       → rewrite naar /_custom-domain/* (met header)
 *
 * BELANGRIJK: /api routes worden NOOIT geredirect — altijd op hetzelfde origin
 * verwerkt om CORS problemen te voorkomen.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";

// Routes die op het platform horen (app.dashportal.app), niet op marketing
// LET OP: /api staat hier NIET in — API routes worden nooit geredirect
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

  // ─── API routes: NOOIT redirecten, altijd lokaal verwerken ───
  // Dit voorkomt CORS problemen bij cross-origin redirects
  if (pathname.startsWith("/api")) {
    return updateSession(request);
  }

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
  const domainBase = ROOT_DOMAIN.replace(/:\d+$/, "");
  const subdomain = hostname
    .replace(`.${domainBase}`, "")
    .replace(domainBase, "");

  // ─── www redirect ───
  if (subdomain === "www") {
    const url = new URL(request.url);
    url.hostname = domainBase;
    return NextResponse.redirect(url, 301);
  }

  // ─── Naked domain: dashportal.app → marketing + agency routes ───
  if (!subdomain) {
    // Platform routes (dashboard, admin, onboarding) → redirect naar app.
    if (PLATFORM_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(
        new URL(pathname, `https://app.${domainBase}`),
        302
      );
    }

    // Marketing routes + agency routes (/agency/*) → gewoon serveren
    return updateSession(request);
  }

  // ─── app subdomain: app.dashportal.app → platform ───
  if (subdomain === "app") {
    if (MARKETING_ROUTES.includes(pathname)) {
      return NextResponse.redirect(
        new URL(pathname, `https://${domainBase}`),
        302
      );
    }

    return updateSession(request);
  }

  // ─── Tenant subdomain: platform routes doorlaten ───
  // acme.dashportal.app/dashboard → NIET rewriten
  if (PLATFORM_ROUTES.some((r) => pathname.startsWith(r))) {
    return updateSession(request);
  }

  // ─── Tenant subdomain: [slug].dashportal.app → rewrite ───
  // lyreco.dashportal.app/home → intern rewrite naar /lyreco/home
  const rewritePath = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  const rewriteUrl = new URL(rewritePath, request.url);
  rewriteUrl.search = request.nextUrl.search;

  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set("x-tenant-slug", subdomain);

  return updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
