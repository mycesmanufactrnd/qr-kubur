import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';

type useGetActivityLogPaginatedParams = {
  page?: number;
  pageSize?: number;
};

export function useGetActivityLogPaginated({
  page,
  pageSize,
}: useGetActivityLogPaginatedParams) {
  const { checkRole, isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.activityLogs.getPaginated.useQuery(
      {
        page,
        pageSize,
        checkRole,
      },
      { enabled: isSuperAdmin }
    );

  const activityLogList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(activityLogList.total / pageSize);

  return { activityLogList, totalPages, isLoading, refetch, error };
}

