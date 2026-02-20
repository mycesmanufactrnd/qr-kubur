import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetMosquePaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterState?: string;
};

const titleMessage = 'Mosque';

export function useGetMosquePaginated({
  page,
  pageSize,
  filterName,
  filterState,
}: useGetMosquePaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.mosque.getPaginated.useQuery(
      { page, pageSize, filterName, filterState },
      { enabled: hasAdminAccess }
    );

  const mosquesList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(mosquesList.total / (pageSize ?? 10));

  return { mosquesList, totalPages, isLoading, refetch, error };
}

export function useMosqueMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.mosque.getPaginated.invalidate();
  };

  const createMosque = trpc.mosque.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateMosque = trpc.mosque.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteMosque = trpc.mosque.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createMosque, updateMosque, deleteMosque };
}

export function useGetMosqueCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  filters?: Record<string, any>
) {
  return trpc.mosque.getMosqueByCoordinates.useQuery(
    { 
      coordinates: coordinates ?? null,
      filters: filters ?? {}, 
    },
    {
      enabled: !!coordinates || !!filters?.name || !!filters?.state,
      ...coordinatesQueryOptions,
    }
  );
}

export function useGetMosqueById(id: number | null) {
  return trpc.mosque.getMosqueById.useQuery(
    { id: id as number }, 
    { enabled: !!id }
  );
}

export function useGetMosquesByOrganisationId(organisationId: number | null) {
  return trpc.mosque.getMosquesByOrganisationId.useQuery(
    { organisationId: Number(organisationId) }, 
    { enabled: !!organisationId }
  );
}