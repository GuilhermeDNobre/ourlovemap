import { useRef, useState, useCallback } from 'react';
import type { YouTubePlayer } from 'react-youtube';

interface UseMusicPlayerOptions {
  startTime: number;
  loop: boolean;
}

interface UseMusicPlayerReturn {
  playerRef: React.MutableRefObject<YouTubePlayer | null>;
  isBlocked: boolean;
  unblock: () => void;
  onAutoplayBlocked: () => void;
  handleEnd: () => void;
}

export function useMusicPlayer({ startTime, loop }: UseMusicPlayerOptions): UseMusicPlayerReturn {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const onAutoplayBlocked = useCallback(() => {
    setIsBlocked(true);
  }, []);

  const unblock = useCallback(() => {
    playerRef.current?.playVideo();
    setIsBlocked(false);
  }, []);

  const handleEnd = useCallback(() => {
    if (!loop || !playerRef.current) return;
    playerRef.current.seekTo(startTime, true);
    playerRef.current.playVideo();
  }, [loop, startTime]);

  return { playerRef, isBlocked, unblock, onAutoplayBlocked, handleEnd };
}
