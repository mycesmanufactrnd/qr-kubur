import { trpc } from '@/utils/trpc';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

const titleMessage = 'Islamic Events';

export function useIslamicEventMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.islamicEvent.getEventsByHijriYear.invalidate();
  };

  const createEvent = trpc.islamicEvent.create.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'create'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const updateEvent = trpc.islamicEvent.update.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'update'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });

  const deleteEvent = trpc.islamicEvent.delete.useMutation({
    onSuccess: () => { 
      showSuccess(titleMessage, 'delete'); 
      invalidateAll(); 
    },
    onError: (err) => showApiError(err),
  });


  return { createEvent, updateEvent, deleteEvent }
}