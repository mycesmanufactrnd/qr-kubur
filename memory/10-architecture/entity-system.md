# Entity System

TypeORM entities are the schema, same model as MyCES FMS.

- `backend/src/datasource.ts`: `synchronize: process.env.DATABASE_SYNC === "true"`. **Note the exact
  env var name is `DATABASE_SYNC`** (not `DB_SYNC`) — check `.env`/`.env.dev` before assuming.
- `backend/src/db/entities.ts` re-exports every entity class; `datasource.ts` passes
  `Object.values(entities)` to TypeORM.
- **53 entity files**, mostly flat under `backend/src/db/entities/`, with a few grouped into
  subfolders for multi-entity domains: `DeathCharity/` (member, dependent, claim, payment),
  `Inventory/`, `CollectionTree/`, `FirebaseReceiver/` (`KariahDevice`), `GoogleUser/`,
  `ExtendsEntity/` (`AuditableEntity` base class — adds created/updated audit columns, extended by
  e.g. `DeathCharityMember`).
- **Only one hand-written migration exists** (`backend/src/db/migrations/`). Schema changes are made
  by editing the entity class and letting `synchronize` apply them — same caveat as MyCES FMS:
  verify in a dev/staging DB before assuming a column rename or type change is safe, since
  `synchronize` can silently drop/recreate columns with data loss if TypeORM decides it must.

## Column conventions observed

- Lowercase, no-underscore column names (`icnumber`, `dateofbirth`, `causeofdeath`,
  `deathconfirmationphotourl`) — follow this for new columns, don't introduce `snake_case` or
  `camelCase` DB columns inconsistently.
- `@CreateDateColumn({ name: "createdat" })` / similar explicit `name:` overrides are used to keep
  the lowercase convention since TypeORM's default would be `createdAt`.
- Soft relations are sometimes commented out rather than deleted (see `VisitLog.entity.ts`'s
  commented `@ManyToOne` to `Grave`/`DeadPerson`) — check git history/author intent before
  "cleaning up" a commented decorator; it may be an intentionally deferred FK.

## Encrypted-at-rest columns — PDPA-driven, already in the codebase

Several entities use a TypeORM column `transformer` pair (`to`/`from`) backed by
`backend/src/helpers/cryptoHelper.ts`'s `encryptField`/`decryptField` (AES-256-GCM), plus a
companion `*hash` column (via `hashForSearch`, HMAC-SHA256) for exact-match search since the
encrypted value is non-deterministic and can't be used in `WHERE`:

| Entity | Encrypted columns | Hash column |
|---|---|---|
| `DeadPerson` | `icnumber`, `causeofdeath` | `icnumberhash` |
| `DeathCharityMember` | `icnumber`, `phone`, `email`, `address` | `icnumberhash` |
| `Quotation` | `payerphone`, `payeremail` (per `backfillPdpaEncryption.ts`) | — |
| `TahlilRequest` | `requestorphoneno`, `requestoremail` (per backfill script) | — |
| `Donation` | `donorphoneno`, `donoremail` (per backfill script) | — |

**This is not fully applied across every PII-bearing entity** — see
[[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] for the inventory of what's
encrypted vs. plaintext, and [[../20-knowledge/security/field-encryption|20-knowledge/security/field-encryption.md]]
for how to add the pattern to a new column.

Related: [[overview]] · [[backend-patterns]] · [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]
