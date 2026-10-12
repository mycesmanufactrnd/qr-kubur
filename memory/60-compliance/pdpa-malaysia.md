# PDPA (Malaysia, Act 709) — Where QubuR Stands

**Not legal advice.** This maps the Personal Data Protection Act 2010's principles to what is
actually implemented in this codebase, verified by reading the code. Where something is uncertain or
unverified, it's marked as a gap in [[../50-todo/pdpa-gaps|50-todo/pdpa-gaps.md]] rather than assumed.

## Why this matters here specifically

QubuR stores, per `DeadPerson` and `DeathCharityMember` alone: **full name, IC (identity card)
number, date of birth, date of death, cause of death, home address, phone number, email, heir
name/phone, GPS coordinates of burial, and photographed documents** (death confirmation, police
report, supporting documents). Cause of death is health-related data — PDPA treats this as more
sensitive than ordinary personal data. `VisitLog`/`Suggestion` also capture visitor IP addresses.

## What's already implemented

### Notice & Choice Principle
`src/pages/Settings/PrivacyPolicy.jsx` is a real, shipped privacy policy page (linked from
Settings on both web and mobile) that:
- names the PDPA 2010 explicitly and lists the principles it claims to follow (General, Notice and
  Choice, Disclosure, Security, Retention, Data Integrity, Access)
- states users can access/correct/delete their data and withdraw consent "by contacting us"
- is paired with `src/pages/Settings/TermsAndConditions.jsx`

This is real, user-facing policy text — treat edits to it as a legal-content change, not just a
copy change (get sign-off before rewording PDPA claims).

### Security Principle — field-level encryption (partial)
`backend/src/helpers/cryptoHelper.ts` implements AES-256-GCM field encryption
(`encryptField`/`decryptField`) plus HMAC-SHA256 search hashing (`hashForSearch`), applied via
TypeORM column transformers. See [[../20-knowledge/security/field-encryption|20-knowledge/security/field-encryption.md]]
for the mechanism and [[../10-architecture/entity-system|10-architecture/entity-system.md]] for the
full table of which columns use it. `backend/src/db/scripts/backfillPdpaEncryption.ts` exists
specifically to retrofit encryption onto previously-plaintext rows — this was a deliberate,
named-as-such PDPA remediation effort, not incidental.

**Currently encrypted**: `DeadPerson.icnumber`/`causeofdeath`,
`DeathCharityMember.icnumber`/`phone`/`email`/`address`, `Quotation.payerphone`/`payeremail`,
`TahlilRequest.requestorphoneno`/`requestoremail`, `Donation.donorphoneno`/`donoremail`.

**Not yet encrypted** (full list + reasoning per field in
[[../50-todo/pdpa-gaps|50-todo/pdpa-gaps.md]]): `DeadPerson.name`/`heirname`/`heirphoneno`/
`biography`, the three case-document photo URLs on `DeadPerson`/`JenazahCase`, `JenazahCase.details`
(jsonb), `VisitLog.visitorip`, `Suggestion.visitorip`.

### Access control
Role-gated tRPC procedures (`protectedProcedure`/`adminProcedure`/`superAdminProcedure`, see
[[../10-architecture/backend-patterns|10-architecture/backend-patterns.md]]) limit which roles can
read/write PII-bearing routers. Not independently audited per-router in this pass — if adding a new
endpoint that reads `DeadPerson`/`DeathCharityMember` fields, default to `protectedProcedure` or
stricter, never `publicProcedure`, unless the data is intentionally public (e.g. a public grave-lookup
QR flow, which is the app's actual purpose for non-sensitive fields like name/location).

## Confirmed finding: encryption-at-rest does not stop a public endpoint from returning the data

`backend/src/routers/deadpersonRouter.ts`'s `getDeadPersonById` and `getDeadPersonByGraveId` are
`publicProcedure` (no auth, called by the QR-code grave-lookup flow) and return the **full**
`DeadPerson` entity via `findOne`/`find` with no field selection/omission. TypeORM's column
`transformer` decrypts `icnumber` and `causeofdeath` on every read regardless of caller — so these
two public, unauthenticated endpoints currently serve the deceased's **decrypted IC number and cause
of death** to anyone who calls them with a valid id. `graveRouter.ts`'s `getGraveById` /
`getGraveByCoordinates` are also `publicProcedure` and worth the same check for whatever they join in.

This is a field-selection gap, not an encryption-at-rest gap — the DB-level protection is working as
designed, but it doesn't help here because the application layer hands the decrypted value back out.
Fixing it means explicitly selecting only the public-safe fields (name, photo, grave
location/lot, biography) in those two procedures rather than returning the full entity — this is a
real, verified, fixable issue, tracked as the top item in
[[../50-todo/pdpa-gaps|50-todo/pdpa-gaps.md]].

## What's not confirmed implemented (gaps)

Tracked in detail in [[../50-todo/pdpa-gaps|50-todo/pdpa-gaps.md]]:
- No confirmed **retention/deletion policy** for live production data (only backups are pruned, at
  14 days, and that's a DR measure, not a PDPA retention control).
- No confirmed **self-service or admin tooling** for the data-subject access/correction/deletion
  requests the Privacy Policy promises — currently "contact us," manually.
- Uploaded **documents on disk** (`storage_data/`) are not encrypted at rest, only certain DB text
  columns are.
- `FIELD_ENCRYPTION_KEY` backup/escrow process not confirmed.

## Rules for working on this codebase

1. **Any new column storing IC number, name, address, phone, email, date of birth/death,
   cause of death, or similar health-related data is a Red assumption** per
   [[../00-project/00-behaviour-core|00-project/00-behaviour-core.md]] — ask whether it needs
   `encryptField`/`decryptField` before writing the entity, don't silently decide either way.
2. **Never add a new public (`publicProcedure`) endpoint that returns IC number, cause of death,
   address, phone, or email** without an explicit decision that it's meant to be public. Name,
   grave location, and photo of the grave are the fields this app is actually designed to expose
   publicly (QR-code grave lookup) — IC number and cause of death are not.
3. **When adding a feature that touches PII, check whether `PrivacyPolicy.jsx`'s claims still hold**
   (e.g. a new third-party integration that receives personal data should be disclosed there).
4. **Log changes to the field-inventory table above in the same edit** that adds/removes/encrypts a
   PII column — this file drifts fast otherwise.

Parent: [[index|60-compliance/]].
