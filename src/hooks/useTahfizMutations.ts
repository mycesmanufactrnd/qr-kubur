import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetTahfizPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
};

const titleMessage = 'Tahfiz Center';

export function useGetTahfizPaginated({
  page,
  pageSize,
  search,
  filterState,
}: useGetTahfizPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();

  const currentUserTahfizCenterId = currentUser?.tahfizcenter?.id ?? undefined;

  const { data, isLoading, refetch, error } =
    trpc.tahfiz.getPaginated.useQuery(
      {
        page,
        pageSize,
        search,
        filterState,
        currentUserTahfiz: currentUserTahfizCenterId,
        checkRole,
      },
      { enabled: hasAdminAccess && !!currentUser }
    );

  const tahfizCenterList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(tahfizCenterList.total / pageSize);

  return { tahfizCenterList, totalPages, isLoading, refetch, error };
}

