# Development Workflow

## Running it

| Command | What it does |
|---|---|
| `npm run docker:up` | `docker compose --env-file .env up -d` — full prod-shaped stack (db + backend + frontend) |
| `npm run docker:compose:dev` | `docker-compose.dev.yml` + `.env.dev` — live-reload dev stack (Vite dev server on `5174`, bind-mounted backend source with `CHOKIDAR_USEPOLLING`, Postgres open on all interfaces) |
| `npm run docker:logs:backend` / `:frontend` | tail logs |
| `npm run docker:psql` | `docker exec -it postgres_db psql -U postgres -d qr_kubur` |
| `npm run dev` | plain `vite --host`, frontend only (needs a backend to talk to) |
| `npm run docker:rebuild:all` | nuke volumes + rebuild everything — **destructive**, confirm before suggesting this to a user |

Two env files: `.env` (prod shape) and `.env.dev` (dev shape) — both **gitignored**, not committed
(`git ls-files` confirms neither is tracked). Don't assume values from one apply to the other
(`POSTGRES_PORT` binding differs, see [[overview]]).

## Mobile (Capacitor / Android)

| Command | What it does |
|---|---|
| `npm run sync:android` | `vite build` then `npx cap sync android` |
| `npm run apk:debug` / `apk:release` | sync then `gradlew.bat assembleDebug/Release` |
| `npm run bundle:release` | bumps Android version (`scripts/bump-android-version.js`) first, then builds an `.aab` |

Native builds bundle their own `dist/` rather than loading the live site — see the note in
[[frontend-patterns]] about the `trpc.ts` native-vs-web URL split.

## Backend process management in prod

PM2 cluster mode ×5, pinned to `cpuset: "0-4"` — see [[backend-patterns]]. Change `instances` in
`ecosystem.config.cjs` and `cpuset` in `docker-compose.yml` together if ever resizing.

## Backups

`scripts/backup-to-gdrive.ps1` runs on the **Docker host** (Windows Task Scheduler), not in a
container: `pg_dump` via `docker exec postgres_db`, zips each `storage_data/*` bucket folder
separately, `rclone copy` to Google Drive, prunes anything older than 14 days, pings
`HEALTHCHECK_BACKUP_URL` on start/success/fail. Full detail in `markdown_files/BACKUP_DR.md` — this
memory system links to it rather than duplicating it (per the no-duplication rule in root
`CLAUDE.md`).

**Note for PDPA/retention purposes**: the 14-day prune applies only to the *backup* copies in
Google Drive — it is not a retention/deletion policy for the live production data. See
[[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]].

## Monitoring

`markdown_files/MONITORING.md`, `markdown_files/ALERTING_FLOW.md`, `markdown_files/RUNNER.md`,
`markdown_files/SETUP_PM2.md`, `markdown_files/postgres.md` — read these directly for ops detail;
not re-summarized here.

## Flow runbooks

`flow/google-sign-in.md`, `flow/toyyibpay-payment.md`, `flow/fix-postgres-ownership.md` — step-by-step
procedures for those specific flows. Read before touching Google SSO or ToyyibPay payment code.

## Tests

`playwright.config.ts` exists (`@playwright/test` devDependency) — no test files were located during
this survey; treat "what's actually covered" as an open question rather than assuming full E2E
coverage. `npm run lint` / `npm run typecheck` (`tsc -p ./jsconfig.json`) are the fast checks.

Related: [[overview]] · [[backend-patterns]]
