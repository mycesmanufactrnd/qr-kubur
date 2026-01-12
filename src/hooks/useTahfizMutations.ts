import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetTahfizPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterState?: string;
};

const TITLE_MESSAGE = 'Tahfiz Center';

export function useGetTahfizPaginated({
  page = 1,
  pageSize = 10,
  search,
  filterState,
}: useGetTahfizPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();
  const currentUserTahfizCenterId = currentUser?.tahfizcenter?.id ?? undefined;

  const query = trpc.tahfiz.getPaginated.useQuery(
    { page, pageSize, search, filterState, currentUserTahfiz: currentUserTahfizCenterId, checkRole },
    { enabled: hasAdminAccess && !!currentUser, keepPreviousData: true }
  );

  return {
    tahfizCenterList: { items: query.data?.items ?? [], total: query.data?.total ?? 0 },
    totalPages: Math.ceil((query.data?.total ?? 0) / pageSize),
    ...query,
  };
}

export function useTahfizMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidate = () => {
    trpcUtils.tahfiz.getPaginated.invalidate();
  };

  const createTahfiz = trpc.tahfiz.create.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Created successfully'); invalidate(); },
    onError: (err) => showApiError(err),
  });

  const updateTahfiz = trpc.tahfiz.update.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Updated successfully'); invalidate(); },
    onError: (err) => showApiError(err),
  });

  const deleteTahfiz = trpc.tahfiz.delete.useMutation({
    onSuccess: () => { showSuccess(TITLE_MESSAGE, 'Deleted successfully'); invalidate(); },
    onError: (err) => showApiError(err),
  });

  return { createTahfiz, updateTahfiz, deleteTahfiz };
}