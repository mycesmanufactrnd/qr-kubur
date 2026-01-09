import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

type useGetSuggestionPaginatedParams = {
  page?: number;
  pageSize?: number;
};

const titleMessage = 'Suggestion';

export function useGetSuggestionPaginated({
  page,
  pageSize,
}: useGetSuggestionPaginatedParams) {
  const { currentUser, hasAdminAccess, checkRole } = useAdminAccess();

  const { data, isLoading, refetch, error } =
    trpc.suggestion.getPaginated.useQuery(
      {
        page,
        pageSize,
        currentUser,
        checkRole
      },
      { enabled: hasAdminAccess && !!currentUser }
    );

  const suggestionList = {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };

  const totalPages = Math.ceil(suggestionList.total / pageSize);

  return { suggestionList, totalPages, isLoading, refetch, error };
}

// export function useCreateSuggestion() {
//   const trpcUtils = trpc.useUtils();

//   return trpc.suggestion.create.useMutation({
//     onSuccess: () => {
//       showSuccess(titleMessage, 'create');
//       trpcUtils.suggestion.getPaginated.invalidate();
//     },
//     onError: (err) => {
//       showApiError(err);
//     },
//   });
// }

export function useUpdateSuggestion() {
  const trpcUtils = trpc.useUtils();

  return trpc.suggestion.update.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'update');
      trpcUtils.suggestion.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}

export function useDeleteSuggestion() {
  const trpcUtils = trpc.useUtils();

  return trpc.suggestion.delete.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'delete');
      trpcUtils.suggestion.getPaginated.invalidate();
    },
    onError: (err) => {
      showApiError(err);
    },
  });
}
