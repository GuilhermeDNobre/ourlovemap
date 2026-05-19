import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { toPng } from 'html-to-image';
import { Heart } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MAPTILER_API_KEY } from '../../lib/client-env';
import type { ApiLocation } from '../../types/map';

interface FinalMapScreenProps {
  locations: ApiLocation[];
  coupleName: string;
}

const PIN_ROTATIONS = [-4, 3, -2, 5, -3, 4];
const PIXEL_RATIO = 2;
const PREGENERATE_DELAY_MS = 3000;
const OVERLAP_THRESHOLD_DEG = 0.015;
const SPREAD_PX = 80;

function computeMarkerXOffsets(locations: ApiLocation[]): number[] {
  const n = locations.length;
  const xOffsets = new Array<number>(n).fill(0);
  const assigned = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (assigned[i]) continue;
    const group: number[] = [i];
    assigned[i] = true;
    for (let j = i + 1; j < n; j++) {
      if (assigned[j]) continue;
      const dlat = locations[i].latitude - locations[j].latitude;
      const dlng = locations[i].longitude - locations[j].longitude;
      if (Math.sqrt(dlat * dlat + dlng * dlng) < OVERLAP_THRESHOLD_DEG) {
        group.push(j);
        assigned[j] = true;
      }
    }
    if (group.length < 2) continue;
    group.forEach((idx, k) => {
      xOffsets[idx] = Math.round((k - (group.length - 1) / 2) * SPREAD_PX);
    });
  }
  return xOffsets;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function createPolaroidIcon(location: ApiLocation, rotation: number, xOffset: number): L.DivIcon {
  const tilt = xOffset !== 0 ? -Math.sign(xOffset) * 5 : 0;
  const finalRotation = rotation + tilt;
  const photoHtml = location.photoUrl
    ? `<img src="${location.photoUrl}" alt="${location.title}" style="width:64px;height:64px;object-fit:cover;display:block;" />`
    : `<div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(232,119,90,0.25),rgba(37,33,42,0.5));display:flex;align-items:center;justify-content:center;">
        <span style="font-size:9px;color:rgba(251,245,240,0.5);font-family:Georgia,serif;text-align:center;padding:4px;">${location.title}</span>
       </div>`;
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:default;">
        <div style="
          background:white;
          padding:4px 4px 14px;
          box-shadow:0 6px 20px rgba(0,0,0,0.55),0 1px 4px rgba(0,0,0,0.3);
          transform:rotate(${finalRotation}deg);
          transform-origin:bottom center;
        ">
          ${photoHtml}
        </div>
        <div style="
          width:9px;height:9px;border-radius:50%;
          background:#E8775A;
          box-shadow:0 0 8px rgba(232,119,90,0.85);
          margin-top:3px;
          flex-shrink:0;
        "></div>
      </div>
    `,
    className: '',
    iconSize: [74, 87],
    iconAnchor: [37 + xOffset, 87],
  });
}

function FitBoundsOnLoad({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [55, 45], maxZoom: 13 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nosso-mapa-do-amor.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function FinalMapScreen({ locations, coupleName }: FinalMapScreenProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [prebuiltFile, setPrebuiltFile] = useState<File | null>(null);
  const [showInstagramTip, setShowInstagramTip] = useState(false);

  const positions: [number, number][] = locations.map((l) => [l.latitude, l.longitude]);
  const initialCenter: [number, number] = positions.length > 0 ? positions[0] : [-14.235, -51.925];
  const markerXOffsets = computeMarkerXOffsets(locations);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!captureRef.current) return;
      try {
        const dataUrl = await toPng(captureRef.current, { pixelRatio: PIXEL_RATIO, cacheBust: true });
        const blob = dataUrlToBlob(dataUrl);
        setPrebuiltFile(new File([blob], 'nosso-mapa-do-amor.png', { type: 'image/png' }));
      } catch {
        // pre-generation failed — will fall back to on-click download
      }
    }, PREGENERATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showInstagramTip) return;
    const timer = setTimeout(() => setShowInstagramTip(false), 5000);
    return () => clearTimeout(timer);
  }, [showInstagramTip]);

  const handleSave = useCallback(async () => {
    if (isCapturing) return;
    const fileToShare = prebuiltFile ?? await (async () => {
      if (!captureRef.current) return null;
      setIsCapturing(true);
      try {
        const dataUrl = await toPng(captureRef.current, { pixelRatio: PIXEL_RATIO, cacheBust: true });
        const blob = dataUrlToBlob(dataUrl);
        return new File([blob], 'nosso-mapa-do-amor.png', { type: 'image/png' });
      } catch {
        return null;
      } finally {
        setIsCapturing(false);
      }
    })();
    if (!fileToShare) return;
    if (IS_MOBILE) {
      const canShare =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [fileToShare] });
      if (canShare) {
        try {
          await navigator.share({ files: [fileToShare], title: 'Nosso Mapa do Amor' });
          return;
        } catch {
          // share dismissed or failed — fall through to download
        }
      }
      triggerDownload(fileToShare);
      setShowInstagramTip(true);
      return;
    }
    triggerDownload(fileToShare);
  }, [prebuiltFile, isCapturing]);

  return (
    <section
      className="relative flex flex-col items-center justify-start py-16 px-6"
      style={{ background: 'linear-gradient(180deg, #25212A 0%, #1E1C2A 100%)', minHeight: '100vh' }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        aria-hidden="true"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(191,119,246,0.12), transparent 65%)',
        }}
      />

      <div className="relative text-center mb-8 max-w-sm">
        <p
          className="text-xs tracking-[0.18em] uppercase font-semibold mb-3"
          style={{ color: '#E8775A' }}
        >
          O fim? Só o começo.
        </p>
        <h2
          className="font-serif"
          style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            lineHeight: 1.05,
            color: '#FBF5F0',
            letterSpacing: '-0.02em',
          }}
        >
          Esse é o nosso{' '}
          <em style={{ color: '#E8775A' }}>mapa do amor</em>.
        </h2>
      </div>

      <div
        ref={captureRef}
        className="relative overflow-hidden rounded-2xl"
        style={{
          aspectRatio: '9/16',
          width: 'min(320px, 85vw)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {positions.length > 0 && (
          <MapContainer
            center={initialCenter}
            zoom={12}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            doubleClickZoom={false}
            touchZoom={false}
            keyboard={false}
            boxZoom={false}
            attributionControl={false}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          >
            <TileLayer
              url={`https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`}
              tileSize={512}
              zoomOffset={-1}
              maxZoom={18}
              crossOrigin="anonymous"
            />
            <Polyline
              positions={positions}
              pathOptions={{ color: '#E8775A', weight: 1.5, dashArray: '5 8', opacity: 0.65 }}
            />
            {locations.map((loc, i) => (
              <Marker
                key={loc.order}
                position={[loc.latitude, loc.longitude]}
                icon={createPolaroidIcon(loc, PIN_ROTATIONS[i % PIN_ROTATIONS.length], markerXOffsets[i])}
              />
            ))}
            <FitBoundsOnLoad positions={positions} />
          </MapContainer>
        )}

        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, rgba(30,28,42,0.6) 0%, transparent 100%)' }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-5 pt-14 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to top, rgba(30,28,42,0.88) 0%, transparent 100%)' }}
        >
          <Heart size={12} fill="#E8775A" stroke="none" aria-hidden="true" />
          <p
            className="text-[10px] tracking-[0.18em] uppercase font-semibold mt-1"
            style={{ color: 'rgba(251,245,240,0.7)' }}
          >
            ourlovemap
          </p>
          <p className="font-serif italic text-[11px] mt-0.5" style={{ color: 'rgba(251,245,240,0.45)' }}>
            {coupleName}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-4 mt-8">
        <p className="text-sm text-center max-w-xs" style={{ color: 'rgba(251,245,240,0.5)', lineHeight: 1.55 }}>
          {IS_MOBILE ? 'Compartilhe nos Stories ou salve na galeria.' : 'Salve a imagem e compartilhe nos Stories.'}
        </p>
        <button
          onClick={handleSave}
          disabled={isCapturing}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #E8775A 0%, #BF77F6 55%, #413C7B 100%)',
            boxShadow: '0 14px 34px rgba(232,119,90,0.4)',
            opacity: isCapturing ? 0.7 : 1,
          }}
        >
          {isCapturing ? 'Gerando...' : IS_MOBILE ? 'Compartilhar nos Stories' : 'Salvar imagem'}
        </button>
        {showInstagramTip && (
          <p
            className="text-xs text-center max-w-xs px-4 py-2.5 rounded-xl"
            style={{
              color: 'rgba(251,245,240,0.85)',
              background: 'rgba(232,119,90,0.18)',
              border: '1px solid rgba(232,119,90,0.3)',
              lineHeight: 1.5,
            }}
          >
            Imagem salva! Abra o Instagram, acesse Stories e selecione da galeria.
          </p>
        )}
        <a href="#top" className="text-xs tracking-widest" style={{ color: 'rgba(251,245,240,0.4)' }}>
          Voltar ao começo ↑
        </a>
      </div>
    </section>
  );
}
