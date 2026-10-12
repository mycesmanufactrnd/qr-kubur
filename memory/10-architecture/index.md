# 10-architecture - Folder Index

How QubuR is **built**. Written from the code and from `markdown_files/FULL_ARCHITECTURE.md` on
2026-10-12. Everything here was verified in the source; what could not be verified is listed under
[[../40-questions/unanswered/index|40-questions/unanswered/]].

Read [[overview]] first. Load-first files are in [[critical|critical.md]].

| File | Contents |
|---|---|
| [[overview]] | What QubuR is, the pieces (React frontend / Fastify+tRPC backend / Postgres / Capacitor mobile), how they talk, the legacy base44/supabase status, scale. Start here. |
| [[project-structure]] | What every top-level and `src/`/`backend/src/` subfolder is, live vs dead. |
| [[backend-patterns]] | JWT auth + role-gated tRPC procedures, router/schema pairing, file upload/download (REST, outside tRPC), payments, PM2 cluster. |
| [[frontend-patterns]] | **The mutation-hooks convention** — one `use<Entity>Mutations.ts` file per backend entity, the exact shape, the rules it implies. The tRPC client setup. Real vs legacy auth. i18n rule pointer. |
| [[entity-system]] | TypeORM entities as schema (`DATABASE_SYNC=true`), column conventions, and the encrypted-at-rest PII columns already in the codebase. |
| [[development-workflow]] | Docker/dev commands, Capacitor/APK build, PM2, backups, monitoring doc pointers, flow runbooks, test tooling. |
| [[best-practices]] | Pitfalls: misplaced mutations file, i18n three-file rule, `DATABASE_SYNC` data-loss risk, adding PII columns without encryption, the `FIELD_ENCRYPTION_KEY` disaster-recovery risk, unconfirmed Stripe/PayPal wiring. |

Parent: [[../index|memory root]].
