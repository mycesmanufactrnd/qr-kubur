import { trpc } from '@/utils/trpc';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

const titleMessage = 'Organisation Type';

/**
 * Standardized Fetcher: Supports URL-driven search and pagination
 */
export function useGetOrganisationType({ page, pageSize, search, hasAccess }) {
  const { data, isLoading, refetch } = trpc.organisationType.getTypes.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      search: search || '',
    },
    {
      // 🔹 Strict boolean cast to prevent TanStack Query runtime errors
      enabled: !!hasAccess,
      keepPreviousData: true,
    }
  );

  return {
    // 🔹 Ensure we return a safe default structure
    data: data ?? { items: [], total: 0 },
    isLoading,
    refetch,
  };
}

export function useCreateOrganisationType() {
  const trpcUtils = trpc.useUtils();
  return trpc.organisationType.createType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'create');
    },
    onError: (err) => showApiError(err),
  });
}

export function useUpdateOrganisationType() {
  const trpcUtils = trpc.useUtils();
  return trpc.organisationType.updateType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'update');
    },
    onError: (err) => showApiError(err),
  });
}

export function useDeleteOrganisationType() {
  const trpcUtils = trpc.useUtils();
  return trpc.organisationType.deleteType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'delete');
    },
    onError: (err) => showApiError(err),
  });
}