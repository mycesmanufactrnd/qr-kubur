# CLAUDE.md

This project uses a structured memory system in `/memory`, for Claude, Copilot, Codex, or any other
coding agent working on this repo to read.

Memory is NOT documentation dumping. It is a **retrieval-based knowledge system**.

Any new thing you learn can be documented if you think it's suitable. Make it short, no need for
lengthy elaboration.

> **Start at [memory/index.md](memory/index.md).** It was first built 2026-10-12 by reading the
> actual code (`src/`, `backend/`) plus the existing `markdown_files/FULL_ARCHITECTURE.md`. Say
> **"generate knowledge graph"** to reconcile it against the code after it drifts — see section 14.

---

# QubuR Architecture Memory

**QubuR** — a grave/mosque/death-management platform for Malaysian kariah communities (grave mapping,
deceased records, death-charity mutual aid, tahlil requests, donations, waqf, inventory, payments).
Confirmed layout:

| Folder | What it is |
|---|---|
| `src/` | React 18 + Vite frontend. Every backend call goes through a `use<Entity>Mutations.ts` file in `src/mutations/` — see `memory/10-architecture/frontend-patterns.md`. |
| `backend/` | Fastify + tRPC 11 + TypeORM 0.3 API, own `package.json`. JWT auth (`backend/src/auth.ts`), role-gated procedures. |
| `capacitor/` | Capacitor Android wrapper (Google Play), bundles its own `dist/`. |
| `markdown_files/`, `flow/` | Hand-written ops/architecture docs and flow runbooks — authoritative, linked from `/memory` rather than duplicated. |
| `base44/`, `src/api/*`, `src/lib/AuthContext.jsx` | Legacy Base44 scaffold. Partially orphaned — see `memory/20-knowledge/legacy/base44-and-supabase-status.md` and the open question in `memory/40-questions/unanswered/architecture.md`. |
| `supabase/` | Dead — CLI metadata only, no code references it. |

**This system stores IC numbers, names, addresses, phone/email, and cause of death**
(`DeadPerson`, `DeathCharityMember`). Malaysia's PDPA (Act 709) applies — read
`memory/60-compliance/pdpa-malaysia.md` before touching any personal-data field or endpoint. It
includes a confirmed, unfixed finding: two public (unauthenticated) tRPC procedures currently return
decrypted IC number and cause of death.

Everything still unanswered lives in
[memory/40-questions/unanswered/](memory/40-questions/unanswered/index.md). **Blocking questions get
asked, not parked** — see section 6.1.

# Required Always-Read Files

Before working, any agent must read:

- `/memory/00-project/00-behaviour-core.md`
- `/memory/00-project/critical.md`
- `/memory/60-compliance/pdpa-malaysia.md` if the task touches personal data

This project's architecture is defined in `/memory/10-architecture/` (start at `overview.md`;
`critical.md` lists the load-first subset).

# =========================
# 1. CORE OPERATING PRINCIPLES
# =========================

Accuracy is more important than speed.

Never optimize for appearing confident.

Optimize for producing correct and maintainable work.

If confidence decreases, stop and investigate rather than continue guessing.

---

# =========================
# 2. CONFIDENCE MANAGEMENT
# =========================

Continuously estimate confidence during work.

Before important decisions, evaluate:

- Do I actually know this?
- Am I assuming anything?
- Is this verified in code?
- Is this verified in `/memory`?
- Are there alternative interpretations?
- Would asking the user prevent mistakes?

If confidence < 95% on:

- architecture
- intent
- requirements
- system behavior
- anything touching personal data (IC number, name, address, phone, email, cause of death, photos,
  GPS coordinates)

→ STOP

Then:

- Explain what is uncertain
- List interpretations
- Ask minimal clarifying questions

Never silently choose an interpretation.

---

# =========================
# 3. RECONFIRMATION PROCESS
# =========================

When uncertain:

1. Re-read relevant code
2. Re-read `/memory`
3. Search existing implementation (e.g. an existing `use<Entity>Mutations.ts` before inventing a new
   request pattern)
4. Compare interpretations
5. Re-estimate confidence

Only ask user after exhausting evidence.

---

# =========================
# 4. ASSUMPTION POLICY
# =========================

Classify assumptions:

Green:
- Low impact, easily reversible

Yellow:
- Medium impact, mention before proceeding

Red:
- Architecture, data, security, API contracts, **any field or endpoint touching personal data**
→ MUST ask user

Never proceed on Red assumptions without confirmation. In particular: never add a column storing IC
number, phone, email, address, or health-related data without checking whether it needs the
`encryptField`/`decryptField` pattern (`memory/20-knowledge/security/field-encryption.md`), and never
add or widen a `publicProcedure` on a PII-bearing router without checking
`memory/60-compliance/pdpa-malaysia.md` first.

---

# =========================
# 5. INTERNAL CHECKLIST
# =========================

Before writing code:

✓ Understand request
✓ Read existing code
✓ Read relevant `/memory` files
✓ Follow existing patterns — the mutation-hooks file convention, the i18n three-locale rule below
✓ Avoid unnecessary complexity
✓ Avoid unrelated modifications
✓ Check for side effects (cache invalidation, PII exposure)
✓ Consider simpler solutions
✓ Identify unknowns

If any uncertainty → investigate or ask.

---

# =========================
# 6. PRECISION QUESTIONS
# =========================

Never ask vague questions.

Bad:
"How should this work?"

Good:
"`DeathCharityMember.address` is encrypted via `cryptoHelper.ts` but `DeadPerson.heirphoneno` isn't.
Should the new field follow the encrypted pattern?"

Ask the smallest question that resolves ambiguity.

---

# =========================
# 6.1 BLOCKING QUESTIONS - ASK, ABSORB, PROCEED
# =========================

`/memory/40-questions/unanswered/` is split by category, and every question carries a **Priority**:
`blocking`, `important` or `background`.

**If a `blocking` question bears on the task in front of you, ask the user — in that turn, not at the
end.** Do not park it and carry on; do not guess; do not silently pick an interpretation.

The full loop, in order:

1. **Check** `/memory/40-questions/unanswered/` for a blocking question that touches this task.
2. **Ask it** — the smallest question that resolves it. Say what you already checked and why the
   code cannot answer it.
3. **Do the unblocked work while you wait.**
4. **When the answer comes, update the knowledge first, before writing code:**
   - move the question out of `unanswered/` into `answered/` as its own file, with the answer, its
     date and its delete criteria
   - fold the fact into the real store — `10-architecture/`, `20-knowledge/`, `50-todo/`,
     `60-compliance/`
   - update every index touched, in the same edit (section 12)
   - delete the `answered/` file once it is genuinely absorbed
5. **Then proceed with the job**, on the answer rather than on an assumption.

`important` and `background` questions do not stop anything. Note them, proceed, and ask when the
work actually reaches them.

---

# =========================
# 7. SELF CRITIQUE
# =========================

Before finishing:

- Did I solve the real request?
- Did I over-engineer?
- Did I modify too much?
- Did I duplicate existing logic (e.g. a raw `fetch`/`trpc` call instead of a mutation hook)?
- Can this be simpler?
- Will the next agent understand this?
- If I touched a PII-bearing field or a `publicProcedure`, did I check `60-compliance/pdpa-malaysia.md`?

If not → improve before responding.

---

# =========================
# 8. LEARNING RULE
# =========================

All useful discoveries must be written into `/memory`.

Includes:

- architecture
- patterns (e.g. a new entity's mutation-hooks file)
- decisions
- pitfalls
- conventions
- new PII-bearing fields (update `60-compliance/pdpa-malaysia.md`'s inventory)

Goal: never re-learn the same thing twice.

---
# =========================
# 9-13. MEMORY SYSTEM MECHANICS
# =========================

Memory is split into: detailed knowledge files, `critical.md` (load-first filenames only, no
explanations), folder-level `index.md` (what each file contains, used for navigation), and the root
`/memory/index.md` (what each folder is responsible for).

**No orphans.** Every `.md` is linked from its own folder's `index.md`. Every `index.md` is linked
from its parent's `index.md`, reaching the root. `critical.md` is linked from its own folder's
`index.md` (still filenames only — the link lives in the index). When moving or renaming a file,
update every inbound link in the same edit.

**Obsidian-compatible links**: the repo root is the vault root. Inside `/memory` use `[[note-name]]`
(no `.md` inside brackets). Across folders use a relative path with an alias:
`[[../pdpa-malaysia/index|compliance]]`. Never use a leading slash. Never put a `|` alias inside a
markdown table cell.

Writing rule: full explanation in a dedicated `.md` file → add to `critical.md` only if frequently
needed/easy to forget/critical for correctness → add an `index.md` entry if it helps navigation.
`critical.md` holds filenames only — no explanations, logs, examples, or summaries.

---

# =========================
# 14. "GENERATE KNOWLEDGE GRAPH"
# =========================

When the user says **"generate knowledge graph"**, it means: build or refresh `/memory` end to end,
following sections 9-13.

1. **Survey first, write nothing** — the stack, entry points, where data lives and who owns the
   schema, what's generated vs. hand-written, what's dead/legacy (like `base44/`, `supabase/`).
2. **Ask before assuming** — anything Red under section 4 the code doesn't answer. Collect questions,
   ask together, once, before writing.
3. **Write `/memory/10-architecture/`** — `overview.md`, `project-structure.md`,
   `backend-patterns.md`, `frontend-patterns.md`, `entity-system.md`, `development-workflow.md`,
   `best-practices.md`. Short, only what's verified in code.
4. **Wire the network** (section 12) — every file linked from its folder index, every index linked
   from its parent, reaching both `/index.md` (if one exists at repo root) and `/memory/index.md`.
5. **Verify, then report**: orphaned `.md` files must be 0, broken links must be 0, leading-slash
   links must be 0. Never report success you did not verify.

**Scope rules**: skip `node_modules`, `dist`/build output, `.git`, `capacitor/android` generated
build files. `20-knowledge/` grows lazily — a note is added the first time a real pitfall is learned,
not pre-populated. Never invent — anything unverified goes to open questions, not into memory.

**Refreshing later** is a reconcile, not a rewrite: keep what's still true, fix what drifted, delete
what's wrong, add what's missing, report the diff.

---

# Internationalization (i18n) — mandatory

All user-facing text must go through `translate("...")` from `@/utils/translations`.

Whenever you add or change a `translate("...")` call, add the exact same key to **all three** locale files, each with a real translation (not just copying the English string):

- `src/i18n/en.json`
- `src/i18n/ms.json`
- `src/i18n/ar.json`

Rules:
- The key (the English string passed to `translate()`) must match exactly across all three files.
- `en.json` value is normally the same as the key. `ms.json` and `ar.json` must contain actual Malay / Arabic translations, not the English text.
- Do this for every new `translate()` call in the same change — don't defer it or add it to only one file.
- Before finishing a task that touched UI copy, grep the new/changed `translate("...")` keys against all three `src/i18n/*.json` files to confirm none are missing.
