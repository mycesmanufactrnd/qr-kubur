import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetDeathCharityClaimPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterDeceasedName?: string;
};

const titleMessage = 'Death Charity Claim';

export function useGetDeathCharityClaimPaginated({
  page,
  pageSize,
  filterDeceasedName,
}: useGetDeathCharityClaimPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.deathCharityClaim.getPaginated.useQuery(
      { page, pageSize, filterDeceasedName },
      { enabled: hasAdminAccess }
    );

  const deathCharityClaimList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(deathCharityClaimList.total / (pageSize ?? 10));

  return { deathCharityClaimList, totalPages, isLoading, refetch, error };
}

export function useDeathCharityClaimMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deathCharityClaim.getPaginated.invalidate();
  };

  const createDeathCharityClaim = trpc.deathCharityClaim.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateDeathCharityClaim = trpc.deathCharityClaim.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteDeathCharityClaim = trpc.deathCharityClaim.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const createDeathCharityBulkClaims = trpc.deathCharityMember.createClaims.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { createDeathCharityClaim, updateDeathCharityClaim, deleteDeathCharityClaim, createDeathCharityBulkClaims }
}