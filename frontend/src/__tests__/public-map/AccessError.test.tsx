import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { AccessError } from '../../components/public-map/AccessError';

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('AccessError', () => {
  it('should show "Acesso inválido" for status 401 with no CTA', () => {
    render(<AccessError status={401} />, { wrapper: Wrapper });
    expect(screen.getByText('Acesso inválido')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should show "Seu acesso expirou" and upgrade CTA for 403 map_expired', () => {
    render(<AccessError status={403} errorCode="map_expired" />, { wrapper: Wrapper });
    expect(screen.getByText('Seu acesso expirou')).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /Fazer upgrade para Premium/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/');
  });

  it('should show "Acesso negado" for 403 without map_expired code', () => {
    render(<AccessError status={403} />, { wrapper: Wrapper });
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
