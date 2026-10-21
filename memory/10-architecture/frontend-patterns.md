# Frontend Patterns (`src/`)

Vite + React 18 + React Router + TanStack Query (via tRPC's React bindings) + Radix/shadcn UI +
Tailwind.

## The core convention: every backend request goes through a mutation-hooks file

**This is the single most important frontend pattern in this repo. Never call `trpc.*` directly
from inside a page/component body, and never add a raw `fetch`/`axios` call for app data. Put it in
a `use<Entity>Mutations.ts` hook file.**

### Where it lives

- `src/mutations/use<Entity>Mutations.ts` — **27 of the 28 files**, one per domain entity
  (`useDeadPersonMutations.ts`, `useGraveMutations.ts`, `useDonationMutations.ts`, etc.).
- `src/hooks/useInventoryMutations.ts` — the one outlier, living in `hooks/` instead of
  `mutations/`. Historical inconsistency, not a different pattern — see [[best-practices]]. New
  inventory-domain hooks should still go in this same file (it covers `inventoryItem`,
  `reusableItemGroup`, `inventoryPackage`, `inventoryTransaction`, `inventoryAudit` — multiple
  sub-domains in one file because they're tightly related).

### The shape (from `useDeadPersonMutations.ts`, confirmed consistent across files)

```ts
import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

// 1. Paginated/list query hooks — thin wrappers over trpc.*.useQuery
export function useGetDeadPersonPaginated({ page, pageSize, filterName, ... }) {
  const { data, isLoading, refetch, error } = trpc.deadperson.getPaginated.useQuery({ ... });
  const deadPersonsList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(deadPersonsList.total / (pageSize ?? 10));
  return { deadPersonsList, totalPages, isLoading, refetch, error };
}

// 2. One combined mutations hook per entity
export function useDeadPersonMutations() {
  const trpcUtils = trpc.useUtils();

  // Invalidate every query this entity's writes can affect — including OTHER
  // entities' queries when there's a real relationship (here: grave mapping).
  const invalidateAll = () => {
    trpcUtils.deadperson.getPaginated.invalidate();
    trpcUtils.deadperson.getDeadPersonByGraveId.invalidate();
    trpcUtils.graveMapping.getBlocksByGrave.invalidate();
    trpcUtils.graveMapping.getSlotOptionsByGrave.invalidate();
  };

  const createDeadPerson = trpc.deadperson.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });
  const updateDeadPerson = trpc.deadperson.update.useMutation({ /* same shape */ });
  const deleteDeadPerson = trpc.deadperson.delete.useMutation({ /* same shape */ });
  const bulkDeleteDeadPersons = trpc.deadperson.bulkDelete.useMutation({ /* same shape */ });

  return { createDeadPerson, updateDeadPerson, deleteDeadPerson, bulkDeleteDeadPersons };
}
```

### The rules this implies

1. **One tRPC router per entity on the backend ↔ one mutations file per entity on the frontend.**
   The router name (`trpc.deadperson.*`) matches the backend `routers/deadpersonRouter.ts`
   registration key in `appRouter.ts`.
2. **Every mutation gets `onSuccess` (toast + invalidate) and `onError` (toast).** Use
   `showSuccess(titleMessage, 'create'|'update'|'delete')` and `showApiError(err)` from
   `@/components/ToastrNotification` — don't roll your own toast call or swallow errors silently.
3. **`invalidateAll()` is the single source of truth for cache invalidation for that entity**,
   defined once per mutations hook and called from every mutation's `onSuccess`. When a write can
   affect another entity's cached queries (e.g. deleting a `DeadPerson` affects grave-slot
   availability), invalidate that entity's queries too, in the same `invalidateAll()`.
4. **Query hooks gate on access where relevant** via `useAdminAccess()` from `@/utils/auth`
   (`{ enabled: hasAdminAccess }`) — see `useInventoryMutations.ts` for the pattern — rather than
   conditionally rendering the whole component tree.
5. **Components call the hook, never `trpc` directly.** A page does
   `const { createDeadPerson } = useDeadPersonMutations()` then
   `createDeadPerson.mutate(payload)` — it never imports `trpc` itself.

A full copy-paste template for adding a new entity's mutations file is in
[[../20-knowledge/frontend-conventions/mutation-hooks-pattern|20-knowledge/frontend-conventions/mutation-hooks-pattern.md]].

## The tRPC client (`src/utils/trpc.ts`)

- `createTRPCReact<AppRouter>()` — typed against the **backend's** `AppRouter` type via a relative
  import (`../../backend/src/routers/appRouter`). This is why the frontend needs the backend
  source present (monorepo-style type sharing, not a published package).
- Auth header: reads `accessToken` from `sessionStorage` then `localStorage`, sends as
  `Authorization: Bearer <token>`.
- **Native (Capacitor) vs web split**: web uses a relative `/trpc` URL (same-origin, reverse-proxied);
  native builds bundle their own `dist/` (for push notifications to work fully natively) so there's
  no same-origin backend — native hits `${VITE_API_BASE_URL}/trpc` directly. See the comment in
  `trpc.ts` before changing this.
- `splitLink` with a `skipBatch` context flag lets individual calls opt out of request batching.

## Auth on the frontend — `src/utils/auth.js` is the real one

`useAdminAccess()`, `useLoginGoogle()`, `handleLoginTRPC()`, biometric login (`useBiometricLoginTRPC`,
via `@capgo/capacitor-native-biometric`) — this file is the live auth logic, paired with the backend
JWT system in [[backend-patterns]]. **`src/lib/AuthContext.jsx` (`useAuth()`, base44-backed) is a
separate, likely-legacy path** — see [[overview#legacy--half-migrated-pieces]] and
[[../20-knowledge/legacy/base44-and-supabase-status|20-knowledge/legacy/base44-and-supabase-status.md]].
Don't copy patterns from `AuthContext.jsx`/`ProtectedRoute.jsx` into new code without checking that
question first.

## Admin pages need a mobile view too

New `src/pages/Management/ManageX.jsx` pages are expected to ship a
`src/pages/Mobile/ManageX.jsx` card-list counterpart, switched in via `useIsNarrow()` (not
`useIsMobile()` — that's a different hook used elsewhere). Several existing pages still lack this.
See [[../20-knowledge/frontend-conventions/admin-mobile-pattern|20-knowledge/frontend-conventions/admin-mobile-pattern.md]]
for the exact shape, confirmed examples, and the current coverage gap.

## i18n — mandatory, enforced by root `CLAUDE.md`

All user-facing text goes through `translate("...")` from `@/utils/translations`. Every new key must
be added to **all three** of `src/i18n/en.json`, `src/i18n/ms.json`, `src/i18n/ar.json` with real
translations (not copies) in the same change. This rule lives in the repo's `CLAUDE.md`, not
duplicated here — see it for the exact wording.

Related: [[overview]] · [[backend-patterns]] · [[../20-knowledge/frontend-conventions/mutation-hooks-pattern|mutation-hooks-pattern.md]] · [[../20-knowledge/frontend-conventions/admin-mobile-pattern|admin-mobile-pattern.md]]
