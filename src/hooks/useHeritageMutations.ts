import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { Coordinates } from '@/utils/enums';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetHeritagePaginatedParams = {
  page?: number;
  pageSize?: number;
};

const titleMessage = 'Heritage Site';

// export function useGetHeritageSitesPaginated({
//   page,
//   pageSize,
// }: useGetHeritagePaginatedParams) {
//   const { hasAdminAccess } = useAdminAccess();

//   const { data, isLoading, refetch, error } =
//     trpc.grave.getPaginated.useQuery(
//       { page, pageSize },
//       { enabled: hasAdminAccess }
//     );

//   const heritageSiteList = { items: data?.items ?? [], total: data?.total ?? 0 };
//   const totalPages = Math.ceil(heritageSiteList.total / (pageSize ?? 10));

//   return { heritageSiteList, totalPages, isLoading, refetch, error };
// }

export function useHeritageMutations() {
  const trpcUtils = trpc.useUtils();

  const incrementViewCount = trpc.heritage.incViewCount.useMutation({
    onError: (err) => console.error(err),
  })

  return { incrementViewCount }
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