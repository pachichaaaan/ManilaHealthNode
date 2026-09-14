import { randomUUID } from "node:crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { getDb } from "./db";
import type { Assignment, Classification, OpenRoleFields, Priority, PublicUser, Role, Status, WbsState } from "./types";

type Row = Record<string, unknown>;

function s(v: unknown): string | null {
  return v == null ? null : String(v);
}

/** Throw on a PostgREST error, mirroring how the libSQL driver used to reject. */
function check(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}

function unwrap<T>(res: { data: T | null; error: PostgrestError | null }): T {
  check(res.error);
  return res.data as T;
}

/* ---------------------------------- Users --------------------------------- */

export interface FullUser extends PublicUser {
  passwordHash: string;
}

function toPublicUser(r: Row): PublicUser {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    role: String(r.role) as Role,
    title: s(r.title),
    accent: String(r.accent),
    active: r.active === true,
  };
}

export async function getUserByEmail(email: string): Promise<FullUser | null> {
  const r = unwrap(
    await getDb().from("users").select("*").eq("email", email.toLowerCase()).limit(1).maybeSingle(),
  ) as Row | null;
  if (!r) return null;
  return { ...toPublicUser(r), passwordHash: String(r.password_hash) };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const r = unwrap(
    await getDb().from("users").select("*").eq("id", id).limit(1).maybeSingle(),
  ) as Row | null;
  return r ? toPublicUser(r) : null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const rows = unwrap(await getDb().from("users").select("*")) as Row[];
  // Leads first, then by name — previously an ORDER BY CASE, which PostgREST
  // can't express. The roster is small, so ordering here costs nothing.
  return rows.map(toPublicUser).sort((a, b) => {
    const rank = (u: PublicUser) => (u.role === "lead" ? 0 : 1);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  title?: string | null;
  accent?: string;
}

export async function createUser(u: NewUser): Promise<PublicUser> {
  const id = randomUUID();
  const now = new Date().toISOString();
  check(
    (
      await getDb().from("users").insert({
        id,
        name: u.name,
        email: u.email.toLowerCase(),
        password_hash: u.passwordHash,
        role: u.role ?? "member",
        title: u.title ?? null,
        accent: u.accent ?? "sky",
        active: true,
        created_at: now,
        updated_at: now,
      })
    ).error,
  );
  const created = await getUserById(id);
  if (!created) throw new Error("Failed to create user");
  return created;
}

export interface UserPatch {
  name?: string;
  email?: string;
  role?: Role;
  title?: string | null;
  accent?: string;
  active?: boolean;
  passwordHash?: string;
}

const USER_PATCH_COLUMNS: Record<keyof UserPatch, string> = {
  name: "name",
  email: "email",
  role: "role",
  title: "title",
  accent: "accent",
  active: "active",
  passwordHash: "password_hash",
};

export async function updateUser(id: string, patch: UserPatch): Promise<PublicUser | null> {
  const row: Row = {};
  for (const key of Object.keys(USER_PATCH_COLUMNS) as (keyof UserPatch)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    row[USER_PATCH_COLUMNS[key]] = key === "email" ? String(value).toLowerCase() : value;
  }
  if (Object.keys(row).length === 0) return getUserById(id);
  row.updated_at = new Date().toISOString();
  check((await getDb().from("users").update(row).eq("id", id)).error);
  return getUserById(id);
}

/** Assignments and role interests follow via ON DELETE CASCADE. */
export async function deleteUser(id: string): Promise<void> {
  check((await getDb().from("users").delete().eq("id", id)).error);
}

/* ------------------------------- Assignments ------------------------------ */

/** Assignment columns plus the owner's display name/accent (an INNER JOIN on
 *  users, resolved through the assignments.owner_id foreign key). */
const SELECT = "*, owner:users!inner(name, accent)";

function toAssignment(r: Row): Assignment {
  const owner = (r.owner ?? {}) as Row;
  return {
    id: String(r.id),
    seq: Number(r.seq),
    ownerId: String(r.owner_id),
    member: String(owner.name),
    ownerAccent: String(owner.accent),
    role: s(r.role),
    title: s(r.title),
    client: String(r.client),
    classification: String(r.classification) as Classification,
    gnPocName: s(r.gn_poc_name),
    gnPocEmail: s(r.gn_poc_email),
    keyPriority: s(r.key_priority),
    offering: s(r.offering),
    startDate: s(r.start_date),
    endDate: s(r.end_date),
    wbsProvided: String(r.wbs_provided) as WbsState,
    wbsCode: s(r.wbs_code),
    estimatedHours: Number(r.estimated_hours),
    actualHours: Number(r.actual_hours),
    priority: String(r.priority) as Priority,
    status: String(r.status) as Status,
    notes: s(r.notes),
    archived: r.archived === true,
    lastUpdated: s(r.last_updated),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/**
 * List assignments. Pass an ownerId to scope to one member (used for members).
 * By default only *active* (non-archived) rows are returned; pass
 * `{ archived: true }` for the Archived screen.
 */
export async function listAssignments(
  ownerId?: string,
  opts: { archived?: boolean } = {},
): Promise<Assignment[]> {
  let q = getDb()
    .from("assignments")
    .select(SELECT)
    .eq("archived", opts.archived === true)
    .order("seq", { ascending: true });
  if (ownerId) q = q.eq("owner_id", ownerId);
  const rows = unwrap(await q) as Row[];
  return rows.map(toAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const r = unwrap(
    await getDb().from("assignments").select(SELECT).eq("id", id).limit(1).maybeSingle(),
  ) as Row | null;
  return r ? toAssignment(r) : null;
}

export interface AssignmentInput {
  seq?: number;
  ownerId: string;
  role?: string | null;
  title?: string | null;
  client: string;
  classification: Classification;
  gnPocName?: string | null;
  gnPocEmail?: string | null;
  keyPriority?: string | null;
  offering?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  wbsProvided: WbsState;
  wbsCode?: string | null;
  estimatedHours: number;
  actualHours: number;
  priority: Priority;
  status: Status;
  notes?: string | null;
  lastUpdated?: string | null;
}

export async function createAssignment(a: AssignmentInput): Promise<Assignment> {
  const id = randomUUID();
  const now = new Date().toISOString();
  let seq = a.seq;
  if (seq == null) {
    const top = unwrap(
      await getDb().from("assignments").select("seq").order("seq", { ascending: false }).limit(1).maybeSingle(),
    ) as Row | null;
    seq = Number(top?.seq ?? 0) + 1;
  }
  check(
    (
      await getDb().from("assignments").insert({
        id,
        seq,
        owner_id: a.ownerId,
        role: a.role ?? null,
        title: a.title ?? null,
        client: a.client,
        classification: a.classification,
        gn_poc_name: a.gnPocName ?? null,
        gn_poc_email: a.gnPocEmail ?? null,
        key_priority: a.keyPriority ?? null,
        offering: a.offering ?? null,
        start_date: a.startDate ?? null,
        end_date: a.endDate ?? null,
        wbs_provided: a.wbsProvided,
        wbs_code: a.wbsCode ?? null,
        estimated_hours: Math.round(a.estimatedHours),
        actual_hours: Math.round(a.actualHours),
        priority: a.priority,
        status: a.status,
        notes: a.notes ?? null,
        last_updated: a.lastUpdated ?? now,
        created_at: now,
        updated_at: now,
      })
    ).error,
  );
  const created = await getAssignmentById(id);
  if (!created) throw new Error("Failed to create assignment");
  return created;
}

export type AssignmentPatch = Partial<Omit<AssignmentInput, "seq">>;

const PATCH_COLUMNS: Record<keyof AssignmentPatch, string> = {
  ownerId: "owner_id",
  role: "role",
  title: "title",
  client: "client",
  classification: "classification",
  gnPocName: "gn_poc_name",
  gnPocEmail: "gn_poc_email",
  keyPriority: "key_priority",
  offering: "offering",
  startDate: "start_date",
  endDate: "end_date",
  wbsProvided: "wbs_provided",
  wbsCode: "wbs_code",
  estimatedHours: "estimated_hours",
  actualHours: "actual_hours",
  priority: "priority",
  status: "status",
  notes: "notes",
  lastUpdated: "last_updated",
};

export async function updateAssignment(id: string, patch: AssignmentPatch): Promise<Assignment | null> {
  const row: Row = {};
  for (const key of Object.keys(PATCH_COLUMNS) as (keyof AssignmentPatch)[]) {
    const value = patch[key];
    if (value !== undefined) row[PATCH_COLUMNS[key]] = value;
  }
  if (patch.lastUpdated === undefined) row.last_updated = new Date().toISOString();
  row.updated_at = new Date().toISOString();
  check((await getDb().from("assignments").update(row).eq("id", id)).error);
  return getAssignmentById(id);
}

export async function deleteAssignment(id: string): Promise<void> {
  check((await getDb().from("assignments").delete().eq("id", id)).error);
}

/** Move an assignment to (or out of) the Archived screen. */
export async function setAssignmentArchived(id: string, archived: boolean): Promise<void> {
  check(
    (
      await getDb()
        .from("assignments")
        .update({ archived, updated_at: new Date().toISOString() })
        .eq("id", id)
    ).error,
  );
}

/** Wipe everything (used by seed and by leader re-import). */
export async function clearAll(): Promise<void> {
  await clearAssignments();
  check((await getDb().from("users").delete().not("id", "is", null)).error);
}

/** Replace only assignments for a given set of owners (used by scoped import). */
export async function clearAssignments(): Promise<void> {
  // PostgREST refuses an unfiltered delete, so match every row explicitly.
  check((await getDb().from("assignments").delete().not("id", "is", null)).error);
}

/* ------------------------------ Open Roles -------------------------------- */

export async function insertRoles(rows: OpenRoleFields[]): Promise<number> {
  const payload = rows.map((r) => ({
    id: randomUUID(),
    role_id: r.roleId,
    title: r.title,
    client: r.client ?? null,
    industry: r.industry ?? null,
    market_unit: r.marketUnit ?? null,
    country: r.country ?? null,
    project: r.project ?? null,
    job_family_group: r.jobFamilyGroup ?? null,
    project_role: r.projectRole ?? null,
    status: r.status ?? null,
    demand_type: r.demandType ?? null,
    priority: r.priority ?? null,
    location_type: r.locationType ?? null,
    work_location: r.workLocation ?? null,
    career_from: r.careerFrom ?? null,
    career_to: r.careerTo ?? null,
    primary_skill: r.primarySkill ?? null,
    skill_group: r.skillGroup ?? null,
    language: r.language ?? null,
    start_date: r.startDate ?? null,
    end_date: r.endDate ?? null,
    win_probability: r.winProbability ?? null,
    primary_contact: r.primaryContact ?? null,
    primary_contact_email: r.primaryContactEmail ?? null,
    cn_poc: r.cnPoc ?? null,
    description: r.description ?? null,
    edit_link: r.editLink ?? null,
  }));
  const CHUNK = 200;
  for (let i = 0; i < payload.length; i += CHUNK) {
    check((await getDb().from("roles").insert(payload.slice(i, i + CHUNK))).error);
  }
  return rows.length;
}

/** Interests cascade from roles. */
export async function clearRoles(): Promise<void> {
  check((await getDb().from("roles").delete().not("id", "is", null)).error);
}

/* ----------------------------- Skill entries ------------------------------ */

export interface SkillEntry {
  id: string;
  name: string;
  segment: string;
  level: string;
  functionalSkills: string[];
  businessSkills: string[];
  internalAssignment: string | null;
  createdAt: string;
  updatedAt: string;
}

function toSkillEntry(r: Row): SkillEntry {
  return {
    id: String(r.id),
    name: String(r.name),
    segment: String(r.segment),
    level: String(r.level),
    functionalSkills: Array.isArray(r.functional_skills) ? (r.functional_skills as string[]) : [],
    businessSkills: Array.isArray(r.business_skills) ? (r.business_skills as string[]) : [],
    internalAssignment: s(r.internal_assignment),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listSkillEntries(): Promise<SkillEntry[]> {
  const rows = unwrap(
    await getDb().from("skill_entries").select("*").order("name", { ascending: true }),
  ) as Row[];
  return rows.map(toSkillEntry);
}

export interface SkillEntryInput {
  name: string;
  segment: string;
  level: string;
  functionalSkills: string[];
  businessSkills: string[];
  internalAssignment?: string | null;
}

export async function upsertSkillEntry(input: SkillEntryInput): Promise<{ entry: SkillEntry; action: "created" | "updated" }> {
  const now = new Date().toISOString();
  const payload = {
    name: input.name,
    segment: input.segment,
    level: input.level,
    functional_skills: input.functionalSkills.filter(Boolean),
    business_skills: input.businessSkills.filter(Boolean),
    internal_assignment: input.internalAssignment ?? null,
    updated_at: now,
  };
  const existing = unwrap(
    await getDb().from("skill_entries").select("id").eq("name", input.name).maybeSingle(),
  ) as Row | null;

  if (existing) {
    check((await getDb().from("skill_entries").update(payload).eq("id", String(existing.id))).error);
    const updated = unwrap(
      await getDb().from("skill_entries").select("*").eq("id", String(existing.id)).single(),
    ) as Row;
    return { entry: toSkillEntry(updated), action: "updated" };
  } else {
    const { randomUUID } = await import("node:crypto");
    const id = randomUUID();
    check(
      (await getDb().from("skill_entries").insert({ id, ...payload, created_at: now })).error,
    );
    const created = unwrap(
      await getDb().from("skill_entries").select("*").eq("id", id).single(),
    ) as Row;
    return { entry: toSkillEntry(created), action: "created" };
  }
}

/* ------------------------------ Page views -------------------------------- */

export interface PageView {
  path: string;
  userId?: string | null;
  userAgent?: string | null;
}

/** Record one visit. userId is null for a signed-out visitor. */
export async function recordPageView(v: PageView): Promise<void> {
  check(
    (
      await getDb().from("page_views").insert({
        user_id: v.userId ?? null,
        path: v.path,
        user_agent: v.userAgent ?? null,
      })
    ).error,
  );
}
