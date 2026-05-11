import { render, screen, fireEvent } from '@testing-library/react';
import { FAQ } from '../components/landing/FAQ';

describe('FAQ', () => {
  it('should render all questions', () => {
    render(<FAQ />);
    expect(screen.getByText('Quanto tempo a página fica online?')).toBeInTheDocument();
    expect(screen.getByText('Posso editar após o pagamento?')).toBeInTheDocument();
    expect(screen.getByText('Como recebo o QR Code?')).toBeInTheDocument();
    expect(screen.getByText('Funciona bem no celular?')).toBeInTheDocument();
    expect(screen.getByText('Posso adicionar mais localizações depois?')).toBeInTheDocument();
  });

  it('should open an item when clicked', () => {
    render(<FAQ />);
    const firstQuestion = screen.getByText('Quanto tempo a página fica online?').closest('button')!;
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/No plano Básico/)).toBeInTheDocument();
  });

  it('should close an item when clicked again', () => {
    render(<FAQ />);
    const firstQuestion = screen.getByText('Quanto tempo a página fica online?').closest('button')!;

    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close the previous item when a new one is opened', () => {
    render(<FAQ />);
    const first = screen.getByText('Quanto tempo a página fica online?').closest('button')!;
    const second = screen.getByText('Posso editar após o pagamento?').closest('button')!;

    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});
