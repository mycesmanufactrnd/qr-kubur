import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { trpc } from "@/utils/trpc";

export function useGetConfigByEntity({
  entityId,
  entityType,
  enabled = false,
}: {
  entityId?: number;
  entityType?: string;
  enabled?: boolean;
}) {
  const organisationQuery =
    trpc.organisationPaymentConfig.getConfigByOrganisationId.useQuery(
      { organisation: entityId ? { id: entityId } : undefined },
      {
        enabled: enabled && entityType === 'organisation' && !!entityId,
        retry: false,
        trpc: { context: { skipBatch: true } },
      }
    );

  const tahfizQuery =
    trpc.tahfizPaymentConfig.getConfigByTahfizId.useQuery(
      { tahfiz: entityId ? { id: entityId } : undefined },
      {
        enabled: enabled && entityType === 'tahfiz' && !!entityId,
        retry: false,
        trpc: { context: { skipBatch: true } },
      }
    );

  const data =
    entityType === 'organisation'
      ? organisationQuery.data
      : entityType === 'tahfiz'
        ? tahfizQuery.data
        : [];

  return {
    data: data ?? [],
    isLoading: organisationQuery.isLoading || tahfizQuery.isLoading,
  };
}


export function useUpsertConfigByEntity() {
  const trpcUtils = trpc.useUtils();

  const orgMutation = trpc.organisationPaymentConfig.upsert.useMutation({
    onSuccess: () => {
      trpcUtils.organisationPaymentConfig.getConfigByOrganisationId.invalidate();
      showSuccess("Payment Configuration", "save");
    },
    onError: (err) => showApiError(err),
  });

  const tahfizMutation = trpc.tahfizPaymentConfig.upsert.useMutation({
    onSuccess: () => {
      trpcUtils.tahfizPaymentConfig.getConfigByTahfizId.invalidate();
      showSuccess("Payment Configuration", "save");
    },
    onError: (err) => showApiError(err),
  });

  return {
    mutateAsync: async (payload: { organisationId?: number; tahfizId?: number; configs: any[] }) => {
      if (payload.organisationId) {
        return orgMutation.mutateAsync(payload as {
          organisationId: number;
          configs: { paymentPlatformId: number; paymentFieldId: number; value: string }[];
        });
      } else if (payload.tahfizId) {
        return tahfizMutation.mutateAsync(payload as {
          tahfizId: number;
          configs: { paymentPlatformId: number; paymentFieldId: number; value: string }[];
        });
      } else {
        throw new Error("Payload must include organisationId or tahfizId");
      }
    },
    orgMutation,
    tahfizMutation,
  };
}
