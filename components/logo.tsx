"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Brand mark: a white chevron (>) on a purple gradient tile. */
export function KeystoneMark({ className }: { className?: string }) {
  // Unique gradient id per instance — avoids id collisions across the multiple
  // marks on a page (which would break the fill).
  const gid = `acc-chevron-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a0b5e" />
          <stop offset="55%" stopColor="#6a24c8" />
          <stop offset="100%" stopColor="#a24dff" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill={`url(#${gid})`} />
      <path
        d="M11 8.5 L21.5 16 L11 23.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KeystoneMark className="h-7 w-7 shrink-0 text-ink" />
      {!compact && (
        <span className="font-display text-[0.95rem] font-semibold leading-tight tracking-tight">
          Manila Health Node
        </span>
      )}
    </span>
  );
}
