import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listSkillEntries } from "@/lib/repo";
import type { SkillEntry } from "@/lib/repo";
import { SEED_TEAM, MATRIX_SKILLS, GAP_ANALYSIS, buildDynamicMatrix, getNamesForSkill, assessCoverage } from "@/lib/skills-matrix";
import { Card, CardTitle } from "@/components/card";
import { HealthSkillsClient } from "./client";

export const dynamic = "force-dynamic";

type CoverageVal = "●" | "○" | "";

const CATEGORIES = ["Domain", "Analytics", "Consulting", "Leadership"] as const;

const categoryColors: Record<string, string> = {
  Domain:     "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Analytics:  "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Consulting: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Leadership: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const LEVEL_ORDER = ["Manager", "Consultant", "Analyst"];

function memberId(name: string) {
  return `roster-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function assessmentStyle(a: string) {
  if (a === "Strong")   return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  if (a === "Adequate") return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
  if (a === "Thin")     return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
}

function coverageStyle(val: CoverageVal) {
  if (val === "●") return "text-emerald-500 font-bold text-base";
  if (val === "○") return "text-amber-500 text-base";
  return "text-ink-faint text-xs";
}

function mergeTeam(dbEntries: SkillEntry[]) {
  const dbByName = new Map(dbEntries.map((e) => [e.name.toLowerCase(), e]));
  const merged = SEED_TEAM.map((s) => dbByName.get(s.name.toLowerCase()) ?? s);
  for (const e of dbEntries) {
    if (!SEED_TEAM.find((s) => s.name.toLowerCase() === e.name.toLowerCase())) merged.push(e);
  }
  return merged.sort((a, b) => {
    const ai = LEVEL_ORDER.indexOf(a.level);
    const bi = LEVEL_ORDER.indexOf(b.level);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
  });
}

export default async function HealthSkillsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let dbEntries: SkillEntry[] = [];
  try { dbEntries = await listSkillEntries(); } catch { /* table may not exist yet */ }

  const team = mergeTeam(dbEntries);
  const dynamicMatrix = buildDynamicMatrix(dbEntries);

  const totalGaps   = GAP_ANALYSIS.filter((g) => getNamesForSkill(g.matrixKey, dynamicMatrix).direct.length === 0).length;
  const totalStrong = GAP_ANALYSIS.filter((g) => getNamesForSkill(g.matrixKey, dynamicMatrix).direct.length >= 3).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-faint">GN Health · Manila Node</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Health Skills Alignment
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Skills inventory, coverage matrix, and bench strength analysis · {team.length} team members
          </p>
        </div>
        <HealthSkillsClient />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Team Members",  value: team.length,   sub: "Industry Consulting" },
          { label: "Skills Tracked",value: MATRIX_SKILLS.length, sub: "Across 4 categories" },
          { label: "Strong Bench",  value: totalStrong,   sub: "Skills with 3+ direct" },
          { label: "Skill Gaps",    value: totalGaps,     sub: "No direct coverage" },
        ].map((s) => (
          <Card key={s.label} className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{s.label}</p>
            <p className="font-display text-3xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Gap Analysis */}
      <Card>
        <CardTitle
          title="Bench Strength & Gap Analysis"
          subtitle="Direct (●) = skill explicitly stated · Adjacent (○) = closely related skill implies capability"
        />
        <div className="flex flex-col gap-6">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${categoryColors[cat]}`}>{cat}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {GAP_ANALYSIS.filter((g) => g.category === cat).map((g) => {
                  const { direct, adjacent } = getNamesForSkill(g.matrixKey, dynamicMatrix);
                  const assessment = assessCoverage(direct.length, adjacent.length);
                  return (
                    <div key={g.skill} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{g.skill}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${assessmentStyle(assessment)}`}>{assessment}</span>
                      </div>
                      {direct.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">● Direct</span>
                          {direct.map((name) => (
                            <a key={name} href={`#${memberId(name)}`} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">{name}</a>
                          ))}
                        </div>
                      )}
                      {adjacent.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">○ Adjacent</span>
                          {adjacent.map((name) => (
                            <a key={name} href={`#${memberId(name)}`} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">{name}</a>
                          ))}
                        </div>
                      )}
                      {direct.length === 0 && adjacent.length === 0 && (
                        <p className="text-[11px] text-ink-faint">No coverage identified</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills Coverage Matrix */}
      <Card>
        <CardTitle title="Skills Coverage Matrix" subtitle="● Direct  ·  ○ Adjacent  ·  — No evidence" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface pb-2 pr-3 text-left text-xs font-semibold text-ink-faint" style={{ minWidth: 160 }}>Member</th>
                <th className="pb-2 pr-3 text-left text-xs font-semibold text-ink-faint" style={{ minWidth: 80 }}>Level</th>
                {MATRIX_SKILLS.map((s) => (
                  <th key={s.key} className="px-1 pb-2 text-center text-[10px] font-semibold leading-tight text-ink-faint" style={{ minWidth: 62, maxWidth: 72 }}>
                    <span className={`inline-block rounded px-1 py-0.5 ${categoryColors[s.category]}`}>{s.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dynamicMatrix.map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-surface-2/20" : ""}>
                  <td className="sticky left-0 z-10 bg-inherit py-2 pr-3 text-xs font-medium text-ink">{row.name}</td>
                  <td className="py-2 pr-3 text-xs text-ink-soft">{row.level}</td>
                  {MATRIX_SKILLS.map((s) => {
                    const val = row.coverage[s.key] as CoverageVal;
                    return (
                      <td key={s.key} className="py-2 text-center">
                        <span className={coverageStyle(val)}>{val || "—"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Team Skills Roster */}
      <Card>
        <CardTitle
          title="Team Skills Roster"
          subtitle={`Functional and business skills by member · sorted by level`}
        />
        <div className="flex flex-col divide-y divide-border">
          {team.map((member) => (
            <div key={member.name} id={memberId(member.name)} style={{ scrollMarginTop: "5rem" }} className="flex flex-col gap-2 py-4 -mx-2 px-2 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
              <div className="shrink-0 sm:w-48">
                <p className="text-sm font-semibold text-ink">{member.name}</p>
                <p className="text-xs text-ink-soft">{member.level} · {member.segment ?? "Industry Consulting"}</p>
                {member.internalAssignment && (
                  <p className="mt-1 text-[11px] italic text-gold-text">{member.internalAssignment}</p>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Functional</p>
                  <div className="flex flex-wrap gap-1">
                    {member.functionalSkills.map((s) => (
                      <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft border border-border">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Business</p>
                  <div className="flex flex-wrap gap-1">
                    {member.businessSkills.map((s) => (
                      <span key={s} className="rounded-md bg-gold/10 px-2 py-0.5 text-[11px] text-gold-text border border-gold/20">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
