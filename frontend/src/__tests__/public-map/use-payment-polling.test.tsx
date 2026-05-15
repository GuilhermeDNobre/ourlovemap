import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { usePaymentPolling } from '../../hooks/use-payment-polling';

const mockGet = jest.fn();

jest.mock('../../lib/api', () => ({
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePaymentPolling', () => {
  it('should expose isExpired true and other flags false when status is expired', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map-1'], { status: 'expired' });
    const { result } = renderHook(() => usePaymentPolling('map-1'), { wrapper: makeWrapper(queryClient) });
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isFailed).toBe(false);
  });

  it('should expose isActive true and other flags false when status is active', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map-2'], { status: 'active' });
    const { result } = renderHook(() => usePaymentPolling('map-2'), { wrapper: makeWrapper(queryClient) });
    expect(result.current.isActive).toBe(true);
    expect(result.current.isFailed).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('should expose isFailed true and other flags false when status is payment_failed', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map-3'], { status: 'payment_failed' });
    const { result } = renderHook(() => usePaymentPolling('map-3'), { wrapper: makeWrapper(queryClient) });
    expect(result.current.isFailed).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('should have all derived flags false when status is pending_payment', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map-4'], { status: 'pending_payment' });
    const { result } = renderHook(() => usePaymentPolling('map-4'), { wrapper: makeWrapper(queryClient) });
    expect(result.current.isActive).toBe(false);
    expect(result.current.isFailed).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('should not fetch when mapId is null', () => {
    const queryClient = makeClient();
    const { result } = renderHook(() => usePaymentPolling(null), { wrapper: makeWrapper(queryClient) });
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should stop polling for expired status — refetchInterval returns false for non-pending statuses', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map-5'], { status: 'expired' });
    renderHook(() => usePaymentPolling('map-5'), { wrapper: makeWrapper(queryClient) });
    const query = queryClient.getQueryCache().find({ queryKey: ['payment-status', 'map-5'] });
    const options = query?.options;
    const refetchInterval =
      typeof options?.refetchInterval === 'function'
        ? options.refetchInterval(query as Parameters<typeof options.refetchInterval>[0])
        : options?.refetchInterval;
    expect(refetchInterval).toBe(false);
  });
});
