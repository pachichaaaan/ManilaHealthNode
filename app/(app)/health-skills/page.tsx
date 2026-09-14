import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listSkillEntries } from "@/lib/repo";
import type { SkillEntry } from "@/lib/repo";
import { Card, CardTitle } from "@/components/card";
import { HealthSkillsClient } from "./client";

export const dynamic = "force-dynamic";

// Seed data from GN Health Skills Alignment - Manila Node.xlsm
const SEED_TEAM = [
  {
    name: "Adrianne Tan-gatue",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Clinical Data Integration", "AI in Healthcare", "Prior Authorization", "Clinical Analytics", "Clinical Operations", "Healthcare Workforce Management"],
    businessSkills: ["Business Analysis", "Project Management", "Cost-Benefit Analysis", "Leadership & Team Management"],
    internalAssignment: null,
  },
  {
    name: "Aristotle Castro",
    segment: "Industry Consulting",
    level: "Manager",
    functionalSkills: ["Healthcare Data Management (HEDIS, CCTI, CDM)", "HL7/FHIR Integration", "SAP FICO/xRPM/ECC 6.0/S4HANA", "Care Management Systems", "Data Architecture"],
    businessSkills: ["Program & Vendor Management", "Data Quality & Governance Strategy", "Budget & Financial Oversight", "Enterprise System Implementation"],
    internalAssignment: null,
  },
  {
    name: "Bien Jonas Caluyo",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Care Management", "EHR / EMR Systems", "Health Interoperability (HL7)", "HIPAA Compliance"],
    businessSkills: ["Change Management", "PMO & Governance", "Business Analysis"],
    internalAssignment: "Industry Tower, Onboarding, and Engagements POC",
  },
  {
    name: "Brian Matthew P. Belen",
    segment: "Industry Consulting",
    level: "Analyst",
    functionalSkills: ["Public Health", "Digital Health", "EHR / EMR Systems", "Health Information Exchange (HIE)", "Health Policy & Regulatory Programs", "Generative AI (GenAI) in Healthcare"],
    businessSkills: ["Digital Transformation", "PMO & Governance", "Business Case Development", "AI Strategy"],
    internalAssignment: null,
  },
  {
    name: "Chelsea Patricia L. Lopez",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["AI Product Management", "Clinical Decision Support", "Digital Health"],
    businessSkills: ["Current & Future State Assessment", "PMO & Governance", "Technology Assessment", "Program Management"],
    internalAssignment: "Market Outreach - Manila, AO&J",
  },
  {
    name: "Jon Eric Cuevas",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Payer Operations", "Provider Network Management", "symplr Payer", "Facets", "Medical Coding", "AI in Healthcare"],
    businessSkills: ["Data Analysis", "Requirements Gathering", "Business Analysis", "Change Management"],
    internalAssignment: null,
  },
  {
    name: "Kacelyn Palma",
    segment: "Industry Consulting",
    level: "Manager",
    functionalSkills: ["Business Process Reengineering", "FDD Development", "Data Mapping", "Payment Integrity", "JIRA/Visio/Mural", "Change Management Foundations (certified)"],
    businessSkills: ["Strategic Planning & Business Transformation", "Program Management", "Business Process Improvement", "Organizational Change Management", "Training & Development Program Design"],
    internalAssignment: null,
  },
  {
    name: "Kyle Darren Gerente",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["AI in Healthcare", "Risk Adjustment", "Healthcare Compliance", "HealthEdge", "HEDIS & Quality Reporting", "Medical Coding"],
    businessSkills: ["Business Analysis", "Digital Transformation", "User Story & Backlog Management", "Requirements Gathering"],
    internalAssignment: null,
  },
  {
    name: "Mar Alfie Mendoza",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Provider Network Management", "Payer Operations", "AI in Healthcare", "Claims Adjudication", "symplr Payer", "HealthEdge"],
    businessSkills: ["Requirements Gathering", "Change Management", "Digital Transformation", "Data Analysis"],
    internalAssignment: null,
  },
  {
    name: "Patricia Mamaril",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Agentic AI Solutions", "Clinical Data Integration", "Data Migration", "EHR / EMR Systems", "Provider Data Management", "Salesforce Service Cloud"],
    businessSkills: ["Business Analysis", "Data Analysis", "Process Mapping", "Go-to-Market (GTM) Strategy"],
    internalAssignment: null,
  },
  {
    name: "Earl Zyrus Abeleda",
    segment: "Industry Consulting",
    level: "Consultant",
    functionalSkills: ["Benefits Administration", "Enrollment & Billing", "Member Engagement", "Benefit Plan Configuration", "Claims Adjudication", "Payer Operations"],
    businessSkills: ["Business Analysis", "Requirements Gathering", "Functional & UAT Testing", "Process Mapping"],
    internalAssignment: "Engagement POC",
  },
  {
    name: "Sai Meghana Paidi",
    segment: "Industry Consulting",
    level: "Analyst",
    functionalSkills: ["Public Health", "AI in Healthcare", "Clinical Operations", "Business Process Analysis and Mapping", "Tableau/Power BI for Visualization", "Clinical Workflow/Process Improvement"],
    businessSkills: ["Stakeholder Management", "Workshop Facilitation", "Process Mapping", "Requirements Elicitation and Documentation", "Change Management", "UAT and Test Case Design/Execution"],
    internalAssignment: null,
  },
];

const MATRIX_SKILLS = [
  { key: "claims", label: "Claims", category: "Domain" },
  { key: "medicareAdvantage", label: "Medicare Advantage", category: "Domain" },
  { key: "paymentIntegrity", label: "Payment Integrity", category: "Domain" },
  { key: "fwa", label: "FWA", category: "Domain" },
  { key: "utilizationManagement", label: "Utilization Mgmt", category: "Domain" },
  { key: "sql", label: "SQL", category: "Analytics" },
  { key: "powerBi", label: "Power BI", category: "Analytics" },
  { key: "dataAnalysis", label: "Data Analysis", category: "Analytics" },
  { key: "requirementsGathering", label: "Requirements Gathering", category: "Consulting" },
  { key: "processMapping", label: "Process Mapping", category: "Consulting" },
  { key: "uat", label: "UAT", category: "Consulting" },
  { key: "operatingModelDesign", label: "Operating Model Design", category: "Leadership" },
  { key: "stakeholderManagement", label: "Stakeholder Mgmt", category: "Leadership" },
  { key: "executiveCommunication", label: "Executive Comms", category: "Leadership" },
  { key: "programManagement", label: "Program Management", category: "Leadership" },
] as const;

type SkillKey = typeof MATRIX_SKILLS[number]["key"];

const MATRIX: { name: string; level: string; coverage: Record<SkillKey, string> }[] = [
  { name: "Adrianne Tan-gatue", level: "Consultant", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "○", sql: "○", powerBi: "", dataAnalysis: "●", requirementsGathering: "○", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "○", executiveCommunication: "", programManagement: "○" } },
  { name: "Aristotle Castro", level: "Manager", coverage: { claims: "", medicareAdvantage: "○", paymentIntegrity: "", fwa: "", utilizationManagement: "○", sql: "○", powerBi: "", dataAnalysis: "", requirementsGathering: "", processMapping: "○", uat: "", operatingModelDesign: "○", stakeholderManagement: "○", executiveCommunication: "●", programManagement: "" } },
  { name: "Bien Jonas Caluyo", level: "Consultant", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "○", sql: "", powerBi: "", dataAnalysis: "", requirementsGathering: "○", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "○", executiveCommunication: "", programManagement: "○" } },
  { name: "Brian Matthew P. Belen", level: "Analyst", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "", requirementsGathering: "○", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "○", executiveCommunication: "○", programManagement: "○" } },
  { name: "Chelsea Patricia L. Lopez", level: "Consultant", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "", requirementsGathering: "○", processMapping: "", uat: "", operatingModelDesign: "○", stakeholderManagement: "○", executiveCommunication: "○", programManagement: "●" } },
  { name: "Jon Eric Cuevas", level: "Consultant", coverage: { claims: "○", medicareAdvantage: "", paymentIntegrity: "○", fwa: "○", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "●", requirementsGathering: "●", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "○", executiveCommunication: "", programManagement: "" } },
  { name: "Kacelyn Palma", level: "Manager", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "●", fwa: "○", utilizationManagement: "", sql: "○", powerBi: "", dataAnalysis: "○", requirementsGathering: "○", processMapping: "○", uat: "", operatingModelDesign: "○", stakeholderManagement: "○", executiveCommunication: "○", programManagement: "●" } },
  { name: "Kyle Darren Gerente", level: "Consultant", coverage: { claims: "○", medicareAdvantage: "○", paymentIntegrity: "○", fwa: "○", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "", requirementsGathering: "●", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "", executiveCommunication: "", programManagement: "" } },
  { name: "Mar Alfie Mendoza", level: "Consultant", coverage: { claims: "●", medicareAdvantage: "", paymentIntegrity: "○", fwa: "○", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "●", requirementsGathering: "●", processMapping: "", uat: "", operatingModelDesign: "", stakeholderManagement: "○", executiveCommunication: "", programManagement: "" } },
  { name: "Patricia Mamaril", level: "Consultant", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "", sql: "○", powerBi: "", dataAnalysis: "●", requirementsGathering: "○", processMapping: "●", uat: "", operatingModelDesign: "", stakeholderManagement: "", executiveCommunication: "", programManagement: "" } },
  { name: "Earl Zyrus Abeleda", level: "Consultant", coverage: { claims: "●", medicareAdvantage: "", paymentIntegrity: "○", fwa: "○", utilizationManagement: "", sql: "", powerBi: "", dataAnalysis: "", requirementsGathering: "●", processMapping: "●", uat: "●", operatingModelDesign: "", stakeholderManagement: "", executiveCommunication: "", programManagement: "" } },
  { name: "Sai Meghana Paidi", level: "Analyst", coverage: { claims: "", medicareAdvantage: "", paymentIntegrity: "", fwa: "", utilizationManagement: "", sql: "○", powerBi: "●", dataAnalysis: "○", requirementsGathering: "●", processMapping: "●", uat: "●", operatingModelDesign: "", stakeholderManagement: "●", executiveCommunication: "○", programManagement: "" } },
];

const GAP_ANALYSIS = [
  { category: "Domain", skill: "Claims", direct: 2, adjacent: 2, assessment: "Adequate" },
  { category: "Domain", skill: "Medicare Advantage", direct: 0, adjacent: 2, assessment: "GAP" },
  { category: "Domain", skill: "Payment Integrity", direct: 1, adjacent: 4, assessment: "Thin" },
  { category: "Domain", skill: "FWA", direct: 0, adjacent: 5, assessment: "GAP" },
  { category: "Domain", skill: "Utilization Management", direct: 0, adjacent: 3, assessment: "GAP" },
  { category: "Analytics", skill: "SQL", direct: 0, adjacent: 4, assessment: "GAP" },
  { category: "Analytics", skill: "Power BI", direct: 1, adjacent: 0, assessment: "Thin" },
  { category: "Analytics", skill: "Data Analysis", direct: 4, adjacent: 2, assessment: "Strong" },
  { category: "Consulting", skill: "Requirements Gathering", direct: 5, adjacent: 4, assessment: "Strong" },
  { category: "Consulting", skill: "Process Mapping", direct: 3, adjacent: 1, assessment: "Adequate" },
  { category: "Consulting", skill: "UAT", direct: 2, adjacent: 1, assessment: "Adequate" },
  { category: "Consulting", skill: "Operating Model Design", direct: 0, adjacent: 2, assessment: "GAP" },
  { category: "Leadership", skill: "Stakeholder Management", direct: 1, adjacent: 8, assessment: "Thin" },
  { category: "Leadership", skill: "Executive Communication", direct: 0, adjacent: 5, assessment: "GAP" },
  { category: "Leadership", skill: "Program Management", direct: 3, adjacent: 3, assessment: "Adequate" },
];

function assessmentStyle(a: string) {
  if (a === "Strong") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  if (a === "Adequate") return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
  if (a === "Thin") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
}

function coverageStyle(val: string) {
  if (val === "●") return "text-emerald-500 font-bold text-base";
  if (val === "○") return "text-amber-500 text-base";
  return "text-ink-faint text-xs";
}

const CATEGORIES = ["Domain", "Analytics", "Consulting", "Leadership"] as const;

const categoryColors: Record<string, string> = {
  Domain: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Analytics: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Consulting: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Leadership: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const LEVEL_ORDER = ["Manager", "Consultant", "Analyst"];

// Merge DB entries over seed data by name (DB wins)
function mergeTeam(dbEntries: SkillEntry[]) {
  const dbByName = new Map(dbEntries.map((e) => [e.name.toLowerCase(), e]));
  const merged = SEED_TEAM.map((s) => dbByName.get(s.name.toLowerCase()) ?? s);
  // Add any DB entries not in seed
  for (const e of dbEntries) {
    if (!SEED_TEAM.find((s) => s.name.toLowerCase() === e.name.toLowerCase())) {
      merged.push(e);
    }
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
  try {
    dbEntries = await listSkillEntries();
  } catch {
    // Table may not exist yet — page still works with seed data
  }

  const team = mergeTeam(dbEntries);
  const totalGaps = GAP_ANALYSIS.filter((g) => g.assessment === "GAP").length;
  const totalStrong = GAP_ANALYSIS.filter((g) => g.assessment === "Strong").length;

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
          { label: "Team Members", value: team.length, sub: "Industry Consulting" },
          { label: "Skills Tracked", value: MATRIX_SKILLS.length, sub: "Across 4 categories" },
          { label: "Strong Bench", value: totalStrong, sub: "Skills with deep coverage" },
          { label: "Skill Gaps", value: totalGaps, sub: "No direct coverage" },
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
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${categoryColors[cat]}`}>
                  {cat}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {GAP_ANALYSIS.filter((g) => g.category === cat).map((g) => (
                  <div key={g.skill} className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{g.skill}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">{g.direct} direct · {g.adjacent} adjacent</p>
                    </div>
                    <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${assessmentStyle(g.assessment)}`}>
                      {g.assessment}
                    </span>
                  </div>
                ))}
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
              {MATRIX.map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-surface-2/20" : ""}>
                  <td className="sticky left-0 z-10 bg-inherit py-2 pr-3 text-xs font-medium text-ink">{row.name}</td>
                  <td className="py-2 pr-3 text-xs text-ink-soft">{row.level}</td>
                  {MATRIX_SKILLS.map((s) => {
                    const val = row.coverage[s.key];
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

      {/* Team Skills Roster — dynamic */}
      <Card>
        <CardTitle
          title="Team Skills Roster"
          subtitle={`Functional and business skills by member · ${dbEntries.length > 0 ? `${dbEntries.length} submitted entr${dbEntries.length === 1 ? "y" : "ies"} · ` : ""}sorted by level`}
        />
        <div className="flex flex-col divide-y divide-border">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
              <div className="shrink-0 sm:w-48">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{member.name}</p>
                  {dbEntries.some((e) => e.name.toLowerCase() === member.name.toLowerCase()) && (
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      submitted
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-soft">{member.level} · {"segment" in member ? member.segment : "Industry Consulting"}</p>
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
