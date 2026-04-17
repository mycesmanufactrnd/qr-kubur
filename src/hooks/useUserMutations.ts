import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetUserPaginatedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  organisationId?: number | null;
};

const titleMessage = 'User';

export function useGetUsers(canView: boolean) {
  const { 
    currentUser, 
    checkRole
  } = useAdminAccess();

  const trpcRes = trpc.users.getUsers.useQuery(
    { currentUser, checkRole },
    { enabled: !!currentUser && canView }
  );
  return {
    data: trpcRes.data ?? [],
    isLoading: trpcRes.isLoading,
    refetch: trpcRes.refetch,
  };
}

export function useGetUserPaginated({
  page,
  pageSize,
  search,
  organisationId,
}: useGetUserPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.users.getPaginated.useQuery(
      {
        page,
        pageSize,
        search,
        organisationId,
        currentUser,
        checkRole,
      },
      { enabled: hasAdminAccess && !!currentUser }
    );

  const userList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = pageSize ? Math.ceil(userList.total / pageSize) : 1;

  return { userList, totalPages, isLoading, refetch, error };
}

export function useUserMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = async () => {
    await trpcUtils.users.getPaginated.invalidate();
  };

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      invalidateAll();
    },
    onError: (err) => {
      showApiError(err);
    },
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      invalidateAll();
    },
    onError: (err) => {
      showApiError(err);
    },
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      invalidateAll();
    },
    onError: (err) => {
      showApiError(err);
    },
  });

  return { createUser, updateUser, deleteUser }
}
