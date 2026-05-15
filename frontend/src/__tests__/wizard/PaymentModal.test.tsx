import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { PaymentModal } from '../../components/wizard/PaymentModal';

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const PIX_RESPONSE = {
  brCode: 'PIX_CODE_STRING',
  brCodeBase64: 'aW1hZ2VkYXRh',
  expiresAt: new Date(Date.now() + 600000).toISOString(),
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderModal(props: { mapId?: string; onClose?: () => void } = {}) {
  const { mapId = 'map123', onClose = jest.fn() } = props;
  return render(
    <PaymentModal isOpen mapId={mapId} onClose={onClose} />,
    { wrapper: makeWrapper() },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPost.mockImplementation((url: string) => {
    if (url.includes('pix-payment')) return Promise.resolve({ data: PIX_RESPONSE });
    if (url.includes('card-payment'))
      return Promise.resolve({ data: { checkoutUrl: 'https://checkout.example.com' } });
    return Promise.reject(new Error(`unhandled POST to ${url}`));
  });
  mockGet.mockResolvedValue({ data: { status: 'pending_payment' } });
});

describe('PaymentModal', () => {
  it('should show loading state initially then transition to pix view', async () => {
    renderModal();
    expect(screen.getByText(/Gerando QR Code PIX/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByAltText('QR Code PIX')).toBeInTheDocument();
    });
  });

  it('should show QR Code after PIX payment is generated', async () => {
    renderModal();
    await waitFor(() => {
      expect(screen.getByAltText('QR Code PIX')).toBeInTheDocument();
    });
    expect(screen.getByText('PIX_CODE_STRING')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar código/i })).toBeInTheDocument();
  });

  it('should show "Copiado!" feedback and call clipboard.writeText when copy is clicked', async () => {
    const spy = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderModal();
    await waitFor(() => {
      expect(screen.getByText('PIX_CODE_STRING')).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copiar código/i }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copiado!/i })).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith('PIX_CODE_STRING');
  });

  it('should show card payment form when card button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await waitFor(() => {
      expect(screen.getByText(/Pagar com cartão de crédito/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/Pagar com cartão de crédito/i));
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
  });

  it('should format CPF with mask as user types', async () => {
    const user = userEvent.setup();
    renderModal();
    await waitFor(() => {
      expect(screen.getByText(/Pagar com cartão de crédito/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/Pagar com cartão de crédito/i));
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');
    await user.type(cpfInput, '12345678901');
    expect((cpfInput as HTMLInputElement).value).toBe('123.456.789-01');
  });

  it('should show error state when PIX request fails', async () => {
    mockPost.mockRejectedValue(new Error('network error'));
    renderModal();
    await waitFor(() => {
      expect(screen.getByText(/Erro ao gerar QR Code/i)).toBeInTheDocument();
    });
  });

  it('should show success view when Fechar button is clicked after success state', async () => {
    mockGet.mockResolvedValue({ data: { status: 'active' } });
    const onClose = jest.fn();
    render(
      <PaymentModal isOpen mapId="map123" onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText(/Pagamento confirmado/i)).toBeInTheDocument();
    });
    await act(async () => {
      screen.getByRole('button', { name: /Fechar/i }).click();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should show Tentar novamente button in error state', async () => {
    mockPost.mockRejectedValue(new Error('network error'));
    renderModal();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    });
  });

  it('should show success state when polling returns active', async () => {
    mockGet.mockResolvedValue({ data: { status: 'active' } });
    renderModal();
    await waitFor(() => {
      expect(screen.getByText(/Pagamento confirmado/i)).toBeInTheDocument();
    });
  });
});
