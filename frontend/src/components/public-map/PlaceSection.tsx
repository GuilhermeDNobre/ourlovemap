import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useInView } from 'react-intersection-observer';
import maplibregl from 'maplibre-gl';
import { Polaroid } from '../ui/Polaroid';
import { MAPTILER_API_KEY } from '../../lib/client-env';
import type { ApiLocation } from '../../types/map';

interface PlaceSectionProps {
  location: ApiLocation;
  index: number;
  isActive: boolean;
  allLocations: ApiLocation[];
  onVisibilityChange: (index: number, inView: boolean) => void;
}

export function PlaceSection({
  location,
  index,
  isActive,
  allLocations,
  onVisibilityChange,
}: PlaceSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<{ kill: () => void } | null>(null);

  const { ref: sectionRef } = useInView({
    threshold: 0.5,
    onChange: (inView) => onVisibilityChange(index, inView),
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_API_KEY}`,
      center: [location.longitude, location.latitude],
      zoom: 14,
      interactive: false,
    });
    mapRef.current = map;
    map.on('load', () => {
      markersRef.current = allLocations.map((loc, i) => {
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#E8775A';
        el.style.opacity = i === index ? '1' : '0.35';
        el.style.boxShadow = i === index ? '0 0 12px #E8775A' : 'none';
        return new maplibregl.Marker(el)
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map);
      });
    });
    return () => { mapRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement();
      const isThisPin = i === index;
      el.style.opacity = isThisPin && isActive ? '1' : '0.35';
      el.style.boxShadow = isThisPin && isActive ? '0 0 12px #E8775A' : 'none';
    });
  }, [isActive, index]);

  useEffect(() => {
    tweenRef.current?.kill();
    if (!cardRef.current) return;
    tweenRef.current = gsap.to(cardRef.current, {
      opacity: isActive ? 1 : 0.35,
      y: isActive ? 0 : 20,
      duration: 0.5,
      ease: 'power2.out',
    });
    return () => { tweenRef.current?.kill(); };
  }, [isActive]);

  return (
    <section id={`place-${index}`} ref={sectionRef} className="relative h-screen overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, rgba(37,33,42,0.2) 0%, rgba(37,33,42,0.5) 100%)' }}
      >
        <div
          ref={cardRef}
          className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
          style={{
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            background: 'rgba(37,33,42,0.72)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="p-6 flex flex-col gap-4">
            <p className="text-xs tracking-[0.25em] uppercase font-medium" style={{ color: '#E8775A' }}>
              LUGAR {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="font-serif text-2xl" style={{ color: '#FBF5F0' }}>
              {location.title}
            </h2>
            {location.photoUrl ? (
              <Polaroid
                src={location.photoUrl}
                alt={location.title}
                className="w-full"
              />
            ) : (
              <div
                className="w-full rounded-lg"
                style={{ height: 160, background: 'linear-gradient(135deg, rgba(232,119,90,0.15), rgba(37,33,42,0.5))' }}
              />
            )}
            {location.description && (
              <p className="font-serif italic text-sm" style={{ color: 'rgba(251,245,240,0.65)' }}>
                {location.description}
              </p>
            )}
          </div>
        </div>
      </div>
      {isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center" aria-hidden="true">
          <p className="text-xs tracking-widest" style={{ color: 'rgba(251,245,240,0.4)' }}>
            role para continuar
          </p>
        </div>
      )}
    </section>
  );
}
