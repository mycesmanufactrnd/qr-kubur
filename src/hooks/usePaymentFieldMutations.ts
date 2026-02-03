import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { trpc } from '@/utils/trpc';

const titleMessage = "Payment Field";

export function useGetPaymentField(isSuperadmin: boolean) {
  const trpcRes = trpc.paymentField.getField.useQuery(
    undefined,
    { enabled: isSuperadmin }
  );
  return {
    data: trpcRes.data ?? [],
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function usePaymentFieldMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.paymentField.getField.invalidate();
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