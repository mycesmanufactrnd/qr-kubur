import { trpc } from "@/utils/trpc";
import { showApiError, showSuccess } from "@/components/ToastrNotification";

const titleMessage = "Grave Block";

export function useGetGraveBlocks(graveId?: number | string | null) {
  const id = graveId ? Number(graveId) : null;
  return trpc.graveMapping.getBlocksByGrave.useQuery(
    { graveId: id },
    { enabled: !!id },
  );
}

export function useGetGraveSlotOptions(graveId?: number | string | null) {
  const id = graveId ? Number(graveId) : null;
  return trpc.graveMapping.getSlotOptionsByGrave.useQuery(
    { graveId: id },
    { enabled: !!id },
  );
}

export function useGraveBlockMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.graveMapping.getBlocksByGrave.invalidate();
    trpcUtils.graveMapping.getSlotOptionsByGrave.invalidate();
  };

  const createBlock = trpc.graveMapping.createBlock.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "create");
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const updateBlock = trpc.graveMapping.updateBlock.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "update");
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const deleteBlock = trpc.graveMapping.deleteBlock.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, "delete");
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const updateSlot = trpc.graveMapping.updateSlot.useMutation({
    onSuccess: () => {
      showSuccess("Grave Slot", "update");
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { createBlock, updateBlock, deleteBlock, updateSlot };
}
