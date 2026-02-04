import { trpc } from '@/utils/trpc';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

const titleMessage = "Payment Platform";

export function useGetPaymentPlatform({ page, pageSize, search, hasAccess }) {
  const trpcRes = trpc.paymentPlatform.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      search: search || '',
    },
    { 
      enabled: !!hasAccess,
      keepPreviousData: true 
    }
  );

  return {
    data: trpcRes.data ?? { items: [], total: 0 },
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function useCreatePaymentPlatform() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentPlatform.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.paymentPlatform.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}

export function useUpdatePaymentPlatform() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentPlatform.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.paymentPlatform.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}

export function useDeletePaymentPlatform() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentPlatform.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.paymentPlatform.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}