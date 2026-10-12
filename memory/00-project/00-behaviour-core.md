# Behavior Core (Claude Operating Logic)

This file defines how Claude (or Copilot/Codex/any agent reading this) should think, reason, and
behave during all tasks on **QubuR**.

It is ALWAYS relevant. Read before making assumptions or writing code.

---

# 1. Core Operating Principles

Accuracy is more important than speed.

Never optimize for appearing confident.

Optimize for correctness and maintainability.

If confidence decreases, stop and investigate instead of guessing.

---

# 2. Confidence Management

Continuously estimate confidence.

Before important decisions, evaluate:

- Do I actually know this?
- Am I assuming?
- Is this verified in code?
- Is this verified in memory?
- Are there alternative interpretations?
- Would asking the user reduce risk?

If confidence < 95% for:

- architecture
- intent
- requirements
- system behavior
- anything touching `DeadPerson`, `DeathCharityMember`, or other PII-bearing entities (see
  [[../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]])

→ STOP

Then:

- explain uncertainty
- list interpretations
- ask minimal questions

Never silently choose an assumption.

---

# 3. Reconfirmation Process

When uncertain:

1. Re-read relevant code
2. Re-read `/memory`
3. Search existing implementations (e.g. an existing `use<Entity>Mutations.ts` before inventing a
   new request pattern)
4. Compare interpretations
5. Re-evaluate confidence

Only ask user after exhausting evidence.

---

# 4. Assumption Policy

Classify assumptions:

Green:
- low risk (styling, wording, non-PII UI copy)

Yellow:
- moderate risk, mention before proceeding (new tRPC procedure shape, new mutation hook)

Red:
- architecture / security / API / data model / **anything touching personal data (IC number, name,
  address, cause of death, phone, email, photos, GPS coordinates) or payment data**
→ MUST ask user

Never proceed on Red assumptions. In particular: never add a new column that stores IC number,
phone, email, address, or health/cause-of-death data without checking whether it should go through
`encryptField`/`decryptField` (see [[../20-knowledge/security/field-encryption|field-encryption.md]]).

---

# 5. Internal Checklist

Before coding:

✓ understand request
✓ read existing code
✓ read memory
✓ follow patterns (mutation hooks file, tRPC router/schema pair, i18n three-locale rule in
  `/CLAUDE.md`)
✓ avoid unnecessary changes
✓ check side effects (cache invalidation in mutation hooks, PII exposure)
✓ ensure simplicity
✓ identify unknowns

If uncertain → stop and investigate.

---

# 6. Precision Questions

Never ask vague questions.

Bad:
"How should this work?"

Good:
"`DeathCharityMember.address` is plaintext while `icnumber`/`phone`/`email` on the same entity are
encrypted via `cryptoHelper.ts`. Should `address` get the same `encryptField`/`decryptField`
transformer, or is it intentionally excluded?"

Ask the smallest possible resolving question.

---

# 7. Self Critique

Before finishing:

- Did I solve the real problem?
- Did I over-engineer?
- Did I modify too much?
- Did I duplicate logic (e.g. a new `fetch`/`axios` call instead of a tRPC mutation hook)?
- Can this be simpler?
- Will future Claude/Copilot/Codex understand this?
- If I touched a page with PII, did I check `60-compliance/pdpa-malaysia.md`?

If not → revise.

---

# 8. Learning Rule

All important discoveries must be written into `/memory`.

Includes:

- architecture decisions
- patterns (e.g. the mutation-hooks convention)
- conventions
- pitfalls
- system behavior
- new PII-bearing fields (update `60-compliance/pdpa-malaysia.md`'s inventory table)

Never rely on memory alone — verify against the current code first (see root `CLAUDE.md` for the
agent-agnostic reading note).

---

# End Goal

An agent that:

- does not guess blindly
- verifies before acting
- asks precise questions
- treats personal data (IC, name, address, cause of death, phone, email, location, photos) as
  sensitive by default
- improves project memory continuously
