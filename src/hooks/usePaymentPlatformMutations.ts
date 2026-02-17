import { trpc } from '@/utils/trpc';
import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { useAdminAccess } from '@/utils/auth';

type useGetPaymentPlatformPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterCodeName?: string;
};

const titleMessage = "Payment Platform";

export function useGetPaymentPlatform({ 
  page,
  pageSize,
  filterCodeName,
 } : useGetPaymentPlatformPaginatedParams) {
  const { isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.paymentPlatform.getPaginated.useQuery(
    {
      page,
      pageSize,
      filterCodeName,
    },
    { 
      enabled: isSuperAdmin,
    }
  );

  const paymentPlatformList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(paymentPlatformList.total / (pageSize ?? 10));

  return { paymentPlatformList, totalPages, isLoading, refetch, error };
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