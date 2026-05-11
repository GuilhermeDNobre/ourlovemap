import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '../../../stores/wizard-store';
import { Field } from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

const schema = z.object({
  names: z.string().min(1, 'Informe os nomes do casal'),
  buyerName: z.string().min(1, 'Informe seu nome completo'),
  buyerPhone: z.string().min(1, 'Informe seu telefone'),
  startDate: z.string().min(1, 'Informe a data de início'),
  opening: z.string().max(200, 'Máximo de 200 caracteres'),
});

type Step1Fields = z.infer<typeof schema>;

interface Step1VocesProps {
  onNext: () => void;
}

export function Step1Voces({ onNext }: Step1VocesProps) {
  const { names, buyerName, buyerPhone, startDate, opening, setField } = useWizardStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Step1Fields>({
    resolver: zodResolver(schema),
    defaultValues: { names, buyerName, buyerPhone, startDate, opening },
  });
  const openingValue = watch('opening', opening);
  const onSubmit = (data: Step1Fields) => {
    setField('names', data.names);
    setField('buyerName', data.buyerName);
    setField('buyerPhone', data.buyerPhone);
    setField('startDate', data.startDate);
    setField('opening', data.opening);
    onNext();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        name="names"
        control={control}
        render={({ field }) => (
          <Field label="Nomes do casal" error={errors.names?.message} required>
            <Input
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setField('names', value);
              }}
              placeholder="Ex: Ana e Lucas"
            />
          </Field>
        )}
      />
      <Controller
        name="buyerName"
        control={control}
        render={({ field }) => (
          <Field label="Seu nome completo" error={errors.buyerName?.message} required>
            <Input
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setField('buyerName', value);
              }}
              placeholder="Nome completo"
            />
          </Field>
        )}
      />
      <Controller
        name="buyerPhone"
        control={control}
        render={({ field }) => (
          <Field label="Telefone" error={errors.buyerPhone?.message} required>
            <Input
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setField('buyerPhone', value);
              }}
              placeholder="(11) 9 0000-0000"
              type="tel"
            />
          </Field>
        )}
      />
      <Controller
        name="startDate"
        control={control}
        render={({ field }) => (
          <Field label="Data de início do relacionamento" error={errors.startDate?.message} required>
            <Input
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setField('startDate', value);
              }}
              type="date"
            />
          </Field>
        )}
      />
      <Controller
        name="opening"
        control={control}
        render={({ field }) => (
          <Field
            label={`Frase de abertura (${openingValue?.length ?? 0}/200)`}
            error={errors.opening?.message}
          >
            <Input
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setField('opening', value);
              }}
              placeholder="Uma frase especial para vocês..."
            />
          </Field>
        )}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="lg">
          Continuar
        </Button>
      </div>
    </form>
  );
}
