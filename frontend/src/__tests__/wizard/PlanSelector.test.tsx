import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PlanSelector } from '../../components/wizard/PlanSelector';
import { useWizardStore } from '../../stores/wizard-store';

beforeEach(() => {
  useWizardStore.getState().reset();
});

function renderSelector(search = '', onConfirm = jest.fn()) {
  return render(
    <MemoryRouter initialEntries={[`/criar${search}`]}>
      <PlanSelector onConfirm={onConfirm} />
    </MemoryRouter>,
  );
}

describe('PlanSelector', () => {
  it('should render Basic and Premium plan cards', () => {
    renderSelector();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should pre-select premium plan from ?plano=premium query param', () => {
    renderSelector('?plano=premium');
    expect(useWizardStore.getState().plan).toBe('premium');
  });

  it('should select a plan when card is clicked', async () => {
    const user = userEvent.setup();
    renderSelector();
    await user.click(screen.getByText('Premium').closest('button')!);
    expect(useWizardStore.getState().plan).toBe('premium');
  });

  it('should call onConfirm when continue button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderSelector('', onConfirm);
    await user.click(screen.getByRole('button', { name: /Continuar com/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
