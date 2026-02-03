import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

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
    trpc.deadperson.getPaginated.useQuery(params);

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

export function useDeadPersonMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.deadperson.getPaginated.invalidate();
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

  return { createDeadPerson, updateDeadPerson, deleteDeadPerson };
}