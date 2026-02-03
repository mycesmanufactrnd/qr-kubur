import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetPostsPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterTitle?: string;
};

const titleMessage = 'Activity Posts';

export function useGetActivityPostsPaginated({
  page,
  pageSize,
  filterTitle,
}: useGetPostsPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.activityPost.getPaginated.useQuery(
      { page, pageSize, filterTitle },
      { enabled: hasAdminAccess }
    );

  const activityPostsList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(activityPostsList.total / (pageSize ?? 10));

  return { activityPostsList, totalPages, isLoading, refetch, error };
}

export function useActivityPostMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.activityPost.getPaginated.invalidate();
  };

  const createPost = trpc.activityPost.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updatePost = trpc.activityPost.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deletePost = trpc.activityPost.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  return { createPost, updatePost, deletePost }
}
