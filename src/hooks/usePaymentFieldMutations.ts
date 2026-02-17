import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';

type useGetPaymentFieldPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterLabelKey?: string;
  platformId?: number;
};

const titleMessage = "Payment Field";

export function useGetPaymentField({ 
  page, 
  pageSize,
  filterLabelKey, 
  platformId 
} : useGetPaymentFieldPaginatedParams) {
  const { isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.paymentField.getPaginated.useQuery(
    {
      page,
      pageSize,
      filterLabelKey,
      platformId,
    },
    { enabled: isSuperAdmin }
  );

  const paymentFieldList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(paymentFieldList.total / (pageSize ?? 10));

  return { paymentFieldList, totalPages, isLoading, refetch, error };
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