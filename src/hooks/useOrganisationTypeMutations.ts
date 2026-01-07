import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { base44 } from '@/api/base44Client';
import { showSuccess } from '@/components/ToastrNotification';
import { isSupabaseMode } from '@/utils/auth';

const titleMessage = 'Organisation Type';

export function useGetOrganisationType(isSuperAdmin) {
  if (isSupabaseMode) {
    
  } else {
    const base44Res = useQuery({
      queryKey: ['organisationTypes'],
      queryFn: () => base44.entities.OrganisationType.list('-created_date'),
      enabled: !isSupabaseMode && isSuperAdmin,
    });
    return {
      data: base44Res.data ?? [],
      isLoading: base44Res.isLoading,
      refetch: base44Res.refetch,
    };
  }
}

export function useCreateOrganisationType() {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  if (isSupabaseMode) {
    return trpc.organisationType.createType.useMutation({
      onSuccess: () => {
        trpcUtils.organisationType.getTypes.invalidate();
        showSuccess('create', titleMessage);
      },
    });
  } else {
    return useMutation({
      mutationFn: (data: any) => base44.entities.OrganisationType.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organisationTypes'] });
        showSuccess('create', titleMessage);
      },
    });
  }
}

export function useUpdateOrganisationType() {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  if (isSupabaseMode) {
    return trpc.organisationType.updateType.useMutation({
      onSuccess: () => {
        trpcUtils.organisationType.getTypes.invalidate();
        showSuccess('update', titleMessage);
      },
    });
  } else {
    return useMutation({
      mutationFn: ({ id, ...data }: any) => {
        if (!id) throw new Error('Missing Base44 ID');
        return base44.entities.OrganisationType.update(id, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organisationTypes'] });
        showSuccess('update', titleMessage);
      },
    });
  }
}

export function useDeleteOrganisationType() {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  if (isSupabaseMode) {
    return trpc.organisationType.deleteType.useMutation({
      onSuccess: () => {
        trpcUtils.organisationType.getTypes.invalidate();
        showSuccess('delete', titleMessage);
      },
    });
  } else {
    return useMutation({
      mutationFn: (id: any) => base44.entities.OrganisationType.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organisationTypes'] });
        showSuccess('delete', titleMessage);
      },
    });
  }
}
