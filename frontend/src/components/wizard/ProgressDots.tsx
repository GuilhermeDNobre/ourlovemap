import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const STEP_LABELS = ['Vocês', 'Localizações', 'Música', 'Envio'];

interface ProgressDotsProps {
  currentStep: number;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isPast = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold tabular-nums transition-colors',
                  isPast
                    ? 'bg-olm-primary text-white'
                    : isActive
                      ? 'bg-olm-accent text-white'
                      : 'bg-olm-surface text-fg-2',
                ].join(' ')}
                aria-label={`Step ${stepNumber}: ${label}${isPast ? ' (completo)' : isActive ? ' (ativo)' : ''}`}
                initial={false}
                animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isPast ? `check-${stepNumber}` : `num-${stepNumber}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="inline-flex items-center justify-center"
                  >
                    {isPast ? <Check size={14} strokeWidth={2.5} /> : stepNumber}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
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
                  'h-[1.5px] w-7 sm:w-10 mx-1.5 sm:mx-2 mb-5 transition-colors',
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
