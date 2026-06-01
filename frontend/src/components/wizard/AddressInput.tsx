import { useRef, useCallback, useState, useEffect } from 'react';
import { MapPin, Locate } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../../lib/client-env';

interface AddressPickResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressInputProps {
  onPick: (result: AddressPickResult) => void;
  initialValue?: string;
}

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface LocationBias {
  lat: number;
  lng: number;
}

interface PlacesPredictionSuggestion {
  placePrediction: {
    placeId: string;
    structuredFormat: {
      mainText: { text: string };
      secondaryText?: { text: string };
    };
  };
}

interface PlacesAutocompleteResponse {
  suggestions?: PlacesPredictionSuggestion[];
}

interface PlaceDetailsResponse {
  location?: { latitude: number; longitude: number };
  formattedAddress?: string;
  displayName?: { text: string };
}

async function fetchPredictions(input: string, bias: LocationBias | null): Promise<Prediction[]> {
  const body: Record<string, unknown> = {
    input,
    includedRegionCodes: ['br'],
    languageCode: 'pt-BR',
  };
  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 50000,
      },
    };
  }
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const data = await res.json() as PlacesAutocompleteResponse;
  return (data.suggestions ?? []).map((s) => ({
    placeId: s.placePrediction.placeId,
    mainText: s.placePrediction.structuredFormat.mainText.text,
    secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? '',
  }));
}

async function fetchPlaceDetails(placeId: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=location,formattedAddress,displayName`,
    { headers: { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY } },
  );
  if (!res.ok) return null;
  const data = await res.json() as PlaceDetailsResponse;
  if (!data.location) return null;
  return {
    lat: data.location.latitude,
    lng: data.location.longitude,
    address: data.formattedAddress ?? data.displayName?.text ?? '',
  };
}

export function AddressInput({ onPick, initialValue = '' }: AddressInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationBias, setLocationBias] = useState<LocationBias | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchPredictions(value, locationBias);
        setPredictions(results);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectPrediction = async (prediction: Prediction) => {
    const address = prediction.secondaryText
      ? `${prediction.mainText}, ${prediction.secondaryText}`
      : prediction.mainText;
    setPredictions([]);
    setQuery(address);
    const details = await fetchPlaceDetails(prediction.placeId);
    if (!details) return;
    onPick({ address, latitude: details.lat, longitude: details.lng });
  };

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocationBias({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setLocating(false),
    );
  }, []);

  return (
    <div className="relative">
      <MapPin
        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
        size={15}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onBlur={() => setTimeout(() => setPredictions([]), 150)}
        placeholder="Restaurante, shopping, parque..."
        className="w-full pl-9 pr-10 py-[11px] rounded-md border-[1.5px] border-olm-surface focus:border-olm-accent outline-none text-sm text-fg-2 font-sans bg-olm-bg-elevated"
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
      {(predictions.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[99999] rounded-xl border border-olm-surface bg-olm-bg-elevated shadow-[0_8px_24px_rgba(65,60,123,0.18)] overflow-hidden">
          {isLoading && (
            <div className="px-4 py-3 text-xs text-fg-2">Buscando...</div>
          )}
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); void handleSelectPrediction(p); }}
              className="w-full flex flex-col items-start px-4 py-2.5 text-left hover:bg-olm-surface-soft border-t border-olm-surface first:border-t-0 transition-colors"
            >
              <span className="text-[13px] font-medium text-fg-1">{p.mainText}</span>
              {p.secondaryText && (
                <span className="text-[11px] text-fg-2">{p.secondaryText}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
