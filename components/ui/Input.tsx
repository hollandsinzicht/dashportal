"use client";

import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-surface text-text-primary placeholder:text-text-secondary/50 transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error
              ? "border-danger focus:ring-danger focus:border-danger"
              : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {hint && !error && (
          <p className="text-sm text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
