import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';
import { Coordinates } from '@/utils/enums';
import { coordinatesQueryOptions } from '@/utils/queryOptions';

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

export function useOrganisationMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.organisation.getPaginated.invalidate();
  };

  const createOrganisation = trpc.organisation.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateOrganisation = trpc.organisation.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteOrganisation = trpc.organisation.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
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
