import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/landing/Navbar';

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 });
  });

  it('should render the logo text', () => {
    renderNavbar();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderNavbar();
    expect(screen.getAllByText('Como funciona').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Funcionalidades').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Preços').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('FAQ').length).toBeGreaterThanOrEqual(1);
  });

  it('should render the CTA button', () => {
    renderNavbar();
    expect(screen.getByText('Criar nosso mapa')).toBeInTheDocument();
  });

  it('should apply scrolled styles when scrollY > 12', async () => {
    renderNavbar();
    const nav = screen.getByTestId('navbar');

    expect(nav.className).not.toContain('border-olm-surface');

    await act(async () => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 50 });
      fireEvent.scroll(window);
    });

    expect(nav.className).toContain('border-olm-surface');
  });

  it('should remove scrolled styles when scrollY <= 12', async () => {
    renderNavbar();
    const nav = screen.getByTestId('navbar');

    await act(async () => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 50 });
      fireEvent.scroll(window);
    });

    await act(async () => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 });
      fireEvent.scroll(window);
    });

    expect(nav.className).not.toContain('border-olm-surface');
  });
});
