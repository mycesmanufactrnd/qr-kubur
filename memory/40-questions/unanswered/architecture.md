# Architecture — Unanswered Questions

## Q-ARCH-01: Is `src/lib/AuthContext.jsx` (base44-backed auth) actually live anywhere?

**Priority: important** (not blocking — the confirmed-live JWT/tRPC auth system is sufficient for
normal feature work; this only matters if you're about to touch `ProtectedRoute.jsx`,
`GoogleSignInDialog.jsx`, or the Settings/FamilyTree pages that import `useAuth()`).

**What was checked**: `AuthContext.jsx` exports `AuthProvider`/`useAuth()` wrapping the base44 SDK.
Five files import `useAuth` from it (`ProtectedRoute.jsx`, `GoogleSignInDialog.jsx`,
`SettingsPage.jsx` ×2 (web+mobile), `FamilyTree.jsx`). A repo-wide grep for `<AuthProvider` (JSX
usage, not the import) found **zero matches** in `src/`, including `App.jsx` and `main.jsx`.

**Why the code can't answer it**: either (a) `AuthProvider` really is never mounted and those five
files are dead/broken code paths, (b) it's mounted somewhere this survey didn't check (a dynamically
rendered layout, a HOC, or inside `pages.config.js`'s per-page composition), or (c) React's
`createContext()` default (here, `undefined`) combined with some other guard prevents the throw in
practice and these components silently no-op.

**Interpretations**:
1. Dead code — base44 auth was fully replaced by the JWT/tRPC system and these 5 files just weren't
   cleaned up. Safe to leave alone, but don't copy their pattern into new code, and consider deleting
   in a future cleanup pass.
2. Still wired somewhere not found — needs the person who built it to point at where `AuthProvider`
   actually mounts.
3. Genuinely broken (throws at runtime when those components render) — worth a real bug report if so.

**Answer here when resolved**, then fold into
[[../../20-knowledge/legacy/base44-and-supabase-status|20-knowledge/legacy/base44-and-supabase-status.md]]
and delete this entry per the lifecycle in [[../index|40-questions/index.md]].

---

## Q-ARCH-02: Are Stripe/PayPal payment flows actually wired up, or just scaffolded?

**Priority: background**

**What was checked**: `backend/src/config/stripe.config.ts` and `paypal.config.ts` exist, and
`@stripe/react-stripe-js`/`@stripe/stripe-js` are frontend dependencies. `markdown_files/FULL_ARCHITECTURE.md`
only lists ToyyibPay and Billplz as confirmed-live payment integrations (its component table and
request-flow diagram don't mention Stripe/PayPal at all).

**Why the code can't answer it**: a config file existing doesn't confirm a live, called code path —
would need to trace every router that might call into Stripe/PayPal config, which wasn't done in this
survey.

**Interpretations**: (1) legacy/unused scaffolding from an earlier payment-provider experiment, (2)
a payment method in progress, not yet documented in `FULL_ARCHITECTURE.md`, (3) actually live and the
architecture doc is just stale.

Answer here when resolved, then fold into [[../../10-architecture/backend-patterns|10-architecture/backend-patterns.md]].
