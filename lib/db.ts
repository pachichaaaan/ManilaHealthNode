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
  last_updated TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_assignments_owner ON assignments(owner_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(classification);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
`;

/** Idempotently ensure the schema exists. Memoised for the process lifetime. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__keystoneMigrated) {
    globalThis.__keystoneMigrated = getDb()
      .executeMultiple(SCHEMA)
      .then(() => undefined);
  }
  return globalThis.__keystoneMigrated;
}
