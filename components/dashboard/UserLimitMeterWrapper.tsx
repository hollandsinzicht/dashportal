"use client";

import { UserLimitMeter } from "@/components/ui/UserLimitMeter";
import { getPlanLimits } from "@/lib/stripe/config";
import { Card } from "@/components/ui/Card";

interface UserLimitMeterWrapperProps {
  tenantId: string;
  plan: string;
  currentUsers: number;
}

/**
 * Wrapper component die server-side opgehaalde data
 * omzet naar het TenantUsage format voor UserLimitMeter.
 *
 * Wordt gebruikt in server components (dashboard overview, users page)
 * waar we de data al hebben opgehaald.
 */
export function UserLimitMeterWrapper({
  plan,
  currentUsers,
}: UserLimitMeterWrapperProps) {
  const limits = getPlanLimits(plan);
  const maxUsers = limits.users;
  const isUnlimited = maxUsers === -1;

  const usage = {
    currentUsers,
    maxUsers,
    remaining: isUnlimited ? -1 : Math.max(0, maxUsers - currentUsers),
    percentageUsed: isUnlimited
      ? 0
      : maxUsers > 0
        ? Math.min(100, Math.round((currentUsers / maxUsers) * 100))
        : 0,
    isUnlimited,
  };

  return (
    <Card>
      <UserLimitMeter usage={usage} plan={plan} />
    </Card>
  );
}
