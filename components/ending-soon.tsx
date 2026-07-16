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
          <li key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Dot tone={CLASSIFICATION_META[a.classification].tone} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{a.client}</div>
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
          </li>
        );
      })}
    </ul>
  );
}
