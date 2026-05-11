import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Pricing } from '../components/landing/Pricing';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderPricing() {
  return render(
    <MemoryRouter>
      <Pricing />
    </MemoryRouter>,
  );
}

describe('Pricing', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render both plan names', () => {
    renderPricing();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should render plan prices', () => {
    renderPricing();
    expect(screen.getByText(/R\$19/)).toBeInTheDocument();
    expect(screen.getByText(/R\$29/)).toBeInTheDocument();
  });

  it('should navigate to /criar?plano=basic when Basic CTA is clicked', () => {
    renderPricing();
    fireEvent.click(screen.getByText('Começar pelo básico'));
    expect(mockNavigate).toHaveBeenCalledWith('/criar?plano=basic');
  });

  it('should navigate to /criar?plano=premium when Premium CTA is clicked', () => {
    renderPricing();
    fireEvent.click(screen.getByText('Criar nosso mapa Premium'));
    expect(mockNavigate).toHaveBeenCalledWith('/criar?plano=premium');
  });

  it('should show "Mais escolhido" badge on Premium', () => {
    renderPricing();
    expect(screen.getByText('Mais escolhido')).toBeInTheDocument();
  });
});
