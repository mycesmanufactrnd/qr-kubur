import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

const titleMessage = "Payment";

export function useDeathCharityPaymentMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deathCharityPayment.getPaymentByMemberId.invalidate();
  };

  const createDeathCharityPayment = trpc.deathCharityPayment.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { createDeathCharityPayment }
}

export function useGetPaymentByMemberId(memberId: number | null) {

  return trpc.deathCharityPayment.getPaymentByMemberId.useQuery(
    { memberId: Number(memberId) }, 
    { enabled: !!memberId }
  );
}
