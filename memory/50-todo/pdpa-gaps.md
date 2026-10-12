# PDPA Gaps — Not Yet Decided, Not Yet Done

Concrete, code-verified gaps between what the Security Principle of PDPA would suggest and what's
currently implemented. These are flagged, not fixed — each needs a decision (is the field actually
sensitive enough to justify encryption overhead / query-ability loss?) before changing anything. See
[[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] for the full compliance picture.

## Highest priority — confirmed, fixable, not just theoretical

- [ ] **`deadpersonRouter.getDeadPersonById`/`getDeadPersonByGraveId` are unauthenticated
  (`publicProcedure`) and return the full `DeadPerson` row, including the decrypted `icnumber` and
  `causeofdeath`.** The QR-lookup flow needs name/photo/grave-location to work publicly, but it does
  not need IC number or cause of death exposed. Fix is to select/omit fields explicitly in those two
  procedures rather than returning the full entity. See the confirmed-finding section in
  [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]. `graveRouter.getGraveById`/
  `getGraveByCoordinates` (also `publicProcedure`) should get the same field-selection check.

## Encryption coverage gaps

- [ ] `DeadPerson.name`, `heirname`, `heirphoneno`, `biography` — plaintext. Name is unavoidably
  displayed (grave markers, QR lookups are the whole point of the app), so full-column encryption may
  not even be appropriate here — needs a product decision, not just a technical one.
- [ ] `DeadPerson.deathconfirmationphotourl`, `policereportphotourl`, `supportingdocphotourl` — these
  are URLs/filenames to documents stored in `storage_data/`; the **files themselves** are not
  encrypted at rest on disk (only DB field encryption exists today). A death certificate and a police
  report are sensitive documents.
- [ ] `JenazahCase.details` (jsonb) — likely contains structured personal data mirroring the
  `DeadPerson/JenazahCase` photo fields; not audited field-by-field in this pass.
- [ ] `VisitLog.visitorip`, `Suggestion.visitorip` — plaintext IP addresses tied to a timestamp (and,
  per commented-out relations in `VisitLog.entity.ts`, potentially a grave/dead-person visited). An
  IP address is personal data under PDPA when it can identify a person or device.
- [ ] Organisation/Mosque/TahfizCenter `address`/`email`/`phoneno` fields are plaintext — likely lower
  risk (business/institutional contact info, not an individual's), but not explicitly scoped out.

## Process gaps

- [ ] **No explicit data-retention/deletion policy found for live production data.** The 14-day prune
  in `scripts/backup-to-gdrive.ps1` only applies to *backup copies*, not the production `deadperson`/
  `deathcharitymember`/etc. tables. PDPA's Retention Principle requires personal data not be kept
  longer than necessary for the purpose it was collected for.
- [ ] **No confirmed Data Subject Access/Correction/Deletion Request workflow** — `PrivacyPolicy.jsx`
  promises users the right to access/correct/delete their data "by contacting us," but no in-app
  self-service flow or admin tooling for fulfilling such a request was found in this survey.
- [ ] `FIELD_ENCRYPTION_KEY` backup/escrow process not confirmed — losing this key permanently loses
  the ability to decrypt every encrypted PII column. See
  [[../10-architecture/best-practices|10-architecture/best-practices.md]].

Each item here should move to `60-compliance/pdpa-malaysia.md`'s "addressed" state once actually
fixed, and be deleted from this list at that point (same no-stale-todo discipline as the rest of this
memory system).

Parent: [[index|50-todo/]].
