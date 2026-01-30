import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { coordinatesQueryOptions } from '@/utils/queryOptions';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetHeritagePaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterState?: string;
};

const titleMessage = 'Heritage Site';

export function useGetHeritageSitesPaginated({
  page,
  pageSize,
  filterName,
  filterState,
}: useGetHeritagePaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.heritage.getPaginated.useQuery(
      { page, pageSize, filterName, filterState },
      { enabled: hasAdminAccess }
    );

  const heritageSiteList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(heritageSiteList.total / (pageSize ?? 10));

  return { heritageSiteList, totalPages, isLoading, refetch, error };
}

export function useHeritageMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.heritage.getPaginated.invalidate();
  };

  const createHeritage = trpc.heritage.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateHeritage = trpc.heritage.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteHeritage = trpc.heritage.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const incrementViewCount = trpc.heritage.incViewCount.useMutation({
    onError: (err) => console.error(err),
  })

  return { createHeritage, updateHeritage, deleteHeritage, incrementViewCount }
}

export function useGetHeritageSitesCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  filters?: Record<string, string>
) {
  return trpc.heritage.getHeritageByCoordinates.useQuery(
    { 
      coordinates: coordinates ?? null,
      filters: filters ?? {},
    },
    {
      enabled: !!coordinates,
      ...coordinatesQueryOptions,
    }
  );
}

export function useGetHeritageById(id: number | null) {
  return trpc.heritage.getHeritageById.useQuery(
    { id: Number(id) }, 
    { enabled: !!id }
  );
}