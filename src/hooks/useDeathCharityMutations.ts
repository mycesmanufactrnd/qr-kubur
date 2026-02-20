import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetDeathCharityPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterState?: string;
};

const titleMessage = 'Death Charity';

export function useGetDeathCharityPaginated({
  page,
  pageSize,
  filterName,
  filterState,
}: useGetDeathCharityPaginatedParams) {
  const { currentUser, isSuperAdmin, hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.deathCharity.getPaginated.useQuery(
      { 
        page, pageSize, filterName, filterState,
        organisationId: ( currentUser && currentUser.organisation ) ? currentUser.organisation.id : null,
        isSuperAdmin,
      },
      { enabled: hasAdminAccess }
    );

  const deathCharityList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(deathCharityList.total / (pageSize ?? 10));

  return { deathCharityList, totalPages, isLoading, refetch, error };
}

export function useDeathCharityMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deathCharity.getPaginated.invalidate();
  };

  const createDeathCharity = trpc.deathCharity.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateDeathCharity = trpc.deathCharity.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteDeathCharity = trpc.deathCharity.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createDeathCharity, updateDeathCharity, deleteDeathCharity }
}

export function useGetDeathCharityByOrganisation() {
  const { currentUser, isSuperAdmin } = useAdminAccess();

  const organisationId = currentUser?.organisation?.id ?? null;

  return trpc.deathCharity.getDeathCharityByOrganisation.useQuery(
    { organisationId: Number(organisationId), isSuperAdmin: isSuperAdmin }, 
    { enabled: !!organisationId || isSuperAdmin }
  );
}

export function useGetDeathCharityByMosque(mosqueId: number | null) {
  return trpc.deathCharity.getDeathCharityByMosqueId.useQuery(
    { mosqueId: Number(mosqueId) },
    { enabled: !!mosqueId }
  );
}
