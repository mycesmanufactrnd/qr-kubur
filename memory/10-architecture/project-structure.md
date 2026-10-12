# Project Structure

What every top-level folder is, verified against the repo listing.

| Folder | What it is | Status |
|---|---|---|
| `src/` | React frontend (Vite). See below for the subfolder breakdown. | Live |
| `backend/` | Fastify + tRPC + TypeORM API. Own `package.json`, own `node_modules`. | Live |
| `capacitor/` | Capacitor Android wrapper around the built frontend (`npm run sync:android`). | Live |
| `public/` | Static assets, `firebase-messaging-sw.js` (web push service worker). | Live |
| `dockerfiles/` | `backend.prod.dockerfile`, `frontend.prod.dockerfile` (multi-stage, nginx). | Live |
| `scripts/` | Build/version helper scripts (e.g. `bump-android-version.js`), `backup-to-gdrive.ps1`. | Live |
| `flow/` | Hand-written runbooks for specific flows: `google-sign-in.md`, `toyyibpay-payment.md`, `fix-postgres-ownership.md`. | Live, read before touching those flows |
| `markdown_files/` | Ops/architecture docs: `FULL_ARCHITECTURE.md`, `BACKUP_DR.md`, `MONITORING.md`, `ALERTING_FLOW.md`, `RUNNER.md`, `SETUP_PM2.md`, `postgres.md`. | Live, authoritative for ops — this memory system links to it rather than duplicating it |
| `base44/` | `.app.jsonc` / `config.jsonc` only — Base44 scaffold leftover. | Mostly dead, see [[overview#legacy]] |
| `supabase/` | CLI branch/temp metadata only, no code references it. | Dead |
| `storage_data/` | Bind-mounted disk storage for uploaded files (one subfolder per bucket). | Live (runtime data, not source) |
| `.github/` | CI / self-hosted runner workflow(s). | Live |

## `src/` breakdown

| Subfolder | Contents |
|---|---|
| `api/` | Legacy Base44 SDK wrappers (`base44Client.js`, `entities.js`, `integrations.js`) — see legacy note in [[overview]]. |
| `mutations/` | **One `use<Entity>Mutations.ts` file per domain entity.** The project's core request convention — see [[frontend-patterns]]. |
| `hooks/` | Generic/reusable hooks (`use-mobile`, `useIsNarrow`, `useNativeBackButton`, `usePullToRefresh`, `useFirstInstallPermissions`, `useAuthenticatedObjectUrl`) **plus one misplaced mutations file**, `useInventoryMutations.ts` — see [[best-practices]]. |
| `pages/` | Route-level screens, further split into `Dashboards/`, `ExtraFeatures/`, `Management/`, `Mobile/`, `Payment/`, `QuickLink/`, `Settings/`, `User/`. `Settings/PrivacyPolicy.jsx` and `Settings/TermsAndConditions.jsx` are the PDPA-facing pages — see [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]. |
| `components/` | Shared UI, split by domain (`calendar/`, `collectiontree/`, `deathcharity/`, `forms/`, `jitsi/`, `map/`, `mobile/`, `PDF/`, `plainforms/`, `PopUpAlert/`, `ui/` (shadcn/radix primitives), `waqf/`). `ToastrNotification.jsx` is used by every mutation hook. |
| `i18n/` | `en.json`, `ms.json`, `ar.json` — the three locale files every `translate()` key must exist in (mandatory rule, see root `CLAUDE.md`). |
| `firebase/` | `firebase.ts` (client SDK init), `useFCM.ts` (push notification hook). |
| `jenazah/` | Jenazah (funeral/corpse-handling) case specific logic. |
| `lib/` | `AuthContext.jsx` (legacy base44 auth, see [[overview]]), `app-params.js`, `PageNotFound.jsx`. |
| `providers/` | `LocationProvider.jsx`, `AudioPlayerProvider.jsx` — React context providers actually mounted in `App.jsx`. |
| `utils/` | `trpc.ts` (the tRPC client — every mutation hook imports from here), `auth.js` (the real JWT/Google-SSO auth logic: `useAdminAccess`, `useLoginGoogle`, `handleLoginTRPC`, biometric login), `appUpdate.js`, translations. |

## `backend/src/` breakdown

| Subfolder | Contents |
|---|---|
| `routers/` | **51 files**, one tRPC sub-router per domain, composed into `appRouter.ts`. 1:1 with `src/mutations/*.ts` on the frontend (see [[frontend-patterns]]). |
| `schemas/` | Zod validation schemas, one per entity-ish domain, imported by the matching router. |
| `db/entities/` | **53 TypeORM entity files** — the schema. Some grouped into subfolders (`DeathCharity/`, `Inventory/`, `CollectionTree/`, `FirebaseReceiver/`, `GoogleUser/`, `ExtendsEntity/`). |
| `db/migrations/` | **One** hand-written migration — `DATABASE_SYNC=true` is the real schema mechanism, see [[entity-system]]. |
| `db/scripts/` | One-off data scripts, e.g. `backfillPdpaEncryption.ts` — see [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]. |
| `db/seeder/`, `seed.prod.ts` | Seed data. |
| `helpers/` | `authHelper.ts`, `cryptoHelper.ts` (field encryption, see [[../20-knowledge/security/field-encryption|field-encryption.md]]), `passwordHelper.ts`, `requestContext.ts`. |
| `middleware/` | `rateLimit.ts`. |
| `storage/` | `storage.ts` (driver switch), `storageDisk.ts`, `storageS3.ts` — `STORAGE_DRIVER=disk\|s3`. |
| `services/` | `firebase.service.ts` (push), `billplz.service.ts`, `toyyibpay.service.ts`, `upload.service.ts`, `storageMetadata.service.ts`, `notificationUrls.ts` (event → in-app deep link map). |
| `config/` | Payment gateway configs: `billplz.config.ts`, `toyyibpay.config.ts`, `stripe.config.ts`, `paypal.config.ts` (Stripe/PayPal present but check [[../40-questions/unanswered/architecture|open questions]] for whether they're wired up — ToyyibPay/Billplz are the ones confirmed live in `markdown_files/FULL_ARCHITECTURE.md`). |
| `ollama/` | Local LLM integration (chains, prompts, router) — separate from the Base44 `InvokeLLM` integration. |
| `api/` | Plain REST handlers: `api.ts`, `payment.ts`, `proxy.ts`, `upload.ts` (outside tRPC — file upload/download and payment callbacks). |
| `auth.ts`, `trpc.ts`, `datasource.ts`, `server.ts` | Core wiring — see [[backend-patterns]]. |

Parent: [[../index|memory root]].
