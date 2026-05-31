import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Check, QrCode } from 'lucide-react';
import { Eyebrow } from '../ui/Eyebrow';
import { useIsMobile } from '../../hooks/use-is-mobile';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: '01',
    title: 'Preencha os momentos',
    body: 'Adicione fotos, locais marcantes e mensagens da história de vocês.',
    Icon: MapPin,
  },
  {
    n: '02',
    title: 'Escolha seu plano',
    body: 'Básico para um presente rápido ou Premium sem expiração.',
    Icon: Check,
  },
  {
    n: '03',
    title: 'Receba o QR Code',
    body: 'Chega no seu email, pronto pra imprimir, enviar ou surpreender.',
    Icon: QrCode,
  },
];

export function HowItWorks() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const icon1Ref = useRef<HTMLDivElement>(null);
  const icon2Ref = useRef<HTMLDivElement>(null);
  const icon3Ref = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const conn1Ref = useRef<SVGSVGElement>(null);
  const conn2Ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (isMobile) {
      [icon1Ref, icon2Ref, icon3Ref, text1Ref, text2Ref, text3Ref].forEach((ref) => {
        if (ref.current) gsap.set(ref.current, { autoAlpha: 1, x: 0, scale: 1, clearProps: 'filter' });
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
        },
      });

      tl.fromTo(
        icon1Ref.current,
        { autoAlpha: 0, scale: 0.85 },
        { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'none' },
        0,
      )
        .fromTo(
          text1Ref.current,
          { autoAlpha: 0, x: -24, filter: 'blur(6px)' },
          { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.15, ease: 'none' },
          0,
        )
        .fromTo(
          conn1Ref.current,
          { clipPath: 'inset(0px 52px 0px 0px)' },
          { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.15, ease: 'none' },
          0.15,
        )
        .fromTo(
          icon2Ref.current,
          { autoAlpha: 0, scale: 0.85 },
          { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'none' },
          0.3,
        )
        .fromTo(
          text2Ref.current,
          { autoAlpha: 0, x: -24, filter: 'blur(6px)' },
          { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.15, ease: 'none' },
          0.3,
        )
        .fromTo(
          conn2Ref.current,
          { clipPath: 'inset(0px 52px 0px 0px)' },
          { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.15, ease: 'none' },
          0.45,
        )
        .fromTo(
          icon3Ref.current,
          { autoAlpha: 0, scale: 0.85 },
          { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'none' },
          0.6,
        )
        .fromTo(
          text3Ref.current,
          { autoAlpha: 0, x: -24, filter: 'blur(6px)' },
          { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.15, ease: 'none' },
          0.6,
        );
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section id="how" ref={sectionRef} className="relative">
      <div className={`${isMobile ? 'py-20' : 'h-dvh'} flex items-center justify-center bg-olm-bg-elevated`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full">
          <div className="text-center max-w-[640px] mx-auto mb-16">
            <Eyebrow>Como funciona</Eyebrow>
            <h2
              className="font-serif text-olm-title mt-4 mb-3 leading-[1.1]"
              style={{ fontSize: 'var(--fs-h2)' }}
            >
              Três passos. <em className="text-olm-primary">Uma</em> memória pra sempre.
            </h2>
            <p className="text-base text-fg-2">
              Do primeiro encontro ao QR Code na mão em poucos minutos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative text-left">
                {i < 2 && (
                  <svg
                    ref={i === 0 ? conn1Ref : conn2Ref}
                    className="hidden md:block absolute"
                    style={{ left: 'calc(100% - 24px)', width: 52, height: 14, top: '28px' }}
                    viewBox="0 0 52 14"
                    fill="none"
                  >
                    <path
                      d="M2 7 Q 26 -6, 50 7"
                      stroke="#F56C73"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="0 10"
                    />
                  </svg>
                )}
                <div
                  ref={i === 0 ? icon1Ref : i === 1 ? icon2Ref : icon3Ref}
                  style={isMobile ? undefined : { opacity: 0 }}
                >
                  <div className="w-14 h-14 rounded-[18px] bg-olm-primary-100 text-olm-primary flex items-center justify-center mb-[18px]">
                    <step.Icon size={22} strokeWidth={1.75} />
                  </div>
                </div>
                <div
                  ref={i === 0 ? text1Ref : i === 1 ? text2Ref : text3Ref}
                  style={isMobile ? undefined : { opacity: 0 }}
                >
                  <div className="font-serif text-[14px] text-olm-primary tracking-[0.04em]">
                    {step.n}
                  </div>
                  <div className="font-serif text-[24px] text-olm-title mt-1.5 mb-2.5 leading-[1.15]">
                    {step.title}
                  </div>
                  <div className="text-[15px] leading-[1.55] text-fg-2">{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
