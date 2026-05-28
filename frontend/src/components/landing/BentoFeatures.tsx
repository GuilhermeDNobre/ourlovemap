import { useState, useRef } from "react";
import {
  MapPin,
  Camera,
  Music,
  Calendar,
  Share2,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Eyebrow } from "../ui/Eyebrow";
import qrCodeSvg from "../../assets/lp/qr-code.svg";

const BENTO_MAP_TILE_MIN_HEIGHT = 400;
const BENTO_TILE_MIN_HEIGHT = 190;
const BENTO_PINS: [number, number][] = [
  [60, 320],
  [240, 260],
  [440, 80],
];
const CLUSTER_CX = 30.5;
const CLUSTER_CY = 30;
const POLAROID_ROTATIONS = [-6, 3, -4];
const POLAROID_GRADIENTS = [
  "linear-gradient(135deg,#FAA2A7,#BF77F6)",
  "linear-gradient(135deg,#BF77F6,#413C7B)",
  "linear-gradient(135deg,#F56C73,#FAA2A7)",
];

const mapReveal = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "linear" as const },
  },
};

const polaroidReveal = {
  hidden: { opacity: 0, y: 120, rotate: -6 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { type: "spring" as const, damping: 35, stiffness: 180, mass: 1 },
  },
};

const youtubeReveal = {
  hidden: { opacity: 0, scale: 0.8, rotate: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 200, mass: 1 },
  },
};

const counterReveal = {
  hidden: { opacity: 0, y: 80, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 50, stiffness: 250, mass: 0.8 },
  },
};

const instagramReveal = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 35, stiffness: 180, mass: 1 },
  },
};

const qrReveal = {
  hidden: { opacity: 0, scale: 0.75, rotate: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, damping: 40, stiffness: 200, mass: 1 },
  },
};

function DarkTileIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-11 h-11 rounded-[14px] bg-[rgba(251,245,240,0.08)] text-white flex items-center justify-center mb-3.5">
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

function LightTileIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-11 h-11 rounded-[14px] bg-olm-primary-100 text-olm-primary flex items-center justify-center mb-3.5">
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

export function BentoFeatures() {
  const [isHovered, setIsHovered] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(mapRef, { once: true, amount: 0.2 });

  return (
    <section
      id="features"
      className="bg-olm-bg"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-16">
        <div
          className="text-center max-w-[620px] mx-auto mb-10"
        >
          <Eyebrow>Funcionalidades</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: "var(--fs-h2)" }}
          >
            Detalhes que fazem vocês dizerem{" "}
            <em className="text-olm-primary">uau</em>.
          </h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={{
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5"
          style={{ gridAutoRows: `minmax(${BENTO_TILE_MIN_HEIGHT}px, auto)` }}
        >
          {/* Big map tile — dark, 2×2 — pins cluster at MapPin icon, fly on scroll reveal, radar-ring + float on hover */}
          <motion.div
            ref={mapRef}
            variants={mapReveal}
            className="group sm:col-span-2 md:col-span-2 md:row-span-2 rounded-[22px] overflow-hidden bg-olm-dark border border-olm-surface relative flex flex-col justify-between p-7 transition-all duration-500 ease-emphasized hover:-translate-y-0.5"
            style={{ minHeight: BENTO_MAP_TILE_MIN_HEIGHT }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="absolute inset-0 opacity-90">
              <svg
                viewBox="0 0 500 400"
                preserveAspectRatio="xMinYMin meet"
                className="w-full h-full"
              >
                <defs>
                  <pattern
                    id="bfg"
                    width="22"
                    height="22"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 22 0 L 0 0 0 22"
                      fill="none"
                      stroke="rgba(251,245,240,0.04)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <mask id="route-mask">
                    <path
                      d="M 60 320 Q 150 240, 240 260 T 440 80"
                      stroke="white"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 600,
                        strokeDashoffset: isInView ? 0 : 600,
                        transitionProperty: isInView
                          ? "stroke-dashoffset"
                          : "none",
                        transitionDuration: isInView ? "1200ms" : "0ms",
                        transitionTimingFunction: isInView
                          ? "var(--ease-emphasized)"
                          : "linear",
                        transitionDelay: isInView ? "500ms" : "0ms",
                      }}
                    />
                  </mask>
                  <style>{`
                    @keyframes ring-radar {
                      0% { transform: scale(0.4); opacity: 0.7; }
                      50% { transform: scale(2.8); opacity: 0.15; }
                      100% { transform: scale(3.2); opacity: 0; }
                    }
                    @keyframes pin-float {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-4px); }
                    }
                    @keyframes glow-breathe {
                      0%, 100% { transform: scale(1); opacity: 0.18; }
                      50% { transform: scale(1.25); opacity: 0.3; }
                    }
                  `}</style>
                </defs>
                <rect width="500" height="400" fill="url(#bfg)" />
                {/* Dashed route — faint by default, revealed progressively via mask on scroll */}
                <path
                  d="M 60 320 Q 150 240, 240 260 T 440 80"
                  stroke="#F56C73"
                  strokeWidth="2"
                  strokeDasharray="2 7"
                  fill="none"
                  mask="url(#route-mask)"
                  className="transition-opacity duration-500 ease-standard"
                  style={{
                    opacity: isInView ? 0.7 : 0.15,
                    transition: isInView
                      ? "opacity 800ms ease-standard"
                      : "none",
                  }}
                />
                {/* Pins: clustered at MapPin icon, fly on scroll reveal, then radar-ring + float on hover */}
                {BENTO_PINS.map(([x, y], pinIndex) => {
                  const isPulsing = isHovered && isInView;
                  return (
                    <g
                      key={pinIndex}
                      style={{
                        transform: isInView
                          ? `translate(${x - 10}px, ${y - 20}px)`
                          : `translate(${CLUSTER_CX}px, ${CLUSTER_CY}px)`,
                        transitionProperty: isInView
                          ? "transform"
                          : "none",
                        transitionDuration: isInView ? "1000ms" : "0ms",
                        transitionTimingFunction: isInView
                          ? "var(--ease-emphasized)"
                          : "linear",
                        transitionDelay: isInView
                          ? `${pinIndex * 120}ms`
                          : "0ms",
                      }}
                    >
                      <g
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "center",
                          animation: isPulsing
                            ? "ring-radar 2s ease-out infinite"
                            : "none",
                        }}
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="7"
                          fill="none"
                          stroke="#F56C73"
                          strokeWidth="2"
                        />
                      </g>
                      <g
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "center",
                          animation: isPulsing
                            ? "glow-breathe 2.5s ease-in-out infinite"
                            : "none",
                        }}
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="18"
                          fill="rgba(245,108,115,0.18)"
                        />
                      </g>
                      <g
                        style={{
                          animation: isPulsing
                            ? "pin-float 2.5s ease-in-out infinite"
                            : "none",
                        }}
                      >
                        <path
                          d="M10 0 C16 0, 20 4, 20 10 C20 17, 10 22, 10 22 C10 22, 0 17, 0 10 C0 4, 4 0, 10 0 Z"
                          fill="#F56C73"
                        />
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="relative z-10">
              <DarkTileIcon Icon={MapPin} />
              <div className="font-serif text-[22px] text-white leading-[1.15]">
                Mapa interativo com pins
              </div>
              <div className="text-sm text-[rgba(251,245,240,0.72)] leading-[1.5] mt-2">
                Cada local ganha um pin animado e se conecta em uma rota
                desenhada à mão.
              </div>
            </div>
          </motion.div>

          {/* Polaroids — 2x1 */}
          <motion.div variants={polaroidReveal} className="group sm:col-span-2 md:col-span-2 rounded-[22px] bg-olm-bg-elevated border border-olm-surface p-7 flex flex-col justify-between transition-all duration-500 ease-emphasized hover:-translate-y-0.5">
            <div>
              <LightTileIcon Icon={Camera} />
              <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                Fotos em polaroide
              </div>
              <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                Upload simples e cada foto aparece na página pública com aquele
                visual de viagem.
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {POLAROID_ROTATIONS.map((rot, polaroidIndex) => (
                <div
                  key={polaroidIndex}
                  className="bg-olm-bg-elevated p-1 pb-[14px] rounded-sm transition-all duration-500 ease-emphasized group-hover:-translate-y-1.5 group-hover:[box-shadow:0_12px_24px_rgba(65,60,123,0.2)]"
                  style={{
                    width: 70,
                    transform: `rotate(${rot}deg)`,
                    boxShadow: "0 6px 16px rgba(65,60,123,0.15)",
                  }}
                >
                  <div
                    className="aspect-square"
                    style={{ background: POLAROID_GRADIENTS[polaroidIndex] }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* YouTube */}
          <motion.div variants={youtubeReveal}
            className="group rounded-[22px] bg-olm-bg-elevated border border-olm-surface p-7 flex flex-col justify-between transition-all duration-500 ease-emphasized hover:-translate-y-0.5"
            style={{ minHeight: BENTO_TILE_MIN_HEIGHT }}
          >
            <div className="transition-all duration-500 ease-soft-spring group-hover:scale-110 group-hover:rotate-6">
              <LightTileIcon Icon={Music} />
            </div>
            <div>
              <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                Música do YouTube
              </div>
              <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                Adicione um vídeo com timestamp pra tocar no momento certo.
              </div>
            </div>
          </motion.div>

          {/* Counter — dark */}
          <motion.div variants={counterReveal}
            className="group rounded-[22px] bg-olm-bg-card-dark border border-olm-surface p-7 flex flex-col justify-between transition-all duration-500 ease-emphasized hover:-translate-y-0.5"
            style={{ minHeight: BENTO_TILE_MIN_HEIGHT }}
          >
            <div className="transition-transform duration-500 ease-soft-spring group-hover:-rotate-6">
              <DarkTileIcon Icon={Calendar} />
            </div>
            <div>
              <div className="font-serif text-[22px] text-white leading-[1.15]">
                Contador ao vivo
              </div>
              <div className="font-serif text-[28px] text-white mt-2 transition-transform duration-500 ease-emphasized group-hover:scale-105">
                2 anos · 7 meses
              </div>
              <div className="text-xs text-[rgba(251,245,240,0.6)] tracking-[0.1em] uppercase mt-0.5">
                e ainda contando
              </div>
            </div>
          </motion.div>

          {/* Instagram — 2x1 */}
          <motion.div variants={instagramReveal} className="group sm:col-span-2 md:col-span-2 rounded-[22px] bg-olm-bg-elevated border border-olm-surface p-7 transition-all duration-500 ease-emphasized hover:-translate-y-0.5">
            <div className="flex gap-5 items-center">
              <div className="flex-1">
                <LightTileIcon Icon={Share2} />
                <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                  Compartilhe no Instagram
                </div>
                <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                  Story em 9:16 com a página pronta pra postar, direto do
                  celular.
                </div>
              </div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: 80 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { type: "spring", damping: 35, stiffness: 180, mass: 1, delay: 0.1 },
                  },
                }}
                className="w-[100px] h-[170px] rounded-[14px] shrink-0 border-[3px] border-white p-2.5 flex flex-col justify-end transition-all duration-500 ease-emphasized group-hover:-translate-y-2 group-hover:[box-shadow:0_16px_32px_rgba(191,119,246,0.5)]"
                style={{
                  background: "linear-gradient(135deg, #F56C73, #BF77F6)",
                  boxShadow: "0 10px 22px rgba(191,119,246,0.35)",
                }}
              >
                <div className="font-serif text-[14px] text-white leading-[1.05]">
                  Ana <em>e</em> Lucas
                </div>
                <div className="text-[8px] text-[rgba(255,255,255,0.8)] mt-0.5">
                  ourlovemap.com
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* QR Code — 2x1 */}
          <motion.div variants={qrReveal} className="group sm:col-span-2 md:col-span-2 rounded-[22px] bg-olm-bg-elevated border border-olm-surface p-7 transition-all duration-500 ease-emphasized hover:-translate-y-0.5">
            <div className="flex gap-5 items-center">
              <div className="flex-1">
                <LightTileIcon Icon={QrCode} />
                <div className="font-serif text-[22px] text-olm-title leading-[1.15]">
                  QR Code por email
                </div>
                <div className="text-sm text-fg-2 leading-[1.5] mt-2">
                  Chega no seu email em instantes, pronto pra presentear ou
                  imprimir.
                </div>
              </div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.6, rotate: 15 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    transition: { type: "spring", damping: 40, stiffness: 200, mass: 1, delay: 0.08 },
                  },
                }}
                className="w-24 h-24 p-2.5 bg-olm-bg-elevated border-[1.5px] border-olm-surface rounded-xl shrink-0 transition-all duration-500 ease-emphasized group-hover:rotate-3 group-hover:scale-105 group-hover:border-olm-accent"
                aria-label="QR Code decorativo"
              >
                <img src={qrCodeSvg} className="w-full h-full" alt="QR Code" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
