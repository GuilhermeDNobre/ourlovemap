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
    <section id="pricing" className="bg-olm-bg-elevated py-20 md:py-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full">
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <Eyebrow>Planos</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: 'var(--fs-h2)' }}
          >
            Escolha o plano de <em className="text-olm-primary">vocês</em>.
          </h2>
          <div className="inline-flex items-center gap-2 mt-5 bg-olm-primary/10 text-olm-primary text-sm font-semibold px-4 py-2 rounded-full">
            ❤️ Preço especial de Dia dos Namorados — só até 12/06
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[820px] mx-auto">
          {/* Basic */}
          <div className="rounded-[24px] bg-olm-bg border border-olm-surface p-9">
            <div className="font-sans font-semibold text-sm text-fg-3 tracking-[0.04em] uppercase">
              Básico
            </div>
              <div className="mt-5">
                <div className="text-[15px] text-fg-3 line-through opacity-50 mb-1">R$29,90</div>
                <div className="font-serif text-olm-title leading-none">
                  <span style={{ fontSize: 'var(--fs-h1)' }}>R$19</span><span className="text-[22px]" style={{ verticalAlign: 'super', lineHeight: 1 }}>,90</span>
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
          <div className="relative p-10 rounded-[24px] bg-olm-bg-elevated border-2 border-olm-accent"
            style={{ boxShadow: 'var(--sh-glow-accent)' }}
          >
            <div className="absolute -top-3 left-6 px-3 py-1.5 bg-olm-primary text-white rounded-pill text-[11px] font-bold tracking-[0.08em] uppercase">
              Mais escolhido
            </div>
            <div className="font-sans font-semibold text-sm text-olm-accent tracking-[0.04em] uppercase">
              Premium
            </div>
              <div className="mt-5">
                <div className="text-[15px] text-fg-3 line-through opacity-50 mb-1">R$39,90</div>
                <div className="font-serif text-olm-title leading-none">
                  <span style={{ fontSize: 'var(--fs-h1)' }}>R$29</span><span className="text-[22px]" style={{ verticalAlign: 'super', lineHeight: 1 }}>,90</span>
                </div>
              </div>
            <div className="text-[13px] text-dfg-3 mt-1">
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
