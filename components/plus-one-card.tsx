import { ArrowRight } from "lucide-react";
import { KeystoneMark } from "./logo";
import { Avatar } from "./avatar";
import { StatusBadge, WbsBadge } from "./badges";
import { formatDate, formatHours } from "@/lib/utils";
import { hoursProgress, type Assignment } from "@/lib/types";

export function PlusOneCard({ a, delay = 0, showOwner = false }: { a: Assignment; delay?: number; showOwner?: boolean }) {
  const pct = Math.round(hoursProgress(a) * 100);
  return (
    <div
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* keystone-shaped accent */}
      <div
        className="pointer-events-none absolute -top-px right-5 h-9 w-7"
        style={{ clipPath: "polygon(0 0, 100% 0, 82% 100%, 18% 100%)", background: "var(--gold-tint)" }}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-text">
          <KeystoneMark className="h-4 w-4" />
          Plus 1
        </div>
        {showOwner && (
          <span className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Avatar name={a.member} accent={a.ownerAccent} size={20} />
            {a.member}
          </span>
        )}
      </div>

      <div className="mt-2 font-display text-lg font-semibold leading-snug text-ink">{a.client}</div>
      {(a.keyPriority || a.offering) && (
        <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <span>{a.keyPriority ?? "—"}</span>
          {a.offering && (
            <>
              <ArrowRight size={13} className="text-ink-faint" />
              <span>{a.offering}</span>
            </>
          )}
        </div>
      )}

      {/* hours progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-ink-faint">Hours logged</span>
          <span className="tnum text-ink-soft">
            {formatHours(a.actualHours)} / {formatHours(a.estimatedHours)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <StatusBadge value={a.status} />
        <WbsBadge value={a.wbsProvided} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-faint">
        <span>POC {a.gnPocName ?? "—"}</span>
        <span>Ends {formatDate(a.endDate)}</span>
      </div>
    </div>
  );
}
