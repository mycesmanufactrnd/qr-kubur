import { trpc, trpcClient } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetDeadPersonPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterIC?: string;
  filterGrave?: number;
  filterGraveLot?: string;
  filterState?: string;
  filterKariah?: "kariah" | "not_kariah";
  dateFrom?: string;
  dateTo?: string;
  organisationIds?: number[];
  sortField?: string;
  sortOrder?: string;
};

const titleMessage = 'Deceased Record';

export function useGetDeadPersonPaginated({
  page,
  pageSize,
  filterName,
  filterIC,
  filterGrave,
  filterGraveLot,
  filterState,
  filterKariah,
  dateFrom,
  dateTo,
  organisationIds,
  sortField,
  sortOrder,
} : useGetDeadPersonPaginatedParams) {
  const { data, isLoading, refetch, error } = trpc.deadperson.getPaginated.useQuery(
    {
      page,
      pageSize,
      filterName,
      filterIC,
      filterGrave,
      filterGraveLot,
      filterState,
      filterKariah,
      dateFrom,
      dateTo,
      organisationIds,
      sortField,
      sortOrder: sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : undefined,
    },
  );

  const deadPersonsList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(deadPersonsList.total / (pageSize ?? 10));

  return { deadPersonsList, totalPages, isLoading, refetch, error };
}

export function useGetDeadPersonByGraveId(
  params: { graveId: number },
  options?: { enabled?: boolean },
) {
  const { data, isLoading, refetch, error } =
    trpc.deadperson.getDeadPersonByGraveId.useQuery(
      params,
      options?.enabled === undefined ? undefined : { enabled: options.enabled },
    );

  return {
    data,
    isLoading,
    refetch,
    error
  };
}

export function useGetDeadPersonById(
  id: number | null | undefined,
  options?: { enabled?: boolean },
) {
  return trpc.deadperson.getDeadPersonById.useQuery(
    { id: (id ?? null) as number },
    { enabled: options?.enabled ?? !!id },
  );
}

export function useGetDeadPersonByIcNumber(
  icnumber: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return trpc.deadperson.getByIcNumber.useQuery(
    { icnumber: icnumber ?? '' },
    { enabled: options?.enabled ?? !!icnumber },
  );
}

// Imperative one-off fetch for "export all" buttons — not a subscribed query,
// so it goes through trpcClient instead of the useQuery hooks above.
export async function fetchAllDeadPersons(
  params: Omit<useGetDeadPersonPaginatedParams, 'page' | 'pageSize'> & {
    page?: number;
    pageSize?: number;
  },
) {
  const data = await trpcClient.deadperson.getPaginated.query({
    page: 1,
    pageSize: 100000,
    ...params,
  });
  return data?.items ?? [];
}

export function useDeadPersonMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deadperson.getPaginated.invalidate();
    trpcUtils.deadperson.getDeadPersonByGraveId.invalidate();
    trpcUtils.deadperson.getByIcNumber.invalidate();
    // invalidate slot
    trpcUtils.graveMapping.getBlocksByGrave.invalidate();
    trpcUtils.graveMapping.getSlotOptionsByGrave.invalidate();
  };

  const createDeadPerson = trpc.deadperson.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateDeadPerson = trpc.deadperson.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteDeadPerson = trpc.deadperson.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const bulkDeleteDeadPersons = trpc.deadperson.bulkDelete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  // No default onSuccess toast here — callers that want one (e.g. "Dead
  // person recorded") pass it via mutateAsync(payload, { onSuccess }),
  // which fires in addition to this hook's own onSuccess below.
  const upsertDeadPersonForKariah = trpc.deadperson.upsertForKariah.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => showApiError(err),
  });

  return {
    createDeadPerson,
    updateDeadPerson,
    deleteDeadPerson,
    bulkDeleteDeadPersons,
    upsertDeadPersonForKariah,
  };
}