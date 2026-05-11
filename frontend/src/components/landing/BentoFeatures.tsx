import { MapPin, Camera, Music, Calendar, Share2, QrCode } from 'lucide-react';
import { Eyebrow } from '../ui/Eyebrow';

const BENTO_MAP_TILE_MIN_HEIGHT = 400;
const BENTO_TILE_MIN_HEIGHT = 190;
const BENTO_PINS: [number, number][] = [[60, 320], [240, 260], [440, 80]];
const POLAROID_ROTATIONS = [-6, 3, -4];
const POLAROID_GRADIENTS = [
  'linear-gradient(135deg,#FAA2A7,#BF77F6)',
  'linear-gradient(135deg,#BF77F6,#413C7B)',
  'linear-gradient(135deg,#F56C73,#FAA2A7)',
];

function DarkTileIcon({ Icon }: { Icon: React.ComponentType<{ size: number; strokeWidth: number }> }) {
  return (
    <div className="w-11 h-11 rounded-[14px] bg-[rgba(251,245,240,0.08)] text-white flex items-center justify-center mb-3.5">
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

function LightTileIcon({ Icon }: { Icon: React.ComponentType<{ size: number; strokeWidth: number }> }) {
  return (
    <div className="w-11 h-11 rounded-[14px] bg-olm-primary-100 text-olm-primary flex items-center justify-center mb-3.5">
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="bg-olm-bg px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <Eyebrow>Funcionalidades</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Detalhes que fazem vocês dizerem <em className="text-olm-primary">uau</em>.
          </h2>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
          style={{ gridAutoRows: `minmax(${BENTO_TILE_MIN_HEIGHT}px, auto)` }}
        >
          {/* Big map tile — dark, 2x2 */}
          <div
            className="col-span-2 row-span-2 rounded-[22px] overflow-hidden bg-olm-dark border border-[rgba(65,60,123,0.06)] relative flex flex-col justify-between p-7"
            style={{ minHeight: BENTO_MAP_TILE_MIN_HEIGHT }}
          >
            <div className="absolute inset-0 opacity-90">
              <svg viewBox="0 0 500 400" className="w-full h-full">
                <defs>
                  <pattern id="bfg" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path
                      d="M 22 0 L 0 0 0 22"
                      fill="none"
                      stroke="rgba(251,245,240,0.04)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="500" height="400" fill="url(#bfg)" />
                <path
                  d="M 60 320 Q 150 240, 240 260 T 440 80"
                  stroke="#F56C73"
                  strokeWidth="2"
                  strokeDasharray="2 7"
                  fill="none"
                />
                {BENTO_PINS.map(([x, y], pinIndex) => (
                  <g key={pinIndex} transform={`translate(${x - 10}, ${y - 20})`}>
                    <circle cx="10" cy="10" r="18" fill="rgba(245,108,115,0.18)" />
                    <path
                      d="M10 0 C16 0, 20 4, 20 10 C20 17, 10 22, 10 22 C10 22, 0 17, 0 10 C0 4, 4 0, 10 0 Z"
                      fill="#F56C73"
                    />
                  </g>
                ))}
              </svg>
            </div>
            <div className="relative z-10">
              <DarkTileIcon Icon={MapPin} />
              <div className="font-serif text-[22px] text-white leading-[1.15]">
                Mapa interativo com pins
              </div>
              <div className="text-sm text-[rgba(251,245,240,0.72)] leading-[1.5] mt-2">
                Cada local ganha um pin animado e se conecta em uma rota desenhada à mão.
              </div>
            </div>
          </div>

          {/* Polaroids — 2x1 */}
          <div className="col-span-2 rounded-[22px] bg-white border border-[rgba(65,60,123,0.06)] p-7 flex flex-col justify-between">
            <div>
              <LightTileIcon Icon={Camera} />
              <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                Fotos em polaroide
              </div>
              <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                Upload simples e cada foto aparece na página pública com aquele visual de viagem.
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {POLAROID_ROTATIONS.map((rot, polaroidIndex) => (
                <div
                  key={polaroidIndex}
                  className="bg-white p-1 pb-[14px] rounded-sm"
                  style={{
                    width: 70,
                    transform: `rotate(${rot}deg)`,
                    boxShadow: '0 6px 16px rgba(65,60,123,0.15)',
                  }}
                >
                  <div
                    className="aspect-square"
                    style={{ background: POLAROID_GRADIENTS[polaroidIndex] }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* YouTube */}
          <div
            className="rounded-[22px] bg-white border border-[rgba(65,60,123,0.06)] p-7 flex flex-col justify-between"
            style={{ minHeight: BENTO_TILE_MIN_HEIGHT }}
          >
            <LightTileIcon Icon={Music} />
            <div>
              <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                Música do YouTube
              </div>
              <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                Adicione um vídeo com timestamp pra tocar no momento certo.
              </div>
            </div>
          </div>

          {/* Counter — dark */}
          <div
            className="rounded-[22px] bg-olm-title border border-[rgba(65,60,123,0.06)] p-7 flex flex-col justify-between"
            style={{ minHeight: BENTO_TILE_MIN_HEIGHT }}
          >
            <DarkTileIcon Icon={Calendar} />
            <div>
              <div className="font-serif text-[22px] text-white leading-[1.15]">
                Contador ao vivo
              </div>
              <div className="font-serif text-[28px] text-white mt-2">2 anos · 7 meses</div>
              <div className="text-xs text-[rgba(251,245,240,0.6)] tracking-[0.1em] uppercase mt-0.5">
                e ainda contando
              </div>
            </div>
          </div>

          {/* Instagram — 2x1 */}
          <div className="col-span-2 rounded-[22px] bg-white border border-[rgba(65,60,123,0.06)] p-7">
            <div className="flex gap-5 items-center">
              <div className="flex-1">
                <LightTileIcon Icon={Share2} />
                <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                  Compartilhe no Instagram
                </div>
                <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                  Story em 9:16 com a página pronta pra postar, direto do celular.
                </div>
              </div>
              <div
                className="w-[100px] h-[170px] rounded-[14px] shrink-0 border-[3px] border-white p-2.5 flex flex-col justify-end"
                style={{
                  background: 'linear-gradient(135deg, #F56C73, #BF77F6)',
                  boxShadow: '0 10px 22px rgba(191,119,246,0.35)',
                }}
              >
                <div className="font-serif text-[14px] text-white leading-[1.05]">
                  Ana <em>e</em> Lucas
                </div>
                <div className="text-[8px] text-[rgba(255,255,255,0.8)] mt-0.5">ourlovemap.com</div>
              </div>
            </div>
          </div>

          {/* QR Code — 2x1 */}
          <div className="col-span-2 rounded-[22px] bg-white border border-[rgba(65,60,123,0.06)] p-7">
            <div className="flex gap-5 items-center">
              <div className="flex-1">
                <LightTileIcon Icon={QrCode} />
                <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                  QR Code por email
                </div>
                <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                  Chega no seu email em instantes, pronto pra presentear ou imprimir.
                </div>
              </div>
              <div
                className="w-24 h-24 p-2.5 bg-white border-[1.5px] border-olm-surface rounded-xl shrink-0"
                aria-label="QR Code decorativo"
              >
                <svg
                  viewBox="0 0 21 21"
                  className="w-full h-full"
                  style={{ imageRendering: 'pixelated' }}
                >
                  {Array.from({ length: 21 }).map((_, rowIndex) =>
                    Array.from({ length: 21 }).map((_, colIndex) => {
                      const filled =
                        (colIndex + rowIndex * 3 + ((colIndex * rowIndex) % 5)) % 3 === 0 ||
                        (colIndex < 3 && rowIndex < 3) ||
                        (colIndex > 17 && rowIndex < 3) ||
                        (colIndex < 3 && rowIndex > 17);
                      return filled ? (
                        <rect
                          key={`${colIndex}-${rowIndex}`}
                          x={colIndex}
                          y={rowIndex}
                          width={1}
                          height={1}
                          fill="#25212A"
                        />
                      ) : null;
                    }),
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
