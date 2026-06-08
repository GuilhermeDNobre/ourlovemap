import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { Eyebrow } from '../ui/Eyebrow';
import { DarkMockup } from './DarkMockup';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (mockupRef.current) {
        gsap.to(mockupRef.current, {
          y: -7,
          duration: 3.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.06,
          opacity: 0.65,
          duration: 4.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }

      if (routeRef.current) {
        const len = routeRef.current.getTotalLength();
        routeRef.current.style.strokeDasharray = `${len}`;
        routeRef.current.style.strokeDashoffset = `${len}`;
        gsap.to(routeRef.current, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        });
      }

      if (scrollHintRef.current) {
        gsap.to(scrollHintRef.current, {
          y: 5,
          opacity: 0.25,
          duration: 1.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }

      const countObj = { val: 0 };
      gsap.to(countObj, {
        val: 3200,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = Math.round(countObj.val).toLocaleString();
          }
        },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="bg-olm-bg border-b min-h-dvh border-olm-surface relative overflow-hidden"
    >
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none origin-center"
        style={{
          background:
            'radial-gradient(ellipse 85% 60% at 65% 50%, rgba(245,108,115,0.09) 0%, rgba(231,183,104,0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--olm-title) 0.5px, transparent 0.5px)',
          backgroundSize: '28px 28px',
          opacity: '0.04',
        }}
      />

      <div className="absolute inset-0 pointer-events-none select-none">
        <svg
          viewBox="0 0 78 78"
          className="absolute"
          style={{
            width: 520, height: 520,
            right: '-4%', bottom: '-8%',
            opacity: 0.08,
            transform: 'rotate(22deg) scaleX(1.6)',
          }}
        >
          <path
            d="M11.303 34.8332L11.2752 56.3749C11.2705 60.0107 12.7102 63.4993 15.2777 66.0733C17.8452 68.6473 21.3301 70.0961 24.9658 70.1008C28.6015 70.1055 32.0899 68.6657 34.6643 66.0984C37.2384 63.531 38.6871 60.0459 38.6918 56.4105L38.7322 25.077C38.7369 21.8331 39.794 18.7398 41.9764 16.564C44.5508 13.9965 48.0394 12.9484 51.2831 12.9531C54.5273 12.9578 57.6207 14.4066 59.7964 16.9807C61.9721 19.5548 63.0202 22.6518 63.0155 25.8958L62.9928 42.7374M11.3434 3.50001C9.26593 3.4973 7.27242 4.32004 5.80148 5.78718C4.33057 7.25433 3.50271 9.24568 3.50001 11.3232C3.49734 13.4008 4.32004 15.3943 5.78718 16.8652C7.25433 18.3361 9.24568 19.164 11.3232 19.1666C13.4008 19.1693 15.3943 18.3466 16.8652 16.8795C18.3361 15.4124 19.164 13.421 19.1667 11.3434C19.1693 9.26593 18.3466 7.27242 16.8795 5.80148C15.4124 4.33054 13.421 3.50267 11.3434 3.50001ZM58.2626 66.2272C58.2599 68.305 59.0824 70.2982 60.5496 71.7693C62.0168 73.24 64.008 74.068 66.0858 74.0707C68.1632 74.0735 70.1568 73.2506 71.6275 71.7834C73.0986 70.3166 73.9266 68.325 73.9293 66.2476C73.9317 64.1702 73.1092 62.1766 71.642 60.7055C70.1748 59.2348 68.1836 58.4068 66.1058 58.4041C64.0284 58.4013 62.0348 59.2242 60.5641 60.6914C59.093 62.1586 58.265 64.1498 58.2626 66.2272Z"
            stroke="var(--olm-title)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 78 78"
          className="absolute"
          style={{
            width: 280, height: 280,
            left: '6%', top: '12%',
            opacity: 0.06,
            transform: 'rotate(-12deg) scaleY(1.4)',
          }}
        >
          <path
            d="M11.303 34.8332L11.2752 56.3749C11.2705 60.0107 12.7102 63.4993 15.2777 66.0733C17.8452 68.6473 21.3301 70.0961 24.9658 70.1008C28.6015 70.1055 32.0899 68.6657 34.6643 66.0984C37.2384 63.531 38.6871 60.0459 38.6918 56.4105L38.7322 25.077C38.7369 21.8331 39.794 18.7398 41.9764 16.564C44.5508 13.9965 48.0394 12.9484 51.2831 12.9531C54.5273 12.9578 57.6207 14.4066 59.7964 16.9807C61.9721 19.5548 63.0202 22.6518 63.0155 25.8958L62.9928 42.7374M11.3434 3.50001C9.26593 3.4973 7.27242 4.32004 5.80148 5.78718C4.33057 7.25433 3.50271 9.24568 3.50001 11.3232C3.49734 13.4008 4.32004 15.3943 5.78718 16.8652C7.25433 18.3361 9.24568 19.164 11.3232 19.1666C13.4008 19.1693 15.3943 18.3466 16.8652 16.8795C18.3361 15.4124 19.164 13.421 19.1667 11.3434C19.1693 9.26593 18.3466 7.27242 16.8795 5.80148C15.4124 4.33054 13.421 3.50267 11.3434 3.50001ZM58.2626 66.2272C58.2599 68.305 59.0824 70.2982 60.5496 71.7693C62.0168 73.24 64.008 74.068 66.0858 74.0707C68.1632 74.0735 70.1568 73.2506 71.6275 71.7834C73.0986 70.3166 73.9266 68.325 73.9293 66.2476C73.9317 64.1702 73.1092 62.1766 71.642 60.7055C70.1748 59.2348 68.1836 58.4068 66.1058 58.4041C64.0284 58.4013 62.0348 59.2242 60.5641 60.6914C59.093 62.1586 58.265 64.1498 58.2626 66.2272Z"
            stroke="var(--olm-title)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 6"
          />
        </svg>
        <svg
          viewBox="0 0 78 78"
          className="absolute"
          style={{
            width: 180, height: 180,
            left: '48%', top: '6%',
            opacity: 0.05,
            transform: 'rotate(45deg) scaleX(0.6)',
          }}
        >
          <path
            d="M11.303 34.8332L11.2752 56.3749C11.2705 60.0107 12.7102 63.4993 15.2777 66.0733C17.8452 68.6473 21.3301 70.0961 24.9658 70.1008C28.6015 70.1055 32.0899 68.6657 34.6643 66.0984C37.2384 63.531 38.6871 60.0459 38.6918 56.4105L38.7322 25.077C38.7369 21.8331 39.794 18.7398 41.9764 16.564C44.5508 13.9965 48.0394 12.9484 51.2831 12.9531C54.5273 12.9578 57.6207 14.4066 59.7964 16.9807C61.9721 19.5548 63.0202 22.6518 63.0155 25.8958L62.9928 42.7374M11.3434 3.50001C9.26593 3.4973 7.27242 4.32004 5.80148 5.78718C4.33057 7.25433 3.50271 9.24568 3.50001 11.3232C3.49734 13.4008 4.32004 15.3943 5.78718 16.8652C7.25433 18.3361 9.24568 19.164 11.3232 19.1666C13.4008 19.1693 15.3943 18.3466 16.8652 16.8795C18.3361 15.4124 19.164 13.421 19.1667 11.3434C19.1693 9.26593 18.3466 7.27242 16.8795 5.80148C15.4124 4.33054 13.421 3.50267 11.3434 3.50001ZM58.2626 66.2272C58.2599 68.305 59.0824 70.2982 60.5496 71.7693C62.0168 73.24 64.008 74.068 66.0858 74.0707C68.1632 74.0735 70.1568 73.2506 71.6275 71.7834C73.0986 70.3166 73.9266 68.325 73.9293 66.2476C73.9317 64.1702 73.1092 62.1766 71.642 60.7055C70.1748 59.2348 68.1836 58.4068 66.1058 58.4041C64.0284 58.4013 62.0348 59.2242 60.5641 60.6914C59.093 62.1586 58.265 64.1498 58.2626 66.2272Z"
            stroke="var(--olm-title)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />
        </svg>
      </div>

      <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-12 grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-14 items-start pt-24 md:pt-28">
        <div className="pt-6">
          <div className="olm-hero-reveal">
            <Eyebrow>Para vocês dois</Eyebrow>
          </div>
          <h1
            className="olm-hero-reveal font-serif text-olm-title mt-[22px] leading-[1.02] tracking-tight"
            style={{ fontSize: 'var(--fs-display)', animationDelay: '100ms' }}
          >
            O mapa de tudo
            <br />
            que vocês{' '}
            <em className="text-olm-primary not-italic hero-emphasis">
              viveram
            </em>
            <br />
            juntos.
          </h1>
          <p
            className="olm-hero-reveal text-[18px] leading-relaxed text-fg-2 mt-6 max-w-[480px]"
            style={{ animationDelay: '200ms' }}
          >
            Uma página privada com os lugares, as fotos e as mensagens da
            história de vocês — entregue por QR Code no seu e-mail.
          </p>
          <div
            className="olm-hero-reveal mt-5 flex items-center gap-3 text-[13px] text-fg-3"
            style={{ animationDelay: '240ms' }}
          >
            <span>Fotos</span>
            <span className="w-px h-3 rounded-full bg-olm-surface" />
            <span>Lugares</span>
            <span className="w-px h-3 rounded-full bg-olm-surface" />
            <span>Mensagens</span>
            <span className="w-px h-3 rounded-full bg-olm-surface" />
            <span>QR Code</span>
          </div>
          <div
            className="olm-hero-reveal mt-8 flex gap-3.5 flex-wrap"
            style={{ animationDelay: '300ms' }}
          >
            <Button size="lg" onClick={() => navigate('/criar?plano=basic')}>
              Criar nosso mapa <ArrowRight size={16} strokeWidth={1.75} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.open('https://ourlovemap.com.br/bruno-e-leticia?token=JJXyq', '_blank', 'noopener,noreferrer')}
            >
              Ver exemplo
            </Button>
          </div>
          <p
            className="olm-hero-reveal mt-7 text-[13px] text-fg-3 flex items-center gap-1.5"
            style={{ animationDelay: '380ms' }}
          >
            <Heart size={12} strokeWidth={1.75} className="text-olm-primary" />
            Mais de{' '}
            <span
              ref={counterRef}
              className="font-semibold tabular-nums text-olm-title"
            >
              0
            </span>{' '}
            casais já criaram o deles
          </p>
        </div>

        <div
          ref={mockupRef}
          className="olm-hero-reveal flex justify-center relative"
          style={{ animationDelay: '150ms' }}
        >
          <DarkMockup size="md" />
        </div>
      </div>

      <svg
        className="absolute inset-0 pointer-events-none w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 1 }}
      >
        <defs>
          <linearGradient id="route-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F56C73" stopOpacity="0" />
            <stop offset="25%" stopColor="#F56C73" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#F56C73" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F56C73" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          ref={routeRef}
          d="M 380 290 Q 580 200, 780 270 Q 920 310, 1050 250"
          stroke="url(#route-grad)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <circle cx="1050" cy="250" r="4" fill="#F56C73" opacity="0.4" />
        <circle cx="1050" cy="250" r="2" fill="#F56C73" opacity="0.6" />
      </svg>

      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-fg-4 pointer-events-none"
      >
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path
            d="M8 2V18M8 18L2 12M8 18L14 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
