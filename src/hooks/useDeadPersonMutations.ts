// hooks/useDeadPersonMutations.ts
import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

// Define parameters to match the filtering logic in ManageDeadPersons.jsx
type useGetDeadPersonPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterIC?: string;
  filterGrave?: number;
  filterState?: string;
  dateFrom?: string;
  dateTo?: string;
  accessibleOrgIds?: number[];
};

const titleMessage = 'Deceased Record';

export function useGetDeadPersonPaginated(params: useGetDeadPersonPaginatedParams) {
  const { data, isLoading, refetch, error } = 
    trpc.deadPerson.getPaginated.useQuery(params);

  return { 
    deadPersonsList: { 
      items: data?.items ?? [], 
      total: data?.total ?? 0 
    },
    isLoading, 
    refetch,
    error
  };
}

export function useCreateDeadPerson() {
  const utils = trpc.useUtils();

  return trpc.deadPerson.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      utils.deadPerson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateDeadPerson() {
  const utils = trpc.useUtils();

  return trpc.deadPerson.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      utils.deadPerson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteDeadPerson() {
  const trpcUtils = trpc.useUtils();

  return trpc.deadPerson.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.deadPerson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}