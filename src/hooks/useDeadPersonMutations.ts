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

export function useCreateDeadPerson() {
  const utils = trpc.useUtils();

  return trpc.deadperson.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      utils.deadperson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateDeadPerson() {
  const utils = trpc.useUtils();

  return trpc.deadperson.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      utils.deadperson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteDeadPerson() {
  const trpcUtils = trpc.useUtils();

  return trpc.deadperson.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.deadperson.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}