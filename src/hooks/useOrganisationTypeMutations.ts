import { trpc } from '@/utils/trpc';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

const titleMessage = 'Organisation Type';

export function useGetOrganisationType(hasAdminAccess) {
  const trpcRes = trpc.organisationType.getTypes.useQuery(undefined, {
    enabled: hasAdminAccess,
  });
  return {
    data: trpcRes.data ?? [],
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function useCreateOrganisationType() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisationType.createType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'create');
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateOrganisationType() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisationType.updateType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'update');
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteOrganisationType() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisationType.deleteType.useMutation({
    onSuccess: () => {
      trpcUtils.organisationType.getTypes.invalidate();
      showSuccess(titleMessage, 'delete');
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}
