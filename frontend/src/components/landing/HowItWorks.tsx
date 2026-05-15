import { MapPin, Check, QrCode } from 'lucide-react';
import { Eyebrow } from '../ui/Eyebrow';

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
  return (
    <section id="how" className="bg-white px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center max-w-[640px] mx-auto mb-16">
          <Eyebrow>Como funciona</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 mb-3 leading-[1.1]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Três passos. <em className="text-olm-primary">Uma</em> memória pra sempre.
          </h2>
          <p className="text-base text-fg-2">
            Do primeiro encontro ao QR Code na mão em poucos minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, stepIndex) => (
            <div key={step.n} className="relative text-left">
              {stepIndex < 2 && (
                <svg
                  className="hidden md:block absolute top-7 text-olm-surface"
                  style={{ left: 'calc(100% - 24px)', width: 48, height: 14 }}
                  viewBox="0 0 48 14"
                  fill="none"
                >
                  <path
                    d="M1 7 Q 24 -6, 47 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <div className="w-14 h-14 rounded-[18px] bg-olm-primary-100 text-olm-primary flex items-center justify-center mb-[18px]">
                <step.Icon size={22} strokeWidth={1.75} />
              </div>
              <div className="font-serif text-[14px] text-olm-primary tracking-[0.04em]">
                {step.n}
              </div>
              <div className="font-serif text-[24px] text-olm-title mt-1.5 mb-2.5 leading-[1.15]">
                {step.title}
              </div>
              <div className="text-[15px] leading-[1.55] text-fg-2">{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
