import { trpc, trpcClient } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { translate } from '@/utils/translations';

type useGetJenazahCasePaginatedParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  referenceno?: string;
};

export function useGetJenazahCasePaginated({
  page,
  pageSize,
  status,
  search,
  referenceno,
}: useGetJenazahCasePaginatedParams) {
  const { currentUser, isSuperAdmin, hasAdminAccess, loadingUser } = useAdminAccess();

  const { data, isLoading, isFetching, refetch, error } = trpc.jenazahCase.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      status: status || undefined,
      search: search || undefined,
      referenceno: referenceno || undefined,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      isSuperAdmin,
    },
    { enabled: !loadingUser && hasAdminAccess },
  );

  const jenazahCasesList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(jenazahCasesList.total / (pageSize ?? 10));

  return { jenazahCasesList, totalPages, isLoading, isFetching, refetch, error };
}

export function useGetJenazahCaseByReferenceNoAdmin(
  referenceno: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { hasAdminAccess } = useAdminAccess();

  return trpc.jenazahCase.getByReferenceNoAdmin.useQuery(
    { referenceno: referenceno ?? '' },
    { enabled: (options?.enabled ?? true) && !!referenceno && hasAdminAccess },
  );
}

// Imperative one-off fetch for "export all" buttons — not a subscribed query,
// so it goes through trpcClient instead of the useQuery hook above. Callers
// already have currentUserOrganisation/isSuperAdmin in scope via useAdminAccess().
export async function fetchAllJenazahCases(params: {
  status?: string;
  search?: string;
  referenceno?: string;
  currentUserOrganisation?: number | null;
  isSuperAdmin?: boolean;
}) {
  const data = await trpcClient.jenazahCase.getPaginated.query({
    page: 1,
    pageSize: 100000,
    status: params.status || undefined,
    search: params.search || undefined,
    referenceno: params.referenceno || undefined,
    currentUserOrganisation: params.currentUserOrganisation ?? null,
    isSuperAdmin: params.isSuperAdmin,
  });
  return data?.items ?? [];
}

export function useJenazahCaseMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.jenazahCase.getPaginated.invalidate();
    trpcUtils.jenazahCase.getByReferenceNoAdmin.invalidate();
  };

  const updateJenazahCaseStatus = trpc.jenazahCase.updateStatus.useMutation({
    onSuccess: () => {
      showSuccess(translate('Case status updated.'));
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  // No default toast — the admin-create flow (ManageJenazahCase) and the
  // public self-service flow (JenazahEmergencyRequest) show different
  // messages, passed via mutateAsync(payload, { onSuccess }).
  const createJenazahCase = trpc.jenazahCase.create.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => showApiError(err),
  });

  const deleteJenazahCase = trpc.jenazahCase.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate('Funeral case deleted successfully.'));
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  // No onSuccess here, deliberately — addToKariah can resolve successfully
  // with a "conflict" status instead of throwing, and the caller decides
  // whether that counts as done (and whether to refetch) based on that
  // result. Matches the original inline mutation exactly.
  const addJenazahCaseToKariah = trpc.jenazahCase.addToKariah.useMutation({
    onError: (err) => showApiError(err),
  });

  return {
    updateJenazahCaseStatus,
    createJenazahCase,
    deleteJenazahCase,
    addJenazahCaseToKariah,
  };
}
