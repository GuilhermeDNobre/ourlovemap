import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { Step4Envio } from '../../components/wizard/steps/Step4Envio';
import { useWizardStore } from '../../stores/wizard-store';

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function setupStore() {
  const state = useWizardStore.getState();
  state.setField('names', 'Ana e Pedro');
  state.setField('buyerName', 'Pedro Silva');
  state.setField('buyerPhone', '11999999999');
  state.setField('startDate', '2020-06-15');
  state.addPlace({
    id: '1',
    title: 'Parque',
    address: 'Rua A',
    description: '',
    photo: null,
    latitude: -23.5,
    longitude: -46.6,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useWizardStore.getState().reset();
  mockGet.mockResolvedValue({ data: { status: 'pending_payment' } });
  mockPost.mockImplementation((url: string) => {
    if (url === '/api/maps') return Promise.resolve({ data: { mapId: 'new-map-id' } });
    if (url.includes('pix-payment'))
      return Promise.resolve({
        data: {
          brCode: 'PIX_CODE',
          brCodeBase64: 'aW1hZ2U=',
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
      });
    return Promise.reject(new Error('unhandled'));
  });
});

describe('payment-flow integration', () => {
  async function typeAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    const [emailInput, confirmInput] = screen.getAllByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'pedro@example.com');
    await user.type(confirmInput, 'pedro@example.com');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finalizar compra/i })).not.toBeDisabled();
    });
    await user.click(screen.getByRole('button', { name: /Finalizar compra/i }));
  }

  it('should call POST /api/maps with FormData when finalizar is clicked', async () => {
    setupStore();
    const user = userEvent.setup();
    render(<Step4Envio onBack={jest.fn()} />, { wrapper: makeWrapper() });
    await typeAndSubmit(user);
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/maps', expect.any(FormData));
    });
  });

  it('should save mapId to store after successful POST', async () => {
    setupStore();
    const user = userEvent.setup();
    render(<Step4Envio onBack={jest.fn()} />, { wrapper: makeWrapper() });
    await typeAndSubmit(user);
    await waitFor(() => {
      expect(useWizardStore.getState().mapId).toBe('new-map-id');
    });
  });

  it('should display error message when backend returns 422 and plan is basic with >3 places', async () => {
    setupStore();
    useWizardStore.getState().addPlace({ id: '2', title: 'Café', address: 'Rua B', description: '', photo: null, latitude: -23.6, longitude: -46.7 });
    useWizardStore.getState().addPlace({ id: '3', title: 'Bar', address: 'Rua C', description: '', photo: null, latitude: -23.7, longitude: -46.8 });
    useWizardStore.getState().addPlace({ id: '4', title: 'Praia', address: 'Rua D', description: '', photo: null, latitude: -23.8, longitude: -46.9 });
    mockPost.mockRejectedValue({ isAxiosError: true, response: { status: 422 } });
    const user = userEvent.setup();
    render(<Step4Envio onBack={jest.fn()} />, { wrapper: makeWrapper() });
    await typeAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/plano Basic permite apenas 3/i)).toBeInTheDocument();
  });

  it('should show generic error for 400 response', async () => {
    setupStore();
    mockPost.mockRejectedValue({ isAxiosError: true, response: { status: 400 } });
    const user = userEvent.setup();
    render(<Step4Envio onBack={jest.fn()} />, { wrapper: makeWrapper() });
    await typeAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Requisição inválida/i)).toBeInTheDocument();
  });
});
