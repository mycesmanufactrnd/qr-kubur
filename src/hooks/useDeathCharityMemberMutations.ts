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
    trpcUtils.deathCharityMember.searchByDeathCharity.invalidate();
    trpcUtils.deathCharityMember.getMemberByDeathCharity.invalidate();
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

  const upsertDeathCharityDependents = trpc.deathCharityMember.upsertDependents.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'save');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const createPublicDeathCharityMember = trpc.deathCharityMember.createPublic.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { 
    createDeathCharityMember, 
    updateDeathCharityMember, 
    deleteDeathCharityMember, 
    upsertDeathCharityDependents,
    createPublicDeathCharityMember,
  }
}

export function useGetMemberByDeathCharity(deathCharityId) {
  const { isSuperAdmin } = useAdminAccess();

  return trpc.deathCharityMember.getMemberByDeathCharity.useQuery(
    { deathcharityId: Number(deathCharityId), isSuperAdmin: isSuperAdmin }, 
    { enabled: !!deathCharityId }
  );
}

export function useGetDependentsByMember(memberId) {
  const { isSuperAdmin } = useAdminAccess();

  return trpc.deathCharityMember.getDependentsByMember.useQuery(
    { memberId: Number(memberId), isSuperAdmin: isSuperAdmin }, 
    { enabled: !!memberId }
  );
}

export function useSearchMemberByDeathCharity(
  deathCharityId: number | null,
  keyword: string,
  limit: number = 10,
) {
  const trimmedKeyword = (keyword || '').trim();

  return trpc.deathCharityMember.searchByDeathCharity.useQuery(
    { deathcharityId: Number(deathCharityId), keyword: trimmedKeyword, limit },
    { enabled: !!deathCharityId && trimmedKeyword.length > 1 }
  );
}
