import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Step2Localizacoes } from '../../components/wizard/steps/Step2Localizacoes';
import { useWizardStore } from '../../stores/wizard-store';

jest.mock('../../components/wizard/AddressInput', () => ({
  AddressInput: ({ onPick }: { apiKey: string; onPick: (r: unknown) => void }) => (
    <input
      placeholder="Buscar endereço..."
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onPick({ address: e.target.value, latitude: 0, longitude: 0 })
      }
    />
  ),
}));

beforeEach(() => {
  useWizardStore.getState().reset();
});

function renderStep(onNext = jest.fn(), onBack = jest.fn()) {
  return render(
    <MemoryRouter>
      <Step2Localizacoes onNext={onNext} onBack={onBack} />
    </MemoryRouter>,
  );
}

describe('Step2Localizacoes', () => {
  it('should render 2 place cards by default', () => {
    renderStep();
    expect(screen.getAllByPlaceholderText('Buscar endereço...')).toHaveLength(2);
  });

  it('should add a place card when "Adicionar lugar" is clicked', async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole('button', { name: /Adicionar lugar/i }));
    expect(screen.getAllByPlaceholderText('Buscar endereço...')).toHaveLength(3);
  });

  it('should remove a place card when remove button is clicked', async () => {
    const user = userEvent.setup();
    renderStep();
    const removeButtons = screen.getAllByRole('button', { name: /Remover lugar/i });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText('Buscar endereço...')).toHaveLength(1);
  });

  it('should show upgrade modal when exceeding Basic plan limit', async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setPlan('basic');
    renderStep();
    const addBtn = screen.getByRole('button', { name: /Adicionar lugar/i });
    await user.click(addBtn); // 2 → 3 (at limit)
    await user.click(addBtn); // triggers modal
    await waitFor(() => {
      expect(screen.getByText('Upgrade para Premium')).toBeInTheDocument();
    });
  });

  it('should upgrade to premium and add place when confirmed in upgrade modal', async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setPlan('basic');
    renderStep();
    const addBtn = screen.getByRole('button', { name: /Adicionar lugar/i });
    await user.click(addBtn); // 2 → 3
    await user.click(addBtn); // modal
    await waitFor(() => screen.getByText('Upgrade para Premium'));
    await user.click(screen.getByRole('button', { name: /Fazer upgrade/i }));
    expect(useWizardStore.getState().plan).toBe('premium');
    expect(useWizardStore.getState().places).toHaveLength(4);
  });

  it('should display place count footer', () => {
    renderStep();
    const footer = document.querySelector('.text-xs.text-fg-3.mt-1') as HTMLElement;
    expect(footer?.textContent).toMatch(/2.*de.*3.*lugares.*Basic/i);
  });
});
