"use client";

import type { ReactNode } from "react";
import { CountUp } from "./count-up";
import { formatHours } from "@/lib/utils";

type Kind = "hours" | "percent" | "number";

function makeFormatter(kind: Kind) {
  switch (kind) {
    case "hours":
      return (n: number) => formatHours(n);
    case "percent":
      return (n: number) => `${n}%`;
    default:
      return (n: number) => n.toLocaleString("en-GB");
  }
}

export function StatCard({
  label,
  value,
  kind = "number",
  icon,
  hint,
  tone = "gold",
  delay = 0,
}: {
  label: string;
  value: number;
  kind?: Kind;
  icon?: ReactNode;
  hint?: string;
  tone?: "gold" | "sky" | "emerald" | "rose" | "amber" | "slate";
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{
              background: `color-mix(in srgb, var(--stage-${tone}) 14%, transparent)`,
              color: `var(--stage-${tone}-fg)`,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-ink tnum">
        <CountUp value={value} format={makeFormatter(kind)} />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
