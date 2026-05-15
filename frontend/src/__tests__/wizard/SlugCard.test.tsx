import { render, screen } from '@testing-library/react';
import { SlugCard } from '../../components/wizard/SlugCard';

describe('SlugCard', () => {
  it('should render the base URL', () => {
    render(<SlugCard names="Ana e Lucas" />);
    expect(screen.getByText(/ourlovemap\.com\.br\//)).toBeInTheDocument();
  });

  it('should render slugified names', () => {
    render(<SlugCard names="Ana e Lucas" />);
    expect(screen.getByText('ana-e-lucas')).toBeInTheDocument();
  });

  it('should render fallback slug when names is empty', () => {
    render(<SlugCard names="" />);
    expect(screen.getByText('seu-mapa')).toBeInTheDocument();
  });

  it('should render token protection note', () => {
    render(<SlugCard names="Maria e João" />);
    expect(screen.getByText(/token/i)).toBeInTheDocument();
  });
});
