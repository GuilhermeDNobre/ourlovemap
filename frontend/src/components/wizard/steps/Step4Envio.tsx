import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '../../../stores/wizard-store';
import { step4Schema } from '../../../lib/wizard-schema';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

type Step4Fields = z.infer<typeof step4Schema>;

interface Step4EnvioProps {
  onBack: () => void;
  onFinalize: () => void;
}

export function Step4Envio({ onBack, onFinalize }: Step4EnvioProps) {
  const { names, places, plan, music, email, emailConfirm, setPlan, setField } = useWizardStore();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step4Fields>({
    resolver: zodResolver(step4Schema),
    defaultValues: { email, emailConfirm },
    mode: 'onChange',
  });
  const watchedEmail = watch('email') ?? '';
  const canFinalize = !errors.email && !errors.emailConfirm && watchedEmail.length > 0;

  const onFormSubmit = (data: Step4Fields) => {
    setField('email', data.email);
    setField('emailConfirm', data.emailConfirm);
    onFinalize();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-5">
      <div
        className="rounded-xl p-4 text-sm text-olm-title"
        style={{
          background: 'linear-gradient(135deg, rgba(245,108,115,0.08), rgba(191,119,246,0.08))',
        }}
      >
        <strong>Atenção:</strong> O QR Code e o link de edição vão{' '}
        <strong>APENAS para esse email</strong>. Confirme com cuidado.
      </div>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            label="Email"
            error={errors.email?.message}
            value={field.value}
            onChange={(val) => {
              field.onChange(val);
              setField('email', val);
            }}
            type="email"
            placeholder="seu@email.com"
          />
        )}
      />
      <Controller
        name="emailConfirm"
        control={control}
        render={({ field }) => (
          <Input
            label="Confirme o email"
            error={errors.emailConfirm?.message}
            value={field.value}
            onChange={(val) => {
              field.onChange(val);
              setField('emailConfirm', val);
            }}
            type="email"
            placeholder="seu@email.com"
          />
        )}
      />
      <div className="rounded-xl border border-olm-surface bg-white p-4 flex flex-col gap-2 text-sm">
        <p className="font-semibold text-olm-title mb-1">Resumo do pedido</p>
        <div className="flex justify-between text-fg-2">
          <span>Casal</span>
          <span>{names || '—'}</span>
        </div>
        <div className="flex justify-between text-fg-2">
          <span>Lugares</span>
          <span>{places.length}</span>
        </div>
        <div className="flex justify-between text-fg-2">
          <span>Plano</span>
          <span>{plan === 'premium' ? 'Premium' : 'Basic'}</span>
        </div>
        <div className="flex justify-between text-fg-2">
          <span>Música</span>
          <span>{music.videoId ? '✓' : '—'}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-fg-1">Selecione seu plano</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPlan('basic')}
            className={[
              'flex-1 rounded-xl border p-3 text-sm text-left transition-colors',
              plan === 'basic'
                ? 'border-olm-primary bg-olm-primary/5 text-olm-title'
                : 'border-olm-surface text-fg-2 hover:border-olm-primary/50',
            ].join(' ')}
          >
            <div className="font-semibold">Basic</div>
            <div className="text-xs mt-0.5 text-fg-3">Até 3 lugares · R$19,90</div>
          </button>
          <button
            type="button"
            onClick={() => setPlan('premium')}
            className={[
              'flex-1 rounded-xl border p-3 text-sm text-left transition-colors',
              plan === 'premium'
                ? 'border-olm-accent bg-olm-accent/5 text-olm-title'
                : 'border-olm-surface text-fg-2 hover:border-olm-accent/50',
            ].join(' ')}
          >
            <div className="font-semibold">Premium</div>
            <div className="text-xs mt-0.5 text-fg-3">Até 7 lugares · R$29,90</div>
          </button>
        </div>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack} type="button">
          Voltar
        </Button>
        <Button type="submit" variant="primary" size="lg" disabled={!canFinalize}>
          Finalizar compra
        </Button>
      </div>
    </form>
  );
}
