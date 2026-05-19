import { render, screen, fireEvent, act } from '@testing-library/react';
import { MusicLayer } from '../../components/public-map/MusicLayer';
import { getCapturedProps, resetCapturedProps } from '../../__mocks__/react-youtube-mock';
import type { YouTubePlayer } from 'react-youtube';

function makeRef() {
  return { current: null } as React.MutableRefObject<YouTubePlayer | null>;
}

function renderLayer(overrides: Partial<Parameters<typeof MusicLayer>[0]> = {}) {
  const defaults = {
    videoId: 'abc123',
    startTime: 0,
    endTime: 60,
    playerRef: makeRef(),
    isBlocked: false,
    unblock: jest.fn(),
    onAutoplayBlocked: jest.fn(),
    onEnd: jest.fn(),
  };
  return render(<MusicLayer {...defaults} {...overrides} />);
}

beforeEach(() => {
  resetCapturedProps();
});

describe('MusicLayer', () => {
  it('should render null when videoId is not provided', () => {
    const { container } = render(
      <MusicLayer
        videoId={null}
        startTime={0}
        endTime={60}
        playerRef={makeRef()}
        isBlocked={false}
        unblock={jest.fn()}
        onAutoplayBlocked={jest.fn()}
        onEnd={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render hidden YouTube player when videoId exists', () => {
    renderLayer();
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
  });

  it('should render "Tocar música" overlay when isBlocked is true', () => {
    renderLayer({ isBlocked: true });
    expect(screen.getByRole('button', { name: /Tocar música/i })).toBeInTheDocument();
  });

  it('should not render overlay when isBlocked is false', () => {
    renderLayer({ isBlocked: false });
    expect(screen.queryByRole('button', { name: /Tocar música/i })).not.toBeInTheDocument();
  });

  it('should call unblock when overlay button is clicked', () => {
    const unblock = jest.fn();
    renderLayer({ isBlocked: true, unblock });
    fireEvent.click(screen.getByRole('button', { name: /Tocar música/i }));
    expect(unblock).toHaveBeenCalledTimes(1);
  });

  it('should call onAutoplayBlocked after timeout when player is not playing', () => {
    jest.useFakeTimers();
    const onAutoplayBlocked = jest.fn();
    renderLayer({ onAutoplayBlocked });
    const props = getCapturedProps();
    const mockPlayer = { getPlayerState: jest.fn().mockReturnValue(-1) };
    act(() => {
      props?.onReady?.({ data: undefined, target: mockPlayer as unknown as YouTubePlayer });
    });
    act(() => { jest.advanceTimersByTime(2000); });
    expect(onAutoplayBlocked).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('should cancel autoplay timer when onStateChange fires with state playing', () => {
    jest.useFakeTimers();
    const onAutoplayBlocked = jest.fn();
    renderLayer({ onAutoplayBlocked });
    const props = getCapturedProps();
    const mockPlayer = { getPlayerState: jest.fn().mockReturnValue(-1) };
    act(() => {
      props?.onReady?.({ data: undefined, target: mockPlayer as unknown as YouTubePlayer });
    });
    act(() => {
      props?.onStateChange?.({ data: 1, target: mockPlayer as unknown as YouTubePlayer });
    });
    act(() => { jest.advanceTimersByTime(2000); });
    expect(onAutoplayBlocked).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
