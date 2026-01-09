import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetOrganisationPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterType?: number;
  filterState?: string;
};

const titleMessage = 'Organisation';

export function useGetOrganisationPaginated({
  page,
  pageSize,
  search,
  filterType,
  filterState,
}: useGetOrganisationPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();
  const currentUserOrganisationId = currentUser?.organisation?.id ?? undefined;

  const { data, isLoading, refetch, error } =
    trpc.organisation.getPaginated.useQuery(
      {
        page,
        pageSize,
        search,
        filterType,
        filterState,
        currentUserOrganisation: currentUserOrganisationId,
        checkRole,
      },
      { enabled: hasAdminAccess && !!currentUser }
    );

  const organisationsList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(organisationsList.total / pageSize);

  return { organisationsList, totalPages, isLoading, refetch, error };
}

export function useCreateOrganisation() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisation.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.organisation.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateOrganisation() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisation.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.organisation.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteOrganisation() {
  const trpcUtils = trpc.useUtils();

  return trpc.organisation.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.organisation.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}
