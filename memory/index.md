# Memory Root Index

High-level map of `/memory` for **QubuR**. This describes what each folder is responsible for — not
individual files. To find a specific file, open that folder's own `index.md`.

The rules this system runs on live in [CLAUDE.md](../CLAUDE.md).

## Folders

- **[[00-project/index|00-project/]]** -> How any agent (Claude, Copilot, Codex, ...) must operate on
  this project (behaviour, confidence, assumption policy — personal data is always Red). Read first,
  always.
- **[[10-architecture/index|10-architecture/]]** -> How the system is **built**: React frontend +
  Fastify/tRPC backend + Postgres, the mutation-hooks request convention, TypeORM entities, dev
  workflow, pitfalls. Written from the code on 2026-10-12.
- **[[20-knowledge/index|20-knowledge/]]** -> What was **learned building and operating it**: the
  mutation-hooks copy-paste template, field-level encryption how-to, and the legacy base44/supabase
  status.
- **[[40-questions/index|40-questions/]]** -> **Questions for you.** Things the code cannot answer,
  parked instead of guessed — e.g. whether the base44 `AuthContext` path is actually mounted anywhere.
- **[[50-todo/index|50-todo/]]** -> Tracked work items: the PDPA remediation gaps, and frontend
  consistency gaps (admin pages missing a mobile view, a misplaced mutations file).
- **[[60-compliance/index|60-compliance/]]** -> **Why this matters**: QubuR stores IC numbers, names,
  addresses, phone/email, and cause of death. Malaysia's PDPA (Act 709) mapped to what's actually
  implemented — field encryption, the shipped Privacy Policy page, and a confirmed finding that two
  public (unauthenticated) tRPC procedures currently return decrypted IC number and cause of death.
  Not legal advice.
- **[[90-reference/index|90-reference/]]** -> **Generated** lookup tables: all 51 tRPC routers, all
  53 entities. Regenerate rather than hand-edit.

## Retrieval flow

1. Read `00-project/00-behaviour-core.md`
2. Read `00-project/critical.md`
3. Use THIS index to locate the right folder
4. Use `<folder>/index.md` to locate the right file
5. Use `<folder>/critical.md` for what must not be missed, then read the actual `.md`

## Open questions

Live in **[[40-questions/unanswered/index|40-questions/unanswered/]]**. Currently: whether the
legacy base44 `AuthContext`/`ProtectedRoute` path is mounted anywhere (Q-ARCH-01), and whether
Stripe/PayPal config is actually wired up (Q-ARCH-02). Answer in place; an answered question moves to
[[40-questions/answered/index|answered/]], gets folded into the real store, then deleted.

## Highest-value thing to read if you're new here

If the task touches `DeadPerson`, `DeathCharityMember`, or any personal-data field: read
[[60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] first, in full — it includes a
confirmed, unfixed data-exposure finding (public endpoints returning decrypted IC number and cause of
death), not just general compliance background.
