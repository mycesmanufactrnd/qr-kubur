import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetNotificationPaginatedParams = {
    page?: number;
    pageSize?: number;
    receiveremail?: string;
    isread?: boolean;
};

export function useGetNotificationPaginated({
  page,
  pageSize,
  receiveremail,
  isread,
}: useGetNotificationPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.notification.getPaginated.useQuery(
      {
        page,
        pageSize,
        receiveremail,
        isread,
      },
      { enabled: hasAdminAccess }
    );

  const notificationList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(notificationList.total / pageSize);

  return { notificationList, totalPages, isLoading, refetch, error };
}

export function useUpdateNotification() {
  const trpcUtils = trpc.useUtils();

  return trpc.notification.update.useMutation({
    onSuccess: () => {
      showSuccess('Notification', 'update');
      trpcUtils.notification.getPaginated.invalidate();

      // Invalidate unread count so the layout badge updates
      trpcUtils.notification.getUnreadNotificationCount.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}