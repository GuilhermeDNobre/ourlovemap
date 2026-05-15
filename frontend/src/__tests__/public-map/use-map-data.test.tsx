import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { useMapData } from '../../hooks/use-map-data';

const mockGet = jest.fn();

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

const MAP_DATA = {
  coupleName: 'Ana e João',
  relationshipStartDate: '2020-01-01',
  youtubeVideoId: null,
  youtubeStartTime: null,
  youtubeEndTime: null,
  locations: [],
};

function makeWrapper(path = '/acesso?token=test-token') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMapData', () => {
  it('should return data correctly on 200 response', async () => {
    mockGet.mockResolvedValue({ data: MAP_DATA });
    const { result } = renderHook(() => useMapData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MAP_DATA);
    expect(mockGet).toHaveBeenCalledWith('/api/maps/by-token?token=test-token');
  });

  it('should set isError to true on 401 response', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    const { result } = renderHook(() => useMapData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should expose error.response.status 403 on 403 response', async () => {
    const err = { isAxiosError: true, response: { status: 403, data: { code: 'map_expired' } } };
    mockGet.mockRejectedValue(err);
    const { result } = renderHook(() => useMapData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as typeof err).response.status).toBe(403);
  });

  it('should not fetch when token is absent', () => {
    const { result } = renderHook(() => useMapData(), { wrapper: makeWrapper('/acesso') });
    expect(result.current.isPending).toBe(true);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
