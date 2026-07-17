import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  var __keystoneDb: SupabaseClient | undefined;
}

/**
 * Lazy singleton Supabase client. Reads env at call-time (not import-time) so the
 * seed script can `process.loadEnvFile()` before the first query.
 *
 * Uses the secret (service_role) key, so it bypasses RLS. Every table has RLS
 * enabled with no policies, which makes this the only way in — the publishable
 * key can't read or write anything. Keep this module server-side only; the key
 * is deliberately not NEXT_PUBLIC_, so importing it into a Client Component
 * would leave it undefined rather than leak it.
 */
export function getDb(): SupabaseClient {
  if (!globalThis.__keystoneDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
    globalThis.__keystoneDb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalThis.__keystoneDb;
}
