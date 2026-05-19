import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ImagePlus } from 'lucide-react';
import type { Place } from '../../stores/wizard-store';
import { Input } from '../ui/Input';
import { Field } from '../ui/Field';
import { AddressInput } from './AddressInput';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PlaceCardEditorProps {
  place: Place;
  index: number;
  showRemove: boolean;
  onUpdate: (patch: Partial<Place>) => void;
  onRemove: () => void;
}

export function PlaceCardEditor({
  place,
  index,
  showRemove,
  onUpdate,
  onRemove,
}: PlaceCardEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: place.id });
  const [photoError, setPhotoError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const handleAddressPick = useCallback(
    (result: { address: string; latitude: number; longitude: number }) =>
      onUpdate({ address: result.address, latitude: result.latitude, longitude: result.longitude }),
    [onUpdate],
  );
  const previewUrl = useMemo(
    () => (place.photo instanceof File ? URL.createObjectURL(place.photo) : null),
    [place.photo],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  const processFile = useCallback((file: File) => {
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('Arquivo muito grande. Máximo: 5MB.');
      return;
    }
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Formato inválido. Use JPEG, PNG ou WebP.');
      return;
    }
    setPhotoError('');
    onUpdate({ photo: file });
  }, [onUpdate]);
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[16px] border border-olm-surface bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 text-fg-3 hover:text-fg-2 cursor-grab active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical size={18} />
        </button>
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-full bg-olm-primary text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            {showRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-fg-3 hover:text-red-500 transition-colors"
                aria-label="Remover lugar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <Field label="Endereço">
            <AddressInput onPick={handleAddressPick} initialValue={place.address} />
          </Field>
          <Field label="Nome do lugar">
            <Input
              value={place.title}
              onChange={(value) => onUpdate({ title: value })}
              placeholder="Ex: Café Central"
            />
          </Field>
          <Field label="Descrição / lembrança">
            <Input
              value={place.description}
              onChange={(value) => onUpdate({ description: value })}
              placeholder="O que aconteceu aqui..."
            />
          </Field>
          <div>
            <div className="text-sm font-medium text-olm-title mb-1.5">Foto</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Upload de foto"
              onChange={handlePhotoChange}
            />
            {previewUrl ? (
              <div className="relative w-24">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({ photo: null });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-olm-primary text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed text-sm transition-colors w-full',
                  isDragOver
                    ? 'border-olm-primary bg-olm-primary-100 text-olm-primary'
                    : 'border-olm-surface text-fg-3 hover:border-olm-primary hover:text-olm-primary',
                ].join(' ')}
              >
                <ImagePlus size={16} />
                {isDragOver ? 'Solte aqui para adicionar' : 'Adicionar foto ou arrastar'}
              </button>
            )}
            {photoError && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {photoError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
