import { Fragment, useEffect } from 'react';
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

  useEffect(() => {
    const playOnScroll = () => { playerRef.current?.playVideo(); };
    window.addEventListener('scroll', playOnScroll, { once: true });
    return () => window.removeEventListener('scroll', playOnScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#25212A' }}>
        <div
          role="status"
          aria-label="carregando"
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#E8775A', borderTopColor: 'transparent' }}
        />
      </div>
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
