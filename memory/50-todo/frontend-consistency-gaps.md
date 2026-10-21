# Frontend Consistency Gaps

Places where an established frontend convention exists but isn't applied everywhere yet. Each item
is a real, code-verified gap against a convention documented elsewhere in `/memory` — not a new
convention invented here.

## Admin pages missing a mobile view

Convention: see
[[../20-knowledge/frontend-conventions/admin-mobile-pattern|20-knowledge/frontend-conventions/admin-mobile-pattern.md]]
— a desktop table component + a `src/pages/Mobile/ManageX.jsx` card-list view, switched via
`useIsNarrow()`.

- [ ] These admin management pages have **no** mobile handling at all (no `useIsNarrow`, no
  `useIsMobile`, no `Mobile/ManageX.jsx`, no responsive breakpoints), confirmed 2026-10-12:
  `ManageGraveMapping`, `ManageHeritageSites`, `ManageInventoryItems`, `ManageOrganisationTypes`,
  `ManagePaymentDistribution`, `ManagePaymentFields`, `ManagePaymentPlatforms`, `ManageSuggestions`,
  `ManageTempOrganisations`, `ManageWaqfProject`, `ManageCollectionTree`, `ManageIslamicEvent`,
  `ManageDeathCharityClaim`. Bring each in line with the pattern (desktop component + sibling
  `Mobile/ManageX.jsx` + `useIsNarrow()` switch) when next touched, rather than all at once.

## Pages calling trpc directly instead of through a mutation hook

Convention: see
[[../20-knowledge/frontend-conventions/mutation-hooks-pattern|20-knowledge/frontend-conventions/mutation-hooks-pattern.md]]
— never call `trpc.*`/`trpcClient.*` from a page/component body; always go through a
`use<Entity>Mutations.ts` hook.

A full-codebase grep on 2026-10-13 found 56 page/component files doing this. Rolling out the fix
"phased by domain" per user decision (not one giant sweep), since a full fix touches admin CRUD,
payment, and PII-bearing pages.

- [x] **Jenazah Case / Dead Person domain — done 2026-10-13.** Files fixed: `DetailJenazah.jsx` (+
  Mobile), `DeadPersonDetails.jsx`, `GraveDetails.jsx`, `AddFamilyMemberButton.jsx`,
  `User/FamilyTree.jsx`, `User/JenazahEmergencyRequest.jsx`, `ScanQR.jsx`,
  `PopUpAlert/JenazahCaseAlert.jsx` (+ `JenazahCaseOngoingAlert.jsx`),
  `Dashboards/JenazahCaseDashboard.jsx` (+ Mobile), `Management/ManageJenazahCase.jsx` (+ Mobile),
  `Management/ManageDeadPersons.jsx` (+ Mobile). New mutation files:
  `useJenazahCaseMutations.ts`, `useFamilyTreeMutations.ts`, `useVisitLogMutations.ts`; extended
  `useDeadPersonMutations.ts`, `useOrganisationMutations.ts`, `useDeathCharityMemberMutations.ts`,
  `useGraveMutations.ts`, `useInventoryMutations.ts` (`src/hooks/`), and `src/utils/auth.ts`
  (`useGetClientIp`, alongside the existing `trpc.auth.*` hooks there).
  Two small user-visible toast-wording changes as a result of consolidating onto shared mutations
  (both still show a success toast, just more generic text): `ManageKariahMember`'s
  "Dead person recorded" and `Mobile/ManageJenazahCase`'s "Grave lot updated" now show the shared
  `useDeadPersonMutations` hook's generic "Deceased Record ... updated" toast instead.
  Also fixed in passing: `useInventoryTransactionMutations().stockOut`'s `invalidateAll()` was
  missing `inventoryItem.getAll.invalidate()` — a latent staleness bug for every caller, not just
  this domain.
- [ ] **Still outstanding, by domain** (file-level detail in each page, not re-derived here — rerun
  `grep -rl '\btrpc\.'` and exclude `src/mutations/`, `src/hooks/useInventoryMutations.ts`,
  `src/utils/trpc.ts`, `src/utils/auth.ts`, `src/main.jsx` to get the current list):
  - Mosque/Organisation: `OrganisationDetails.jsx`, `OrganisationQuickRegister.jsx`,
    `Management/ManageOrganisations.jsx`, `Management/ManageTempOrganisations.jsx`,
    `Management/ManageTahfizCenters.jsx` (+ Mobile), `TahfizDetails.jsx`,
    `Management/ManageGraves.jsx` (+ Mobile), `Management/ManageGraveMapping.jsx`,
    `components/PaymentConfigDialog.jsx`, `GraveService.jsx` — several of these reuse
    `organisation.getParentAndChildOrgs`/`getGraveServiceByState`, now already wrapped as
    `useGetAccessibleOrgIds()`/`useGetGraveServiceByState()` in `useOrganisationMutations.ts` from
    the Jenazah Case phase — just need their call sites swapped.
  - Kariah / Death Charity: `Management/ManageKariahMember.jsx` (+ Mobile) — already has its own
    direct `deadperson.upsertForKariah`/`delete` calls that could reuse
    `useDeadPersonMutations().upsertDeadPersonForKariah`/`deleteDeadPerson` (now already wrapped) —,
    `Management/ManageDeathCharityMember.jsx` (+ Mobile), `User/UserKariahRegistration.jsx`,
    `PopUpAlert/KariahRegistrationAlert.jsx`, `Management/ManageNotifyDeathKariah.jsx` (+ Mobile),
    `DeathCharityUserPayment.jsx`.
  - Payment/Finance: `Payment/FinancialReports.jsx` (+ Mobile), `Payment/ToyyibPayConfigPage.jsx`,
    `Payment/BillplzConfigPage.jsx`, `Settings/UserTransactionRecords.jsx`, `DonationPage.jsx`,
    `QuickLink/QuickDonation.jsx`.
  - Tahlil: `TahlilRequestPage.jsx` (reuses `deadperson.getDeadPersonById`/`familyTree.getByGoogleUser`,
    now already wrapped), `QuickLink/QuickTahlil.jsx`, `User/CheckTahlilStatus.jsx`,
    `User/CheckServiceStatus.jsx`, `User/StatusCheck.jsx`.
  - Misc/Settings: `Mobile/SettingsPage.jsx`, `Settings/Ollama.jsx`, `IslamicCalendar.jsx`,
    `Management/ManageIslamicEvent.jsx`, `Management/ManageCollectionTree.jsx`,
    `SubmitSuggestion.jsx` (reuses `deadperson.getDeadPersonByGraveId`/`auth.getClientIp`, now
    already wrapped), `User/SurahPage.jsx`, `Management/InventoryReports.jsx`.
  - `Settings/Ollama.jsx`, `Management/ManageNotifyDeathKariah.jsx`,
    `Management/ManageCollectionTree.jsx`, `Management/ManageTempOrganisations.jsx`,
    `Payment/ToyyibPayConfigPage.jsx`/`BillplzConfigPage.jsx` need a **new**
    `use<Entity>Mutations.ts` created from scratch (zero hook coverage today) — the rest reuse or
    extend an existing file.
- Raw `fetch()`/`fetch(apiUrl(...))` calls to the non-tRPC REST endpoints
  (`/api/upload/:bucket`, `/api/file/:bucket/:filename`, CSV bulk-import routes) are **out of
  scope** for this convention by user decision 2026-10-13 — the mutation-hooks template is
  tRPC-specific and those aren't tRPC procedures.

## Misplaced mutations file

Convention: see
[[../20-knowledge/frontend-conventions/mutation-hooks-pattern|20-knowledge/frontend-conventions/mutation-hooks-pattern.md]]
— one `use<Entity>Mutations.ts` per entity, living in `src/mutations/`.

- [ ] `src/hooks/useInventoryMutations.ts` lives in `src/hooks/` instead of `src/mutations/` (historical
  inconsistency, not a different valid pattern — see
  [[../10-architecture/best-practices|10-architecture/best-practices.md]]). Low priority: moving it is
  a pure rename/relocation with no behavior change, worth doing opportunistically rather than urgently.

Parent: [[index|50-todo/]].
