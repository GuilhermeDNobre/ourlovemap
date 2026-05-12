import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface PaymentStatus {
  status: 'pending_payment' | 'active' | 'payment_failed';
}

export function usePaymentPolling(mapId: string | null) {
  const query = useQuery({
    queryKey: ['payment-status', mapId],
    queryFn: async () => {
      const response = await api.get<PaymentStatus>(`/api/maps/${mapId}/payment-status`);
      return response.data;
    },
    enabled: !!mapId,
    refetchInterval: (q) => {
      const data = q.state.data as PaymentStatus | undefined;
      return data?.status === 'pending_payment' ? 3000 : false;
    },
    staleTime: 0,
  });
  return {
    ...query,
    isActive: query.data?.status === 'active',
    isFailed: query.data?.status === 'payment_failed',
  };
}
