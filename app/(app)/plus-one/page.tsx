import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssignments } from "@/lib/repo";
import { computeAnalytics } from "@/lib/analytics";
import { PlusOneCard } from "@/components/plus-one-card";
import { Card, CardTitle } from "@/components/card";
import { KeystoneMark } from "@/components/logo";
import { formatHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tracking-tight text-ink tnum">{value}</div>
    </div>
  );
}

export default async function PlusOnePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const assignments = await listAssignments(isLead ? undefined : session.id);
  const a = computeAnalytics(assignments);
  const est = a.plusOnes.reduce((s, x) => s + x.estimatedHours, 0);
  const act = a.plusOnes.reduce((s, x) => s + x.actualHours, 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-gold-text">
          <KeystoneMark className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">The stretch</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Plus 1</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          {isLead ? "Every member's" : "Your"} additional / stretch assignments, and how each aligns
          to a firm key priority and offering.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Plus 1 assignments" value={String(a.plusOneCount)} />
        <MiniStat label="Hours logged" value={`${formatHours(act)} / ${formatHours(est)}`} />
        <MiniStat label="Key priorities" value={String(a.priorityGroups.length)} />
      </div>

      {a.priorityGroups.length > 0 && (
        <Card>
          <CardTitle title="Alignment to key priorities" subtitle="Where the +1 effort is directed" />
          <ul className="flex flex-col divide-y divide-border">
            {a.priorityGroups.map((g) => (
              <li key={g.keyPriority} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{g.keyPriority}</div>
                  <div className="truncate text-xs text-ink-faint">{g.assignments.map((x) => x.offering ?? x.client).join(" · ")}</div>
                </div>
                <span className="tnum shrink-0 rounded-full bg-[var(--gold-tint)] px-2.5 py-0.5 text-xs font-semibold text-gold-text">{g.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {a.plusOnes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {a.plusOnes.map((p, i) => (
            <PlusOneCard key={p.id} a={p} delay={i * 70} showOwner={isLead} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">No Plus 1 assignments yet.</p>
      )}
    </div>
  );
}
