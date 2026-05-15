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

  it('should wire onAutoplayBlocked to the YouTube player onError handler', () => {
    const onAutoplayBlocked = jest.fn();
    renderLayer({ onAutoplayBlocked });
    const props = getCapturedProps();
    expect(props?.onError).toBeDefined();
    act(() => {
      props?.onError?.({ data: 150, target: {} as YouTubePlayer });
    });
    expect(onAutoplayBlocked).toHaveBeenCalledTimes(1);
  });
});
