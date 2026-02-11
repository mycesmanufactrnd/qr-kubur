import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetDeathCharityMemberPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterFullName?: string;
};

const titleMessage = 'Death Charity Member';

export function useGetDeathCharityMemberPaginated({
  page,
  pageSize,
  filterFullName,
}: useGetDeathCharityMemberPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.deathCharityMember.getPaginated.useQuery(
      { page, pageSize, filterFullName },
      { enabled: hasAdminAccess }
    );

  const deathCharityMemberList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(deathCharityMemberList.total / (pageSize ?? 10));

  return { deathCharityMemberList, totalPages, isLoading, refetch, error };
}

export function useDeathCharityMemberMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deathCharityMember.getPaginated.invalidate();
  };

  const createDeathCharityMember = trpc.deathCharityMember.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateDeathCharityMember = trpc.deathCharityMember.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteDeathCharityMember = trpc.deathCharityMember.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createDeathCharityMember, updateDeathCharityMember, deleteDeathCharityMember }
}


export function useGetDeathCharityByOrganisation() {
  const { currentUser, isSuperAdmin } = useAdminAccess();

  const organisationId = currentUser?.organisation?.id ?? null;

  return trpc.deathCharityMember.getDeathCharityByOrganisation.useQuery(
    { organisationId: Number(organisationId), isSuperAdmin: isSuperAdmin }, 
    { enabled: !!organisationId || isSuperAdmin }
  );
}