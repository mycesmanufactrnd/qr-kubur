import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type UseGetTahlilReqPaginatedParams = {
  page?: number;
  pageSize?: number;
};

const titleMessage = 'Tahlil Request';

export function useGetTahlilRequestPaginated({
  page,
  pageSize,
}: UseGetTahlilReqPaginatedParams) {
  const { isTahfizAdmin, isSuperAdmin, currentUser } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.tahlilRequest.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            tahfizcenter: currentUser.tahfizcenter
              ? { id: currentUser.tahfizcenter.id }
              : null,
          }
        : { id: 0, tahfizcenter: null },
      isTahfizAdmin: !!isTahfizAdmin,
      isSuperAdmin: !!isSuperAdmin,
    },
    {
      enabled: !!currentUser,
    }
  );

  const tahlilRequestList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = pageSize
    ? Math.ceil(tahlilRequestList.total / pageSize)
    : 1;

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

export function useUpdateLiveURLTahlilRequest() {
  const trpcUtils = trpc.useUtils();

  return trpc.tahlilRequest.updateLiveURL.useMutation({
    onSuccess: () => {
      showSuccess(`${titleMessage} URL`, 'update');
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