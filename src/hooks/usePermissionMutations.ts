import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { useAdminAccess } from '@/utils/auth';

export function useGetPermission(userId?: number, canView?: boolean) {
    return trpc.permission.getByUser.useQuery(
        { userId: userId },
        { enabled: !!userId && canView }
    );
}

export function useUpsertPermission() {
  const utils = trpc.useUtils();

  return trpc.permission.upsert.useMutation({
    onSuccess: () => {
      utils.permission.getByUser.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}