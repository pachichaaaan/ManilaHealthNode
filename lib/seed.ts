/**
 * Seed the team roster (no assignments yet).
 * Run with `npm run seed`. Every account's default password is `password`.
 * Login email = firstname.lastname@manilahealthnode.com.
 */
process.loadEnvFile(".env");

import { readFileSync } from "node:fs";
import { hashPassword } from "./password";
import { clearAll, clearRoles, createUser, insertRoles } from "./repo";
import type { OpenRoleFields, Role } from "./types";

const DOMAIN = "manilahealthnode.com";
const DEFAULT_PASSWORD = "password";
const ACCENTS = ["gold", "sky", "emerald", "rose", "violet", "slate"];

const LEADS = ["Aristotle Castro", "Kacelyn Palma", "Patricia Mamaril"];
const MEMBERS = [
  "Chelsea Lopez",
  "Jonas Caluyo",
  "Earl Abeleda",
  "Stephene Banagan",
  "Brian Belen",
  "Jon Cuevas",
  "Kyle Gerente",
  "Mar Mendoza",
  "Meghana Paidi",
  "Adrian Tan",
];

const emailFor = (name: string) => `${name.toLowerCase().replace(/\s+/g, ".")}@${DOMAIN}`;

async function main() {
  console.log("→ Resetting database…");
  await clearAll();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const roster: { name: string; role: Role; title: string }[] = [
    ...LEADS.map((name) => ({ name, role: "lead" as Role, title: "Team Lead" })),
    ...MEMBERS.map((name) => ({ name, role: "member" as Role, title: "Consultant" })),
  ];

  console.log("→ Creating accounts…");
  let i = 0;
  for (const p of roster) {
    await createUser({
      name: p.name,
      email: emailFor(p.name),
      passwordHash,
      role: p.role,
      title: p.title,
      accent: ACCENTS[i % ACCENTS.length],
    });
    i += 1;
  }

  console.log("→ Loading open roles…");
  await clearRoles();
  const roles = JSON.parse(
    readFileSync(new URL("./data/open-roles.json", import.meta.url), "utf8"),
  ) as OpenRoleFields[];
  await insertRoles(roles);

  console.log(`✓ Seeded ${roster.length} accounts (${LEADS.length} leads, ${MEMBERS.length} members) and ${roles.length} open roles.`);
  console.log(`\n  All passwords: ${DEFAULT_PASSWORD}`);
  for (const p of roster) console.log(`    ${p.role === "lead" ? "LEAD  " : "member"}  ${emailFor(p.name)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
