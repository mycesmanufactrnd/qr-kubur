import { trpc } from '@/utils/trpc';
import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { useAdminAccess } from '@/utils/auth';

type useGetOrganisationTypePaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
};

const titleMessage = 'Organisation Type';

export function useGetOrganisationTypePaginated({ 
  page, 
  pageSize, 
  filterName 
} : useGetOrganisationTypePaginatedParams ) {
  const { isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.organisationType.getTypes.useQuery(
    { page, pageSize, filterName },
    { enabled: isSuperAdmin }
  );

  const organisationTypeList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(organisationTypeList.total / (pageSize ?? 10));

  return { organisationTypeList, totalPages, isLoading, refetch, error };
}

export function useOrganisationTypeMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.organisationType.getTypes.invalidate();
  };

  const createOrganisationType = trpc.organisationType.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updateOrganisationType = trpc.organisationType.update.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteOrganisationType = trpc.organisationType.delete.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createOrganisationType, updateOrganisationType, deleteOrganisationType };
}