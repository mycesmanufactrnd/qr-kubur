import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetTahlilReqPaginatedParams = {
  page?: number;
  pageSize?: number;
};

const titleMessage = 'Tahlil Request';

export function useGetTahlilRequestPaginated({
  page,
  pageSize,
}: useGetTahlilReqPaginatedParams) {
  const { currentUser, isTahfizAdmin, isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.tahlilRequest.getPaginated.useQuery(
      {
        page,
        pageSize,
        currentUser,
        isTahfizAdmin,
        isSuperAdmin
      },
      { enabled: (isSuperAdmin || isTahfizAdmin) && !!currentUser }
    );

  const tahlilRequestList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(tahlilRequestList.total / pageSize);

  return { tahlilRequestList, totalPages, isLoading, refetch, error };
}
export function useUpdateTahlilRequest() {
  const trpcUtils = trpc.useUtils();

  return trpc.tahlilRequest.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.tahlilRequest.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteTahlilRequest() {
  const trpcUtils = trpc.useUtils();

  return trpc.tahlilRequest.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.tahlilRequest.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}