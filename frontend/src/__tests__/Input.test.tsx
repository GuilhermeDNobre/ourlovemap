import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../components/ui/Input';

describe('Input', () => {
  it('should render with label', () => {
    render(<Input label="Nome" />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(<Input placeholder="Digite aqui" />);
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument();
  });

  it('should display error message when error prop is provided', () => {
    render(<Input error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('should apply red border when error prop is provided', () => {
    render(<Input error="Erro" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-olm-error');
  });

  it('should not show error border when there is no error', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).not.toContain('border-olm-error');
  });

  it('should display help text when help prop is provided', () => {
    render(<Input help="Texto de ajuda" />);
    expect(screen.getByText('Texto de ajuda')).toBeInTheDocument();
  });

  it('should call onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });
});
