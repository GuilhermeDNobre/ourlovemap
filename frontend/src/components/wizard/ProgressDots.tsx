import { Check } from 'lucide-react';

const STEP_LABELS = ['Vocês', 'Localizações', 'Música', 'Envio'];

interface ProgressDotsProps {
  currentStep: number;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isPast = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isPast
                    ? 'bg-olm-primary text-white'
                    : isActive
                      ? 'bg-olm-accent text-white'
                      : 'bg-olm-surface text-fg-2',
                ].join(' ')}
                aria-label={`Step ${stepNumber}: ${label}${isPast ? ' (completo)' : isActive ? ' (ativo)' : ''}`}
              >
                {isPast ? <Check size={14} strokeWidth={2.5} /> : stepNumber}
              </div>
              <span
                className={[
                  'text-[11px] font-medium whitespace-nowrap',
                  isActive ? 'text-olm-title' : 'text-fg-3',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {index < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'h-[1.5px] w-10 mx-1 mb-5 transition-colors',
                  isPast ? 'bg-olm-primary' : 'bg-olm-surface',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
