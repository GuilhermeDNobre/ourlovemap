import { useRef, useEffect, useCallback, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Locate } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../../lib/client-env';

setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' });

interface AddressPickResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressInputProps {
  onPick: (result: AddressPickResult) => void;
}

export function AddressInput({ onPick }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    importLibrary('places').then((lib) => {
      if (!inputRef.current) return;
      const { Autocomplete } = lib as google.maps.PlacesLibrary;
      const autocomplete = new Autocomplete(inputRef.current, {
        fields: ['geometry', 'formatted_address', 'name'],
        componentRestrictions: { country: 'br' },
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        onPick({
          address: place.formatted_address ?? place.name ?? '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        importLibrary('core').then((lib) => {
          if (!autocompleteRef.current) return;
          const { LatLngBounds } = lib as google.maps.CoreLibrary;
          const bounds = new LatLngBounds(
            { lat: pos.coords.latitude - 0.05, lng: pos.coords.longitude - 0.05 },
            { lat: pos.coords.latitude + 0.05, lng: pos.coords.longitude + 0.05 },
          );
          autocompleteRef.current!.setBounds(bounds);
        });
      },
      () => setLocating(false),
    );
  }, []);

  return (
    <>
      <style>{`
        .pac-container {
          border-radius: 12px;
          border: 1.5px solid #E0DCE5;
          box-shadow: 0 8px 24px rgba(65,60,123,0.1);
          font-family: inherit;
          margin-top: 4px;
          overflow: hidden;
          z-index: 99999 !important;
        }
        .pac-item {
          padding: 8px 14px;
          font-size: 13px;
          color: #3D3850;
          cursor: pointer;
          border-top: 1px solid #F0ECF5;
          line-height: 1.5;
        }
        .pac-item:first-child { border-top: none; }
        .pac-item:hover, .pac-item-selected { background: #F8F5FF; }
        .pac-item-query { font-size: 13px; color: #1E1A2E; font-weight: 500; }
        .pac-icon { display: none; }
        .pac-matched { color: #F56C73; }
      `}</style>
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
          size={15}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Restaurante, shopping, parque..."
          className="w-full pl-9 pr-10 py-[11px] rounded-md border border-[1.5px] border-[#E0DCE5] focus:border-olm-accent outline-none text-sm text-fg-2 font-sans bg-white"
        />
        <button
          type="button"
          onClick={handleGeolocate}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-olm-primary transition-colors"
          aria-label="Usar minha localização"
          title="Centralizar busca na minha localização"
        >
          {locating ? (
            <div
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
            />
          ) : (
            <Locate size={15} />
          )}
        </button>
      </div>
    </>
  );
}
