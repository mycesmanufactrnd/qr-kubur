# Backend Patterns (`backend/`)

Fastify + tRPC 11 + TypeORM 0.3. No Nest, no Express.

## Auth: JWT, with role-gated tRPC procedures

`backend/src/auth.ts`:
- `signAccessToken` / `signRefreshToken` — HS256 JWT via `jsonwebtoken`, secret from `JWT_SECRET`.
  Access token expiry `ACCESS_TOKEN_EXPIRY` (default 1 day), refresh `REFRESH_TOKEN_EXPIRY` (default
  7 days). Payload: `{ id, role, type: "access"|"refresh" }`.
- `verifyToken(token)` — returns the payload or `null`; never throws out.

`backend/src/trpc.ts#createContext`:
- Reads `Authorization: Bearer <token>` first, falls back to the `accessToken` httpOnly cookie
  (mobile/Capacitor path). Priority: **Bearer > Cookie > none**.
- Builds `{ user, req, reply }` as tRPC context.

Procedure tiers, composed with `.use()` middleware:

| Procedure | Guard |
|---|---|
| `publicProcedure` | none |
| `protectedProcedure` | `ctx.user` must exist; rejects `type: "refresh"` tokens used as access tokens |
| `adminProcedure` | `protectedProcedure` + role in `["superadmin", "admin"]` |
| `superAdminProcedure` | `protectedProcedure` + role === `"superadmin"` |

Roles: `superadmin | admin | employee | google` (the last is a Google-SSO-only user tier).

**Google SSO** (`googleRouter.ts`, `utils/auth.js#useLoginGoogle`/`handleLoginTRPC`) issues the same
JWT access/refresh pair after verifying the Google credential — it's a second login path into the
same token system, not a separate Firebase-session mechanism. Firebase elsewhere in the backend
(`services/firebase.service.ts`) is for **push notifications**, not auth.

## Router / schema pairing

Every domain gets:
- `backend/src/routers/<domain>Router.ts` — tRPC router, registered in `appRouter.ts`
- `backend/src/schemas/<domain>Schema.ts` — Zod schema used for input validation in that router

One frontend `src/mutations/use<Entity>Mutations.ts` file (or query hook) maps to one backend
router. See [[frontend-patterns]] for the frontend half of this pairing, and
[[../90-reference/trpc-routers|90-reference/trpc-routers.md]] for the full router list.

## File upload/download — outside tRPC

tRPC handles data; files go through plain REST (`backend/src/api/upload.ts`, registered alongside
the tRPC adapter in `server.ts`):
- `POST /api/upload/:bucket` (multipart `file`) → writes to disk (`STORAGE_DRIVER=disk`,
  `STORAGE_DISK_ROOT`) or S3 (`STORAGE_DRIVER=s3`, `S3_BUCKET`/`S3_REGION`) via
  `storage/storage.ts`'s driver switch, and inserts/updates a `StoredFile` metadata row.
- `GET /api/file/:bucket/:filename` → reads back, sets `Content-Type` +
  `Content-Disposition: inline`.
- Buckets map 1:1 to the `*_STORAGE_ID` env vars (e.g. `DEAD_PERSON_STORAGE_ID`,
  `DEATH_CONFIRMATION_STORAGE_ID`, `POLICE_REPORT_STORAGE_ID`) — these gate which config a given
  upload endpoint uses, not a hardcoded bucket name.

## Payments

`services/toyyibpay.service.ts` and `services/billplz.service.ts`, each with a `config/*.config.ts`
that validates required env keys are present at boot (`server.ts` logs what's missing — check boot
logs if payment calls fail before assuming the code is broken). `stripe.config.ts` and
`paypal.config.ts` also exist but confirmed-live payment flows per
`markdown_files/FULL_ARCHITECTURE.md` are ToyyibPay and Billplz only — see the open question in
[[../40-questions/unanswered/architecture|40-questions/unanswered/architecture.md]] before assuming
Stripe/PayPal are wired up.

## Process management

`ecosystem.config.cjs` → PM2 **cluster mode, 5 instances**, matched to `docker-compose.yml`'s
`cpuset: "0-4"`. Docker's `CMD` runs `pm2-runtime` (not `pm2`) so it behaves correctly as container
PID 1 (forwards `SIGTERM`/`SIGINT` for a clean `docker stop`). See [[development-workflow]].

## Rate limiting

`middleware/rateLimit.ts` — check this before assuming an endpoint has no throttling, especially
public-facing ones (`publicRouter.ts`, QR-scan/visit-log endpoints).

Related: [[frontend-patterns]] · [[entity-system]] · [[../90-reference/trpc-routers|90-reference/trpc-routers.md]]
