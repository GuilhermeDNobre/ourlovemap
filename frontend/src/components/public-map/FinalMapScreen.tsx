import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAPTILER_API_KEY, API_BASE_URL } from '../../lib/client-env';
import { useIsMobile } from '../../hooks/use-is-mobile';
import type { ApiLocation } from '../../types/map';

interface FinalMapScreenProps {
  locations: ApiLocation[];
  coupleName: string;
}

interface ClusterGroup {
  position: [number, number];
  locations: ApiLocation[];
  side: 'center' | 'left' | 'right';
  index: number;
}

const PIXEL_RATIO = 2;
const ICON_W = 74;
const ICON_H = 94;
const ICON_PADDING = 8;
const SPREAD_SETTLE_MS = 600;
const CAPTURE_SETTLE_MS = 500;
const PIN_SCALE_SAME_COUNTRY = 0.8;
const PIN_SCALE_MIXED_COUNTRIES = 0.5;
const STACK_TILT_ANGLE = 4;
const STACK_STEP_RATIO = 1.05;

function getStackTilt(clusterIndex: number, posInStack: number): number {
  const startLeft = clusterIndex % 2 === 0;
  const isLeft = posInStack % 2 === 0;
  return (startLeft === isLeft ? -1 : 1) * STACK_TILT_ANGLE;
}

function extractCountry(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(',');
  const country = parts[parts.length - 1].trim().toLowerCase();
  return country || null;
}

function computeIsSameCountry(locations: ApiLocation[]): boolean {
  const countries = locations
    .map(loc => extractCountry(loc.address))
    .filter((c): c is string => c !== null);
  if (countries.length === 0) return true;
  return new Set(countries).size === 1;
}

function computeClusters(
  locations: ApiLocation[],
  pixelPoints: { x: number; y: number }[],
  scale: number,
): ClusterGroup[] {
  const n = locations.length;
  const fullW = Math.round(ICON_W * scale) + ICON_PADDING;
  const fullH = Math.round(ICON_H * scale) + ICON_PADDING;
  const groupOf = new Array<number>(n).fill(-1);
  const groups: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (groupOf[i] >= 0) continue;
    const gIdx = groups.length;
    groups.push([i]);
    groupOf[i] = gIdx;
    const queue = [i];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (let j = 0; j < n; j++) {
        if (groupOf[j] >= 0) continue;
        const dx = Math.abs(pixelPoints[j].x - pixelPoints[curr].x);
        const dy = Math.abs(pixelPoints[j].y - pixelPoints[curr].y);
        if (dx < fullW && dy < fullH) {
          groups[gIdx].push(j);
          groupOf[j] = gIdx;
          queue.push(j);
        }
      }
    }
  }

  const result: ClusterGroup[] = [];
  for (const group of groups) {
    const groupLocs = group.map(i => locations[i]);
    if (groupLocs.length <= 3) {
      const idx = result.length;
      result.push({
        position: [groupLocs[0].latitude, groupLocs[0].longitude],
        locations: groupLocs,
        side: groupLocs.length === 1 ? 'center' : (idx % 2 === 0 ? 'left' : 'right'),
        index: idx,
      });
    } else {
      const first = groupLocs.slice(0, 3);
      const second = groupLocs.slice(3, 6);
      result.push({
        position: [first[0].latitude, first[0].longitude],
        locations: first,
        side: 'left',
        index: result.length,
      });
      result.push({
        position: [first[0].latitude, first[0].longitude],
        locations: second,
        side: 'right',
        index: result.length,
      });
    }
  }

  return result;
}

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

async function fetchPhotoAsDataUrl(photoUrl: string): Promise<string | null> {
  try {
    const path = new URL(photoUrl).pathname.slice(1);
    const proxyUrl = `${API_BASE_URL}/api/proxy-photo?path=${encodeURIComponent(path)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

function fillTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
): void {
  const chars = Array.from(text);
  const charWidths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth =
    charWidths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
  let x = cx - totalWidth / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += charWidths[i] + spacing;
  });
}

function drawHeartOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const s = size / 12;
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx - 12 * s, cy - 12 * s);
  ctx.scale(s, s);
  const path = new Path2D(
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  );
  ctx.fill(path);
  ctx.restore();
}

async function drawPolaroidFrame(
  ctx: CanvasRenderingContext2D,
  ix: number,
  iy: number,
  rotationDeg: number,
  photoUrl: string | undefined,
  title: string,
  scale: number,
): Promise<void> {
  const FW = Math.round(72 * scale);
  const FH = Math.round(82 * scale);
  const photoSize = FW - 8;
  const photoPad = 4;
  const pivotX = ix + FW / 2;
  const pivotY = iy + FH;
  const photoMidX = ix + photoPad + photoSize / 2;
  const photoMidY = iy + photoPad + photoSize / 2;

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.translate(-pivotX, -pivotY);

  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.round(20 * scale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ix, iy, FW, FH);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (photoUrl) {
    try {
      const img = await loadImageFromUrl(photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(ix + photoPad, iy + photoPad, photoSize, photoSize);
      ctx.clip();
      ctx.drawImage(img, ix + photoPad, iy + photoPad, photoSize, photoSize);
      ctx.restore();
    } catch {
      const grad = ctx.createLinearGradient(
        ix + photoPad, iy + photoPad,
        ix + photoPad + photoSize, iy + photoPad + photoSize,
      );
      grad.addColorStop(0, 'rgba(232,119,90,0.25)');
      grad.addColorStop(1, 'rgba(37,33,42,0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(ix + photoPad, iy + photoPad, photoSize, photoSize);
    }
  } else {
    const grad = ctx.createLinearGradient(
      ix + photoPad, iy + photoPad,
      ix + photoPad + photoSize, iy + photoPad + photoSize,
    );
    grad.addColorStop(0, 'rgba(232,119,90,0.25)');
    grad.addColorStop(1, 'rgba(37,33,42,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(ix + photoPad, iy + photoPad, photoSize, photoSize);
    ctx.fillStyle = 'rgba(251,245,240,0.5)';
    ctx.font = `${Math.round(9 * scale)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.slice(0, 14), photoMidX, photoMidY);
  }

  ctx.restore();
}

function drawPinDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
): void {
  const dotRadius = 4.5 * scale;
  ctx.fillStyle = '#E8775A';
  ctx.shadowColor = 'rgba(232,119,90,0.85)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy + dotRadius, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

async function drawStackOnCanvas(
  ctx: CanvasRenderingContext2D,
  ix: number,
  iy: number,
  locations: ApiLocation[],
  clusterIndex: number,
  side: 'center' | 'left' | 'right',
  scale: number,
  photoDataUrls: Record<string, string>,
): Promise<void> {
  const FW = Math.round(72 * scale);
  const FH = Math.round(82 * scale);
  const stepY = Math.round(FH * STACK_STEP_RATIO);
  const n = locations.length;
  const sideMargin = Math.round(8 * scale);
  const sideGap = side !== 'center' ? Math.round(16 * scale) : 0;
  const iconW = FW + 2 * sideMargin + sideGap;
  const dotRadius = 4.5 * scale;
  const photoLeft = side === 'right' ? sideMargin + sideGap : sideMargin;
  const pinCx = side === 'center'
    ? ix + Math.round(iconW / 2)
    : side === 'left'
      ? ix + sideMargin + FW + sideGap
      : ix + sideMargin;

  for (let j = n - 1; j >= 0; j--) {
    const loc = locations[j];
    const tilt = getStackTilt(clusterIndex, j);
    const photoUrl = loc.photoUrl ? photoDataUrls[loc.photoUrl] : undefined;
    await drawPolaroidFrame(ctx, ix + photoLeft, iy + j * stepY, tilt, photoUrl, loc.title, scale);
  }

  const pinDotTopY = n === 1 ? iy + FH + 3 : iy + stepY - dotRadius;
  drawPinDot(ctx, pinCx, pinDotTopY, scale);
}

function createStackIcon(
  locations: ApiLocation[],
  clusterIndex: number,
  side: 'center' | 'left' | 'right',
  scale: number,
  resolvedPhotos: Record<string, string>,
): L.DivIcon {
  const FW = Math.round(72 * scale);
  const FH = Math.round(82 * scale);
  const stepY = Math.round(FH * STACK_STEP_RATIO);
  const n = locations.length;
  const photoSize = FW - 8;
  const bottomPad = Math.round(14 * scale);
  const dotDiam = Math.max(5, Math.round(9 * scale));
  const sideMargin = Math.round(8 * scale);
  const sideGap = side !== 'center' ? Math.round(16 * scale) : 0;
  const iconW = FW + 2 * sideMargin + sideGap;
  const stackH = FH + (n - 1) * stepY;
  const iconH = n === 1 ? FH + 3 + dotDiam : stackH + 3;
  const photoLeft = side === 'right' ? sideMargin + sideGap : sideMargin;

  const pinCenterX = side === 'center'
    ? Math.round(iconW / 2)
    : side === 'left'
      ? sideMargin + FW + sideGap
      : sideMargin;
  const anchorX = pinCenterX;
  const anchorY = n === 1 ? iconH : stepY;

  const photosHtml = locations.map((loc, j) => {
    const tilt = getStackTilt(clusterIndex, j);
    const src = loc.photoUrl ? (resolvedPhotos[loc.photoUrl] ?? loc.photoUrl) : null;
    const photoHtml = src
      ? `<img src="${src}" alt="" style="width:${photoSize}px;height:${photoSize}px;object-fit:cover;display:block;" />`
      : `<div style="width:${photoSize}px;height:${photoSize}px;background:linear-gradient(135deg,rgba(232,119,90,0.25),rgba(37,33,42,0.5));"></div>`;
    return `<div style="position:absolute;top:${j * stepY}px;left:${photoLeft}px;background:white;padding:4px 4px ${bottomPad}px;box-shadow:0 6px 20px rgba(0,0,0,0.55),0 1px 4px rgba(0,0,0,0.3);transform:rotate(${tilt}deg);transform-origin:bottom center;z-index:${n - j};">
      ${photoHtml}
    </div>`;
  }).join('');

  const pinLeft = pinCenterX - Math.round(dotDiam / 2);
  const pinTop = n === 1 ? FH + 3 : stepY - Math.round(dotDiam / 2);

  return L.divIcon({
    html: `
      <div style="position:relative;width:${iconW}px;height:${iconH}px;overflow:visible;">
        ${photosHtml}
        <div style="position:absolute;left:${pinLeft}px;top:${pinTop}px;width:${dotDiam}px;height:${dotDiam}px;border-radius:50%;background:#E8775A;box-shadow:0 0 8px rgba(232,119,90,0.85);"></div>
      </div>`,
    className: '',
    iconSize: [iconW, iconH],
    iconAnchor: [anchorX, anchorY],
  });
}

function FitBoundsOnLoad({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [55, 45], maxZoom: 13 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ClusterComputer({
  locations,
  pinScale,
  onClustersReady,
}: {
  locations: ApiLocation[];
  pinScale: number;
  onClustersReady: (clusters: ClusterGroup[]) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      const pixelPoints = locations.map(loc =>
        map.latLngToContainerPoint([loc.latitude, loc.longitude]),
      );
      onClustersReady(computeClusters(locations, pixelPoints, pinScale));
    }, SPREAD_SETTLE_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function MapRefCapture({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export function FinalMapScreen({ locations, coupleName }: FinalMapScreenProps) {
  const isMobile = useIsMobile();
  const mapRef = useRef<L.Map | null>(null);
  const photoDataUrlsRef = useRef<Record<string, string>>({});
  const locationsRef = useRef(locations);
  const coupleNameRef = useRef(coupleName);
  const clustersRef = useRef<ClusterGroup[]>([]);
  const positionsRef = useRef<[number, number][]>([]);
  const pinScaleRef = useRef(0);

  const isSameCountry = computeIsSameCountry(locations);
  const pinScale = isSameCountry ? PIN_SCALE_SAME_COUNTRY : PIN_SCALE_MIXED_COUNTRIES;

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);
  const [prebuiltFile, setPrebuiltFile] = useState<File | null>(null);
  const [showInstagramTip, setShowInstagramTip] = useState(false);
  const [clusters, setClusters] = useState<ClusterGroup[] | null>(null);
  const [photoDataUrls, setPhotoDataUrls] = useState<Record<string, string>>({});
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [photosAttempted, setPhotosAttempted] = useState(false);

  const positions: [number, number][] = locations.map((l) => [l.latitude, l.longitude]);
  const initialCenter: [number, number] = positions.length > 0 ? positions[0] : [-14.235, -51.925];

  useEffect(() => { locationsRef.current = locations; }, [locations]);
  useEffect(() => { coupleNameRef.current = coupleName; }, [coupleName]);
  useEffect(() => { clustersRef.current = clusters ?? []; }, [clusters]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { photoDataUrlsRef.current = photoDataUrls; }, [photoDataUrls]);
  useEffect(() => { pinScaleRef.current = pinScale; }, [pinScale]);

  useEffect(() => {
    const photoUrls = locations.map((l) => l.photoUrl).filter(Boolean) as string[];
    if (photoUrls.length === 0) {
      setPhotosAttempted(true);
      return;
    }
    Promise.all(
      photoUrls.map(async (url) => [url, await fetchPhotoAsDataUrl(url)] as const),
    ).then((results) => {
      const map: Record<string, string> = {};
      for (const [url, dataUrl] of results) {
        if (dataUrl) map[url] = dataUrl;
      }
      setPhotoDataUrls(map);
      setPhotosAttempted(true);
    });
  }, [locations]);

  const captureImage = useCallback(async (): Promise<File | null> => {
    const map = mapRef.current;
    if (!map) return null;

    const size = map.getSize();
    const W = size.x;
    const H = size.y;

    const canvas = document.createElement('canvas');
    canvas.width = W * PIXEL_RATIO;
    canvas.height = H * PIXEL_RATIO;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

    ctx.fillStyle = '#1E1C2A';
    ctx.fillRect(0, 0, W, H);

    const mapContainer = map.getContainer();
    const containerRect = mapContainer.getBoundingClientRect();
    const tileImgs = Array.from(
      mapContainer.querySelectorAll<HTMLImageElement>('img.leaflet-tile'),
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    for (const img of tileImgs) {
      if (!img.complete || img.naturalWidth === 0) continue;
      const rect = img.getBoundingClientRect();
      ctx.drawImage(
        img,
        rect.left - containerRect.left,
        rect.top - containerRect.top,
        rect.width,
        rect.height,
      );
    }
    ctx.restore();

    const pos = positionsRef.current;
    if (pos.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#E8775A';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      pos.forEach(([lat, lng], i) => {
        const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    const scale = pinScaleRef.current;
    const clusterList = clustersRef.current;
    const FW = Math.round(72 * scale);
    const FH = Math.round(82 * scale);
    const stepY = Math.round(FH * STACK_STEP_RATIO);
    const sideMargin = Math.round(8 * scale);
    const dotDiam = Math.max(5, Math.round(9 * scale));
    const dotRadius = dotDiam / 2;

    for (const cluster of clusterList) {
      const [lat, lng] = cluster.position;
      const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
      const n = cluster.locations.length;
      const stackH = FH + (n - 1) * stepY;
      const sideGap = cluster.side !== 'center' ? Math.round(16 * scale) : 0;
      const iconW = FW + 2 * sideMargin + sideGap;
      const anchorY = n === 1 ? Math.round(FH + 3 + dotRadius) : Math.round(stepY);
      const anchorX = cluster.side === 'center'
        ? Math.round(iconW / 2)
        : cluster.side === 'left'
          ? sideMargin + FW + sideGap
          : sideMargin;

      await drawStackOnCanvas(
        ctx,
        pt.x - anchorX,
        pt.y - anchorY,
        cluster.locations,
        cluster.index,
        cluster.side,
        scale,
        photoDataUrlsRef.current,
      );
    }

    const topGrad = ctx.createLinearGradient(0, 0, 0, 112);
    topGrad.addColorStop(0, 'rgba(30,28,42,0.6)');
    topGrad.addColorStop(1, 'rgba(30,28,42,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 112);

    const bottomGrad = ctx.createLinearGradient(0, H, 0, H - 80);
    bottomGrad.addColorStop(0, 'rgba(30,28,42,0.88)');
    bottomGrad.addColorStop(1, 'rgba(30,28,42,0)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - 80, W, 80);

    drawHeartOnCanvas(ctx, W / 2, H - 35, 6, '#E8775A');

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(251,245,240,0.85)';
    ctx.font = '600 10px system-ui, -apple-system, Arial, sans-serif';
    fillTextCentered(ctx, 'OURLOVEMAP', W / 2, H - 19, 1.8);

    ctx.fillStyle = 'rgba(251,245,240,0.65)';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(coupleNameRef.current, W / 2, H - 6);

    return new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], 'nosso-mapa-do-amor.png', { type: 'image/png' }));
        }, 'image/png');
      } catch {
        resolve(null);
      }
    });
  }, []);

  useEffect(() => {
    if (clusters === null || !tilesLoaded || !photosAttempted) return;
    const timer = setTimeout(async () => {
      try {
        const file = await captureImage();
        if (file) setPrebuiltFile(file);
      } catch {
        // on-demand capture will run when user taps
      }
    }, CAPTURE_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [clusters, captureImage, tilesLoaded, photosAttempted]);

  useEffect(() => {
    if (!showInstagramTip) return;
    const timer = setTimeout(() => setShowInstagramTip(false), 5000);
    return () => clearTimeout(timer);
  }, [showInstagramTip]);

  const handleSave = useCallback(async () => {
    if (isCapturing) return;
    setCaptureError(false);

    let fileToShare = prebuiltFile;
    if (!fileToShare) {
      setIsCapturing(true);
      fileToShare = await captureImage();
      setIsCapturing(false);
    }

    if (!fileToShare) {
      setCaptureError(true);
      return;
    }

    if (isMobile) {
      const canShare =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [fileToShare] });
      if (canShare) {
        try {
          await navigator.share({ files: [fileToShare], title: 'Nosso Mapa do Amor' });
          return;
        } catch {
          // dismissed — fall through to download
        }
      }
      triggerDownload(fileToShare);
      setShowInstagramTip(true);
      return;
    }

    triggerDownload(fileToShare);
  }, [prebuiltFile, isCapturing, captureImage, isMobile]);

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
              eventHandlers={{ load: () => setTilesLoaded(true) }}
            />
            <Polyline
              positions={positions}
              pathOptions={{ color: '#E8775A', weight: 1.5, dashArray: '5 8', opacity: 0.65 }}
            />
            {clusters !== null && clusters.map((cluster) => (
              <Marker
                key={`${cluster.index}-${cluster.side}`}
                position={cluster.position}
                icon={createStackIcon(
                  cluster.locations,
                  cluster.index,
                  cluster.side,
                  pinScale,
                  photoDataUrls,
                )}
              />
            ))}
            <FitBoundsOnLoad positions={positions} />
            <ClusterComputer
              locations={locations}
              pinScale={pinScale}
              onClustersReady={setClusters}
            />
            <MapRefCapture mapRef={mapRef} />
          </MapContainer>
        )}

        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, rgba(30,28,42,0.6) 0%, transparent 100%)' }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: '20px',
            paddingTop: '56px',
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(30,28,42,0.88) 0%, transparent 100%)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8775A" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p style={{
            fontFamily: 'system-ui, -apple-system, Arial, Helvetica, sans-serif',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginTop: '4px',
            marginBottom: 0,
            color: 'rgba(251,245,240,0.85)',
          }}>
            ourlovemap
          </p>
          <p style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '11px',
            marginTop: '2px',
            marginBottom: 0,
            color: 'rgba(251,245,240,0.65)',
          }}>
            {coupleName}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-4 mt-8">
        <p className="text-sm text-center max-w-xs" style={{ color: 'rgba(251,245,240,0.5)', lineHeight: 1.55 }}>
          {isMobile ? 'Compartilhe nos Stories ou salve na galeria.' : 'Salve a imagem e compartilhe nos Stories.'}
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
          {isCapturing ? 'Gerando...' : isMobile ? 'Compartilhar nos Stories' : 'Salvar imagem'}
        </button>
        {captureError && (
          <p
            className="text-xs text-center max-w-xs px-4 py-2.5 rounded-xl"
            style={{
              color: 'rgba(251,245,240,0.85)',
              background: 'rgba(216,85,96,0.18)',
              border: '1px solid rgba(216,85,96,0.3)',
              lineHeight: 1.5,
            }}
          >
            Não foi possível gerar a imagem. Tire um print da tela para salvar.
          </p>
        )}
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
