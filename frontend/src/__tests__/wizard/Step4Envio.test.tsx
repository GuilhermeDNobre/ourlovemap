import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Step4Envio } from '../../components/wizard/steps/Step4Envio';
import { useWizardStore } from '../../stores/wizard-store';

const mockPost = jest.fn();

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
}));

beforeEach(() => {
  useWizardStore.getState().reset();
  jest.clearAllMocks();
  mockPost.mockResolvedValue({ data: { mapId: 'test-map-id' } });
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function renderStep(onBack = jest.fn()) {
  return render(<Step4Envio onBack={onBack} />, { wrapper: makeWrapper() });
}

describe('Step4Envio', () => {
  it('should render email fields and finalize button', () => {
    renderStep();
    expect(screen.getAllByPlaceholderText('seu@email.com')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Finalizar compra/i })).toBeInTheDocument();
  });

  it('should have "Finalizar compra" disabled initially', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /Finalizar compra/i })).toBeDisabled();
  });

  it('should disable "Finalizar compra" when emails diverge', async () => {
    const user = userEvent.setup();
    renderStep();
    const [emailInput, confirmInput] = screen.getAllByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'test@example.com');
    await user.type(confirmInput, 'other@example.com');
    expect(screen.getByRole('button', { name: /Finalizar compra/i })).toBeDisabled();
  });

  it('should show error message when emails diverge', async () => {
    const user = userEvent.setup();
    renderStep();
    const [emailInput, confirmInput] = screen.getAllByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'test@example.com');
    await user.type(confirmInput, 'other@example.com');
    await waitFor(() => {
      expect(screen.getByText('Os emails não coincidem')).toBeInTheDocument();
    });
  });

  it('should enable "Finalizar compra" when emails match and are valid', async () => {
    const user = userEvent.setup();
    renderStep();
    const [emailInput, confirmInput] = screen.getAllByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'test@example.com');
    await user.type(confirmInput, 'test@example.com');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finalizar compra/i })).not.toBeDisabled();
    });
  });

  it('should show summary card with store data', () => {
    useWizardStore.getState().setField('names', 'Ana e João');
    useWizardStore.getState().addPlace({
      id: '1',
      title: 'Café',
      address: 'Rua X',
      description: '',
      photo: null,
      latitude: 1,
      longitude: 1,
    });
    renderStep();
    expect(screen.getByText('Ana e João')).toBeInTheDocument();
    expect(screen.getByText('Resumo do pedido')).toBeInTheDocument();
  });

  it('should switch to premium when Premium plan button is clicked', async () => {
    const user = userEvent.setup();
    renderStep();
    const premiumBtn = screen.getByRole('button', { name: /Premium/i });
    await user.click(premiumBtn);
    expect(useWizardStore.getState().plan).toBe('premium');
  });

  it('should switch back to basic when Basic plan button is clicked', async () => {
    useWizardStore.getState().setPlan('premium');
    const user = userEvent.setup();
    renderStep();
    const basicBtn = screen.getByRole('button', { name: /Basic/i });
    await user.click(basicBtn);
    expect(useWizardStore.getState().plan).toBe('basic');
  });

  it('should show warning banner', () => {
    renderStep();
    expect(screen.getByText(/QR Code e o link de edição vão/i)).toBeInTheDocument();
    expect(screen.getByText(/APENAS para esse email/i)).toBeInTheDocument();
  });

  it('should call POST /api/maps after valid form submission', async () => {
    const user = userEvent.setup();
    renderStep();
    const [emailInput, confirmInput] = screen.getAllByPlaceholderText('seu@email.com');
    await user.type(emailInput, 'test@example.com');
    await user.type(confirmInput, 'test@example.com');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finalizar compra/i })).not.toBeDisabled();
    });
    await user.click(screen.getByRole('button', { name: /Finalizar compra/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/maps', expect.any(FormData));
    });
  });
});
