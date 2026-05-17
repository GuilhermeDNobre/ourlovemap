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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'rounded-[18px] border-2 p-6 text-left w-full transition-all cursor-pointer',
        selected
          ? 'border-olm-primary bg-olm-primary-100'
          : 'border-olm-surface bg-white hover:border-olm-primary/40',
      ].join(' ')}
    >
      {highlighted && (
        <div className="inline-flex items-center px-2.5 py-1 rounded-pill bg-olm-accent text-white text-[10px] font-semibold tracking-[0.08em] uppercase mb-3">
          Mais popular
        </div>
      )}
      <div className="font-serif text-xl text-olm-title">{title}</div>
      <div className="text-3xl font-bold text-olm-primary mt-1 mb-4">{price}</div>
      <ul className="flex flex-col gap-2">
        {features.map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-sm text-fg-2">
            <Check size={14} strokeWidth={2} className="text-olm-primary shrink-0" />
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
    <div className="min-h-screen bg-olm-bg flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full">
        <h1 className="font-serif text-3xl text-olm-title text-center mb-2">
          Escolha seu plano
        </h1>
        <p className="text-center text-fg-2 mb-10">
          Você pode mudar até o momento do pagamento.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
        <div className="flex justify-center">
          <Button variant="primary" size="lg" onClick={onConfirm}>
            Continuar com {plan === 'premium' ? 'Premium' : 'Basic'}
          </Button>
        </div>
      </div>
    </div>
  );
}
