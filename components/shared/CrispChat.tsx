"use client";

import { useEffect, useState } from "react";
import { useTenantOptional } from "@/lib/tenant/context";
import { isPlanAtLeast } from "@/lib/features/gates";
import { Mail, MessageCircle, ArrowUpRight, X } from "lucide-react";

/**
 * Support levels per plan tier:
 *
 * Starter:  Geen chat widget — floating email-only kaart
 * Business: Crisp chat met 1 werkdag responstijd
 * Scale:    Crisp chat + priority segment, 4 uur respons
 * Enterprise: Crisp chat + priority segment, dedicated support, <1 uur
 * Trial:    Business-level support
 */

type SupportTier = "starter" | "business" | "scale" | "enterprise";

const SUPPORT_CONFIG: Record<
  SupportTier,
  {
    hasCrisp: boolean;
    messageHint: string;
    responseTime: string;
    segment?: string;
  }
> = {
  starter: {
    hasCrisp: false,
    messageHint: "",
    responseTime: "2 werkdagen",
  },
  business: {
    hasCrisp: true,
    messageHint:
      "Hoi! Heb je een vraag? We reageren binnen 1 werkdag.",
    responseTime: "1 werkdag",
  },
  scale: {
    hasCrisp: true,
    messageHint:
      "Hoi! Als Scale klant reageren we binnen 4 uur op werkdagen.",
    responseTime: "4 uur op werkdagen",
    segment: "priority",
  },
  enterprise: {
    hasCrisp: true,
    messageHint:
      "Hoi! Als Enterprise klant krijg je altijd voorrang. We reageren zo snel mogelijk.",
    responseTime: "Binnen 1 uur",
    segment: "priority",
  },
};

const SUPPORT_EMAIL = "support@dashportal.app";

function getSupportTier(
  plan: string,
  status: string,
  trialEndsAt: string | null
): SupportTier {
  // Trial users krijgen business-level support
  if (
    status === "trialing" &&
    trialEndsAt &&
    new Date(trialEndsAt) > new Date()
  ) {
    return "business";
  }

  // Check plan
  if (isPlanAtLeast(plan, "enterprise")) return "enterprise";
  if (isPlanAtLeast(plan, "scale")) return "scale";
  if (isPlanAtLeast(plan, "business")) return "business";
  return "starter";
}

/**
 * CrispChat — Tier-gebaseerde support widget.
 *
 * Business+: Laadt Crisp SDK met plan-specifieke hints en segments.
 * Starter:   Toont een floating email support kaart.
 */
export function CrispChat() {
  const tenant = useTenantOptional();

  // Agency-managed tenants: geen Crisp chat (support via agency)
  if (tenant?.agencyId) return null;

  // Bepaal support tier
  const tier = tenant
    ? getSupportTier(
        tenant.subscriptionPlan,
        tenant.subscriptionStatus,
        tenant.trialEndsAt
      )
    : "starter";

  const config = SUPPORT_CONFIG[tier];

  // Laad Crisp voor business+ plans
  useCrispLoader(tenant, tier, config);

  // Starter toont floating email widget
  if (!config.hasCrisp && tenant) {
    return <StarterEmailWidget />;
  }

  // Business+: Crisp widget wordt gerenderd door het script zelf
  return null;
}

/**
 * Hook: laadt en configureert Crisp SDK voor business+ plans.
 */
function useCrispLoader(
  tenant: ReturnType<typeof useTenantOptional>,
  tier: SupportTier,
  config: (typeof SUPPORT_CONFIG)[SupportTier]
) {
  useEffect(() => {
    if (!config.hasCrisp) return;

    const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!crispWebsiteId) return;

    // Voorkom dubbele loading
    if (document.getElementById("crisp-widget-script")) return;

    // Crisp configuratie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).$crisp = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CRISP_WEBSITE_ID = crispWebsiteId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $crisp = (window as any).$crisp;

    // Wacht tot Crisp geladen is vóór user data te zetten
    $crisp.push([
      "on",
      "session:loaded",
      () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const crisp = (window as any).$crisp;

          // Bedrijfsnaam als nickname
          if (tenant?.name) {
            crisp.push(["set", "user:nickname", [tenant.name]]);
          }

          // Message box hint per tier
          if (config.messageHint) {
            crisp.push([
              "set",
              "message:text",
              [config.messageHint],
            ]);
          }

          // Session data voor support context
          if (tenant) {
            const sessionData: string[][] = [
              ["tenant_id", tenant.tenantId],
              ["tenant_name", tenant.name],
              ["plan", tenant.subscriptionPlan],
              ["support_tier", tier],
            ];
            crisp.push(["set", "session:data", [sessionData]]);
          }

          // Priority segment voor scale/enterprise
          if (config.segment) {
            crisp.push([
              "set",
              "session:segments",
              [[config.segment], true],
            ]);
          }
        } catch (e) {
          console.warn("[CrispChat] Kon user data niet zetten:", e);
        }
      },
    ]);

    // Script laden
    const script = document.createElement("script");
    script.id = "crisp-widget-script";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("crisp-widget-script");
      if (existingScript) existingScript.remove();
    };
  }, [tenant, tier, config]);
}

/**
 * Floating email support widget voor Starter plan.
 * Vervangt de Crisp chat bubble met een e-mail support kaart.
 */
function StarterEmailWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Expanded card */}
      {open && (
        <div className="mb-3 w-72 bg-surface border border-border rounded-xl shadow-xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Support
                </p>
                <p className="text-xs text-text-secondary">
                  E-mail support
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-surface-secondary rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-3">
            Heb je een vraag? Stuur ons een e-mail. We reageren binnen 2
            werkdagen.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {SUPPORT_EMAIL}
            <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
          </a>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-secondary">
              Wil je snellere support met live chat?{" "}
              <a
                href="/dashboard/billing"
                className="text-primary underline hover:text-primary/80"
              >
                Upgrade naar Business
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center hover:scale-105"
        aria-label="Support openen"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}

/**
 * Export support config voor gebruik in SettingsForm support kaart.
 */
export { SUPPORT_CONFIG, SUPPORT_EMAIL, getSupportTier };
export type { SupportTier };
