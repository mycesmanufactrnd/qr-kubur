import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

const titleMessage = 'Activity Posts';

// Hook for Public Mosque/Tahfiz Details
export function useGetActivityPosts({ mosqueId, tahfizId }) {
  const { data, isLoading, isError } = trpc.activityPost.getPaginated.useQuery(
    { 
      mosqueId, 
      tahfizId, 
      pageSize: 20 
    },
    { enabled: !!mosqueId || !!tahfizId }
  );

  return { 
    data: data?.items ?? [], 
    isLoading, 
    isError 
  };
}

// Hook for Admin Dashboard Table
export function useGetActivityPostsPaginated({ page, pageSize, filterTitle }) {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading, refetch, error } = trpc.activityPost.getPaginated.useQuery(
    { page, pageSize, filterTitle },
    { enabled: hasAdminAccess }
  );

  return { 
    activityPostsList: { items: data?.items ?? [], total: data?.total ?? 0 }, 
    isLoading, 
    refetch, 
    error 
  };
}

export function useActivityPostMutations() {
  const trpcUtils = trpc.useUtils();
  const invalidateAll = () => trpcUtils.activityPost.getPaginated.invalidate();

  const createPost = trpc.activityPost.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updatePost = trpc.activityPost.update.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deletePost = trpc.activityPost.delete.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createPost, updatePost, deletePost };
}