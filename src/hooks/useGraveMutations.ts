import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

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
      {
        page,
        pageSize,
        search,
        filterState,
        filterStatus,
        organisationIds,
        filterBlock,
        filterLot,
      },
      { enabled: hasAdminAccess }
    );

  const gravesList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(gravesList.total / (pageSize ?? 10));

  return { gravesList, totalPages, isLoading, refetch, error };
}

export function useCreateGrave() {
  const trpcUtils = trpc.useUtils();

  return trpc.grave.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.grave.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateGrave() {
  const trpcUtils = trpc.useUtils();

  return trpc.grave.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.grave.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}


export function useDeleteGrave() {
  const trpcUtils = trpc.useUtils();

  return trpc.grave.delete.useMutation({
    onSuccess: () => {
      showSuccess('Grave', 'delete');
      // This tells tRPC to reload the table data
      trpcUtils.grave.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useBulkCreateGraves() {
  const trpcUtils = trpc.useUtils();

  return trpc.grave.bulkCreate.useMutation({
    onSuccess: (data) => {
      showSuccess('Grave', `Successfully imported ${data.count} records`);
      trpcUtils.grave.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}