import { cn } from "@/lib/utils";

/** The keystone mark: an arch with a gold keystone wedge at its apex. */
export function KeystoneMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 26.5a11 11 0 0 1 22 0"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 26.5a9.5 9.5 0 0 1 19 0"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* keystone wedge */}
      <path d="M12.4 6.2h7.2l-1.5 9.2h-4.2z" fill="var(--gold)" />
      <path d="M12.4 6.2h7.2l-1.5 9.2h-4.2z" stroke="var(--gold-strong)" strokeWidth="0.6" />
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
