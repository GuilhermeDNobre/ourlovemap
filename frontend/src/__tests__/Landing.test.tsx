import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routeConfig } from '../routes';

function renderLanding() {
  const router = createMemoryRouter(routeConfig, { initialEntries: ['/'] });
  render(<RouterProvider router={router} />);
}

describe('Landing', () => {
  it('should render without errors (smoke test)', () => {
    renderLanding();
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('should render Navbar', () => {
    renderLanding();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('should render hero headline', () => {
    renderLanding();
    expect(screen.getByText(/O mapa de tudo/)).toBeInTheDocument();
  });

  it('should render How It Works section', () => {
    renderLanding();
    expect(screen.getAllByText('Como funciona').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Três passos/)).toBeInTheDocument();
  });

  it('should render Pricing section', () => {
    renderLanding();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should render FAQ section', () => {
    renderLanding();
    expect(screen.getByText('Quanto tempo a página fica online?')).toBeInTheDocument();
  });
});
