import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';

type useGetActivityLogPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  level?: string;
};

export function useGetActivityLogPaginated({
  page,
  pageSize,
  search,
  level,
}: useGetActivityLogPaginatedParams) {
  const {  isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.activityLogs.getPaginated.useQuery(
      {
        page,
        pageSize,
        search,
        level,
      },
      { enabled: isSuperAdmin }
    );

  const activityLogList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(activityLogList.total / (pageSize ?? 10));

  return { activityLogList, totalPages, isLoading, refetch, error };
}

