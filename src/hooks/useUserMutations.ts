import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetUserPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

const titleMessage = 'User';

export function useGetUsers(canView: boolean) {
  const { currentUser } = useAdminAccess();
  // Standardized: No input needed, backend uses session context
  const trpcRes = trpc.users.getUsers.useQuery(
    undefined, 
    { enabled: !!currentUser && canView }
  );
  return {
    data: trpcRes.data ?? [],
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function useGetUserPaginated({ page, pageSize, search }: useGetUserPaginatedParams) {
  const { currentUser, hasAdminAccess } = useAdminAccess();

  // 🔹 Standardized: Removed currentUser/checkRole from input
  const { data, isLoading, refetch, error } = trpc.users.getPaginated.useQuery(
    {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
      search: search || '',
    },
    { 
      enabled: hasAdminAccess && !!currentUser,
      keepPreviousData: true 
    }
  );

  return {
    userList: { items: data?.items ?? [], total: data?.total ?? 0 },
    totalPages: data ? Math.ceil(data.total / (pageSize ?? 10)) : 1,
    isLoading,
    refetch,
    error 
  };
}

export function useUserMutations() {
  const trpcUtils = trpc.useUtils();
  const invalidateAll = async () => {
    await trpcUtils.users.getPaginated.invalidate();
  };

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => { showSuccess(titleMessage, 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createUser, updateUser, deleteUser };
}