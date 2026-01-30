import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetMosquePaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
};

const titleMessage = 'Mosque';

export function useGetMosquePaginated({
  page,
  pageSize,
  search,
  filterState,
}: useGetMosquePaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.mosque.getPaginated.useQuery(
      { page, pageSize, search, filterState },
      { enabled: hasAdminAccess }
    );

  const mosquesList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(mosquesList.total / (pageSize ?? 10));

  return { mosquesList, totalPages, isLoading, refetch, error };
}

export function useCreateMosque() {
  const trpcUtils = trpc.useUtils();

  return trpc.mosque.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.mosque.getPaginated.invalidate();
    },
    onError: showApiError,
  });
}

export function useUpdateMosque() {
  const trpcUtils = trpc.useUtils();

  return trpc.mosque.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.mosque.getPaginated.invalidate();
    },
    onError: showApiError,
  });
}

export function useDeleteMosque() {
  const trpcUtils = trpc.useUtils();

  return trpc.mosque.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.mosque.getPaginated.invalidate();
    },
    onError: showApiError,
  });
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