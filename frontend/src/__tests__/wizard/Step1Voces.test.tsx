import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Step1Voces } from '../../components/wizard/steps/Step1Voces';
import { useWizardStore } from '../../stores/wizard-store';

beforeEach(() => {
  useWizardStore.getState().reset();
});

function renderStep(onNext = jest.fn()) {
  return render(
    <MemoryRouter>
      <Step1Voces onNext={onNext} />
    </MemoryRouter>,
  );
}

describe('Step1Voces', () => {
  it('should render all fields', () => {
    renderStep();
    expect(screen.getByPlaceholderText(/Ex: Ana e Lucas/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/9 0000-0000/)).toBeInTheDocument();
  });

  it('should show validation error when names is empty on submit', async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(screen.getByText('Informe os nomes do casal')).toBeInTheDocument();
    });
  });

  it('should show validation error when startDate is empty on submit', async () => {
    const user = userEvent.setup();
    renderStep();
    await user.type(screen.getByPlaceholderText(/Ex: Ana e Lucas/i), 'Ana e João');
    await user.type(screen.getByPlaceholderText(/Nome completo/i), 'João Silva');
    await user.type(screen.getByPlaceholderText(/9 0000-0000/), '11999999999');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(screen.getByText('Informe a data de início')).toBeInTheDocument();
    });
  });

  it('should call onNext when form is valid', async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    renderStep(onNext);
    await user.type(screen.getByPlaceholderText(/Ex: Ana e Lucas/i), 'Ana e João');
    await user.type(screen.getByPlaceholderText(/Nome completo/i), 'João Silva');
    await user.type(screen.getByPlaceholderText(/9 0000-0000/), '11999999999');
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, '2024-01-01');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(onNext).toHaveBeenCalled();
    });
  });
});
