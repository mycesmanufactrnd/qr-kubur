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
}: useGetUserPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.users.getPaginated.useQuery(
      {
        page,
        pageSize,
        search,
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

export function useCreateUser() {
  const trpcUtils = trpc.useUtils();

  return trpc.users.create.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'create');
      trpcUtils.users.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useUpdateUser() {
  const trpcUtils = trpc.useUtils();

  return trpc.users.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.users.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteUser() {
  const trpcUtils = trpc.useUtils();

  return trpc.users.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.users.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}