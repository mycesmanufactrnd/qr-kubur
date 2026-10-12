# base44 and supabase — what's actually live

Verified by reading the code, not guessed.

## `supabase/` — dead

`supabase/.branches/_current_branch` and `supabase/.temp/cli-latest` only — Supabase CLI local-state
files, no migrations, no config referencing a real project. `grep -r "supabase" src backend` (excluding
node_modules) found **zero** references. The README's "Architecture (no Supabase)" is accurate. Safe
to treat as leftover from an earlier CLI `supabase init`/`supabase link`, not part of the running
system.

## `base44/` and `src/api/*` — partially live, auth path looks orphaned

- `base44/.app.jsonc`, `base44/config.jsonc` — Base44 project scaffold config.
- `src/api/base44Client.js` — creates a base44 SDK client (`requiresAuth: false`) from
  `src/lib/app-params.js`.
- `src/api/entities.js` — re-exports `base44.entities.Query` and `base44.auth` as `User`. **Nothing
  in the repo was found importing from `src/api/entities.js`** during this survey.
- `src/api/integrations.js` — re-exports `base44.integrations.Core.*` (`InvokeLLM`, `SendEmail`,
  `SendSMS`, `UploadFile`, `GenerateImage`, `ExtractDataFromUploadedFile`). Usage not confirmed in
  this survey — the backend has its own `ollama/` integration for LLM calls, which may have
  superseded `InvokeLLM`.
- `src/lib/AuthContext.jsx` — a full `AuthProvider`/`useAuth()` context wrapping `base44.auth`
  (`checkAppState`, `checkUserAuth`, `logout`, `navigateToLogin`). **Imported by**
  `src/components/GoogleSignInDialog.jsx`, `src/components/ProtectedRoute.jsx`,
  `src/pages/Mobile/SettingsPage.jsx`, `src/pages/SettingsPage.jsx`,
  `src/pages/User/FamilyTree.jsx` — so the import is real.
- **However, no `<AuthProvider>` JSX usage was found anywhere in `src/`** (checked `App.jsx`,
  `main.jsx`, `Layout.jsx`, and a repo-wide grep for `<AuthProvider`). If `AuthProvider` is genuinely
  never mounted, every `useAuth()` call in the files above would throw
  `"useAuth must be used within an AuthProvider"` at runtime — which would make
  `ProtectedRoute`/`GoogleSignInDialog`/those settings pages broken or dead code paths.

## Why this matters

The **confirmed-live** auth system is JWT + tRPC (`backend/src/auth.ts`, `backend/src/trpc.ts`,
`src/utils/auth.js`) — see [[../../10-architecture/backend-patterns|10-architecture/backend-patterns.md]]
and [[../../10-architecture/frontend-patterns|10-architecture/frontend-patterns.md]]. Until the
`AuthProvider`-mounting question is resolved, **do not use `AuthContext.jsx`/`ProtectedRoute.jsx` as
a reference for new code**, and don't assume `src/api/entities.js`/`integrations.js` are dead without
checking current usage again (a dynamic import or a file outside `src/` evaluated by this survey could
exist).

Open question tracked in [[../../40-questions/unanswered/architecture|40-questions/unanswered/architecture.md]].
