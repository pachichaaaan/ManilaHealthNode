import { randomUUID } from "node:crypto";
import { ensureSchema, getDb } from "./db";
import type { Assignment, Classification, Priority, PublicUser, Role, Status, WbsState } from "./types";

type Row = Record<string, unknown>;

function s(v: unknown): string | null {
  return v == null ? null : String(v);
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
    active: Number(r.active) === 1,
  };
}

export async function getUserByEmail(email: string): Promise<FullUser | null> {
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
    args: [email.toLowerCase()],
  });
  const r = res.rows[0];
  if (!r) return null;
  return { ...toPublicUser(r), passwordHash: String(r.password_hash) };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  await ensureSchema();
  const res = await getDb().execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1", args: [id] });
  const r = res.rows[0];
  return r ? toPublicUser(r) : null;
}

export async function listUsers(): Promise<PublicUser[]> {
  await ensureSchema();
  const res = await getDb().execute(
    "SELECT * FROM users ORDER BY CASE role WHEN 'lead' THEN 0 ELSE 1 END, name ASC",
  );
  return res.rows.map(toPublicUser);
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
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  await getDb().execute({
    sql: `INSERT INTO users (id, name, email, password_hash, role, title, accent, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [id, u.name, u.email.toLowerCase(), u.passwordHash, u.role ?? "member", u.title ?? null, u.accent ?? "sky", now, now],
  });
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
  await ensureSchema();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const key of Object.keys(USER_PATCH_COLUMNS) as (keyof UserPatch)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    sets.push(`${USER_PATCH_COLUMNS[key]} = ?`);
    if (key === "active") args.push(value ? 1 : 0);
    else if (key === "email") args.push(String(value).toLowerCase());
    else args.push(value as string | null);
  }
  if (sets.length === 0) return getUserById(id);
  sets.push("updated_at = ?");
  args.push(new Date().toISOString());
  args.push(id);
  await getDb().execute({ sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ?`, args });
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<void> {
  await ensureSchema();
  await getDb().execute({ sql: "DELETE FROM assignments WHERE owner_id = ?", args: [id] });
  await getDb().execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
}

/* ------------------------------- Assignments ------------------------------ */

const SELECT = `
SELECT a.*, u.name AS o_name, u.accent AS o_accent
FROM assignments a
JOIN users u ON u.id = a.owner_id`;

function toAssignment(r: Row): Assignment {
  return {
    id: String(r.id),
    seq: Number(r.seq),
    ownerId: String(r.owner_id),
    member: String(r.o_name),
    ownerAccent: String(r.o_accent),
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
    lastUpdated: s(r.last_updated),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/** List assignments; pass an ownerId to scope to one member (used for members). */
export async function listAssignments(ownerId?: string): Promise<Assignment[]> {
  await ensureSchema();
  const res = ownerId
    ? await getDb().execute({ sql: `${SELECT} WHERE a.owner_id = ? ORDER BY a.seq ASC`, args: [ownerId] })
    : await getDb().execute(`${SELECT} ORDER BY a.seq ASC`);
  return res.rows.map(toAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  await ensureSchema();
  const res = await getDb().execute({ sql: `${SELECT} WHERE a.id = ? LIMIT 1`, args: [id] });
  const r = res.rows[0];
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
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  let seq = a.seq;
  if (seq == null) {
    const max = await getDb().execute("SELECT COALESCE(MAX(seq), 0) AS m FROM assignments");
    seq = Number(max.rows[0]?.m ?? 0) + 1;
  }
  await getDb().execute({
    sql: `INSERT INTO assignments
      (id, seq, owner_id, role, title, client, classification, gn_poc_name, gn_poc_email,
       key_priority, offering, start_date, end_date, wbs_provided, wbs_code,
       estimated_hours, actual_hours, priority, status, notes, last_updated, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id, seq, a.ownerId, a.role ?? null, a.title ?? null, a.client, a.classification,
      a.gnPocName ?? null, a.gnPocEmail ?? null, a.keyPriority ?? null, a.offering ?? null,
      a.startDate ?? null, a.endDate ?? null, a.wbsProvided, a.wbsCode ?? null,
      Math.round(a.estimatedHours), Math.round(a.actualHours), a.priority, a.status,
      a.notes ?? null, a.lastUpdated ?? now, now, now,
    ],
  });
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
  await ensureSchema();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const key of Object.keys(PATCH_COLUMNS) as (keyof AssignmentPatch)[]) {
    const value = patch[key];
    if (value !== undefined) {
      sets.push(`${PATCH_COLUMNS[key]} = ?`);
      args.push(value as string | number | null);
    }
  }
  if (patch.lastUpdated === undefined) {
    sets.push("last_updated = ?");
    args.push(new Date().toISOString());
  }
  sets.push("updated_at = ?");
  args.push(new Date().toISOString());
  args.push(id);
  await getDb().execute({ sql: `UPDATE assignments SET ${sets.join(", ")} WHERE id = ?`, args });
  return getAssignmentById(id);
}

export async function deleteAssignment(id: string): Promise<void> {
  await ensureSchema();
  await getDb().execute({ sql: "DELETE FROM assignments WHERE id = ?", args: [id] });
}

/** Wipe everything (used by seed and by leader re-import). */
export async function clearAll(): Promise<void> {
  await ensureSchema();
  await getDb().executeMultiple("DELETE FROM assignments; DELETE FROM users;");
}

/** Replace only assignments for a given set of owners (used by scoped import). */
export async function clearAssignments(): Promise<void> {
  await ensureSchema();
  await getDb().execute("DELETE FROM assignments");
}
