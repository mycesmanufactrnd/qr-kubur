# Overview - What QubuR Is

A **grave / mosque / death-management platform** for Malaysian kariah (mosque congregation)
communities: grave mapping, deceased person records, death charity (takaful-style mutual aid)
membership and claims, tahlil requests, donations, waqf projects, mosque org charts, inventory
(jenazah/funeral equipment), and payments (ToyyibPay, Billplz). Written from the code and from
`markdown_files/FULL_ARCHITECTURE.md` (that file has the full Mermaid diagrams — this is the
condensed, navigable version).

## The pieces

| Piece | Folder | Stack | Port (prod) |
|---|---|---|---|
| Web/mobile frontend | `src/` | Vite + React 18, React Router, TanStack Query, Radix UI + Tailwind | `5173` (nginx, serves built `dist/`) |
| Backend API | `backend/` | Fastify + tRPC 11 (TypeScript), TypeORM 0.3 | `8083`, PM2 cluster ×5 |
| Database | `docker-compose.yml` service `db` (`postgres_db`) | PostgreSQL 15, bound to `127.0.0.1` only in prod | `5432` |
| Mobile app | `capacitor/android` | Same React app wrapped in Capacitor, ships via Google Play | — (hits `api.*` directly, does not load the live site) |
| File storage | `storage_data/` (bind mount) or S3 | One subfolder per "bucket" (`bucket-grave`, `bucket-dead-person`, ...) | — |

No Nest/Express — the backend is a single Fastify app registering a tRPC router plus a handful of
plain REST routes (`/api/upload`, `/api/file`, `/api/apps/public`, payment callbacks).

## How the pieces talk

```
Browser/Capacitor app ──HTTPS──> reverse proxy (NOT in this repo) ──┬─> nginx :80 (static dist/)
                                                                     └─> Fastify :8083
                                                                           │
                                                      tRPC /trpc/* + REST /api/* ──TypeORM──> Postgres
                                                           │
                                                 Firebase Admin SDK (push), ToyyibPay, Billplz
```

- **Auth is a JWT**, not Firebase session cookies for the core app: `backend/src/auth.ts` signs
  access (short-lived) + refresh tokens; `backend/src/trpc.ts#createContext` reads the token from
  the `Authorization: Bearer` header (web) or an httpOnly cookie (mobile/Capacitor), then
  `verifyToken()`. Procedures are gated with `publicProcedure` / `protectedProcedure` /
  `adminProcedure` / `superAdminProcedure` (role check against `superadmin | admin | employee |
  google`). Firebase is used for **Google SSO** (`useLoginGoogle`, `googleRouter.ts`) and for push
  notifications (FCM), not as the primary session mechanism. See [[backend-patterns]].
- **Every backend request from the frontend goes through a tRPC hook, organized into one
  `use<Entity>Mutations.ts` file per domain entity in `src/mutations/`.** This is the project's core
  frontend convention — see [[frontend-patterns]] for the pattern, and
  [[../20-knowledge/frontend-conventions/mutation-hooks-pattern|20-knowledge/frontend-conventions/mutation-hooks-pattern.md]]
  for the copy-paste template.
- **The schema authority is the TypeORM entity classes**, synced via `DATABASE_SYNC=true`
  (`backend/src/datasource.ts`). Only **one** hand-written migration exists
  (`backend/src/db/migrations/`) — like MyCES FMS, migrations are not the real mechanism here. See
  [[entity-system]].
- **Personal data is sensitive by default.** `DeadPerson`/`DeathCharityMember` store IC numbers,
  names, addresses, phone numbers, and cause of death — some of these columns are already encrypted
  at rest (`backend/src/helpers/cryptoHelper.ts`, AES-256-GCM) and some are not. See
  [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] before adding or touching any
  such field.

## Not fully in this repo

- The **reverse proxy / TLS termination** that maps `qubur.mycesgroup.com` and
  `api.qubur.mycesgroup.com` to the host's `5173`/`8083` is not checked in — see
  `markdown_files/FULL_ARCHITECTURE.md` §0.
- The **backup pipeline** (`scripts/backup-to-gdrive.ps1`) runs on the Docker host via Windows Task
  Scheduler, not inside a container — see [[development-workflow]].

## Legacy / half-migrated pieces — read before trusting them

- **`base44/` and `src/api/base44Client.js`** — this app was originally scaffolded by Base44.
  `src/api/entities.js`/`integrations.js` still import the base44 SDK, and `src/lib/AuthContext.jsx`
  wraps `base44.auth`, but **no `<AuthProvider>` is mounted anywhere in `App.jsx` or `main.jsx`**.
  The real, live auth path is the JWT + tRPC system above. Treat the base44 auth path as legacy
  until proven otherwise — see [[../20-knowledge/legacy/base44-and-supabase-status|20-knowledge/legacy/base44-and-supabase-status.md]]
  and the open question in [[../40-questions/unanswered/architecture|40-questions/unanswered/architecture.md]].
- **`supabase/`** — only CLI branch/temp metadata (`.branches`, `.temp`), no code references it.
  Dead folder; the README's "Architecture (no Supabase)" is accurate.

## Scale, so you calibrate

- Frontend: **130 page files**, **139 component files**, **28 mutation-hook files** in
  `src/mutations/` (plus one misplaced in `src/hooks/` — see [[best-practices]]).
- Backend: **51 router files**, **53 entity files**, **1** hand-written migration.

Related: [[project-structure]] · [[backend-patterns]] · [[frontend-patterns]] · [[entity-system]] ·
[[development-workflow]] · [[best-practices]]
