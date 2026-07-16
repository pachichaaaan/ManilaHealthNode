import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, ArrowUpRight, Clock, Plus, Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listAssignments } from "@/lib/repo";
import { computeAnalytics } from "@/lib/analytics";
import { CLASSIFICATION_META, WBS_META, WBS_STATES } from "@/lib/types";
import { Card, CardTitle } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { DashboardHero } from "@/components/dashboard-hero";
import { HoursArc } from "@/components/hours-arc";
import { HoursBars } from "@/components/hours-bars";
import { EndingSoon } from "@/components/ending-soon";
import { PlusOneCard } from "@/components/plus-one-card";
import { TiltCard } from "@/components/tilt-card";
import { Avatar } from "@/components/avatar";
import { formatHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const assignments = await listAssignments(isLead ? undefined : session.id);
  const a = computeAnalytics(assignments);
  const firstName = session.name.split(" ")[0];
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const barItems = [...assignments].sort((x, y) => y.estimatedHours - x.estimatedHours).slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      {/* WebGL hero masthead */}
      <DashboardHero>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">{today}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {isLead ? `Good to see you, ${firstName}.` : session.name}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {isLead
                ? a.members.length > 0
                  ? `Team overview · ${a.total} assignments across ${a.members.length} ${a.members.length === 1 ? "person" : "people"}`
                  : "Team overview · no assignments yet"
                : `${session.title ?? "Consultant"} · ${a.total} assignments · ${a.activeCount} active`}
            </p>
          </div>
          <Link href="/assignments" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#0a0f1c] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1c]">
            <Plus size={16} />
            Add assignment
          </Link>
        </div>
      </DashboardHero>

      {/* KPIs (3D tilt) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TiltCard><StatCard label="Active" value={a.activeCount} tone="emerald" icon={<Activity size={16} />} hint={`${a.total} total`} delay={0} /></TiltCard>
        <TiltCard><StatCard label="Plus 1" value={a.plusOneCount} tone="gold" icon={<Star size={16} />} hint={`${a.bdCount} BD · ${a.projectCount} project`} delay={70} /></TiltCard>
        <TiltCard><StatCard label="Hours logged" value={a.actualHours} kind="hours" tone="sky" icon={<Clock size={16} />} hint={`of ${formatHours(a.estimatedHours)} planned`} delay={140} /></TiltCard>
        <TiltCard><StatCard label="WBS to action" value={a.wbsActionCount} tone="rose" icon={<AlertTriangle size={16} />} hint="Codes not provided" delay={210} /></TiltCard>
      </div>

      {/* arc + hours */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up flex flex-col" style={{ animationDelay: "260ms" }}>
          <CardTitle title="Delivery" subtitle="Hours logged vs planned" />
          <div className="flex flex-1 items-center justify-center py-2">
            <HoursArc actual={a.actualHours} estimated={a.estimatedHours} />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-ink-soft">
            {a.classStats.filter((c) => c.count > 0).map((c) => (
              <span key={c.classification} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: `var(--stage-${CLASSIFICATION_META[c.classification].tone})` }} />
                {CLASSIFICATION_META[c.classification].label} · {c.count}
              </span>
            ))}
          </div>
        </Card>
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: "320ms" }}>
          <CardTitle title="Hours by assignment" subtitle={isLead ? "Across the team · actual vs estimate" : "Actual against estimate"} />
          {barItems.length > 0 ? (
            <HoursBars items={barItems} />
          ) : (
            <p className="py-6 text-center text-sm text-ink-faint">No assignments yet — add one to get started.</p>
          )}
        </Card>
      </div>

      {/* ending soon + wbs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "360ms" }}>
          <CardTitle title="Ending soon" subtitle="Active assignments by target end date" />
          <EndingSoon items={a.endingSoon} />
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "420ms" }}>
          <CardTitle title="WBS compliance" subtitle="Code provisioning across assignments" />
          <div className="flex h-2.5 overflow-hidden rounded-full">
            {WBS_STATES.map((w) => (a.wbsCounts[w] > 0 ? <div key={w} style={{ flex: a.wbsCounts[w], background: `var(--stage-${WBS_META[w].tone})` }} title={`${WBS_META[w].label}: ${a.wbsCounts[w]}`} /> : null))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {WBS_STATES.map((w) => (
              <div key={w} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className="h-2 w-2 rounded-full" style={{ background: `var(--stage-${WBS_META[w].tone})` }} />
                  {WBS_META[w].label}
                </span>
                <span className="tnum font-medium text-ink">{a.wbsCounts[w]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* by member (lead only) */}
      {isLead && a.members.length > 0 && (
        <Card className="animate-fade-up" style={{ animationDelay: "460ms" }}>
          <CardTitle title="By member" subtitle="Each person's load at a glance" action={<Link href="/team" className="inline-flex items-center gap-1 text-sm font-medium text-gold-text hover:underline">Manage <ArrowUpRight size={15} /></Link>} />
          <div className="grid gap-3 sm:grid-cols-2">
            {a.members.map((m) => (
              <div key={m.ownerId} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
                <Avatar name={m.member} accent={m.accent} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{m.member}</div>
                  <div className="text-[11px] text-ink-faint">{m.active} active · {m.plusOne} Plus 1 · {m.wbsAction ? `${m.wbsAction} WBS` : "WBS clear"}</div>
                </div>
                <div className="text-right">
                  <div className="tnum text-sm font-semibold text-ink">{formatHours(m.actualHours)}</div>
                  <div className="text-[11px] text-ink-faint">of {formatHours(m.estimatedHours)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* plus 1 watch */}
      {a.plusOnes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Plus 1 watch</h2>
              <p className="text-sm text-ink-soft">Stretch assignments aligned to key priorities.</p>
            </div>
            <Link href="/plus-one" className="inline-flex items-center gap-1 text-sm font-medium text-gold-text hover:underline">View all <ArrowUpRight size={15} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {a.plusOnes.slice(0, 6).map((p, i) => (
              <PlusOneCard key={p.id} a={p} delay={i * 60} showOwner={isLead} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
