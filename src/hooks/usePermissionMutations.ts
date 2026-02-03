import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

const titleMessage = 'Permissions';

/**
 * Fetch permissions for a specific user
 * Maps to trpc.permission.getPermission
 */
export function useGetPermission(userId: number | undefined, enabled: boolean) {
  return trpc.permission.getPermission.useQuery(
    { userId: userId as number },
    { enabled: !!userId && enabled }
  );
}

/**
 * Update many permissions at once
 * Maps to trpc.permission.upsertPermission
 */
export function useUpsertPermission() {
  const trpcUtils = trpc.useUtils();

  return trpc.permission.upsertPermission.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      // Invalidate both paginated users and specific permission queries
      trpcUtils.users.getPaginated.invalidate();
      trpcUtils.permission.getPermission.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}