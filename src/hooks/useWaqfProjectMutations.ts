import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetWaqfPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterWaqfName?: string;
};

const titleMessage = 'Waqf Project';

export function useGetWaqfProjectPaginated({
  page,
  pageSize,
  filterWaqfName
}: useGetWaqfPaginatedParams) {

  const { data, isLoading, refetch, error } =
    trpc.waqfProject.getPaginated.useQuery(
      { page, pageSize, filterWaqfName },
      { enabled: true }
    );

  const waqfList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(waqfList.total / (pageSize ?? 10));

  const waqfStats = data?.stats ?? {
    total: 0,
    active: 0,
    completed: 0,
  };

  return { waqfList, waqfStats, totalPages, isLoading, refetch, error };
}

export function useWaqfProjectMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.waqfProject.getPaginated.invalidate();
  };

  const createWaqfProject = trpc.waqfProject.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateWaqfProject = trpc.waqfProject.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteWaqfProject = trpc.waqfProject.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createWaqfProject, updateWaqfProject, deleteWaqfProject };
}

export function useGetWaqfProjectById(id: number | null) {
  return trpc.waqfProject.getWaqfById.useQuery({ id: id as number }, { enabled: !!id });
}

export function useGetWaqfProject(
  page: number,
  pageSize: number,
  filters?: Record<string, string>
) {
  return trpc.waqfProject.getWaqfProject.useQuery(
    { 
      page,
      pageSize,
      filters: filters ?? {} 
    },
    { enabled: true }
  );
}