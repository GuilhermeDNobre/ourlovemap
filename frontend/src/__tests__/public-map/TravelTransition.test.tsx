import { render, screen } from '@testing-library/react';
import { TravelTransition } from '../../components/public-map/TravelTransition';

describe('TravelTransition', () => {
  it('should render variant 0 without crash and show place names', () => {
    render(<TravelTransition fromTitle="Café" toTitle="Parque" variant={0} />);
    expect(screen.getByText(/Café/)).toBeInTheDocument();
    expect(screen.getByText(/Parque/)).toBeInTheDocument();
  });

  it('should render variant 1 without crash', () => {
    render(<TravelTransition fromTitle="Museu" toTitle="Praia" variant={1} />);
    expect(screen.getByText(/Museu/)).toBeInTheDocument();
    expect(screen.getByText(/Praia/)).toBeInTheDocument();
  });

  it('should render variant 2 without crash', () => {
    render(<TravelTransition fromTitle="Bar" toTitle="Cinema" variant={2} />);
    expect(screen.getByText(/Bar/)).toBeInTheDocument();
    expect(screen.getByText(/Cinema/)).toBeInTheDocument();
  });

  it('should show "pra" transition text', () => {
    render(<TravelTransition fromTitle="Local A" toTitle="Local B" variant={0} />);
    expect(screen.getByText('pra')).toBeInTheDocument();
  });
});
