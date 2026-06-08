import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useWizardStore } from '../../stores/wizard-store';
import type { Place } from '../../stores/wizard-store';
import { ProgressDots } from './ProgressDots';
import { LogoMark } from '../ui/LogoMark';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LivePreview } from './LivePreview';
import { SlugCard } from './SlugCard';
import { PlanSelector } from './PlanSelector';
import { PaymentModal } from './PaymentModal';
import { Step1Voces } from './steps/Step1Voces';
import { Step2Localizacoes } from './steps/Step2Localizacoes';
import { Step3Musica } from './steps/Step3Musica';
import { Step4Envio } from './steps/Step4Envio';
import { step2Schema } from '../../lib/wizard-schema';

const STEP_TITLES = ['Vocês', 'Localizações', 'Música', 'Envio'];

interface StepState {
  places: Place[];
}

function canProceedFromStep(step: number, state: StepState): boolean {
  if (step === 2) return step2Schema.safeParse({ places: state.places }).success;
  return true;
}

function WizardTopbar() {
  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[rgba(65,60,123,0.08)] bg-[color-mix(in_srgb,var(--olm-bg)_88%,transparent)] backdrop-blur-sm">
      <Link to="/" className="inline-flex items-center gap-2 no-underline" aria-label="Voltar para home">
        <LogoMark size={22} />
        <span className="font-serif text-[18px] text-olm-title">
          Our Love <em className="text-olm-primary">Map</em>
        </span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function Wizard() {
  const { step, setStep, setField, names, places, mapId } = useWizardStore();
  if (step === 0) {
    return (
      <div className="min-h-screen bg-olm-bg">
        <WizardTopbar />
        <PlanSelector onConfirm={() => setStep(1)} />
      </div>
    );
  }
  const goNext = () => setStep(Math.min(step + 1, 4));
  const goBack = () => setStep(Math.max(step - 1, 1));
  const stepState: StepState = { places };
  const canProceed = canProceedFromStep(step, stepState);
  const handleModalClose = () => setField('mapId', null);
  return (
    <div
      className="min-h-screen bg-olm-bg"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--olm-primary) 10%, transparent) 0%, transparent 38%), radial-gradient(circle at 90% 14%, color-mix(in srgb, var(--olm-accent) 10%, transparent) 0%, transparent 34%)',
      }}
    >
      <WizardTopbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-[clamp(24px,4vw,56px)] py-6 sm:py-8 md:py-10">
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-10">
          <ProgressDots currentStep={step} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-12 md:gap-8 md:items-start">
          <div className="min-w-0 md:col-span-7">
            <div className="rounded-[20px] sm:rounded-[24px] border border-olm-surface bg-[color-mix(in_srgb,var(--olm-bg-elevated)_90%,transparent)] p-4 sm:p-6 md:p-8 shadow-[var(--sh-md)]">
              <div className="inline-flex items-center px-3 py-1 rounded-pill text-[11px] font-semibold uppercase tracking-[0.08em] bg-olm-primary-100 text-olm-primary mb-4">
                Etapa {step} de 4
              </div>
              <h2 className="font-serif text-olm-title mb-6 tracking-[-0.02em] leading-[1.08]" style={{ fontSize: 'clamp(30px,3vw,42px)' }}>
                {STEP_TITLES[step - 1]}
              </h2>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {step === 1 && <Step1Voces onNext={goNext} />}
                  {step === 2 && (
                    <Step2Localizacoes onNext={goNext} onBack={goBack} canProceed={canProceed} />
                  )}
                  {step === 3 && <Step3Musica onNext={goNext} onBack={goBack} />}
                  {step === 4 && <Step4Envio onBack={goBack} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="md:col-span-5 md:sticky md:top-8 flex flex-col gap-3 sm:gap-4 items-center md:items-stretch" style={{ minWidth: 260 }}>
            <LivePreview />
            <SlugCard names={names} />
          </div>
        </div>
      </div>
      {mapId && (
        <PaymentModal
          isOpen
          onClose={handleModalClose}
          mapId={mapId}
        />
      )}
    </div>
  );
}
