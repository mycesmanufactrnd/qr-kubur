import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetTahfizPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
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

export function useGetTahfizCoordinates(coordinates?: Coordinates | null) {
  const { data = [], isLoading, error, refetch } = trpc.tahfiz.getTahfiz.useQuery(
    { coordinates: coordinates ?? null },
    {
      enabled: !!coordinates,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  return { tahfizCenters: data, isLoading, error, refetch };
}

