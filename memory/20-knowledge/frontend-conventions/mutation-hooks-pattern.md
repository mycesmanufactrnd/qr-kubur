# Mutation Hooks Pattern — copy-paste template

The convention is explained in [[../../10-architecture/frontend-patterns|10-architecture/frontend-patterns.md]].
This file is the practical template for adding a **new** entity.

## When to use this

Any time a page needs to read or write data that goes through the backend. Never call `trpc.*`
directly from a component; never add `fetch`/`axios`.

## Steps

1. **Backend first** (if it doesn't exist yet): add `backend/src/schemas/<entity>Schema.ts` (Zod),
   `backend/src/routers/<entity>Router.ts` (tRPC router using that schema), register it in
   `backend/src/routers/appRouter.ts`.
2. **Frontend**: create `src/mutations/use<Entity>Mutations.ts`:

```ts
import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

const titleMessage = '<Human-readable entity name>';

// --- Queries ---

export function useGet<Entity>Paginated(params: { page?: number; pageSize?: number; /* filters */ }) {
  const { data, isLoading, refetch, error } = trpc.<entity>.getPaginated.useQuery(params);
  const list = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(list.total / (params.pageSize ?? 10));
  return { list, totalPages, isLoading, refetch, error };
}

// --- Mutations ---

export function use<Entity>Mutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.<entity>.getPaginated.invalidate();
    // + invalidate any OTHER entity's queries this write affects
  };

  const create<Entity> = trpc.<entity>.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const update<Entity> = trpc.<entity>.update.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const delete<Entity> = trpc.<entity>.delete.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { create<Entity>, update<Entity>, delete<Entity> };
}
```

3. **Gate admin-only queries** with `useAdminAccess()` from `@/utils/auth`:
   `trpc.<entity>.getPaginated.useQuery(params, { enabled: hasAdminAccess })` — see
   `src/hooks/useInventoryMutations.ts` for several examples in one file.
4. **Use the hook from the page**, never `trpc` directly:
   `const { create<Entity> } = use<Entity>Mutations(); create<Entity>.mutate(payload)`.
5. If the entity carries personal data (IC, name, address, phone, email, health/cause-of-death,
   photos), check [[../../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] and
   [[../security/field-encryption|../security/field-encryption.md]] before finalizing the backend
   entity/schema.

## Existing files to copy from

- `src/mutations/useDeadPersonMutations.ts` — simplest, cross-entity invalidation example (invalidates
  grave-mapping queries too).
- `src/hooks/useInventoryMutations.ts` — multiple related sub-domains in one file, `useAdminAccess`
  gating, non-CRUD mutations (`stockIn`, `stockOut`, `processPackage`).
- `src/mutations/useJenazahCaseMutations.ts` — a mutation reused by multiple pages that each want a
  *different* success toast/side effect (e.g. `createJenazahCase` used by both an admin form and a
  public self-service form). Pattern: the hook's own `onSuccess` does only `invalidateAll()`, no
  toast; each call site supplies its own message via
  `mutation.mutate(payload, { onSuccess: () => {...} })` (or `mutateAsync` + code immediately after
  the `await`) — React Query fires both the hook-level and call-level `onSuccess`, so this doesn't
  skip the shared invalidation. Also shows the imperative "export all rows" idiom as a plain
  exported `async function fetchAllX(params)` using `trpcClient` (not a hook), for pages with a
  bulk CSV/PDF export button — see `fetchAllJenazahCases`/`fetchAllDeadPersons`.
