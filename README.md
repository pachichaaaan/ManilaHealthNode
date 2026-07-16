# Manila Health Node — BD & +1 Assignment Tracker

A role-aware team tracker for Business Development (BD) and **+1** (stretch)
assignments, mirroring the `BD_Plus1_Tracker` workbook. Each assignment records its
classification, status, estimated vs actual **hours**, **WBS** provisioning, GN POC,
and (for +1s) alignment to a key priority and offering.

- **Members** log in and manage **their own** assignments.
- **The team lead** manages their own *and* sees/edits **everyone's**, plus full
  **account management** (add/remove members, set roles, reset passwords, run imports).

Wrapped in a premium 3D presentation: a WebGL shader login **and dashboard
masthead**, an ambient depth background, and pointer-reactive tilt cards — all
degrading gracefully on mobile and under `prefers-reduced-motion`.

Anyone can change their own password from **Account** (topbar avatar → Account);
leads can additionally reset any member's password from **Team**.

---

## Stack

| Layer     | Choice |
|-----------|--------|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling   | Tailwind CSS v4 (token system in `app/globals.css`) |
| 3D / motion | Custom WebGL shader (`webgl-background`), CSS-3D tilt + ambient depth, Framer Motion |
| Database  | libSQL (`@libsql/client`) — local SQLite file, deployable to Turso |
| Auth      | Hand-rolled: bcrypt + `jose` httpOnly JWT cookie, roles enforced server-side |
| Import    | `exceljs` (leader-only workbook import) |

## Quick start

```bash
cd keystone-tracker
npm install
npm run seed        # team roster (3 leads + 10 members), no assignments
npm run dev         # http://localhost:3000  (launch.json uses 3009)
```

### Accounts

`npm run seed` creates the team roster with **no assignments**. Login email is
`firstname.lastname@manilahealthnode.com`; the default password is **`password`**
(change it in **Account**).

- **Leads (3):** Aristotle Castro · Kacelyn Palma · Patricia Mamaril
- **Members (10):** Chelsea Lopez · Jonas Caluyo · Earl Abeleda · Stephene Banagan ·
  Brian Belen · Jon Cuevas · Kyle Gerente · Mar Mendoza · Meghana Paidi · Adrian Tan

e.g. `aristotle.castro@manilahealthnode.com` / `password`. Manage the roster from
**Team**; add assignments from **Assignments** (or import a workbook).

## Roles & access

Scoping is enforced in the **API** (not just the UI):

- Members: `GET/POST/PATCH/DELETE /api/assignments*` are limited to their own rows;
  creating forces the owner to themselves; `/api/users*` returns **403**.
- Leads: full access to all assignments and to `/api/users*` (create/update/delete,
  reset password). A lead can't demote or delete their own account.

## Pages

| Page | Who | Shows |
|------|-----|-------|
| **Dashboard** | all | KPIs, delivery gauge (hours logged vs planned), hours-by-assignment, ending-soon, WBS compliance, Plus 1 watch. Leads also get a **By member** breakdown. |
| **Assignments** | all | Filterable table + add/edit/delete. Leads get a member filter, an owner column, and **Import**. |
| **Plus 1** | all | Stretch assignments + key-priority alignment |
| **WBS** | all | Codes needing action vs provided |
| **Team** | lead only | Account management + each member's load |
| **Account** | all | Profile + **self-service password change** (via the topbar avatar) |

## Import (leader)

The **Import** button on Assignments accepts a `BD_Plus1_Tracker.xlsx`. It parses the
Master Tracker sheet, maps each row's member name to an account (auto-creating a
member account — password `password` — for any new name), and **replaces the
assignments** (accounts are preserved). See [`lib/import.ts`](lib/import.ts).

## Deploying for the team

Point at a hosted **Turso** database (libSQL) — no code changes:

```
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token
AUTH_SECRET=<a long random string>
```

Then `npm run build && npm start`. Schema auto-creates on first connection.

## Project structure

```
app/
  (app)/            guarded shell (role-based nav)
    dashboard/ assignments/ plus-one/ wbs/ team/
  api/
    auth/login  auth/logout
    assignments  assignments/[id]
    users  users/[id]      (lead only)
    import                 (lead only)
  login/
lib/     db, repo, auth, password, analytics, types, validation, seed, import, utils
components/  webgl-background, tilt-card, ambient-background, dialogs, cards, nav, …
```

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run seed` | Reset DB to the team roster (13 accounts, 0 assignments) |
| `npm run lint` | ESLint |
