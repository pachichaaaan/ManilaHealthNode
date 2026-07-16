/* ------------------------------------------------------------------ *
 * Domain model — a BD / +1 assignment (mirrors the BD_Plus1 tracker). *
 * ------------------------------------------------------------------ */

export const CLASSIFICATIONS = ["bd", "plus_one", "project"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const STATUSES = ["active", "pending", "on_hold", "closed"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** WBS code provisioning state (see the tracker's compliance rules). */
export const WBS_STATES = ["yes", "pending", "no", "na"] as const;
export type WbsState = (typeof WBS_STATES)[number];

/** Account role — a member manages their own data; a lead oversees the team. */
export const ROLES = ["member", "lead"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<Role, { label: string }> = {
  member: { label: "Member" },
  lead: { label: "Team lead" },
};

export const ACCENTS = ["gold", "sky", "emerald", "rose", "violet", "slate"] as const;
export type Accent = (typeof ACCENTS)[number];

/** +1 alignment dropdown options. */
export const KEY_PRIORITIES = [
  "Strategy & Transformation",
  "Digital Health",
  "Data & Analytics",
  "Sustainability",
  "Cloud",
  "Applied Intelligence",
  "Customer & Growth",
  "Talent & Organisation",
  "Operating Model",
] as const;

export const OFFERINGS = [
  "Health IT",
  "Digital Transformation",
  "Workforce",
  "Financial Mgmt",
  "Applied Intelligence",
  "Operating Model",
  "Strategy & Consulting",
  "Platforms",
  "Ventures",
  "Market Research",
] as const;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  accent: string;
  active: boolean;
}

export type Tone = "slate" | "sky" | "amber" | "gold" | "emerald" | "rose" | "violet";

interface Meta<T extends string> {
  value: T;
  label: string;
  tone: Tone;
}

export const CLASSIFICATION_META: Record<Classification, Meta<Classification>> = {
  bd: { value: "bd", label: "BD", tone: "sky" },
  plus_one: { value: "plus_one", label: "Plus 1", tone: "gold" },
  project: { value: "project", label: "Project", tone: "slate" },
};

export const STATUS_META: Record<Status, Meta<Status>> = {
  active: { value: "active", label: "Active", tone: "emerald" },
  pending: { value: "pending", label: "Pending", tone: "amber" },
  on_hold: { value: "on_hold", label: "On hold", tone: "rose" },
  closed: { value: "closed", label: "Closed", tone: "slate" },
};

export const PRIORITY_META: Record<Priority, Meta<Priority>> = {
  high: { value: "high", label: "High", tone: "rose" },
  medium: { value: "medium", label: "Medium", tone: "amber" },
  low: { value: "low", label: "Low", tone: "slate" },
};

export const WBS_META: Record<WbsState, Meta<WbsState>> = {
  yes: { value: "yes", label: "Provided", tone: "emerald" },
  pending: { value: "pending", label: "Pending", tone: "amber" },
  no: { value: "no", label: "Not requested", tone: "rose" },
  na: { value: "na", label: "N/A", tone: "slate" },
};

export interface Assignment {
  id: string;
  seq: number;
  ownerId: string; // FK → users.id
  member: string; // owner's display name (denormalised for convenience)
  ownerAccent: string; // owner's avatar accent
  role: string | null; // the person's grade, e.g. "Consultant"
  title: string | null; // practice / role title, e.g. "Strategy and Consulting"
  client: string; // client / organization — the distinguishing name
  classification: Classification;
  gnPocName: string | null;
  gnPocEmail: string | null;
  keyPriority: string | null; // +1 alignment
  offering: string | null; // +1 offering / practice area
  startDate: string | null; // ISO date
  endDate: string | null; // ISO date, or literal "TBD"
  wbsProvided: WbsState;
  wbsCode: string | null;
  estimatedHours: number;
  actualHours: number;
  priority: Priority;
  status: Status;
  notes: string | null;
  lastUpdated: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Delivery progress = hours logged against the estimate (0–1, capped). */
export function hoursProgress(a: Pick<Assignment, "actualHours" | "estimatedHours">): number {
  if (a.estimatedHours <= 0) return 0;
  return Math.min(1, a.actualHours / a.estimatedHours);
}

/** A WBS code that should exist but hasn't been requested is a red flag. */
export function wbsNeedsAction(a: Pick<Assignment, "wbsProvided">): boolean {
  return a.wbsProvided === "no" || a.wbsProvided === "pending";
}

export function isClassification(v: unknown): v is Classification {
  return typeof v === "string" && (CLASSIFICATIONS as readonly string[]).includes(v);
}

/* ------------------------------ Open Roles -------------------------------- */

/** A row from the Open Roles workbook (Shortlisted Roles). */
export interface OpenRoleFields {
  roleId: string;
  title: string;
  client: string | null;
  industry: string | null;
  marketUnit: string | null;
  country: string | null;
  project: string | null;
  jobFamilyGroup: string | null;
  projectRole: string | null;
  status: string | null;
  demandType: string | null;
  priority: string | null;
  locationType: string | null;
  workLocation: string | null;
  careerFrom: string | null;
  careerTo: string | null;
  primarySkill: string | null;
  skillGroup: string | null;
  language: string | null;
  startDate: string | null;
  endDate: string | null;
  winProbability: string | null;
  primaryContact: string | null;
  primaryContactEmail: string | null;
  cnPoc: string | null;
  description: string | null;
  editLink: string | null;
}

export interface OpenRole extends OpenRoleFields {
  id: string;
  createdAt: string;
}

/** tone for a role priority chip */
export function priorityTone(priority: string | null): Tone {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("critical")) return "rose";
  if (p.includes("high")) return "amber";
  return "slate";
}

/** tone for a role status chip */
export function roleStatusTone(status: string | null): Tone {
  const s = (status ?? "").toLowerCase();
  if (s.includes("new")) return "emerald";
  if (s.includes("feedback")) return "amber";
  if (s.includes("process")) return "sky";
  return "slate";
}
