import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { CoupleNames } from '../ui/CoupleNames';
import { useRelationshipCounter } from '../../hooks/use-relationship-counter';

interface CoverScreenProps {
  coupleName: string;
  opening?: string;
  startDate: string;
  onStart?: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function CoverScreen({ coupleName, opening, startDate, onStart }: CoverScreenProps) {
  const ring1Ref = useRef<SVGCircleElement>(null);
  const ring2Ref = useRef<SVGCircleElement>(null);
  const ring3Ref = useRef<SVGCircleElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const counter = useRelationshipCounter(startDate);

  useEffect(() => {
    const tweens = [
      gsap.to(ring1Ref.current, { opacity: 0, scale: 1.6, duration: 1.4, repeat: -1, yoyo: true, ease: 'power1.inOut' }),
      gsap.to(ring2Ref.current, { opacity: 0, scale: 1.9, duration: 1.4, repeat: -1, yoyo: true, ease: 'power1.inOut', delay: 0.3 }),
      gsap.to(ring3Ref.current, { opacity: 0, scale: 2.2, duration: 1.4, repeat: -1, yoyo: true, ease: 'power1.inOut', delay: 0.6 }),
      gsap.to(arrowRef.current, { y: 8, duration: 0.8, repeat: -1, yoyo: true, ease: 'power1.inOut' }),
    ];
    return () => { tweens.forEach(t => t.kill()); };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: '#25212A' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="cover-glow" cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="#E8775A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E8775A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g opacity="0.08" stroke="white" strokeWidth="1" fill="none">
          {[0, 100, 200, 300, 400, 500, 600].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} />
          ))}
          {[0, 100, 200, 300, 400, 500, 600, 700, 800].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" />
          ))}
        </g>
        <g opacity="0.12" stroke="white" strokeWidth="1.5" fill="none">
          <path d="M 100 0 Q 200 150 150 300 T 250 600" />
          <path d="M 400 0 C 500 100 350 250 450 400 S 600 500 550 600" />
          <path d="M 650 0 Q 700 200 600 350 T 700 600" />
        </g>
        <ellipse cx="400" cy="300" rx="280" ry="280" fill="url(#cover-glow)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6">
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(251,245,240,0.5)' }}>
          Um mapa pra você
        </p>

        <h1 className="font-serif text-4xl md:text-6xl" style={{ color: '#FBF5F0' }}>
          <CoupleNames names={coupleName} />
        </h1>

        {opening && (
          <p className="font-serif italic text-lg max-w-sm" style={{ color: 'rgba(251,245,240,0.7)' }}>
            {opening}
          </p>
        )}

        <div
          data-testid="relationship-counter"
          className="flex items-center gap-3 text-sm font-mono"
          style={{ color: 'rgba(251,245,240,0.6)' }}
        >
          <span>{counter.years}a</span>
          <span style={{ color: 'rgba(251,245,240,0.3)' }}>·</span>
          <span>{counter.months}m</span>
          <span style={{ color: 'rgba(251,245,240,0.3)' }}>·</span>
          <span>{counter.days}d</span>
          <span style={{ color: 'rgba(251,245,240,0.3)' }}>·</span>
          <span>{pad2(counter.hours)}:{pad2(counter.minutes)}:{pad2(counter.seconds)}</span>
        </div>

        <a
          href="#place-0"
          className="relative flex items-center justify-center mt-4"
          aria-label="toque pra começar"
          onClick={onStart}
        >
          <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden="true">
            <circle ref={ring1Ref} cx="40" cy="40" r="36" fill="none" stroke="#E8775A" strokeWidth="1.5" opacity="0.5" />
            <circle ref={ring2Ref} cx="40" cy="40" r="28" fill="none" stroke="#E8775A" strokeWidth="1" opacity="0.35" />
            <circle ref={ring3Ref} cx="40" cy="40" r="20" fill="none" stroke="#E8775A" strokeWidth="1" opacity="0.2" />
            <circle cx="40" cy="40" r="10" fill="#E8775A" />
          </svg>
        </a>
        <p className="text-xs" style={{ color: 'rgba(251,245,240,0.4)' }}>toque pra começar</p>
      </div>

      <div ref={arrowRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" aria-hidden="true">
        <p className="text-xs tracking-widest" style={{ color: 'rgba(251,245,240,0.4)' }}>role pra baixo</p>
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" style={{ color: 'rgba(251,245,240,0.4)' }}>
          <path d="M 8 2 L 8 14 M 3 9 L 8 14 L 13 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
