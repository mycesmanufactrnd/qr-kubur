# tRPC Routers (Generated)

**Generated from `backend/src/routers/` on 2026-10-12. Regenerate rather than hand-edit** (`ls
backend/src/routers`). Each one is registered as a sub-router in `appRouter.ts` and has a matching
frontend `src/mutations/use<Entity>Mutations.ts` (or the shared `src/hooks/useInventoryMutations.ts`
for the inventory group) per the convention in
[[../10-architecture/frontend-patterns|10-architecture/frontend-patterns.md]].

activityLogsRouter · activityPostRouter · authRouter · billplzRouter · collectionTreeRouter ·
dashboardRouter · deadpersonRouter · deathCharityClaimRouter · deathCharityMemberRouter ·
deathCharityPaymentRouter · deathCharityRouter · donationRouter · familyTreeRouter ·
financialReportRouter · googleRouter · graveMappingRouter · graveRouter · heritageRouter ·
inventoryAuditRouter · inventoryItemRouter · inventoryPackageRouter · inventoryTransactionRouter ·
islamicEventRouter · jenazahCaseRouter · kariahDeviceRouter · kariahNotificationRouter ·
mosqueOrganisationChartRouter · mosqueRouter · ollamaRouter · organisationPaymentConfigRouter ·
organisationRouter · organisationTypeRouter · paymentDistributionRouter · paymentFieldRouter ·
paymentPlatformRouter · permissionRouter · publicRouter · quotationRouter ·
reusableItemGroupRouter · runningNoRouter · suggestionRouter · surahRouter ·
tahfizPaymentConfigRouter · tahfizRouter · tahlilRequestRouter · tempOrganisationRouter ·
toyyibPayRouter · usersRouter · visitLogsRouter · waqfProjectRouter

`publicProcedure` (no auth) is used across **33 of the 51 routers**, not just `publicRouter` (which
itself only exposes `getClientIp`). The QR grave-lookup flow's actual public endpoints are
`deadpersonRouter.getDeadPersonById` / `getDeadPersonByGraveId` and `graveRouter.getGraveById` /
`getGraveByCoordinates` — **confirmed to return the full `DeadPerson` entity with no field
selection**, which includes the decrypted `icnumber` and `causeofdeath` (the TypeORM transformer
decrypts on read regardless of caller). See the confirmed finding in
[[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] before changing or extending any
`publicProcedure` on a PII-bearing router.

Parent: [[index|90-reference/]].
