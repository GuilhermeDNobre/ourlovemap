import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useInView } from 'react-intersection-observer';
import maplibregl from 'maplibre-gl';
import { MapPin } from 'lucide-react';
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
      zoom: 16,
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
        style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--olm-dark) 15%, transparent) 0%, color-mix(in srgb, var(--olm-dark) 45%, transparent) 100%)' }}
      >
        <div
          ref={cardRef}
          className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
          style={{
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            background: 'color-mix(in srgb, var(--olm-dark) 72%, transparent)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="p-6 flex flex-col gap-4">
            <p className="text-xs tracking-[0.25em] uppercase font-medium" style={{ color: 'var(--olm-primary)' }}>
              LUGAR {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="font-serif text-2xl" style={{ color: 'var(--dfg-1)' }}>
              {location.title}
            </h2>
            {location.address && (
              <div className="flex items-start gap-1.5">
                <MapPin size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--olm-primary)' }} />
                <p className="text-xs leading-tight" style={{ color: 'color-mix(in srgb, var(--olm-primary), transparent 20%)' }}>
                  {location.address}
                </p>
              </div>
            )}
            {location.photoUrl ? (
              <Polaroid
                src={location.photoUrl}
                alt={location.title}
                className="w-full"
              />
            ) : (
              <div
                className="w-full rounded-lg"
                style={{ height: 160, background: 'linear-gradient(135deg, color-mix(in srgb, var(--olm-primary) 15%, transparent), color-mix(in srgb, var(--olm-dark) 50%, transparent))' }}
              />
            )}
            {location.description && (
              <p className="font-serif italic text-sm" style={{ color: 'var(--dfg-3)' }}>
                {location.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        aria-hidden="true"
        style={{ height: '22%', background: 'linear-gradient(to bottom, var(--olm-dark) 0%, transparent 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        aria-hidden="true"
        style={{ height: '28%', background: 'linear-gradient(to bottom, transparent 0%, var(--olm-dark) 100%)' }}
      />
      {isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center" aria-hidden="true">
          <p className="text-xs tracking-widest" style={{ color: 'var(--dfg-4)' }}>
            role para continuar
          </p>
        </div>
      )}
    </section>
  );
}
