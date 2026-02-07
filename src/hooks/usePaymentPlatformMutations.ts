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
    }
  );

  return {
    data: trpcRes.data ?? { items: [], total: 0 },
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function usePaymentPlatformMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.paymentPlatform.getPaginated.invalidate();
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