import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import { showSuccess, showApiError } from "@/components/ToastrNotification";

type useGetDonationPaginatedParams = {
  page?: number;
  pageSize?: number;
};

const titleMessage = "Donation";

export function useGetDonationPaginated({ page, pageSize }: useGetDonationPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.donation.getPaginated.useQuery(
    {
      page,
      pageSize,
      currentUser,
      checkRole,
    },
    { enabled: hasAdminAccess && !!currentUser }
  );

  const donationList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = pageSize ? Math.ceil(donationList.total / pageSize) : 1;

  return { donationList, totalPages, isLoading, refetch, error };
}

export function useUpdateDonation() {
  const trpcUtils = trpc.useUtils();

  return trpc.donation.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "update");
      trpcUtils.donation.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}