import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { trpc } from '@/utils/trpc';

const titleMessage = "Payment Field";

export function useGetPaymentField({ page, pageSize, search, platformId, hasAccess }) {
  const trpcRes = trpc.paymentField.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      search: search || '',
      platformId: platformId || undefined,
    },
    {
      enabled: !!hasAccess,
    }
  );

  return {
    data: trpcRes.data ?? { items: [], total: 0 },
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function usePaymentFieldMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.paymentField.getPaginated.invalidate();
  };

  const createPaymentField = trpc.paymentField.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updatePaymentField = trpc.paymentField.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deletePaymentField = trpc.paymentField.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createPaymentField, updatePaymentField, deletePaymentField };
}