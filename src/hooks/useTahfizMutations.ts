import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetTahfizPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
};

const TITLE_MESSAGE = 'Tahfiz Center';

export function useGetTahfizById(tahfizId: number) {
  return trpc.tahfiz.getTahfizById.useQuery(
    { id: tahfizId }, 
    { enabled: !!tahfizId }
  );
}

export function useGetTahfizPaginated({
  page = 1,
  pageSize = 10,
  search,
  filterState,
}: useGetTahfizPaginatedParams) {
  const { currentUser, hasAdminAccess, isTahfizAdmin, isSuperAdmin, checkRole } = useAdminAccess();
  const currentUserTahfizCenterId = currentUser?.tahfizcenter?.id ?? undefined;

  const query = trpc.tahfiz.getPaginated.useQuery(
    { page, pageSize, search, filterState, currentUserTahfiz: currentUserTahfizCenterId, checkRole },
    { enabled: hasAdminAccess && !!currentUser && (isTahfizAdmin || isSuperAdmin) }
  );

  return {
    tahfizCenterList: { items: query.data?.items ?? [], total: query.data?.total ?? 0 },
    totalPages: Math.ceil((query.data?.total ?? 0) / pageSize),
    ...query,
  };
}

export function useGetTahfizCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  userState?: string,
  searchQuery?: string,
) {
  return trpc.tahfiz.getTahfizByCoordinates.useQuery(
    { 
      coordinates: coordinates ?? null,
      userState,
      searchQuery
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
    trpcUtils.tahfiz.getPaginated.invalidate();
  };

  const createTahfiz = trpc.tahfiz.create.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Created successfully'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updateTahfiz = trpc.tahfiz.update.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Updated successfully'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteTahfiz = trpc.tahfiz.delete.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Deleted successfully'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createTahfiz, updateTahfiz, deleteTahfiz };
}