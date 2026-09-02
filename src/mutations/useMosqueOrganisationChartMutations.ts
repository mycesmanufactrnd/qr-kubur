import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

const titleMessage = 'Organisation Chart';

export function useGetMosqueOrganisationChartByMosqueId(mosqueId: number | null) {
  return trpc.mosqueOrganisationChart.getByMosqueId.useQuery(
    { mosqueId: mosqueId as number },
    { enabled: !!mosqueId }
  );
}

export function useMosqueOrganisationChartMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.mosqueOrganisationChart.getByMosqueId.invalidate();
    trpcUtils.mosque.getMosqueById.invalidate();
  };

  const createChart = trpc.mosqueOrganisationChart.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const updateChart = trpc.mosqueOrganisationChart.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const deleteChart = trpc.mosqueOrganisationChart.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { createChart, updateChart, deleteChart };
}
