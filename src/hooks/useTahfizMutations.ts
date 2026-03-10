import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { coordinatesQueryOptions } from '@/utils/queryOptions';
import { skipToken } from '@tanstack/react-query';

type useGetTahfizPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterState?: string;
};

const TITLE_MESSAGE = 'Tahfiz Center';

export function useGetTahfizById(tahfizId: number | null) {
  const query = trpc.tahfiz.getTahfizById.useQuery(
    tahfizId ? { id: tahfizId } : skipToken
  );

  return query;
}

export function useGetTahfizPaginated({
  page,
  pageSize,
  filterName,
  filterState,
}: useGetTahfizPaginatedParams) {
  const { currentUser, hasAdminAccess, isTahfizAdmin, isSuperAdmin } = useAdminAccess();
  const currentUserTahfizCenterId = currentUser?.tahfizcenter ? Number(currentUser.tahfizcenter.id) : undefined;

  const { data, isLoading, refetch, error } = trpc.tahfiz.getPaginated.useQuery(
    { 
      page, 
      pageSize, 
      filterName, 
      filterState, 
      currentUserTahfizCenterId, 
      isSuperAdmin 
    },
    { enabled: hasAdminAccess && !!currentUser && (isTahfizAdmin || isSuperAdmin) }
  );

  const tahfizCenterList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(tahfizCenterList.total / (pageSize ?? 10));

  return { tahfizCenterList, totalPages, isLoading, refetch, error };
}

export function useGetTahfizCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  userState?: string,
  filterName?: string,
  filterAddress?: string,
) {
  return trpc.tahfiz.getTahfizByCoordinates.useQuery(
    { 
      coordinates: coordinates ?? null,
      userState,
      filterName,
      filterAddress
    },
    {
      enabled: !!coordinates,
      ...coordinatesQueryOptions,
    }
  );
}

export function useTahfizMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.tahfiz.invalidate();
  };

  const createTahfiz = trpc.tahfiz.create.useMutation({
    onSuccess: () => { 
      showSuccess(TITLE_MESSAGE, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateTahfiz = trpc.tahfiz.update.useMutation({
    onSuccess: () => { 
      showSuccess(TITLE_MESSAGE, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteTahfiz = trpc.tahfiz.delete.useMutation({
    onSuccess: () => { 
      showSuccess(TITLE_MESSAGE, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createTahfiz, updateTahfiz, deleteTahfiz };
}