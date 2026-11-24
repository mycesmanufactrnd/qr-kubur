# Ahli Kariah module — what's left

The user-side feature (dashboard card, narrow status lookup, per-user saved status) was built
2026-11-24 — see [[../20-knowledge/frontend-conventions/kariah-saved-membership|kariah-saved-membership.md]].
Scope was fixed by the user that day: no schema change, no new tables, no account linking or auth
changes; reuse `deathcharitymember`, `registerKariah`, `approveMember`.

## Outstanding (separate change, agreed 2026-11-23)

- **Server-side org scoping for staff**: `getKariahPaginated` / `approveMember` / `delete` only
  check "logged in", so any admin/employee can read and approve every organisation's members
  (decrypted PII). The org filter is client-side only. Admin/employee → own org's mosques;
  superadmin → all. JWT payload is only `{ id, role, type }`, so the org needs a user lookup.

## Gaps found while surveying (not fixed, out of scope)

- `KariahDevice.icnumber` is stored **plaintext**, unlike `DeathCharityMember.icnumber`.
- `deathCharityMember.searchByIcNumber` is public and returns full decrypted member records
  (rate-limited only). Still used by admin pages and `User/JenazahEmergencyRequest.jsx`.
- The QR-view subtitle key "Register or check your membership status with your local mosque Kariah."
  on `UserKariahRegistration.jsx` is missing from all three locale files.

## Orphan `qariah*` tables

Local dev DB (checked 2026-11-23): `qariahmember` (0 rows, plaintext PII columns), `qariahdevice`
(1 row), `qariahdeathnotification` (0 rows). No entity in code or git history; left over from the
July 2026 "Qariah" era (renamed to Kariah in `e8917d1`). `DATABASE_SYNC` never drops tables. Not
checked on production. **Not** the table to build on — the live one is `deathcharitymember`.

Parent: [[index|50-todo/]].
