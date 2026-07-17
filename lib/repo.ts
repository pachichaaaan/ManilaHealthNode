import { randomUUID } from "node:crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { getDb } from "./db";
import type { Assignment, Classification, OpenRole, OpenRoleFields, Priority, PublicUser, Role, Status, WbsState } from "./types";

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

function toOpenRole(r: Row): OpenRole {
  return {
    id: String(r.id),
    roleId: r.role_id == null ? "" : String(r.role_id),
    title: String(r.title),
    client: s(r.client),
    industry: s(r.industry),
    marketUnit: s(r.market_unit),
    country: s(r.country),
    project: s(r.project),
    jobFamilyGroup: s(r.job_family_group),
    projectRole: s(r.project_role),
    status: s(r.status),
    demandType: s(r.demand_type),
    priority: s(r.priority),
    locationType: s(r.location_type),
    workLocation: s(r.work_location),
    careerFrom: s(r.career_from),
    careerTo: s(r.career_to),
    primarySkill: s(r.primary_skill),
    skillGroup: s(r.skill_group),
    language: s(r.language),
    startDate: s(r.start_date),
    endDate: s(r.end_date),
    winProbability: s(r.win_probability),
    primaryContact: s(r.primary_contact),
    primaryContactEmail: s(r.primary_contact_email),
    cnPoc: s(r.cn_poc),
    description: s(r.description),
    editLink: s(r.edit_link),
    createdAt: String(r.created_at),
  };
}

export async function listRoles(): Promise<OpenRole[]> {
  const rows = unwrap(
    await getDb().from("roles").select("*").order("title", { ascending: true }),
  ) as Row[];
  return rows.map(toOpenRole);
}

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

export async function deleteRole(id: string): Promise<void> {
  check((await getDb().from("roles").delete().eq("id", id)).error);
}

export async function listInterestedRoleIds(userId: string): Promise<string[]> {
  const rows = unwrap(
    await getDb().from("role_interests").select("role_id").eq("user_id", userId),
  ) as Row[];
  return rows.map((r) => String(r.role_id));
}

export async function listInterestedRoles(userId: string): Promise<OpenRole[]> {
  const rows = unwrap(
    await getDb()
      .from("role_interests")
      .select("created_at, role:roles!inner(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as Row[];
  return rows.map((r) => toOpenRole(r.role as Row));
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

export interface TeamRoleInterest {
  roleId: string;
  title: string;
  client: string | null;
  marketUnit: string | null;
  status: string | null;
  users: { id: string; name: string; accent: string; role: Role }[];
}

/** Roles that other team members have starred (for the lead's team view). */
export async function listTeamInterests(excludeUserId: string): Promise<TeamRoleInterest[]> {
  const rows = unwrap(
    await getDb()
      .from("role_interests")
      .select(
        "created_at, role:roles!inner(id, title, client, market_unit, status), user:users!inner(id, name, accent, role)",
      )
      .neq("user_id", excludeUserId)
      .order("created_at", { ascending: false }),
  ) as Row[];
  const map = new Map<string, TeamRoleInterest>();
  for (const row of rows) {
    const r = row.role as Row;
    const u = row.user as Row;
    const rid = String(r.id);
    let g = map.get(rid);
    if (!g) {
      g = { roleId: rid, title: String(r.title), client: s(r.client), marketUnit: s(r.market_unit), status: s(r.status), users: [] };
      map.set(rid, g);
    }
    g.users.push({ id: String(u.id), name: String(u.name), accent: String(u.accent), role: String(u.role) as Role });
  }
  return [...map.values()];
}

export async function toggleInterest(userId: string, roleId: string): Promise<{ interested: boolean }> {
  const db = getDb();
  const existing = unwrap(
    await db.from("role_interests").select("role_id").eq("user_id", userId).eq("role_id", roleId).limit(1).maybeSingle(),
  ) as Row | null;
  if (existing) {
    check((await db.from("role_interests").delete().eq("user_id", userId).eq("role_id", roleId)).error);
    return { interested: false };
  }
  const role = unwrap(await db.from("roles").select("id").eq("id", roleId).limit(1).maybeSingle()) as Row | null;
  if (!role) throw new Error("Role not found");
  check(
    (
      await db.from("role_interests").insert({ user_id: userId, role_id: roleId, created_at: new Date().toISOString() })
    ).error,
  );
  return { interested: true };
}
