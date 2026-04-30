import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import { showSuccess, showApiError } from "@/components/ToastrNotification";

const titleMessage = "Quotation";

export function useGetQuotationPaginated({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const { currentUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch } = trpc.quotation.getPaginated.useQuery(
    {
      page,
      pageSize,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      isSuperAdmin,
    },
    { enabled: hasAdminAccess && !!currentUser },
  );

  const quotationList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = pageSize ? Math.ceil(quotationList.total / pageSize) : 1;
  return { quotationList, totalPages, isLoading, refetch };
}

export function useGetAllQuotations() {
  const { currentUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const { data, isLoading } = trpc.quotation.getPaginated.useQuery(
    {
      page: 1,
      pageSize: 500,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      isSuperAdmin,
    },
    { enabled: hasAdminAccess && !!currentUser },
  );

  return {
    items: data?.items ?? [],
    isLoading,
  };
}

export function useUpdateQuotation() {
  const trpcUtils = trpc.useUtils();

  return trpc.quotation.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "update");
      trpcUtils.quotation.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}
