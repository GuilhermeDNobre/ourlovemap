import { useRef, useEffect, useCallback } from 'react';
import type { PickEvent } from '@maptiler/geocoding-control';
import '@maptiler/geocoding-control';

interface AddressPickResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressInputProps {
  apiKey: string;
  onPick: (result: AddressPickResult) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'maptiler-geocoder': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        apikey?: string;
        country?: string;
        language?: string;
        'min-length'?: number;
      };
    }
  }
}

export function AddressInput({ apiKey, onPick }: AddressInputProps) {
  const ref = useRef<HTMLElement>(null);
  const handlePick = useCallback(
    (e: Event) => {
      const event = e as PickEvent;
      const feature = event.detail?.feature;
      if (!feature?.geometry) return;
      const geometry = feature.geometry as unknown as { coordinates: [number, number] };
      const [lng, lat] = geometry.coordinates;
      const address = (feature as { place_name?: string }).place_name ?? '';
      onPick({ address, latitude: lat, longitude: lng });
    },
    [onPick],
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('pick', handlePick);
    return () => el.removeEventListener('pick', handlePick);
  }, [handlePick]);
  return (
    <maptiler-geocoder
      ref={ref}
      apikey={apiKey}
      country="br"
      language="pt"
      min-length={3}
    />
  );
}
