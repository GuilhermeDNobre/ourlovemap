import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAPTILER_API_KEY } from '../../lib/client-env';
import type { ApiLocation } from '../../types/map';

interface FinalMapScreenProps {
  locations: ApiLocation[];
}

const PIN_ROTATIONS = [-4, 3, -2, 5, -3, 4];
const COPY_FEEDBACK_DURATION_MS = 2000;

export function FinalMapScreen({ locations }: FinalMapScreenProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_API_KEY}`,
      interactive: true,
    });
    setTimeout(() => map.resize(), 50);
    mapRef.current = map;
    map.on('load', () => {
      const bounds = new maplibregl.LngLatBounds();
      locations.forEach((loc) => bounds.extend([loc.longitude, loc.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: locations.map((l) => [l.longitude, l.latitude]),
          },
          properties: {},
        },
      });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#E8634A',
          'line-width': 2,
          'line-dasharray': [2, 3],
        },
      });
      locations.forEach((loc, i) => {
        const pinEl = document.createElement('div');
        pinEl.style.width = '16px';
        pinEl.style.height = '16px';
        pinEl.style.borderRadius = '50%';
        pinEl.style.backgroundColor = '#E8775A';
        pinEl.style.boxShadow = '0 0 12px #E8775A';
        new maplibregl.Marker(pinEl).setLngLat([loc.longitude, loc.latitude]).addTo(map);
        const popupEl = document.createElement('div');
        popupEl.style.transform = `rotate(${PIN_ROTATIONS[i % PIN_ROTATIONS.length]}deg)`;
        popupEl.style.boxShadow = '0 10px 24px rgba(0,0,0,0.5)';
        if (loc.photoUrl) {
          const img = document.createElement('img');
          img.src = loc.photoUrl;
          img.alt = loc.title;
          img.style.width = '80px';
          img.style.height = '80px';
          img.style.objectFit = 'cover';
          popupEl.appendChild(img);
        } else {
          popupEl.style.width = '80px';
          popupEl.style.height = '80px';
          popupEl.style.background = 'linear-gradient(135deg, rgba(232,119,90,0.3), rgba(37,33,42,0.5))';
        }
        new maplibregl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom' })
          .setLngLat([loc.longitude, loc.latitude])
          .setDOMContent(popupEl)
          .addTo(map);
      });
    });
    return () => { mapRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps — locations are stable after mount; re-running would recreate the map unnecessarily
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: 'Nosso mapa do amor', url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #25212A 0%, #332E3A 100%)' }}>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(191,119,246,0.18), transparent 65%)' }}
      />
      <div className="relative text-center pt-20 pb-10 px-6 max-w-lg mx-auto w-full">
        <p className="text-xs tracking-[0.18em] uppercase font-semibold" style={{ color: '#E8775A' }}>
          O fim? Só o começo.
        </p>
        <h2
          className="font-serif mt-4"
          style={{ fontSize: 'clamp(2.25rem, 7vw, 3.5rem)', lineHeight: 1.05, color: '#FBF5F0', letterSpacing: '-0.02em' }}
        >
          Esse é o nosso{' '}
          <em style={{ color: '#E8775A' }}>mapa do amor</em>.
        </h2>
      </div>
      <div ref={mapContainerRef} className="relative mx-auto w-full max-w-2xl" style={{ height: 480 }} />
      <div className="relative text-center py-10 px-6 max-w-lg mx-auto w-full flex flex-col items-center gap-4">
        <p className="text-sm" style={{ color: 'rgba(251,245,240,0.6)', lineHeight: 1.55 }}>
          Mostra pro mundo — ou guarda só entre vocês.
        </p>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #E8775A 0%, #BF77F6 55%, #413C7B 100%)', boxShadow: '0 14px 34px rgba(232,119,90,0.4)' }}
        >
          {copied ? 'Link copiado!' : (typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'Compartilhar no Instagram' : 'Copiar link')}
        </button>
        <a
          href="#top"
          className="text-xs tracking-widest"
          style={{ color: 'rgba(251,245,240,0.4)' }}
        >
          Voltar ao começo ↑
        </a>
      </div>
    </section>
  );
}
