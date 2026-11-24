# 50-todo - Folder Index

The task list, split by category. Started minimal — add more files here as real, tracked work items
surface (per the same anti-duplication discipline as the rest of this memory system: a todo item
lives here once, gets deleted once done).

- **[[pdpa-gaps|pdpa-gaps.md]]** -> Concrete, code-verified gaps between PDPA's Security/Retention
  principles and the current implementation (unencrypted PII fields, no retention policy, no
  self-service data-subject-request flow). Each item needs a decision before being worked on.
- **[[frontend-consistency-gaps|frontend-consistency-gaps.md]]** -> Admin pages still missing the
  mobile (`useIsNarrow`) view, the one misplaced mutations file, and the phased rollout of the
  mutation-hooks pattern to pages still calling `trpc.*` directly (Jenazah Case / Dead Person domain
  done, others outstanding) — existing conventions not yet applied everywhere.
- **[[ahli-kariah-module|ahli-kariah-module.md]]** -> Ahli Kariah leftovers after the 2026-11-24
  user-side build: server-side staff org-scoping (separate change), kariah PII gaps, a missing
  locale key, and the orphan `qariah*` tables.

Parent: [[../index|memory root]].
