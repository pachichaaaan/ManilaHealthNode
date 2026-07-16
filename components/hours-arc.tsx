"use client";

import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "./count-up";
import { formatHours } from "@/lib/utils";

const ARC = "M 24 130 A 96 96 0 0 1 216 130";

export function HoursArc({ actual, estimated }: { actual: number; estimated: number }) {
  const reduce = useReducedMotion();
  const fraction = estimated > 0 ? Math.max(0, Math.min(1, actual / estimated)) : 0;
  const pct = Math.round(fraction * 100);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 240 150" className="w-full max-w-[280px]" aria-hidden="true">
        <defs>
          <linearGradient id="hours-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--stage-amber)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <path d={ARC} fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d={ARC}
          fill="none"
          stroke="url(#hours-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? fraction : 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: reduce ? 0 : 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-[42%] flex flex-col items-center">
        <div className="font-display text-[1.9rem] font-semibold tracking-tight text-ink tnum">
          <CountUp value={actual} format={formatHours} />
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">Hours logged</div>
      </div>

      <p className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-display font-semibold text-gold-text tnum">{pct}%</span>
        <span className="text-ink-faint">of {formatHours(estimated)} planned</span>
      </p>
    </div>
  );
}
