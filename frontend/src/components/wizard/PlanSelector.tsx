import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useWizardStore } from '../../stores/wizard-store';
import { Button } from '../ui/Button';

const BASIC_FEATURES = [
  'Até 3 lugares no mapa',
  'Fotos em polaroide',
  'Contador ao vivo',
  'QR Code por email',
  'Link válido por 1 ano',
];

const PREMIUM_FEATURES = [
  'Até 7 lugares no mapa',
  'Fotos em polaroide',
  'Contador ao vivo',
  'Música do YouTube',
  'Compartilhamento no Instagram',
  'QR Code por email',
  'Link sem expiração',
];

interface PlanCardProps {
  title: string;
  price: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
  highlighted?: boolean;
}

function PlanCard({ title, price, features, selected, onSelect, highlighted }: PlanCardProps) {
  const isPremium = highlighted;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={
        isPremium
          ? {
              background: selected
                ? 'linear-gradient(160deg, #3A3152 0%, #25212A 100%)'
                : 'linear-gradient(160deg, color-mix(in srgb, #3A3152 84%, var(--olm-bg-elevated)) 0%, color-mix(in srgb, #25212A 78%, var(--olm-bg-elevated)) 100%)',
            }
          : undefined
      }
      className={[
        'rounded-[22px] border-2 text-left w-full transition-all cursor-pointer',
        isPremium
          ? selected
            ? 'border-olm-accent shadow-[0_12px_36px_rgba(191,119,246,0.24)] p-5 sm:p-8'
            : 'border-[rgba(191,119,246,0.45)] hover:border-olm-accent/80 p-5 sm:p-8'
          : selected
            ? 'border-olm-primary bg-olm-primary-100 p-5 sm:p-6'
            : 'border-olm-surface bg-olm-bg-elevated hover:border-olm-primary/40 p-5 sm:p-6',
      ].join(' ')}
    >
      {highlighted && (
        <div className="inline-flex items-center px-2.5 py-1 rounded-pill bg-olm-accent text-white text-[10px] font-semibold tracking-[0.08em] uppercase mb-3">
          Mais popular
        </div>
      )}
      <div className={isPremium ? 'font-serif text-dfg-1 tracking-[-0.02em] leading-[1.04]' : 'font-serif text-xl text-olm-title'} style={isPremium ? { fontSize: 'clamp(22px,5vw,28px)' } : undefined}>{title}</div>
      <div className={isPremium ? 'font-bold text-olm-accent-300 mt-1 mb-5 leading-none' : 'text-3xl font-bold text-olm-primary mt-1 mb-4'} style={isPremium ? { fontSize: 'clamp(34px,8vw,44px)' } : undefined}>{price}</div>
      <ul className="flex flex-col gap-2">
        {features.map((feat) => (
          <li key={feat} className={isPremium ? 'flex items-center gap-2.5 text-[15px] text-dfg-2' : 'flex items-center gap-2 text-sm text-fg-2'}>
            <Check size={14} strokeWidth={2} className={isPremium ? 'text-olm-accent-300 shrink-0' : 'text-olm-primary shrink-0'} />
            {feat}
          </li>
        ))}
      </ul>
    </button>
  );
}

interface PlanSelectorProps {
  onConfirm: () => void;
}

export function PlanSelector({ onConfirm }: PlanSelectorProps) {
  const [searchParams] = useSearchParams();
  const { plan, setPlan } = useWizardStore();
  useEffect(() => {
    const paramPlan = searchParams.get('plano');
    if (paramPlan === 'premium') setPlan('premium');
    else if (paramPlan === 'basic') setPlan('basic');
  }, [searchParams, setPlan]);
  return (
    <div className="min-h-screen bg-olm-bg py-10 sm:py-12 md:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-[clamp(24px,4vw,56px)]">
        <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="md:col-span-4 md:sticky md:top-10">
            <h1 className="font-serif text-olm-title tracking-[-0.02em] leading-[1.04] mb-3" style={{ fontSize: 'clamp(30px,8vw,52px)' }}>
              Escolha seu plano
            </h1>
            <p className="text-fg-2 text-base leading-relaxed max-w-[42ch]">
              Você pode trocar antes do pagamento. Comece no básico ou vá de premium com experiência completa.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
          <PlanCard
            title="Basic"
            price="R$19,90"
            features={BASIC_FEATURES}
            selected={plan === 'basic'}
            onSelect={() => setPlan('basic')}
          />
          <PlanCard
            title="Premium"
            price="R$29,90"
            features={PREMIUM_FEATURES}
            selected={plan === 'premium'}
            onSelect={() => setPlan('premium')}
            highlighted
          />
            </div>
          </div>
        </div>
        <div className="flex justify-center sticky bottom-3 sm:static">
          <Button variant="primary" size="lg" onClick={onConfirm}>
            Continuar com {plan === 'premium' ? 'Premium' : 'Basic'}
          </Button>
        </div>
      </div>
    </div>
  );
}
