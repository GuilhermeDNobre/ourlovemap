import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinalMapScreen } from '../../components/public-map/FinalMapScreen';
import type { ApiLocation } from '../../types/map';

const locations: ApiLocation[] = [
  { title: 'Café do Amor', description: null, message: null, photoUrl: null, latitude: -23.5, longitude: -46.6, order: 0 },
  { title: 'Parque Ibirapuera', description: null, message: null, photoUrl: null, latitude: -23.6, longitude: -46.7, order: 1 },
];

describe('FinalMapScreen', () => {
  it('should render headline "Esse é o nosso mapa do amor."', () => {
    render(<FinalMapScreen locations={locations} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Esse é o nosso');
    expect(screen.getByText('mapa do amor')).toBeInTheDocument();
  });

  it('should render share/copy button', () => {
    render(<FinalMapScreen locations={locations} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('should render "Voltar ao começo" link', () => {
    render(<FinalMapScreen locations={locations} />);
    expect(screen.getByRole('link', { name: /Voltar ao começo/i })).toBeInTheDocument();
  });

  it('should call navigator.share when it is available', async () => {
    const shareSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    render(<FinalMapScreen locations={locations} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(String) })));
  });

  it('should call clipboard.writeText and show "Link copiado!" when navigator.share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const clipSpy = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<FinalMapScreen locations={locations} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Link copiado!'));
    expect(clipSpy).toHaveBeenCalledTimes(1);
    clipSpy.mockRestore();
  });
});
