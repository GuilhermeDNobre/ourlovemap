import { useWizardStore } from '../../stores/wizard-store';
import { ProgressDots } from './ProgressDots';
import { LivePreview } from './LivePreview';
import { SlugCard } from './SlugCard';
import { PlanSelector } from './PlanSelector';
import { Step1Voces } from './steps/Step1Voces';
import { Step2Localizacoes } from './steps/Step2Localizacoes';

const STEP_TITLES = ['Vocês', 'Localizações', 'Música', 'Envio'];

interface StepState {
  names: string;
  startDate: string;
  placesCount: number;
}

function canProceedFromStep(step: number, state: StepState): boolean {
  if (step === 1) return state.names.trim().length > 0 && state.startDate.length > 0;
  if (step === 2) return state.placesCount > 0;
  return true;
}

export function Wizard() {
  const { step, setStep, names, startDate, places } = useWizardStore();
  if (step === 0) {
    return <PlanSelector onConfirm={() => setStep(1)} />;
  }
  const goNext = () => setStep(Math.min(step + 1, 4));
  const goBack = () => setStep(Math.max(step - 1, 1));
  const stepState: StepState = { names, startDate, placesCount: places.length };
  const canProceed = canProceedFromStep(step, stepState);
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
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <p className="text-fg-2">Step 3 — Música (próxima tarefa)</p>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-fg-2 text-sm underline"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed}
                    className="bg-olm-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <p className="text-fg-2">Step 4 — Envio (próxima tarefa)</p>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-fg-2 text-sm underline"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 md:sticky md:top-8 flex flex-col gap-4" style={{ minWidth: 220 }}>
            <LivePreview />
            <SlugCard names={names} />
          </div>
        </div>
      </div>
    </div>
  );
}
