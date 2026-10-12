# Best Practices / Pitfalls

Things that cost time or risk a mistake here, verified against the code.

## Frontend

- **Always put a new backend call in a `use<Entity>Mutations.ts` hook**, not inline `trpc.*` in a
  component. See [[frontend-patterns]]. Finding no existing hook for an entity is a signal to create
  one, not to reach for a direct call.
- **`src/hooks/useInventoryMutations.ts` is a misplaced mutations file**, not a different pattern —
  it should conceptually live in `src/mutations/` but doesn't. Don't be misled into thinking
  `src/hooks/` is a second valid home for new mutation files; keep new ones in `src/mutations/`
  unless there's a reason (like this file) to colocate several tightly related sub-domains.
- **Forgetting the i18n three-file rule** (`en.json`/`ms.json`/`ar.json`) is the single most
  repeated mistake this rule exists to prevent — see root `CLAUDE.md`. Grep new `translate("...")`
  keys against all three before calling a UI task done.
- **Don't copy from `src/lib/AuthContext.jsx` / `ProtectedRoute.jsx`** for new auth-gated code — it's
  the legacy base44 path with no `<AuthProvider>` mounted anywhere found in this survey. Use
  `src/utils/auth.js`'s `useAdminAccess()` / JWT-based helpers instead. See
  [[../20-knowledge/legacy/base44-and-supabase-status|20-knowledge/legacy/base44-and-supabase-status.md]].

## Backend / data

- **`DATABASE_SYNC=true` means entity classes ARE the schema.** A column rename/type change in an
  entity can silently alter or drop a live column via TypeORM's `synchronize`. Verify against a
  dev/staging DB first — don't assume it's as safe as a reviewed migration. See [[entity-system]].
- **Adding a new PII column (IC, phone, email, address, health-related) without the
  `encryptField`/`decryptField` transformer is inconsistent with the pattern already established**
  on `DeadPerson`/`DeathCharityMember`/`Quotation`/`TahlilRequest`/`Donation`. Check
  [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] and
  [[../20-knowledge/security/field-encryption|field-encryption.md]] before adding one. This is a Red
  assumption per [[../00-project/00-behaviour-core|00-behaviour-core.md]] section 4 — ask, don't
  guess, if it's unclear whether a new field should be encrypted.
- **`FIELD_ENCRYPTION_KEY` is a single symmetric key for every encrypted column, read from env, not
  rotated.** Losing it makes every encrypted value permanently unrecoverable (IC numbers, cause of
  death, etc.) — this is a real disaster-recovery risk, not just a security one. It is **not**
  committed to git (`.env`/`.env.dev` are gitignored and untracked, confirmed via `git ls-files`),
  but confirm it's included in whatever secret backup/escrow process exists before assuming it's
  safe. See [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]].
- **`icnumberhash` must be kept in sync whenever `icnumber` changes** — done via `@BeforeInsert()`/
  `@BeforeUpdate()` hooks on the entity (`setIcNumberHash()`). If you ever bulk-update `icnumber`
  outside the entity's save lifecycle (raw SQL, a script), you must recompute the hash yourself —
  see `backend/src/db/scripts/backfillPdpaEncryption.ts` for the reference approach.
- **Config for Stripe/PayPal exists (`config/stripe.config.ts`, `config/paypal.config.ts`) but the
  architecture doc and docker-compose only confirm ToyyibPay + Billplz as live.** Don't assume
  Stripe/PayPal payment flows are production-ready without checking — see
  [[../40-questions/unanswered/architecture|open questions]].

## Generated/do-not-hand-edit

- `backend/dist/`, root `dist/` — build output, regenerate rather than edit.
- `capacitor/android/` build artifacts — regenerate via `npm run sync:android` rather than
  hand-editing generated Gradle/Java files.

Related: [[overview]] · [[frontend-patterns]] · [[entity-system]]
