import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FinalMapScreen } from '../../components/public-map/FinalMapScreen';
import { toPng } from 'html-to-image';
import type { ApiLocation } from '../../types/map';

const locations: ApiLocation[] = [
  { title: 'Café do Amor', description: null, message: null, photoUrl: null, latitude: -23.5, longitude: -46.6, order: 0 },
  { title: 'Parque Ibirapuera', description: null, message: null, photoUrl: null, latitude: -23.6, longitude: -46.7, order: 1 },
];

describe('FinalMapScreen', () => {
  it('should render headline "Esse é o nosso mapa do amor."', () => {
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Esse é o nosso');
    expect(screen.getByText('mapa do amor')).toBeInTheDocument();
  });

  it('should render couple name in the capture zone', () => {
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    expect(screen.getByText('Ana & João')).toBeInTheDocument();
  });

  it('should render save button', () => {
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    expect(screen.getByRole('button', { name: /Salvar imagem/i })).toBeInTheDocument();
  });

  it('should render "Voltar ao começo" link', () => {
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    expect(screen.getByRole('link', { name: /Voltar ao começo/i })).toBeInTheDocument();
  });

  it('should call toPng via slow-path when prebuilt file is not ready', async () => {
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    fireEvent.click(screen.getByRole('button', { name: /Salvar imagem/i }));
    await waitFor(() => expect(toPng).toHaveBeenCalled());
  });

  it('should call navigator.share synchronously with prebuilt file after pre-generation', async () => {
    jest.useFakeTimers();
    const shareSpy = jest.fn().mockResolvedValue(undefined);
    const canShareSpy = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: canShareSpy, configurable: true });
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('coarse'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    render(<FinalMapScreen locations={locations} coupleName="Ana & João" />);
    await act(async () => { jest.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar nos Stories/i }));
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({ files: expect.any(Array) }),
    );
    window.matchMedia = originalMatchMedia;
    jest.useRealTimers();
  });
});
