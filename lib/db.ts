import { createClient, type Client } from "@libsql/client";

declare global {
  var __keystoneDb: Client | undefined;
  var __keystoneMigrated: Promise<void> | undefined;
}

/**
 * Lazy singleton libSQL client. Reads env at call-time (not import-time) so the
 * seed script can `process.loadEnvFile()` before the first query. Point
 * DATABASE_URL at a Turso URL + DATABASE_AUTH_TOKEN to share one DB across the team.
 */
export function getDb(): Client {
  if (!globalThis.__keystoneDb) {
    globalThis.__keystoneDb = createClient({
      url: process.env.DATABASE_URL ?? "file:keystone.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return globalThis.__keystoneDb;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  title TEXT,
  accent TEXT NOT NULL DEFAULT 'sky',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  seq INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT NOT NULL,
  role TEXT,
  title TEXT,
  client TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'bd',
  gn_poc_name TEXT,
  gn_poc_email TEXT,
  key_priority TEXT,
  offering TEXT,
  start_date TEXT,
  end_date TEXT,
  wbs_provided TEXT NOT NULL DEFAULT 'na',
  wbs_code TEXT,
  estimated_hours INTEGER NOT NULL DEFAULT 0,
  actual_hours INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_assignments_owner ON assignments(owner_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(classification);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  role_id TEXT,
  title TEXT NOT NULL,
  client TEXT,
  industry TEXT,
  market_unit TEXT,
  country TEXT,
  project TEXT,
  job_family_group TEXT,
  project_role TEXT,
  status TEXT,
  demand_type TEXT,
  priority TEXT,
  location_type TEXT,
  work_location TEXT,
  career_from TEXT,
  career_to TEXT,
  primary_skill TEXT,
  skill_group TEXT,
  language TEXT,
  start_date TEXT,
  end_date TEXT,
  win_probability TEXT,
  primary_contact TEXT,
  primary_contact_email TEXT,
  cn_poc TEXT,
  description TEXT,
  edit_link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_market ON roles(market_unit);
CREATE TABLE IF NOT EXISTS role_interests (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_interests_user ON role_interests(user_id);
`;

/**
 * Additive migrations for pre-existing DBs, applied in order AFTER the base
 * schema. The ALTER must run before any index that references the new column;
 * both statements are idempotent (duplicate-column / IF NOT EXISTS), so a
 * re-run just no-ops.
 */
const MIGRATIONS = [
  "ALTER TABLE assignments ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
  "CREATE INDEX IF NOT EXISTS idx_assignments_archived ON assignments(archived)",
];

/** Idempotently ensure the schema exists. Memoised for the process lifetime. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__keystoneMigrated) {
    globalThis.__keystoneMigrated = (async () => {
      const db = getDb();
      await db.executeMultiple(SCHEMA);
      // CREATE TABLE IF NOT EXISTS won't add columns to an existing table, so
      // apply additive migrations here. A duplicate-column error just means the
      // migration already ran — safe to ignore.
      for (const sql of MIGRATIONS) {
        try {
          await db.execute(sql);
        } catch {
          /* already applied */
        }
      }
    })().catch((err) => {
      // Don't cache a failed run — allow the next request to retry.
      globalThis.__keystoneMigrated = undefined;
      throw err;
    });
  }
  return globalThis.__keystoneMigrated;
}
