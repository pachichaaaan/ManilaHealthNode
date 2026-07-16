import {
  CLASSIFICATION_META,
  PRIORITY_META,
  STATUS_META,
  WBS_META,
  type Classification,
  type Priority,
  type Status,
  type Tone,
  type WbsState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{ background: `var(--stage-${tone})` }}
    />
  );
}

function Badge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  const solid = `var(--stage-${tone})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${solid} 15%, transparent)`,
        color: `var(--stage-${tone}-fg)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: solid }} />
      {label}
    </span>
  );
}

export function ClassificationBadge({ value, className }: { value: Classification; className?: string }) {
  const m = CLASSIFICATION_META[value];
  return <Badge label={m.label} tone={m.tone} className={className} />;
}

export function StatusBadge({ value, className }: { value: Status; className?: string }) {
  const m = STATUS_META[value];
  return <Badge label={m.label} tone={m.tone} className={className} />;
}

export function PriorityBadge({ value, className }: { value: Priority; className?: string }) {
  const m = PRIORITY_META[value];
  return <Badge label={m.label} tone={m.tone} className={className} />;
}

export function WbsBadge({ value, className }: { value: WbsState; className?: string }) {
  const m = WBS_META[value];
  return <Badge label={m.label} tone={m.tone} className={className} />;
}
