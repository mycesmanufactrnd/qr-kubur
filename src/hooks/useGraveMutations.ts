import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { Coordinates } from '@/utils/enums';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetGravePaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
  filterStatus?: string;
  organisationIds?: number[];
  filterBlock?: string;
  filterLot?: string;
};

const titleMessage = 'Grave';

export function useGetGravePaginated({
  page,
  pageSize,
  search,
  filterState,
  filterStatus,
  organisationIds,
  filterBlock,
  filterLot,
}: useGetGravePaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.grave.getPaginated.useQuery(
      { page, pageSize, search, filterState, filterStatus, organisationIds, filterBlock, filterLot },
      { enabled: hasAdminAccess }
    );

  const gravesList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(gravesList.total / (pageSize ?? 10));

  return { gravesList, totalPages, isLoading, refetch, error };
}

export function useGraveMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.grave.getPaginated.invalidate();
  };

  const createGrave = trpc.grave.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateGrave = trpc.grave.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteGrave = trpc.grave.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createGrave, updateGrave, deleteGrave };
}

export function useBulkCreateGraves() {
  const trpcUtils = trpc.useUtils();

  return trpc.grave.bulkCreate.useMutation({
    onSuccess: (data) => {
      showSuccess(titleMessage, `Successfully imported ${data.count} records`);
      trpcUtils.grave.getPaginated.invalidate();
    },
    onError: showApiError,
  });
}

export function useGetGravesCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  filters?: Record<string, string>
) {
  return trpc.grave.getGraveByCoordinates.useQuery(
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

export function useGetGraveById(id: number | null) {
  return trpc.grave.getGraveById.useQuery({ id: id as number }, { enabled: !!id });
}