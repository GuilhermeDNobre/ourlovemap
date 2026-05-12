import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { PublicMap } from '../../components/public-map/PublicMap';

const mockGet = jest.fn();

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

const MAP_DATA = {
  coupleName: 'Ana e João',
  opening: 'Nossa história',
  relationshipStartDate: '2020-01-01',
  youtubeVideoId: null,
  youtubeStartTime: null,
  youtubeEndTime: null,
  locations: [
    {
      title: 'Café do Amor',
      description: 'Nosso primeiro encontro',
      message: null,
      photoUrl: null,
      latitude: -23.5,
      longitude: -46.6,
      order: 0,
    },
    {
      title: 'Parque Ibirapuera',
      description: 'Nossa segunda data',
      message: null,
      photoUrl: null,
      latitude: -23.6,
      longitude: -46.7,
      order: 1,
    },
  ],
};

function makeWrapper(path = '/acesso?token=abc123') {
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

describe('PublicMap', () => {
  it('should show loading spinner initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<PublicMap />, { wrapper: makeWrapper() });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show AccessError with "Acesso inválido" on 401', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    render(<PublicMap />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Acesso inválido')).toBeInTheDocument();
    });
  });

  it('should show AccessError with upgrade CTA on 403 map_expired', async () => {
    mockGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: 'map_expired' } },
    });
    render(<PublicMap />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Seu acesso expirou')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Fazer upgrade para Premium/i })).toBeInTheDocument();
  });

  it('should render CoverScreen opening and PlaceSection titles on 200', async () => {
    mockGet.mockResolvedValue({ data: MAP_DATA });
    render(<PublicMap />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Nossa história')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Café do Amor/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Parque Ibirapuera/).length).toBeGreaterThan(0);
  });
});
