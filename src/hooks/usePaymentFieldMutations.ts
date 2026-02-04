import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { trpc } from '@/utils/trpc';

const titleMessage = "Payment Field";

/**
 * Standardized: useGetPaymentField
 * Supports URL-driven pagination, search, and platform filtering.
 */
export function useGetPaymentField({ page, pageSize, search, platformId, hasAccess }) {
  const trpcRes = trpc.paymentField.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      search: search || '',
      platformId: platformId || undefined,
    },
    {
      // 🔹 Strictly cast enabled to boolean
      enabled: !!hasAccess,
      keepPreviousData: true,
    }
  );

  return {
    data: trpcRes.data ?? { items: [], total: 0 },
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function useCreatePaymentField() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentField.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.paymentField.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}

export function useUpdatePaymentField() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentField.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.paymentField.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}

export function useDeletePaymentField() {
  const trpcUtils = trpc.useUtils();
  return trpc.paymentField.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.paymentField.getPaginated.invalidate();
    },
    onError: (err) => showApiError(err),
  });
}