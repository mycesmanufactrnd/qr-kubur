# Entities (Generated)

**Generated from `backend/src/db/entities/` on 2026-10-12. Regenerate rather than hand-edit.** 53
entity files total.

## Flat (`backend/src/db/entities/*.entity.ts`)

ActivityLog · ActivityPosts · DeadPerson · Donation · FamilyTree · Grave · GraveBlock · GraveSlot ·
HeritageSite · IslamicEvent · JenazahCase · KariahDeathNotification · Mosque ·
MosqueOrganisationChart · OnlineTransaction · OnlineTransactionAccount · Organisation ·
OrganisationPaymentConfig · OrganisationType · PaymentField · PaymentPlatform · Permission ·
Quotation · RunningNo · ServiceOffered · StoredFile · Suggestion · TahfizCenter ·
TahfizPaymentConfig · TahlilRequest · TempOrganisation · User · VisitLog · WaqfProject

## Grouped subfolders

| Subfolder | Entities (confirmed) |
|---|---|
| `DeathCharity/` | `DeathCharity`, `DeathCharityMember`, `DeathCharityDependent`, `DeathCharityClaim`, `DeathCharityPayment` |
| `FirebaseReceiver/` | `KariahDevice` |
| `GoogleUser/` | `GoogleUser` |
| `Inventory/` | Inventory item/package/transaction/audit entities backing `inventoryItemRouter`/`inventoryPackageRouter`/`inventoryTransactionRouter`/`inventoryAuditRouter` — not individually enumerated in this pass, see the folder directly |
| `CollectionTree/` | Backing `collectionTreeRouter` — not individually enumerated in this pass, see the folder directly |
| `ExtendsEntity/` | `AuditableEntity` — base class with audit columns, extended by e.g. `DeathCharityMember` |

## PII-bearing entities (cross-reference)

For which of these store personal data and which columns are encrypted, see
[[../10-architecture/entity-system|10-architecture/entity-system.md]] and
[[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]. Entities confirmed to carry IC
number, phone, email, address, or similar: `DeadPerson`, `DeathCharityMember`,
`DeathCharityDependent`, `KariahDevice`, `User`, `Quotation`, `TahlilRequest`, `Donation`,
`Suggestion`, `MosqueOrganisationChart`, `TempOrganisation`.

Parent: [[index|90-reference/]].
