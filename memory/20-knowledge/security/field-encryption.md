# Field-Level Encryption (`backend/src/helpers/cryptoHelper.ts`)

How to protect a personal-data column at rest, following the pattern already used on
`DeadPerson.icnumber`/`causeofdeath` and `DeathCharityMember.icnumber`/`phone`/`email`/`address`.

## The three functions

- `encryptField(plainText: string): string` — AES-256-GCM, random IV per call, returns
  `"enc:v1:" + base64(iv + authTag + ciphertext)`. **Non-deterministic** — never usable in a
  `WHERE` clause directly.
- `decryptField(value: string): string` — reverses it. Values that don't start with `enc:v1:` are
  returned unchanged (handles legacy plaintext rows gracefully instead of throwing).
- `hashForSearch(value: string): string` — deterministic HMAC-SHA256 of the plaintext, for exact-match
  lookups on an encrypted column (`WHERE xhash = hashForSearch(input)`). **Not reversible.**

Key: `FIELD_ENCRYPTION_KEY` env var (64-char hex = raw 32 bytes, or any string hashed via SHA-256 to
derive 32 bytes). One key for every encrypted column — see the disaster-recovery note in
[[../../10-architecture/best-practices|10-architecture/best-practices.md]].

## Adding encryption to a new column

1. On the entity, give the column a `transformer`:
   ```ts
   @Column("varchar", {
     length: 255,
     nullable: true,
     transformer: {
       to: (value?: string | null) => (value ? encryptField(value) : value),
       from: (value?: string | null) => (value ? decryptField(value) : value),
     },
   })
   myField?: string | null;
   ```
2. **Only add a companion `myfieldhash` column + `@BeforeInsert()`/`@BeforeUpdate()` hook if the app
   needs exact-match search/filter on that field** (like `icnumber` does, for the IC-number search
   filter in `useGetDeadPersonPaginated`). If it's never queried by exact match (like
   `causeofdeath`), skip the hash column — see the comment on `DeadPerson.causeofdeath` in the
   entity file.
3. **Existing rows**: write a one-off backfill script modeled on
   `backend/src/db/scripts/backfillPdpaEncryption.ts` — it's idempotent (skips values already
   prefixed `enc:v1:`) and safe to re-run.
4. Update [[../../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]]'s field inventory
   table in the same change (per the learning rule in `00-project/00-behaviour-core.md`).

## What's NOT encrypted today (known gap, not yet a decision)

`DeadPerson.name`, `heirname`, `heirphoneno`, `biography`, lat/long, and all three case-document photo
URL columns; `JenazahCase.details` (jsonb, likely contains similar fields); `VisitLog.visitorip` /
`Suggestion.visitorip`. See the full gap list and whether each is worth encrypting in
[[../../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] and
[[../../50-todo/pdpa-gaps|50-todo/pdpa-gaps.md]].
