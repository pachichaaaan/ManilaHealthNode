import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listAssignments } from "@/lib/repo";
import { computeAnalytics } from "@/lib/analytics";
import { Card, CardTitle } from "@/components/card";
import { ClassificationBadge, WbsBadge } from "@/components/badges";
import { wbsNeedsAction } from "@/lib/types";

export const dynamic = "force-dynamic";

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 text-xs text-ink-faint">
        <span className="h-2 w-2 rounded-full" style={{ background: `var(--stage-${tone})` }} />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink tnum">{value}</div>
    </div>
  );
}

export default async function WbsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const assignments = await listAssignments(isLead ? undefined : session.id);
  const a = computeAnalytics(assignments);
  const action = assignments
    .filter(wbsNeedsAction)
    .sort((x, y) => (x.wbsProvided === "no" ? 0 : 1) - (y.wbsProvided === "no" ? 0 : 1));
  const provided = assignments.filter((x) => x.wbsProvided === "yes");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">WBS status</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          A WBS code must be obtained before hours are charged. &ldquo;Not requested&rdquo; is a red flag.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Provided" value={a.wbsCounts.yes} tone="emerald" />
        <MiniStat label="Pending" value={a.wbsCounts.pending} tone="amber" />
        <MiniStat label="Not requested" value={a.wbsCounts.no} tone="rose" />
      </div>

      <Card>
        <CardTitle title="Action required" subtitle="Assignments that need a WBS code before charging" />
        {action.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-6">
            <CheckCircle2 className="h-5 w-5 text-stage-emerald" />
            <p className="text-sm text-ink-soft">Nothing outstanding — every code is provided or N/A.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {action.map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <AlertTriangle size={16} className={x.wbsProvided === "no" ? "text-stage-rose" : "text-stage-amber"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{x.client}</div>
                  <div className="truncate text-xs text-ink-faint">{x.member}</div>
                </div>
                <ClassificationBadge value={x.classification} />
                <WbsBadge value={x.wbsProvided} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle title="Provided codes" subtitle="Active WBS codes on record" />
        {provided.length === 0 ? (
          <p className="text-sm text-ink-faint">No WBS codes provided yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {provided.map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CheckCircle2 size={16} className="text-stage-emerald" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{x.client}</div>
                  <div className="truncate text-xs text-ink-faint">{x.member}</div>
                </div>
                <ClassificationBadge value={x.classification} />
                <code className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-ink-soft">{x.wbsCode ?? "—"}</code>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
