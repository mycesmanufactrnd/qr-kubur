import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import { showSuccess, showApiError } from "@/components/ToastrNotification";

type useGetPaymentDistributionPaginatedParams = {
  page?: number;
  pageSize?: number;
};

type useGetOnlineTransactionParams = {
  referenceno?: string | null;
  enabled?: boolean;
};

const titleMessage = "Payment Distribution";

export function useGetPaymentDistributionPaginated({
  page,
  pageSize,
}: useGetPaymentDistributionPaginatedParams) {
  const { isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.paymentDistribution.getPaginated.useQuery(
      {
        page,
        pageSize,
      },
      { enabled: isSuperAdmin }
    );

  const paymentDistributionList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = pageSize
    ? Math.ceil(paymentDistributionList.total / pageSize)
    : 1;

  return { paymentDistributionList, totalPages, isLoading, refetch, error };
}

export function usePaymentDistributionMutation() {
  const trpcUtils = trpc.useUtils();

  return trpc.paymentDistribution.updateStatus.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "update");
      trpcUtils.paymentDistribution.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useGetOnlineTransaction({
  referenceno,
  enabled = true,
}: useGetOnlineTransactionParams) {
  const { currentUser, hasAdminAccess } = useAdminAccess();

  const shouldFetch = !!referenceno && !!currentUser && hasAdminAccess && enabled;

  const { data, isLoading, refetch, error } =
    trpc.paymentDistribution.getOnlineTransaction.useQuery(
      {
        referenceno: referenceno ?? "",
      },
      { enabled: shouldFetch },
    );

  return { onlineTransaction: data ?? null, isLoading, refetch, error };
}
