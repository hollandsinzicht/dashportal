"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import {
  canUseFeature,
  getUpgradePlanName,
} from "@/lib/features/gates";

interface FeatureGateProps {
  /** De feature die gecontroleerd wordt */
  feature: string;
  /** Huidig abonnementsplan */
  plan: string;
  /** Subscription status */
  subscriptionStatus?: string;
  /** Einde van de trial periode */
  trialEndsAt?: string | null;
  /** Content die getoond wordt als de feature beschikbaar is */
  children: ReactNode;
  /** Optionele fallback als feature niet beschikbaar is */
  fallback?: ReactNode;
  /** Verberg het element volledig i.p.v. een upgrade CTA te tonen */
  hideIfLocked?: boolean;
}

/**
 * Gate component dat children alleen toont als de tenant
 * toegang heeft tot de opgegeven feature.
 *
 * Tijdens een actieve trial zijn alle features beschikbaar.
 * Anders wordt een upgrade CTA of custom fallback getoond.
 */
export function FeatureGate({
  feature,
  plan,
  subscriptionStatus,
  trialEndsAt,
  children,
  fallback,
  hideIfLocked = false,
}: FeatureGateProps) {
  const tenant = {
    subscription_plan: plan,
    subscription_status: subscriptionStatus,
    trial_ends_at: trialEndsAt,
  };

  if (canUseFeature(tenant, feature)) {
    return <>{children}</>;
  }

  // Verberg volledig als gevraagd
  if (hideIfLocked) {
    return null;
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade CTA
  const requiredPlan = getUpgradePlanName(feature);

  return (
    <div className="relative rounded-xl border border-border bg-surface-secondary/30 p-4 opacity-60">
      <div className="pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-[1px] rounded-xl">
        <div className="text-center">
          <Lock className="w-5 h-5 text-text-secondary mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">
            Upgrade naar {requiredPlan}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            Deze functie is beschikbaar vanaf het {requiredPlan} plan
          </p>
        </div>
      </div>
    </div>
  );
}
