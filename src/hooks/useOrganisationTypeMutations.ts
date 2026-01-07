import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { base44 } from '@/api/base44Client';
import { showSuccess } from '@/components/ToastrNotification';
import { isSupabaseMode } from '@/utils/auth';

type Base44OrgTypeInput = {
  id?: string;
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
};

const titleMessage = 'Organisation Type';

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
      mutationFn: (data: Base44OrgTypeInput) => base44.entities.OrganisationType.create(data),
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
      mutationFn: ({ id, ...data }: Base44OrgTypeInput) => {
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
      mutationFn: (id: string) => base44.entities.OrganisationType.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organisationTypes'] });
        showSuccess('delete', titleMessage);
      },
    });
  }
}
