import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';

type useGetActivityPostsPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterTitle?: string;
  mosqueId?: number | null;
  tahfizId?: number | null;
};

const titleMessage = 'Activity Posts';

export function useGetActivityPostsByRelationId({ 
  mosqueId, 
  tahfizId 
} : useGetActivityPostsPaginatedParams) {
  const { currentUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const { data, isLoading, isError } = trpc.activityPost.getPaginated.useQuery(
    { 
      page: 1,
      pageSize: 5,
      mosqueId, 
      tahfizId,
      isSuperAdmin
    },
    { enabled: !!mosqueId || !!tahfizId }
  );

  return { 
    data: data?.items ?? [], 
    isLoading, 
    isError 
  };
}

export function useGetActivityPostsPaginated({ 
  page, 
  pageSize, 
  filterTitle 
} : useGetActivityPostsPaginatedParams) {
  const { hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.activityPost.getPaginated.useQuery(
    { 
      page, 
      pageSize, 
      filterTitle,
      isSuperAdmin 
    },
    { enabled: hasAdminAccess }
  );

  const activityPostsList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(activityPostsList.total / (pageSize ?? 10));

  return { activityPostsList, totalPages, isLoading, refetch, error };
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