// Rows link to the assignment they represent (/assignments?open=<id>).
import Link from "next/link";
import { Dot } from "./badges";
import { CLASSIFICATION_META, type Assignment } from "@/lib/types";
import { cn, daysUntil, formatDate, formatHours } from "@/lib/utils";

export function EndingSoon({ items }: { items: Assignment[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint">No active assignments with a target end date.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((a) => {
        const dd = daysUntil(a.endDate);
        const overdue = dd != null && dd < 0;
        return (
          <li key={a.id} className="first:pt-0 last:pb-0">
            <Link
              href={`/assignments?open=${a.id}`}
              className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/50"
            >
            <Dot tone={CLASSIFICATION_META[a.classification].tone} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink transition-colors group-hover:text-gold-text">{a.client}</div>
              <div className="truncate text-xs text-ink-faint">
                {CLASSIFICATION_META[a.classification].label} · {formatHours(a.actualHours)}/{formatHours(a.estimatedHours)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-ink">{formatDate(a.endDate)}</div>
              <div className={cn("text-[11px]", overdue ? "text-stage-rose" : "text-ink-faint")}>
                {dd == null
                  ? ""
                  : overdue
                    ? `${-dd}d overdue`
                    : dd === 0
                      ? "today"
                      : `in ${dd}d`}
              </div>
            </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
