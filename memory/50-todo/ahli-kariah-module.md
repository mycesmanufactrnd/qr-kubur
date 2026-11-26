# Ahli Kariah module — what's left

Kariah registration now lives on `qariahmember` (built 2026-11-25) — how it works:
[[../20-knowledge/frontend-conventions/kariah-saved-membership|kariah-saved-membership.md]].
User decisions that day: registrations → `qariahmember`; `deathcharitymember` side **on hold**
(its 6 local kariah members left as-is, not copied); `qariahmember` PII encrypted; approval by the
mosque's organisation admin, scoped server-side; the form is the original 5 fields (extra columns stay empty; a
fuller form was built then reverted on request 2026-11-26). `googleUserId` is filled
from a verified Google sign-in token (the senior created that column on purpose; the 2026-11-24
"no googleUserId" rule was about adding one to `deathcharitymember`, not this table).

## Before deploying to production (blocking for deploy)

- `DATABASE_SYNC=true` applies the `QariahMember` entity on startup. Widening `icno`/`phoneno`/
  `spouseicno` (varchar 20 → 255) is done by TypeORM as **DROP + ADD COLUMN** (seen locally
  2026-11-25). If production's `qariahmember` has rows, those values are lost — and `icno` is NOT
  NULL, so the ADD fails on a non-empty table and the backend won't start. Check
  `select count(*) from qariahmember;` on production first (expected 0 / table absent: no code ever
  wrote to it). If absent, sync just creates it.

## Outstanding

- **Server-side org scoping on the held death-charity side**: `deathCharityMember.getKariahPaginated`
  / `approveMember` / `delete` only check "logged in" (org filter is client-side). The new
  `qariahMember` endpoints are already scoped. Agreed 2026-11-23; separate change.
- `deathCharityMember.registerKariah` is no longer called by the frontend (kept while on hold).
- Admin dashboard "Total Kariah Members" / mobile "Total Ahli Kariah" still count
  `deathcharitymember`, not approved `qariahmember` rows.

## Gaps found while surveying (not fixed, out of scope)

- `KariahDevice.icnumber` is stored **plaintext** (approval pushes match it against `QariahMember.icno`).
- `deathCharityMember.searchByIcNumber` is public and returns full decrypted member records
  (rate-limited only). Still used by admin pages and `User/JenazahEmergencyRequest.jsx`.
- `familyTree.getByGoogleUser`-style lookups take `googleUserId` from client input with no check —
  anyone can read another Google user's family tree by id (`familyTreeRouter.ts:10`). Same
  unverified-id pattern in donation/deathCharityPayment/billplz writes.
- tRPC error responses include server stack traces (seen on the local dev backend).

## Other orphan `qariah*` tables

`qariahdevice` (1 row) and `qariahdeathnotification` (0 rows) in the local DB have no entity —
leftovers from the July 2026 "Qariah" naming (renamed to Kariah in `e8917d1`). `qariahmember`
itself was never written by committed code before 2026-11-25 (checked across all branches).

Parent: [[index|50-todo/]].
