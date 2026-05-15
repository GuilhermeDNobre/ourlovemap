import { render, screen } from '@testing-library/react';
import { PlaceSection } from '../../components/public-map/PlaceSection';
import type { ApiLocation } from '../../types/map';

const baseLocation: ApiLocation = {
  title: 'Café do Amor',
  description: 'Nosso primeiro encontro',
  message: null,
  photoUrl: null,
  latitude: -23.5,
  longitude: -46.6,
  order: 0,
};

const allLocations: ApiLocation[] = [
  baseLocation,
  {
    title: 'Parque Ibirapuera',
    description: 'Nossa segunda data',
    message: null,
    photoUrl: null,
    latitude: -23.6,
    longitude: -46.7,
    order: 1,
  },
];

function renderSection(overrides: Partial<Parameters<typeof PlaceSection>[0]> = {}) {
  const defaults = {
    location: baseLocation,
    index: 0,
    isActive: true,
    allLocations,
    onVisibilityChange: jest.fn(),
  };
  return render(<PlaceSection {...defaults} {...overrides} />);
}

describe('PlaceSection', () => {
  it('should render place title', () => {
    renderSection();
    expect(screen.getByText('Café do Amor')).toBeInTheDocument();
  });

  it('should render place description', () => {
    renderSection();
    expect(screen.getByText('Nosso primeiro encontro')).toBeInTheDocument();
  });

  it('should render place number label', () => {
    renderSection({ index: 0 });
    expect(screen.getByText('LUGAR 01')).toBeInTheDocument();
  });

  it('should render "role para continuar" hint when active', () => {
    renderSection({ isActive: true });
    expect(screen.getByText(/role para continuar/i)).toBeInTheDocument();
  });

  it('should not render "role para continuar" hint when inactive', () => {
    renderSection({ isActive: false });
    expect(screen.queryByText(/role para continuar/i)).not.toBeInTheDocument();
  });

  it('should render Polaroid when photoUrl is provided', () => {
    renderSection({ location: { ...baseLocation, photoUrl: 'https://example.com/photo.jpg' } });
    expect(screen.getByRole('img', { name: 'Café do Amor' })).toBeInTheDocument();
  });

  it('should not render img when photoUrl is null', () => {
    renderSection({ location: { ...baseLocation, photoUrl: null } });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    renderSection({ location: { ...baseLocation, description: null } });
    expect(screen.queryByText('Nosso primeiro encontro')).not.toBeInTheDocument();
  });
});
