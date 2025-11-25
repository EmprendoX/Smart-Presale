"use client";

import { clsx } from "clsx";

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function Progress({
  value,
  label,
  showPercentage = true,
  className
}: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className={clsx("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[color:var(--text-strong)] font-medium">
            {label}
          </span>
          {showPercentage && (
            <span className="text-[color:var(--text-muted)]">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-[color:var(--bg-soft)] rounded-full overflow-hidden border border-[color:var(--line)]">
        <div
          className="h-full bg-[color:var(--brand-primary)] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}



