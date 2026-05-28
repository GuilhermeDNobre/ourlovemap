import { Fragment } from 'react';
import { isAxiosError } from 'axios';
import { useMapData } from '../../hooks/use-map-data';
import { useActivePlace } from '../../hooks/use-active-place';
import { useMusicPlayer } from '../../hooks/use-music-player';
import { AccessError } from './AccessError';
import { CoverScreen } from './CoverScreen';
import { PlaceSection } from './PlaceSection';
import { TravelTransition } from './TravelTransition';
import { MusicLayer } from './MusicLayer';
import { FinalMapScreen } from './FinalMapScreen';

type Variant = 0 | 1 | 2;

export function PublicMap() {
  const { data, isLoading, isError, error } = useMapData();
  const { activeIndex, updateVisibility } = useActivePlace();
  const { playerRef, isBlocked, unblock, onAutoplayBlocked, handleEnd } = useMusicPlayer({
    startTime: data?.youtubeStartTime ?? 0,
    loop: data?.youtubeLoop ?? false,
  });

  if (isLoading) {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: '#25212A' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="cover-glow" cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#E8775A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E8775A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="400" cy="300" rx="280" ry="280" fill="url(#cover-glow)" />
        </svg>
        <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6">
          <div className="h-3 w-24 rounded-full bg-[rgba(251,245,240,0.08)] animate-pulse" />
          <div className="h-12 w-64 rounded-md bg-[rgba(251,245,240,0.06)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="h-6 w-48 rounded-md bg-[rgba(251,245,240,0.05)] animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="h-8 w-32 rounded-md bg-[rgba(251,245,240,0.04)] animate-pulse mt-4" style={{ animationDelay: '450ms' }} />
        </div>
        <p className="absolute bottom-12 text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(251,245,240,0.25)' }}>
          Carregando seu mapa
        </p>
      </section>
    );
  }

  if (isError) {
    const status = isAxiosError(error) ? (error.response?.status ?? 401) : 401;
    const errorCode = isAxiosError(error)
      ? (error.response?.data as { code?: string } | undefined)?.code
      : undefined;
    return <AccessError status={status} errorCode={errorCode} />;
  }

  if (!data) return null;

  const sortedLocations = [...data.locations].sort((a, b) => a.order - b.order);

  return (
    <div id="top" style={{ overflowX: 'hidden' }}>
      <MusicLayer
        videoId={data.youtubeVideoId}
        startTime={data.youtubeStartTime ?? 0}
        endTime={data.youtubeEndTime ?? 0}
        playerRef={playerRef}
        isBlocked={isBlocked}
        unblock={unblock}
        onAutoplayBlocked={onAutoplayBlocked}
        onEnd={handleEnd}
      />
      <CoverScreen
        coupleName={data.coupleName}
        opening={data.opening}
        startDate={data.relationshipStartDate}
        onStart={unblock}
      />
      {sortedLocations.map((location, index) => (
        <Fragment key={location.order}>
          <PlaceSection
            location={location}
            index={index}
            isActive={activeIndex === index}
            allLocations={sortedLocations}
            onVisibilityChange={updateVisibility}
          />
          <TravelTransition
            fromTitle={location.title}
            toTitle={index < sortedLocations.length - 1 ? sortedLocations[index + 1].title : 'nosso mapa'}
            variant={(index % 3) as Variant}
          />
        </Fragment>
      ))}
      <FinalMapScreen locations={sortedLocations} coupleName={data.coupleName} />
    </div>
  );
}
