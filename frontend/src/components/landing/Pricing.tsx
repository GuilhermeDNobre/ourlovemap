import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Eyebrow } from '../ui/Eyebrow';

const BASIC_FEATURES = [
  'Até 3 localizações',
  'Página ativa por 7 dias',
  'QR Code por email',
  'Suporte por email',
];

const PREMIUM_FEATURES = [
  'Até 7 localizações',
  'Página sem expiração',
  'Música do YouTube com timestamp',
  'Compartilhamento no Instagram',
  'Contador do relacionamento',
  'Suporte prioritário',
];

export function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="bg-white px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <Eyebrow>Planos</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Escolha o plano de <em className="text-olm-primary">vocês</em>.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[820px] mx-auto">
          {/* Basic */}
          <div className="p-9 rounded-[24px] bg-white border border-olm-surface">
            <div className="font-sans font-semibold text-sm text-olm-title tracking-[0.04em]">
              Básico
            </div>
            <div className="mt-5 flex items-baseline gap-1">
              <div className="font-serif text-[48px] text-olm-title leading-none">
                R$19<span className="text-[28px]">,90</span>
              </div>
            </div>
            <div className="text-[13px] text-fg-3 mt-1">Pagamento único</div>
            <ul className="list-none p-0 my-7 flex flex-col gap-3">
              {BASIC_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm text-fg-2 items-center">
                  <Check size={14} strokeWidth={1.75} className="text-olm-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => navigate('/criar?plano=basic')}
            >
              Começar pelo básico
            </Button>
          </div>

          {/* Premium */}
          <div className="relative p-9 rounded-[24px] bg-white border-2 border-olm-accent shadow-glow-accent">
            <div className="absolute -top-3 left-6 px-3 py-1.5 bg-olm-primary text-white rounded-pill text-[11px] font-bold tracking-[0.08em] uppercase">
              Mais escolhido
            </div>
            <div className="font-sans font-semibold text-sm text-olm-accent tracking-[0.04em]">
              Premium
            </div>
            <div className="mt-5 flex items-baseline gap-1">
              <div className="font-serif text-[48px] text-olm-title leading-none">
                R$29<span className="text-[28px]">,90</span>
              </div>
            </div>
            <div className="text-[13px] text-fg-3 mt-1">
              Pagamento único, página sem expiração
            </div>
            <ul className="list-none p-0 my-7 flex flex-col gap-3">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm text-fg-2 items-center">
                  <Check size={14} strokeWidth={1.75} className="text-olm-accent shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="premium"
              className="w-full justify-center"
              onClick={() => navigate('/criar?plano=premium')}
            >
              Criar nosso mapa Premium
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
