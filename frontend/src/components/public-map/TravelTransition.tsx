import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PATH_VARIANTS = [
  'M 200 20 Q 350 80 300 180 Q 250 280 380 360 Q 480 420 400 500',
  'M 100 40 C 250 10 350 140 280 220 S 150 320 300 420 T 380 500',
  'M 350 20 Q 200 100 250 200 T 180 320 Q 150 400 300 480',
] as const;

type Variant = 0 | 1 | 2;

interface TravelTransitionProps {
  fromTitle: string;
  toTitle: string;
  variant: Variant;
}

export function TravelTransition({ fromTitle, toTitle, variant }: TravelTransitionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const travelerRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const section = sectionRef.current;
    if (!path || !section) return;
    const totalLength = path.getTotalLength();
    gsap.set(path, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
    const st = gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self: { progress: number }) => {
          if (!path || !travelerRef.current) return;
          const point = path.getPointAtLength(self.progress * totalLength);
          gsap.set(travelerRef.current, { attr: { cx: point.x, cy: point.y } });
        },
      },
    });
    return () => { st.kill(); };
  }, []);

  const pathD = PATH_VARIANTS[variant];

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height: '90vh', background: '#25212A' }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 520"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ opacity: 0.35 }}
      >
        <g stroke="white" strokeWidth="0.5" fill="none">
          {[0, 60, 120, 180, 240, 300, 360, 420, 480].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="500" y2={y} />
          ))}
          {[0, 60, 120, 180, 240, 300, 360, 420, 480].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="520" />
          ))}
        </g>
      </svg>

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 520"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          d={pathD}
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.08"
        />
        <path
          ref={pathRef}
          d={pathD}
          stroke="#E8775A"
          strokeWidth="2.5"
          fill="none"
          style={{ filter: 'drop-shadow(0 0 6px rgba(232,119,90,0.8))' }}
        />
        <circle
          ref={travelerRef}
          r="5"
          fill="#E8775A"
          cx="200"
          cy="20"
          style={{ filter: 'drop-shadow(0 0 4px rgba(232,119,90,0.9))' }}
        />
      </svg>

      <div className="relative z-10 text-center px-6" style={{ pointerEvents: 'none' }}>
        <p className="font-serif italic" style={{ color: 'rgba(251,245,240,0.8)', fontSize: '1.125rem', lineHeight: 1.8 }}>
          <span>de {fromTitle}</span>
        </p>
        <p className="font-serif italic" style={{ color: 'rgba(251,245,240,0.4)', fontSize: '0.875rem' }}>pra</p>
        <p className="font-serif italic" style={{ color: 'rgba(251,245,240,0.8)', fontSize: '1.125rem' }}>
          <span>{toTitle}</span>
        </p>
      </div>
    </section>
  );
}
