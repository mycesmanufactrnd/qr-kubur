import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { trpc } from '@/utils/trpc';

export function useGetPermission(userId?: number, canView?: boolean) {
    return trpc.permission.getByUser.useQuery(
        { userId: userId },
        { enabled: !!userId && canView }
    );
}

export function useUpsertPermission() {
  const utils = trpc.useUtils();

  return trpc.permission.upsertMany.useMutation({
    onSuccess: () => {
      utils.permission.getByUser.invalidate();
      showSuccess('Permission', 'update');
    },
    onError: showApiError,
  });
}