import { renderHook, act } from '@testing-library/react';
import { useMusicPlayer } from '../../hooks/use-music-player';

function makePlayer() {
  return {
    playVideo: jest.fn(),
    pauseVideo: jest.fn(),
    seekTo: jest.fn(),
  };
}

describe('useMusicPlayer', () => {
  it('should start with isBlocked false', () => {
    const { result } = renderHook(() => useMusicPlayer({ startTime: 0, loop: false }));
    expect(result.current.isBlocked).toBe(false);
  });

  it('should set isBlocked to true when onAutoplayBlocked is called', () => {
    const { result } = renderHook(() => useMusicPlayer({ startTime: 0, loop: false }));
    act(() => {
      result.current.onAutoplayBlocked();
    });
    expect(result.current.isBlocked).toBe(true);
  });

  it('should call playVideo and set isBlocked to false when unblock is called', () => {
    const { result } = renderHook(() => useMusicPlayer({ startTime: 0, loop: false }));
    const player = makePlayer();
    act(() => {
      result.current.playerRef.current = player as unknown as ReturnType<typeof makePlayer>;
      result.current.onAutoplayBlocked();
    });
    act(() => {
      result.current.unblock();
    });
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should call seekTo and playVideo when handleEnd fires with loop true', () => {
    const { result } = renderHook(() => useMusicPlayer({ startTime: 10, loop: true }));
    const player = makePlayer();
    act(() => {
      result.current.playerRef.current = player as unknown as ReturnType<typeof makePlayer>;
    });
    act(() => {
      result.current.handleEnd();
    });
    expect(player.seekTo).toHaveBeenCalledWith(10, true);
    expect(player.playVideo).toHaveBeenCalledTimes(1);
  });

  it('should not call seekTo or playVideo when handleEnd fires with loop false', () => {
    const { result } = renderHook(() => useMusicPlayer({ startTime: 10, loop: false }));
    const player = makePlayer();
    act(() => {
      result.current.playerRef.current = player as unknown as ReturnType<typeof makePlayer>;
    });
    act(() => {
      result.current.handleEnd();
    });
    expect(player.seekTo).not.toHaveBeenCalled();
    expect(player.playVideo).not.toHaveBeenCalled();
  });
});
