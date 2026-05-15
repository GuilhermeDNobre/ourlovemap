import YouTube, { type YouTubeEvent, type YouTubePlayer } from 'react-youtube';

interface MusicLayerProps {
  videoId: string | null | undefined;
  startTime: number;
  endTime: number;
  playerRef: React.MutableRefObject<YouTubePlayer | null>;
  isBlocked: boolean;
  unblock: () => void;
  onAutoplayBlocked: () => void;
  onEnd: () => void;
}

export function MusicLayer({ videoId, startTime, endTime, playerRef, isBlocked, unblock, onAutoplayBlocked, onEnd }: MusicLayerProps) {
  if (!videoId) return null;
  const handleReady = (e: YouTubeEvent) => {
    playerRef.current = e.target;
  };
  return (
    <>
      <YouTube
        videoId={videoId}
        className="sr-only"
        opts={{ playerVars: { autoplay: 1, start: startTime, end: endTime } }}
        onReady={handleReady}
        onError={onAutoplayBlocked}
        onEnd={onEnd}
      />
      {isBlocked && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4"
          style={{ background: 'linear-gradient(to top, rgba(37,33,42,0.95), transparent)' }}
        >
          <button
            onClick={unblock}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white"
            style={{ background: '#E8775A' }}
          >
            ▶ Tocar música
          </button>
        </div>
      )}
    </>
  );
}
