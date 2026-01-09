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

export function useCreatePaymentField() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentField.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.paymentField.getField.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdatePaymentField() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentField.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.paymentField.getField.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeletePaymentField() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentField.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.paymentField.getField.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}