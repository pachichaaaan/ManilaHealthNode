/**
 * Seed a clean slate: one team-lead account, no assignments.
 * Run with `npm run seed`. Password is `keystone` (change it in-app via Account).
 */
process.loadEnvFile(".env");

import { hashPassword } from "./password";
import { clearAll, createUser } from "./repo";

async function main() {
  console.log("→ Resetting database…");
  await clearAll();

  const passwordHash = await hashPassword("keystone");
  await createUser({
    name: "Patricia Mamaril",
    email: "patricia@keystone.team",
    passwordHash,
    role: "lead",
    title: "Team Lead · Strategy & Consulting",
    accent: "gold",
  });

  console.log("✓ Seeded 1 team-lead account, no assignments.");
  console.log("\n  Log in:  patricia@keystone.team  /  keystone");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
