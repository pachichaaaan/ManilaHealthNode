import type { SkillEntry } from "./repo";

export const SEED_TEAM = [
  { name: "Adrianne Tan-gatue",       segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Clinical Data Integration","AI in Healthcare","Prior Authorization","Clinical Analytics","Clinical Operations","Healthcare Workforce Management"], businessSkills: ["Business Analysis","Project Management","Cost-Benefit Analysis","Leadership & Team Management"], internalAssignment: null },
  { name: "Aristotle Castro",          segment: "Industry Consulting", level: "Manager",   functionalSkills: ["Healthcare Data Management (HEDIS, CCTI, CDM)","HL7/FHIR Integration","SAP FICO/xRPM/ECC 6.0/S4HANA","Care Management Systems","Data Architecture"], businessSkills: ["Program & Vendor Management","Data Quality & Governance Strategy","Budget & Financial Oversight","Enterprise System Implementation"], internalAssignment: null },
  { name: "Bien Jonas Caluyo",         segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Care Management","EHR / EMR Systems","Health Interoperability (HL7)","HIPAA Compliance"], businessSkills: ["Change Management","PMO & Governance","Business Analysis"], internalAssignment: "Industry Tower, Onboarding, and Engagements POC" },
  { name: "Brian Matthew P. Belen",    segment: "Industry Consulting", level: "Analyst",   functionalSkills: ["Public Health","Digital Health","EHR / EMR Systems","Health Information Exchange (HIE)","Health Policy & Regulatory Programs","Generative AI (GenAI) in Healthcare"], businessSkills: ["Digital Transformation","PMO & Governance","Business Case Development","AI Strategy"], internalAssignment: null },
  { name: "Chelsea Patricia L. Lopez", segment: "Industry Consulting", level: "Consultant", functionalSkills: ["AI Product Management","Clinical Decision Support","Digital Health"], businessSkills: ["Current & Future State Assessment","PMO & Governance","Technology Assessment","Program Management"], internalAssignment: "Market Outreach - Manila, AO&J" },
  { name: "Jon Eric Cuevas",           segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Payer Operations","Provider Network Management","symplr Payer","Facets","Medical Coding","AI in Healthcare"], businessSkills: ["Data Analysis","Requirements Gathering","Business Analysis","Change Management"], internalAssignment: null },
  { name: "Kacelyn Palma",             segment: "Industry Consulting", level: "Manager",   functionalSkills: ["Business Process Reengineering","FDD Development","Data Mapping","Payment Integrity","JIRA/Visio/Mural","Change Management Foundations (certified)"], businessSkills: ["Strategic Planning & Business Transformation","Program Management","Business Process Improvement","Organizational Change Management","Training & Development Program Design"], internalAssignment: null },
  { name: "Kyle Darren Gerente",       segment: "Industry Consulting", level: "Consultant", functionalSkills: ["AI in Healthcare","Risk Adjustment","Healthcare Compliance","HealthEdge","HEDIS & Quality Reporting","Medical Coding"], businessSkills: ["Business Analysis","Digital Transformation","User Story & Backlog Management","Requirements Gathering"], internalAssignment: null },
  { name: "Mar Alfie Mendoza",         segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Provider Network Management","Payer Operations","AI in Healthcare","Claims Adjudication","symplr Payer","HealthEdge"], businessSkills: ["Requirements Gathering","Change Management","Digital Transformation","Data Analysis"], internalAssignment: null },
  { name: "Patricia Mamaril",          segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Agentic AI Solutions","Clinical Data Integration","Data Migration","EHR / EMR Systems","Provider Data Management","Salesforce Service Cloud"], businessSkills: ["Business Analysis","Data Analysis","Process Mapping","Go-to-Market (GTM) Strategy"], internalAssignment: null },
  { name: "Earl Zyrus Abeleda",        segment: "Industry Consulting", level: "Consultant", functionalSkills: ["Benefits Administration","Enrollment & Billing","Member Engagement","Benefit Plan Configuration","Claims Adjudication","Payer Operations"], businessSkills: ["Business Analysis","Requirements Gathering","Functional & UAT Testing","Process Mapping"], internalAssignment: "Engagement POC" },
  { name: "Sai Meghana Paidi",         segment: "Industry Consulting", level: "Analyst",   functionalSkills: ["Public Health","AI in Healthcare","Clinical Operations","Business Process Analysis and Mapping","Tableau/Power BI for Visualization","Clinical Workflow/Process Improvement"], businessSkills: ["Stakeholder Management","Workshop Facilitation","Process Mapping","Requirements Elicitation and Documentation","Change Management","UAT and Test Case Design/Execution"], internalAssignment: null },
];

export const MATRIX_SKILLS = [
  { key: "claims",                 label: "Claims",                  category: "Domain" },
  { key: "medicareAdvantage",      label: "Medicare Advantage",      category: "Domain" },
  { key: "paymentIntegrity",       label: "Payment Integrity",       category: "Domain" },
  { key: "fwa",                    label: "FWA",                     category: "Domain" },
  { key: "utilizationManagement",  label: "Utilization Mgmt",        category: "Domain" },
  { key: "sql",                    label: "SQL",                     category: "Analytics" },
  { key: "powerBi",                label: "Power BI",                category: "Analytics" },
  { key: "dataAnalysis",           label: "Data Analysis",           category: "Analytics" },
  { key: "requirementsGathering",  label: "Requirements Gathering",  category: "Consulting" },
  { key: "processMapping",         label: "Process Mapping",         category: "Consulting" },
  { key: "uat",                    label: "UAT",                     category: "Consulting" },
  { key: "operatingModelDesign",   label: "Operating Model Design",  category: "Leadership" },
  { key: "stakeholderManagement",  label: "Stakeholder Mgmt",        category: "Leadership" },
  { key: "executiveCommunication", label: "Executive Comms",         category: "Leadership" },
  { key: "programManagement",      label: "Program Management",      category: "Leadership" },
] as const;

export type SkillKey = typeof MATRIX_SKILLS[number]["key"];
export type CoverageVal = "●" | "○" | "";
export type Coverage = Record<SkillKey, CoverageVal>;

// skill name → matrix key → direct (●) or adjacent (○)
const SKILL_COVERAGE_MAP: [string, SkillKey, CoverageVal][] = [
  ["Claims Adjudication",                  "claims", "●"],
  ["Claims Management",                    "claims", "●"],
  ["Payer Operations",                     "claims", "○"],
  ["Benefits Administration",              "claims", "○"],
  ["Enrollment & Billing",                 "claims", "○"],
  ["Revenue Cycle Management (RCM)",       "claims", "○"],
  ["symplr Payer",                         "claims", "○"],
  ["QNXT",                                 "claims", "○"],
  ["Facets",                               "claims", "○"],
  ["Benefit Plan Configuration",           "claims", "○"],
  ["Medicare",                             "medicareAdvantage", "●"],
  ["Risk Adjustment",                      "medicareAdvantage", "○"],
  ["HEDIS & Quality Reporting",            "medicareAdvantage", "○"],
  ["Healthcare Compliance",                "medicareAdvantage", "○"],
  ["Care Management Systems",              "medicareAdvantage", "○"],
  ["Health Policy & Regulatory Programs",  "medicareAdvantage", "○"],
  ["Medicaid",                             "medicareAdvantage", "○"],
  ["Payment Integrity",                    "paymentIntegrity", "●"],
  ["Medical Coding",                       "paymentIntegrity", "○"],
  ["HIPAA Compliance",                     "paymentIntegrity", "○"],
  ["Revenue Cycle Management (RCM)",       "paymentIntegrity", "○"],
  ["Claims Adjudication",                  "paymentIntegrity", "○"],
  ["Claims Management",                    "paymentIntegrity", "○"],
  ["Healthcare Compliance",                "fwa", "○"],
  ["Medical Coding",                       "fwa", "○"],
  ["Payment Integrity",                    "fwa", "○"],
  ["Payer Operations",                     "fwa", "○"],
  ["Claims Adjudication",                  "fwa", "○"],
  ["Claims Management",                    "fwa", "○"],
  ["Benefits Administration",              "fwa", "○"],
  ["Prior Authorization",                  "fwa", "○"],
  ["HIPAA Compliance",                     "fwa", "○"],
  ["Utilization Management (UM)",          "utilizationManagement", "●"],
  ["Utilization Review",                   "utilizationManagement", "●"],
  ["Care Management",                      "utilizationManagement", "○"],
  ["Clinical Operations",                  "utilizationManagement", "○"],
  ["Prior Authorization",                  "utilizationManagement", "○"],
  ["Population Health Management",         "utilizationManagement", "○"],
  ["Care Coordination",                    "utilizationManagement", "○"],
  ["Care Model Design",                    "utilizationManagement", "○"],
  ["Healthcare Data Management (HEDIS, CCTI, CDM)", "sql", "○"],
  ["Data Architecture",                    "sql", "○"],
  ["Data Mapping",                         "sql", "○"],
  ["Data Migration",                       "sql", "○"],
  ["Clinical Analytics",                   "sql", "○"],
  ["Healthcare Analytics",                 "sql", "○"],
  ["HEDIS & Quality Reporting",            "sql", "○"],
  ["Tableau/Power BI for Visualization",   "sql", "○"],
  ["Tableau/Power BI for Visualization",   "powerBi", "●"],
  ["Clinical Analytics",                   "powerBi", "○"],
  ["Healthcare Analytics",                 "powerBi", "○"],
  ["Data Analysis",                        "powerBi", "○"],
  ["Data Analysis",                        "dataAnalysis", "●"],
  ["Clinical Analytics",                   "dataAnalysis", "●"],
  ["Healthcare Analytics",                 "dataAnalysis", "●"],
  ["Clinical Data Integration",            "dataAnalysis", "●"],
  ["Business Process Analysis and Mapping","dataAnalysis", "○"],
  ["Data Visualization",                   "dataAnalysis", "○"],
  ["Tableau/Power BI for Visualization",   "dataAnalysis", "○"],
  ["Requirements Gathering",               "requirementsGathering", "●"],
  ["Requirements Elicitation and Documentation", "requirementsGathering", "●"],
  ["Translating business needs into requirements", "requirementsGathering", "●"],
  ["Business Analysis",                    "requirementsGathering", "○"],
  ["PMO & Governance",                     "requirementsGathering", "○"],
  ["Process Mapping",                      "processMapping", "●"],
  ["Business Process Analysis and Mapping","processMapping", "●"],
  ["Business Process Reengineering",       "processMapping", "○"],
  ["FDD Development",                      "processMapping", "○"],
  ["Data Mapping",                         "processMapping", "○"],
  ["Functional & UAT Testing",             "uat", "●"],
  ["UAT and Test Case Design/Execution",   "uat", "●"],
  ["User Story & Backlog Management",      "uat", "○"],
  ["Operating Model Design",               "operatingModelDesign", "●"],
  ["Business Process Reengineering",       "operatingModelDesign", "○"],
  ["Capability Model Design",              "operatingModelDesign", "○"],
  ["Organizational Design",               "operatingModelDesign", "○"],
  ["Stakeholder Management",               "stakeholderManagement", "●"],
  ["Workshop Facilitation",                "stakeholderManagement", "○"],
  ["PMO & Governance",                     "stakeholderManagement", "○"],
  ["Change Management",                    "stakeholderManagement", "○"],
  ["Client Relationship Management",       "stakeholderManagement", "○"],
  ["Leadership & Team Management",         "stakeholderManagement", "○"],
  ["Executive Communication",              "executiveCommunication", "●"],
  ["Executive Presentation Development",   "executiveCommunication", "○"],
  ["Strategic Storylining",                "executiveCommunication", "○"],
  ["Communications Planning",              "executiveCommunication", "○"],
  ["Program Management",                   "executiveCommunication", "○"],
  ["Program Management",                   "programManagement", "●"],
  ["Program & Vendor Management",          "programManagement", "●"],
  ["PMO & Governance",                     "programManagement", "○"],
  ["Project Management",                   "programManagement", "○"],
  ["Delivery Management",                  "programManagement", "○"],
];

export function computeCoverage(functionalSkills: string[], businessSkills: string[]): Coverage {
  const cov = Object.fromEntries(MATRIX_SKILLS.map((s) => [s.key, ""])) as Coverage;
  for (const skill of [...functionalSkills, ...businessSkills]) {
    for (const [name, key, type] of SKILL_COVERAGE_MAP) {
      if (name === skill && cov[key] !== "●") cov[key] = type;
    }
  }
  return cov;
}

const SEED_COVERAGE_CACHE = new Map<string, Coverage>();
function getSeedCoverage(member: typeof SEED_TEAM[number]): Coverage {
  const k = member.name.toLowerCase();
  if (!SEED_COVERAGE_CACHE.has(k)) {
    SEED_COVERAGE_CACHE.set(k, computeCoverage(member.functionalSkills, member.businessSkills));
  }
  return SEED_COVERAGE_CACHE.get(k)!;
}

export interface MatrixRow {
  name: string;
  level: string;
  coverage: Coverage;
}

export function buildDynamicMatrix(dbEntries: SkillEntry[]): MatrixRow[] {
  const dbByName = new Map(dbEntries.map((e) => [e.name.toLowerCase(), e]));
  const LEVEL_ORDER = ["Manager", "Consultant", "Analyst"];

  const members = [...SEED_TEAM];
  for (const e of dbEntries) {
    if (!members.find((s) => s.name.toLowerCase() === e.name.toLowerCase())) {
      members.push({ name: e.name, segment: e.segment, level: e.level, functionalSkills: e.functionalSkills, businessSkills: e.businessSkills, internalAssignment: e.internalAssignment ?? null });
    }
  }

  return members
    .sort((a, b) => {
      const ai = LEVEL_ORDER.indexOf(a.level);
      const bi = LEVEL_ORDER.indexOf(b.level);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
    })
    .map((member) => {
      const db = dbByName.get(member.name.toLowerCase());
      return {
        name: member.name,
        level: member.level,
        coverage: db
          ? computeCoverage(db.functionalSkills, db.businessSkills)
          : getSeedCoverage(member as typeof SEED_TEAM[number]),
      };
    });
}

export function getNamesForSkill(key: SkillKey, matrix: MatrixRow[]) {
  const direct: string[] = [];
  const adjacent: string[] = [];
  for (const row of matrix) {
    if (row.coverage[key] === "●") direct.push(row.name);
    else if (row.coverage[key] === "○") adjacent.push(row.name);
  }
  return { direct, adjacent };
}

export function assessCoverage(direct: number, adjacent: number): "Strong" | "Adequate" | "Thin" | "GAP" {
  if (direct >= 3) return "Strong";
  if (direct >= 1) return adjacent >= 2 ? "Adequate" : "Thin";
  return "GAP";
}

export const GAP_ANALYSIS: { category: string; skill: string; matrixKey: SkillKey }[] = [
  { category: "Domain",     skill: "Claims",                  matrixKey: "claims" },
  { category: "Domain",     skill: "Medicare Advantage",      matrixKey: "medicareAdvantage" },
  { category: "Domain",     skill: "Payment Integrity",       matrixKey: "paymentIntegrity" },
  { category: "Domain",     skill: "FWA",                     matrixKey: "fwa" },
  { category: "Domain",     skill: "Utilization Management",  matrixKey: "utilizationManagement" },
  { category: "Analytics",  skill: "SQL",                     matrixKey: "sql" },
  { category: "Analytics",  skill: "Power BI",                matrixKey: "powerBi" },
  { category: "Analytics",  skill: "Data Analysis",           matrixKey: "dataAnalysis" },
  { category: "Consulting", skill: "Requirements Gathering",  matrixKey: "requirementsGathering" },
  { category: "Consulting", skill: "Process Mapping",         matrixKey: "processMapping" },
  { category: "Consulting", skill: "UAT",                     matrixKey: "uat" },
  { category: "Consulting", skill: "Operating Model Design",  matrixKey: "operatingModelDesign" },
  { category: "Leadership", skill: "Stakeholder Management",  matrixKey: "stakeholderManagement" },
  { category: "Leadership", skill: "Executive Communication", matrixKey: "executiveCommunication" },
  { category: "Leadership", skill: "Program Management",      matrixKey: "programManagement" },
];
