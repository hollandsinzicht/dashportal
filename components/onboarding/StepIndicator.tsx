"use client";

import { Check, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Step {
  number: number;
  title: string;
  optional?: boolean;
}

const steps: Step[] = [
  { number: 0, title: "Plan" },
  { number: 1, title: "Registratie" },
  { number: 2, title: "Microsoft", optional: true },
  { number: 3, title: "Workspace", optional: true },
  { number: 4, title: "Branding" },
  { number: 5, title: "Uitnodigen" },
];

interface StepIndicatorProps {
  currentStep: number;
  skippedSteps?: number[];
}

export function StepIndicator({ currentStep, skippedSteps = [] }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, index) => {
        const isSkipped = skippedSteps.includes(step.number);
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isFuture = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isSkipped && "bg-surface-secondary text-text-secondary border border-dashed border-border",
                  isCompleted && !isSkipped && "bg-success text-white",
                  isCurrent && "bg-primary text-white",
                  isFuture && !isSkipped && "bg-surface-secondary text-text-secondary border border-border"
                )}
              >
                {isSkipped ? (
                  <SkipForward className="w-4 h-4" />
                ) : isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1.5 hidden sm:block",
                  isCurrent
                    ? "text-primary font-medium"
                    : isSkipped
                    ? "text-text-secondary/60"
                    : "text-text-secondary"
                )}
              >
                {step.title}
              </span>
              {step.optional && (
                <span className="text-[10px] text-text-secondary/50 hidden sm:block">
                  (optioneel)
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-10 h-0.5 mx-1.5",
                  isCompleted && !isSkipped
                    ? "bg-success"
                    : isSkipped
                    ? "bg-border border-dashed"
                    : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
