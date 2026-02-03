import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { trpc } from '@/utils/trpc';

const titleMessage = "Payment Platform";

export function useGetPaymentPlatform(isSuperadmin: boolean) {
  const trpcRes = trpc.paymentPlatform.getPlatform.useQuery(
    undefined,
    { enabled: isSuperadmin }
  );
  return {
    data: trpcRes.data ?? [],
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function usePaymentPlatformMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.paymentPlatform.getPlatform.invalidate();
  };

  const createPaymentPlatform = trpc.paymentPlatform.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updatePaymentPlatform = trpc.paymentPlatform.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deletePaymentPlatform = trpc.paymentPlatform.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createPaymentPlatform, updatePaymentPlatform, deletePaymentPlatform };
}