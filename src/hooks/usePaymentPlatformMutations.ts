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

export function useCreatePaymentPlatform() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentPlatform.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.paymentPlatform.getPlatform.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdatePaymentPlatform() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentPlatform.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.paymentPlatform.getPlatform.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeletePaymentPlatform() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentPlatform.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.paymentPlatform.getPlatform.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}