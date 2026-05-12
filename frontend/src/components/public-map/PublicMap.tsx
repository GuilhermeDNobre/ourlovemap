import { Fragment } from 'react';
import { isAxiosError } from 'axios';
import { useMapData } from '../../hooks/use-map-data';
import { useActivePlace } from '../../hooks/use-active-place';
import { AccessError } from './AccessError';
import { CoverScreen } from './CoverScreen';
import { PlaceSection } from './PlaceSection';
import { TravelTransition } from './TravelTransition';

type Variant = 0 | 1 | 2;

export function PublicMap() {
  const { data, isLoading, isError, error } = useMapData();
  const { activeIndex, updateVisibility } = useActivePlace();

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
    <div style={{ overflowX: 'hidden' }}>
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
          {index < sortedLocations.length - 1 && (
            <TravelTransition
              fromTitle={location.title}
              toTitle={sortedLocations[index + 1].title}
              variant={(index % 3) as Variant}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
