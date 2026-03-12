"use client";

import { Users, AlertTriangle, ArrowUpRight, Infinity } from "lucide-react";
import { type TenantUsage, getUpgradeSuggestion } from "@/lib/tenant/usage";

interface UserLimitMeterProps {
  usage: TenantUsage;
  plan: string;
  /** Compacte weergave voor in stat grids */
  compact?: boolean;
}

/**
 * UserLimitMeter — visuele meter voor gebruikerslimieten.
 *
 * Kleurcodes:
 * - 0-60%   groen  (alles goed)
 * - 61-80%  oranje (let op)
 * - 81-100% rood   (bijna vol / vol)
 *
 * Toont waarschuwing bij <=3 plekken resterend.
 * Toont rood banner bij 0 resterend.
 */
export function UserLimitMeter({
  usage,
  plan,
  compact = false,
}: UserLimitMeterProps) {
  const { currentUsers, maxUsers, remaining, percentageUsed, isUnlimited } =
    usage;

  // Kleur op basis van percentage
  const color = getColor(percentageUsed, isUnlimited);
  const upgrade = getUpgradeSuggestion(plan);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary tabular-nums">
          {currentUsers}
          <span className="text-text-secondary font-normal">
            /{isUnlimited ? <Infinity className="w-3.5 h-3.5 inline -mt-0.5" /> : maxUsers}
          </span>
        </span>
        {!isUnlimited && (
          <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden min-w-[48px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}
          >
            <Users className={`w-4 h-4 ${color.icon}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Gebruikers
            </p>
            <p className="text-xs text-text-secondary">
              {isUnlimited
                ? `${currentUsers} actief (onbeperkt)`
                : `${currentUsers} van ${maxUsers} gebruikt`}
            </p>
          </div>
        </div>
        {!isUnlimited && (
          <span
            className={`text-sm font-bold tabular-nums ${color.text}`}
          >
            {percentageUsed}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      )}

      {/* Waarschuwingen */}
      {!isUnlimited && remaining <= 3 && remaining > 0 && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">
              Nog {remaining} {remaining === 1 ? "plek" : "plekken"} beschikbaar
            </p>
            {upgrade && (
              <p className="text-xs text-warning/80 mt-0.5">
                Upgrade naar {upgrade.planName} voor {upgrade.userLimit}{" "}
                gebruikers.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Limiet bereikt */}
      {!isUnlimited && remaining === 0 && (
        <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-danger">
              Gebruikerslimiet bereikt
            </p>
            <p className="text-xs text-danger/80 mt-0.5">
              Je kunt geen nieuwe gebruikers meer uitnodigen.
              {upgrade && ` Upgrade naar ${upgrade.planName} voor ${upgrade.userLimit} gebruikers.`}
            </p>
          </div>
          {upgrade && (
            <a
              href="/dashboard/billing"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-danger hover:text-danger/80 transition-colors"
            >
              Upgraden
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Color helpers ───

function getColor(
  percentage: number,
  isUnlimited: boolean
): {
  bar: string;
  text: string;
  icon: string;
  iconBg: string;
} {
  if (isUnlimited) {
    return {
      bar: "bg-success",
      text: "text-success",
      icon: "text-success",
      iconBg: "bg-success/10",
    };
  }

  if (percentage > 80) {
    return {
      bar: "bg-danger",
      text: "text-danger",
      icon: "text-danger",
      iconBg: "bg-danger/10",
    };
  }

  if (percentage > 60) {
    return {
      bar: "bg-warning",
      text: "text-warning",
      icon: "text-warning",
      iconBg: "bg-warning/10",
    };
  }

  return {
    bar: "bg-success",
    text: "text-success",
    icon: "text-success",
    iconBg: "bg-success/10",
  };
}
