"use client";

import { useState } from "react";
import { Clock, Check, AlertCircle, Lock } from "lucide-react";

interface MetaScheduleSelectorProps {
  tenantId: string;
  currentSchedule: string;
  plan: string;
  allowedSchedules: string[];
}

const SCHEDULE_OPTIONS = [
  {
    value: "manual",
    label: "Handmatig",
    description: "Alleen synchroniseren als je op 'Ververs' klikt",
  },
  {
    value: "hourly",
    label: "Elk uur",
    description: "Automatisch elk uur bijwerken",
    minPlan: "Scale",
  },
  {
    value: "twice_daily",
    label: "2x per dag",
    description: "Elke 12 uur automatisch bijwerken",
    minPlan: "Scale",
  },
  {
    value: "daily",
    label: "Dagelijks",
    description: "Eenmaal per dag automatisch bijwerken",
  },
  {
    value: "weekly",
    label: "Wekelijks",
    description: "Eenmaal per week automatisch bijwerken",
  },
];

// Intervals in ms (zelfde als cron route)
const SCHEDULE_INTERVALS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  twice_daily: 12 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export function MetaScheduleSelector({
  tenantId,
  currentSchedule,
  plan,
  allowedSchedules,
}: MetaScheduleSelectorProps) {
  const [schedule, setSchedule] = useState(currentSchedule || "manual");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleChange(value: string) {
    if (!allowedSchedules.includes(value)) return;

    setSchedule(value);
    setSaving(true);
    setFeedback(null);

    try {
      // Bereken volgende sync tijd
      const nextSyncAt =
        value === "manual"
          ? null
          : new Date(
              Date.now() + (SCHEDULE_INTERVALS[value] || SCHEDULE_INTERVALS.daily)
            ).toISOString();

      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          meta_sync_schedule: value,
          meta_next_sync_at: nextSyncAt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Opslaan mislukt");
      }

      setFeedback({
        type: "success",
        message: "Planning opgeslagen",
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Kon planning niet opslaan",
      });
      // Revert
      setSchedule(currentSchedule || "manual");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-secondary" />
        <h3 className="text-sm font-semibold text-text-primary">
          Automatische synchronisatie
        </h3>
        {saving && (
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
        )}
        {feedback && (
          <span
            className={`ml-2 text-xs flex items-center gap-1 ${
              feedback.type === "success" ? "text-success" : "text-danger"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {feedback.message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SCHEDULE_OPTIONS.map((option) => {
          const isAllowed = allowedSchedules.includes(option.value);
          const isSelected = schedule === option.value;

          return (
            <button
              key={option.value}
              onClick={() => isAllowed && handleChange(option.value)}
              disabled={saving || !isAllowed}
              className={`
                relative p-3 rounded-lg border text-left transition-all text-sm
                ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : isAllowed
                      ? "border-border hover:border-primary/20 hover:bg-surface-secondary/50 cursor-pointer"
                      : "border-border/50 bg-surface-secondary/30 cursor-not-allowed"
                }
                ${saving ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {!isAllowed && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-text-secondary/40" />
                </div>
              )}
              <p
                className={`font-medium ${
                  isSelected
                    ? "text-primary"
                    : isAllowed
                      ? "text-text-primary"
                      : "text-text-secondary/50"
                }`}
              >
                {option.label}
              </p>
              <p
                className={`text-xs mt-0.5 leading-snug ${
                  isAllowed ? "text-text-secondary" : "text-text-secondary/40"
                }`}
              >
                {isAllowed
                  ? option.description
                  : `Beschikbaar vanaf ${option.minPlan}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
