# 40-questions - Folder Index

Questions the code cannot answer, parked instead of guessed.

- **[[unanswered/index|unanswered/]]** -> Open, by category.
- **[[answered/index|answered/]]** -> A consumable queue — each answer is folded into the real memory
  store, then the file is deleted.

## Lifecycle

1. Question arises during work; code/memory checked and can't resolve it → written to
   `unanswered/<category>.md` with what was checked, why it's unresolved, and the interpretations.
2. If it's `blocking` for the task at hand, ask the user immediately rather than parking it.
3. When answered: move to `answered/` as its own file with the answer + date + delete criteria, fold
   the fact into the real store (`10-architecture/`, `20-knowledge/`, `50-todo/`), update every index
   touched in the same edit, then delete the `answered/` file once absorbed.

Parent: [[../index|memory root]].
