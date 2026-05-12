import { useWizardStore } from '../../stores/wizard-store';
import type { Place } from '../../stores/wizard-store';
import { ProgressDots } from './ProgressDots';
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

export function Wizard() {
  const { step, setStep, setField, names, places, mapId } = useWizardStore();
  if (step === 0) {
    return <PlanSelector onConfirm={() => setStep(1)} />;
  }
  const goNext = () => setStep(Math.min(step + 1, 4));
  const goBack = () => setStep(Math.max(step - 1, 1));
  const stepState: StepState = { places };
  const canProceed = canProceedFromStep(step, stepState);
  const handleModalClose = () => setField('mapId', null);
  return (
    <div className="min-h-screen bg-olm-bg">
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <div className="flex justify-center mb-10">
          <ProgressDots currentStep={step} />
        </div>
        <div className="flex flex-col-reverse gap-8 md:flex-row md:gap-10 md:items-start">
          <div className="flex-[1.35] min-w-0">
            <h2 className="font-serif text-2xl text-olm-title mb-6">
              {STEP_TITLES[step - 1]}
            </h2>
            {step === 1 && <Step1Voces onNext={goNext} />}
            {step === 2 && (
              <Step2Localizacoes onNext={goNext} onBack={goBack} canProceed={canProceed} />
            )}
            {step === 3 && <Step3Musica onNext={goNext} onBack={goBack} />}
            {step === 4 && <Step4Envio onBack={goBack} />}
          </div>
          <div className="flex-1 md:sticky md:top-8 flex flex-col gap-4" style={{ minWidth: 220 }}>
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
