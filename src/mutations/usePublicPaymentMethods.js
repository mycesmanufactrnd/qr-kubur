import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/utils';

export function usePublicPaymentMethods(entityType, entityId) {
  return useQuery({
    queryKey: ['public-payment-methods', entityType, Number(entityId)],
    enabled: ['organisation', 'tahfiz'].includes(entityType) && Number(entityId) > 0,
    placeholderData: undefined,
    queryFn: async ({ signal }) => {
      const response = await fetch(apiUrl(`/api/payment-display/${entityType}/${Number(entityId)}`), { signal });
      if (!response.ok) throw new Error('Payment details unavailable');
      return response.json();
    },
  });
}
