import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routeConfig } from '../routes';

function renderRoute(path: string) {
  const router = createMemoryRouter(routeConfig, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('Routes', () => {
  it('should render Landing page at /', () => {
    renderRoute('/');
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('should render WizardPage at /criar', () => {
    renderRoute('/criar');
    expect(screen.getByTestId('wizard-page')).toBeInTheDocument();
  });

  it('should render PublicMapPage at /acesso', () => {
    renderRoute('/acesso');
    expect(screen.getByTestId('public-map-page')).toBeInTheDocument();
  });

  it('should render PaymentConfirmedPage at /pagamento-confirmado', () => {
    renderRoute('/pagamento-confirmado');
    expect(screen.getByTestId('payment-confirmed-page')).toBeInTheDocument();
  });
});
