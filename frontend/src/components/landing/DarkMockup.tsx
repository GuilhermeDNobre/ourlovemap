import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import casalRestaurantePng from '../../assets/lp/casal-restaurante.png';
import casalPraiaPng from '../../assets/lp/casal-praia.png';
import casalNatalPng from '../../assets/lp/casal-natal.png';

type MockupSize = 'md' | 'lg';

interface DarkMockupProps {
  size?: MockupSize;
}

interface MockupPlace {
  image: string;
  label: string;
  address: string;
  quote: string;
}

const PLACES: MockupPlace[] = [
  {
    image: casalRestaurantePng,
    label: 'Primeiro Encontro',
    address: 'Villa Restaurante, Fortaleza',
    quote: 'Onde tudo começou',
  },
  {
    image: casalPraiaPng,
    label: 'Nossa primeira viagem juntos',
    address: 'Barraca Areias Coloridas, Beberibe',
    quote: 'O mar era lindo, mas eu só conseguia olhar pra você.',
  },
  {
    image: casalNatalPng,
    label: 'Nosso primeiro natal',
    address: 'Fortaleza, CE',
    quote: 'Você virou minha tradição favorita.',
  },
];

const MOCKUP_WIDTH_MD = 340;
const MOCKUP_WIDTH_LG = 420;
const MAP_PINS: [number, number][] = [[40, 125], [150, 100], [255, 30]];
const CYCLE_INTERVAL_MS = 3200;

export function DarkMockup({ size = 'md' }: DarkMockupProps) {
  const width = size === 'lg' ? MOCKUP_WIDTH_LG : MOCKUP_WIDTH_MD;
  const [active, setActive] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % PLACES.length);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!textRef.current) return;
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' },
    );
  }, [active]);

  const place = PLACES[active];

  return (
    <div
      className="rounded-[28px] overflow-hidden bg-olm-dark border border-[rgba(251,245,240,0.06)] w-full"
      style={{
        maxWidth: width,
        boxShadow: '0 40px 80px rgba(65,60,123,0.25), 0 16px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="h-7 bg-olm-dark-800 flex items-center gap-1.5 px-3">
        {[0, 1, 2].map((dotIndex) => (
          <span key={dotIndex} className="w-2 h-2 rounded-full bg-olm-dark-600" />
        ))}
        <span className="flex-1" />
        <span className="font-sans text-[9px] text-dfg-4 tracking-[0.1em]">
          ourlovemap.com/ana-e-lucas
        </span>
      </div>

      <div className="p-[18px] text-dfg-1">
        <div className="font-serif text-[22px] leading-tight">
          Ana <em className="text-olm-primary">e</em> Lucas
        </div>
        <div className="text-[10px] text-dfg-3 tracking-[0.1em] mt-1">
          2 ANOS · 7 MESES · 14 DIAS
        </div>

        <div
          className="relative mt-3.5 rounded-[14px] overflow-hidden"
          style={{ height: 155, background: 'linear-gradient(180deg, #332E3A, #25212A)' }}
        >
          <svg viewBox="0 0 300 155" className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="mg" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(251,245,240,0.05)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="300" height="155" fill="url(#mg)" />
            <path
              d="M 40 125 Q 80 75, 150 100 T 255 30"
              stroke="#F56C73"
              strokeWidth="2"
              strokeDasharray="2 6"
              fill="none"
              strokeLinecap="round"
            />
            {MAP_PINS.map(([x, y]) => (
              <g key={`pin-${x}-${y}`} transform={`translate(${x - 8}, ${y - 16})`}>
                <circle cx="8" cy="8" r="12" fill="rgba(245,108,115,0.2)" />
                <path
                  d="M8 0 C13 0, 16 3, 16 8 C16 14, 8 18, 8 18 C8 18, 0 14, 0 8 C0 3, 3 0, 8 0 Z"
                  fill="#F56C73"
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-3 flex gap-1.5">
          {PLACES.map((p, i) => {
            const isActive = i === active;
            return (
              <button
                key={p.label}
                type="button"
                aria-label={p.label}
                onClick={() => setActive(i)}
                className="relative flex-1 rounded-xl cursor-pointer"
                style={{
                  height: 94,
                  boxShadow: isActive ? '0 0 0 1.5px rgba(232,119,90,0.75)' : 'none',
                  transition: 'box-shadow 0.45s ease',
                }}
              >
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.label}
                    className="w-full h-full object-cover object-top"
                    style={{
                      opacity: isActive ? 1 : 0.4,
                      transform: isActive ? 'scale(1.08)' : 'scale(1)',
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 px-3 py-2.5 rounded-xl border border-[rgba(251,245,240,0.08)] bg-[rgba(251,245,240,0.04)]">
          <div ref={textRef}>
            <div className="text-[9px] text-olm-primary tracking-[0.12em] font-semibold uppercase leading-normal">
              {place.label}
            </div>
            <div className="font-serif text-[13px] mt-0.5 leading-snug text-dfg-1">
              {place.address}
            </div>
            <div className="text-[10px] text-dfg-3 mt-[3px] italic font-serif leading-relaxed">
              &ldquo;{place.quote}&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
