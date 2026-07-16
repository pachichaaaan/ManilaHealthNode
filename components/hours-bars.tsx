"use client";

import { motion, useReducedMotion } from "motion/react";
import { CLASSIFICATION_META, type Assignment } from "@/lib/types";
import { formatHours } from "@/lib/utils";

/** Estimated hours as a faint track, actual hours as the coloured fill. */
export function HoursBars({ items }: { items: Assignment[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...items.map((a) => a.estimatedHours));

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((a, i) => {
        const tone = CLASSIFICATION_META[a.classification].tone;
        const estW = (a.estimatedHours / max) * 100;
        const actW = (a.actualHours / max) * 100;
        return (
          <div key={a.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--stage-${tone})` }} />
                <span className="truncate">{a.client}</span>
              </span>
              <span className="tnum shrink-0 text-ink-soft">
                {formatHours(a.actualHours)}
                <span className="text-ink-faint"> / {formatHours(a.estimatedHours)}</span>
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
              {/* estimated track */}
              <div
                className="absolute inset-y-0 left-0 rounded-full opacity-30"
                style={{ width: `${estW}%`, background: `var(--stage-${tone})` }}
              />
              {/* actual fill */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `var(--stage-${tone})` }}
                initial={{ width: reduce ? `${actW}%` : 0 }}
                animate={{ width: `${actW}%` }}
                transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
