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
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePaymentPolling', () => {
  it('should have isActive false and isFailed false for pending_payment status', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map1'], { status: 'pending_payment' });
    const { result } = renderHook(() => usePaymentPolling('map1'), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.isActive).toBe(false);
    expect(result.current.isFailed).toBe(false);
  });

  it('should set isActive to true when cached data has active status', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map2'], { status: 'active' });
    const { result } = renderHook(() => usePaymentPolling('map2'), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.isActive).toBe(true);
    expect(result.current.isFailed).toBe(false);
  });

  it('should set isFailed to true when cached data has payment_failed status', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map3'], { status: 'payment_failed' });
    const { result } = renderHook(() => usePaymentPolling('map3'), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.isFailed).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('should not fetch when mapId is null', () => {
    const queryClient = makeClient();
    const { result } = renderHook(() => usePaymentPolling(null), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should use query key with mapId', () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['payment-status', 'map99'], { status: 'active' });
    const { result } = renderHook(() => usePaymentPolling('map99'), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.isActive).toBe(true);
  });
});
