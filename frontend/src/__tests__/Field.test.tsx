import { render, screen } from '@testing-library/react';
import { Field } from '../components/ui/Field';

describe('Field', () => {
  it('should render children', () => {
    render(<Field><input /></Field>);
    expect(document.querySelector('input')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<Field label="Nome"><input /></Field>);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('should render error message when error prop is provided', () => {
    render(<Field error="Campo obrigatório"><input /></Field>);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('should render help text when help prop is provided', () => {
    render(<Field help="Texto de ajuda"><input /></Field>);
    expect(screen.getByText('Texto de ajuda')).toBeInTheDocument();
  });

  it('should prefer error over help text when both are provided', () => {
    render(<Field error="Erro" help="Ajuda"><input /></Field>);
    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(screen.queryByText('Ajuda')).not.toBeInTheDocument();
  });
});
