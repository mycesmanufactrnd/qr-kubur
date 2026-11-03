import { trpc } from '@/utils/trpc';
import { showApiError } from '@/components/ToastrNotification';

export function useGetFamilyTreeByGoogleUser(
  googleUserId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  return trpc.familyTree.getByGoogleUser.useQuery(
    { googleUserId: googleUserId ?? null },
    { enabled: options?.enabled ?? !!googleUserId },
  );
}

export function useFamilyTreeMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.familyTree.getByGoogleUser.invalidate();
  };

  // No default onSuccess toast — callers show their own message ("Family
  // member added", "Deleted", "Removed from family tree", ...) and often
  // close/reset local UI state too, via mutate(payload, { onSuccess }).
  const createFamilyMember = trpc.familyTree.create.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => showApiError(err),
  });

  const deleteFamilyMember = trpc.familyTree.delete.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => showApiError(err),
  });

  return { createFamilyMember, deleteFamilyMember };
}
