import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

type useGetOrganisationPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterType?: number;
  filterState?: string;
};

const titleMessage = 'Organisation';

/**
 * Standardized: useGetOrganisationPaginated
 * Removes 'checkRole' and object literals from the query input to prevent 429 errors.
 */
export function useGetOrganisationPaginated({
  page,
  pageSize,
  search,
  filterType,
  filterState,
}: useGetOrganisationPaginatedParams) {
  const { currentUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  // 🔹 Standardized: Backend handles logic; frontend only sends specific IDs if needed.
  // For standard Admins, we could calculate their sub-org tree here or let backend do it.
  const { data, isLoading, refetch, error } =
    trpc.organisation.getPaginated.useQuery(
      {
        page: page ?? 1,
        pageSize: pageSize ?? 10,
        search: search || '',
        filterType,
        filterState,
        // We let backend handle role-based filtering based on the session token
      },
      { 
        enabled: !!hasAdminAccess && !!currentUser, 
        keepPreviousData: true 
      }
    );

  const total = data?.total ?? 0;

  return {
    organisationsList: { items: data?.items ?? [], total: total },
    totalPages: Math.ceil(total / (pageSize ?? 10)),
    isLoading,
    refetch,
    error,
  };
}

export function useOrganisationMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.organisation.getPaginated.invalidate();
    trpcUtils.organisation.getAll.invalidate();
  };

  const createOrganisation = trpc.organisation.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updateOrganisation = trpc.organisation.update.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteOrganisation = trpc.organisation.delete.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createOrganisation, updateOrganisation, deleteOrganisation };
}

export function useGetOrganisationCoordinates(
  coordinates?: { latitude: number; longitude: number } | null, 
  userState?: string,
  searchQuery?: string,
) {
  const { data = [], isLoading, error, refetch } = trpc.organisation.getOrganisationByCoordinates.useQuery(
    { 
      coordinates: coordinates ?? null,
      userState,
      searchQuery
    },
    {
      enabled: !!coordinates,
      ...coordinatesQueryOptions,
    }
  );

  return { organisations: data, isLoading, error, refetch };
}

export function useGetOrganisationByTypeId(organisationTypeId: number | undefined) {
  const { currentUser, hasAdminAccess } = useAdminAccess();

  // 🔹 FIXED: Added missing return statement
  return trpc.organisation.getByOrganisationTypeId.useQuery(
    { organisationTypeId },
    { enabled: !!hasAdminAccess && !!currentUser }
  );
}