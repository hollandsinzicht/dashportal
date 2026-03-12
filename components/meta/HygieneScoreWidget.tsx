"use client";

import { useState } from "react";
import { type HygieneScore } from "@/lib/powerbi/hygiene";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ChevronDown,
} from "lucide-react";

interface HygieneScoreWidgetProps {
  score: HygieneScore;
}

const GRADE_CONFIG = {
  green: {
    bg: "bg-success/10",
    text: "text-success",
    icon: CheckCircle2,
  },
  yellow: {
    bg: "bg-[var(--color-accent)]/10",
    text: "text-[var(--color-accent)]",
    icon: AlertTriangle,
  },
  red: {
    bg: "bg-danger/10",
    text: "text-danger",
    icon: XCircle,
  },
};

export function HygieneScoreWidget({ score }: HygieneScoreWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const config = GRADE_CONFIG[score.grade];
  const GradeIcon = config.icon;

  const cards = [
    {
      label: "Hygiene Score",
      value: score.total,
      suffix: "/100",
      icon: Shield,
      color: config.text,
      bg: config.bg,
      badge: score.gradeLabel,
      BadgeIcon: GradeIcon,
    },
    {
      label: "Refresh succes",
      value: `${score.breakdown.refreshSuccess.score}%`,
      icon: RefreshCw,
      detail: score.breakdown.refreshSuccess.detail,
      color:
        score.breakdown.refreshSuccess.score >= 80
          ? "text-success"
          : score.breakdown.refreshSuccess.score >= 50
            ? "text-[var(--color-accent)]"
            : "text-danger",
      bg:
        score.breakdown.refreshSuccess.score >= 80
          ? "bg-success/10"
          : score.breakdown.refreshSuccess.score >= 50
            ? "bg-[var(--color-accent)]/10"
            : "bg-danger/10",
    },
    {
      label: "Data versheid",
      value: `${score.breakdown.dataFreshness.score}%`,
      icon: Clock,
      detail: score.breakdown.dataFreshness.detail,
      color:
        score.breakdown.dataFreshness.score >= 80
          ? "text-success"
          : score.breakdown.dataFreshness.score >= 50
            ? "text-[var(--color-accent)]"
            : "text-danger",
      bg:
        score.breakdown.dataFreshness.score >= 80
          ? "bg-success/10"
          : score.breakdown.dataFreshness.score >= 50
            ? "bg-[var(--color-accent)]/10"
            : "bg-danger/10",
    },
  ];

  const breakdownItems = [
    score.breakdown.refreshSuccess,
    score.breakdown.dataFreshness,
    score.breakdown.workspaceHealth,
    score.breakdown.coverage,
  ];

  return (
    <div className="space-y-3">
      {/* Compact KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}
            >
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text-primary">
                  {card.value}
                </span>
                {"suffix" in card && (
                  <span className="text-sm text-text-secondary">
                    {card.suffix}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-secondary">{card.label}</p>
                {"badge" in card && card.badge && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.bg} ${config.text}`}
                  >
                    {card.BadgeIcon && (
                      <card.BadgeIcon className="w-2.5 h-2.5" />
                    )}
                    {card.badge}
                  </span>
                )}
              </div>
              {"detail" in card && card.detail && (
                <p className="text-[10px] text-text-secondary/70 truncate">
                  {card.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        {expanded ? "Verberg details" : "Bekijk score breakdown"}
      </button>

      {expanded && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          {breakdownItems.map((item) => {
            const barColor =
              item.score >= 80
                ? "bg-success"
                : item.score >= 50
                  ? "bg-[var(--color-accent)]"
                  : "bg-danger";

            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium text-xs">
                    {item.label}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {item.score}% · {item.weight}% gewicht
                  </span>
                </div>
                <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{
                      width: `${item.score}%`,
                      transition: "width 0.6s ease-in-out",
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-secondary">{item.detail}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
