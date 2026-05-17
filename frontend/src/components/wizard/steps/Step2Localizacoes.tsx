import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizard-store';
import type { Place } from '../../../stores/wizard-store';
import { PlaceCardEditor } from '../PlaceCardEditor';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

const BASIC_LIMIT = 3;
const PREMIUM_LIMIT = 7;

function createPlace(): Place {
  return {
    id: crypto.randomUUID(),
    title: '',
    address: '',
    description: '',
    photo: null,
    latitude: 0,
    longitude: 0,
  };
}

interface Step2LocalizacoesProps {
  onNext: () => void;
  onBack: () => void;
  canProceed?: boolean;
}

export function Step2Localizacoes({ onNext, onBack, canProceed = true }: Step2LocalizacoesProps) {
  const { plan, places, addPlace, removePlace, updatePlace, reorderPlaces, setPlan } =
    useWizardStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const limit = plan === 'premium' ? PREMIUM_LIMIT : BASIC_LIMIT;
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );
  const handleAddPlace = () => {
    if (plan === 'basic' && places.length >= BASIC_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    if (places.length >= limit) return;
    addPlace(createPlace());
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = places.findIndex((p) => p.id === active.id);
    const newIndex = places.findIndex((p) => p.id === over.id);
    reorderPlaces(arrayMove(places, oldIndex, newIndex));
  };
  const handleUpgradeConfirm = () => {
    setPlan('premium');
    setShowUpgradeModal(false);
    addPlace(createPlace());
  };
  return (
    <div className="flex flex-col gap-5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {places.map((place, index) => (
              <PlaceCardEditor
                key={place.id}
                place={place}
                index={index}
                showRemove={places.length > 1}
                onUpdate={(patch) => updatePlace(place.id, patch)}
                onRemove={() => removePlace(place.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {places.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-olm-surface p-8 text-center text-fg-3 text-sm">
          Nenhum lugar adicionado ainda. Clique abaixo para começar.
        </div>
      )}
      {places.length < PREMIUM_LIMIT && (
        <button
          type="button"
          onClick={handleAddPlace}
          className="flex items-center gap-2 self-start px-4 py-2.5 rounded-lg border border-dashed border-olm-primary text-olm-primary text-sm font-medium hover:bg-olm-primary-100 transition-colors"
        >
          <Plus size={16} />
          Adicionar lugar
        </button>
      )}
      <div className="text-xs text-fg-3 mt-1">
        {places.length} de {limit} lugares ({plan === 'premium' ? 'Premium' : 'Basic'})
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack}>
          Voltar
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!canProceed}>
          Continuar
        </Button>
      </div>
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      >
        <div className="flex flex-col gap-4 p-6">
          <h3 className="font-serif text-xl text-olm-title">Upgrade para Premium</h3>
          <p className="text-sm text-fg-2">
            O plano Basic permite até 3 lugares. Para adicionar mais, faça upgrade para o Premium
            (R$29,90) e tenha até 7 lugares no mapa.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="md" onClick={() => setShowUpgradeModal(false)}>
              Cancelar
            </Button>
            <Button variant="premium" size="md" onClick={handleUpgradeConfirm}>
              Fazer upgrade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
