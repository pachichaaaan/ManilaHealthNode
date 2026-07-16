"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export function CountUp({
  value,
  duration = 1100,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    // Reduced motion renders the final value directly (see `shown` below) —
    // no rAF, so it stays correct even when the tab's rAF loop is paused.
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const from = fromRef.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (value - from) * eased);
      setDisplay(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    // Guarantee the final value even if rAF is throttled (e.g. background tab),
    // where the animation frames would otherwise never fire.
    const fallback = window.setTimeout(() => {
      fromRef.current = value;
      setDisplay(value);
    }, duration + 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [value, duration, reduce]);

  const shown = reduce ? value : display;
  return (
    <span className={className}>
      {format ? format(shown) : shown.toLocaleString("en-GB")}
    </span>
  );
}
