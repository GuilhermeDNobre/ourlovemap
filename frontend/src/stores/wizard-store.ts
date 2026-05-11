import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Plan = 'basic' | 'premium';

export interface Place {
  id: string;
  title: string;
  address: string;
  description: string;
  photo: File | null;
  latitude: number;
  longitude: number;
}

export interface MusicData {
  videoId: string;
  query: string;
  startTime: number;
  endTime: number;
  loop: boolean;
}

const DEFAULT_MUSIC: MusicData = {
  videoId: '',
  query: '',
  startTime: 0,
  endTime: 0,
  loop: false,
};

interface WizardState {
  plan: Plan;
  step: number;
  names: string;
  buyerName: string;
  buyerPhone: string;
  startDate: string;
  opening: string;
  places: Place[];
  music: MusicData;
  email: string;
  emailConfirm: string;
  mapId: string | null;
}

interface WizardActions {
  setPlan: (plan: Plan) => void;
  setStep: (step: number) => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  addPlace: (place: Place) => void;
  removePlace: (id: string) => void;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  reorderPlaces: (places: Place[]) => void;
  reset: () => void;
}

export type WizardStore = WizardState & WizardActions;

const DEFAULT_STATE: WizardState = {
  plan: 'basic',
  step: 0,
  names: '',
  buyerName: '',
  buyerPhone: '',
  startDate: '',
  opening: '',
  places: [],
  music: DEFAULT_MUSIC,
  email: '',
  emailConfirm: '',
  mapId: null,
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setPlan: (plan) => set({ plan }),
      setStep: (step) => set({ step }),
      setField: (key, value) => set({ [key]: value } as Partial<WizardStore>),
      addPlace: (place) => set((state) => ({ places: [...state.places, place] })),
      removePlace: (id) =>
        set((state) => ({ places: state.places.filter((p) => p.id !== id) })),
      updatePlace: (id, patch) =>
        set((state) => ({
          places: state.places.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      reorderPlaces: (places) => set({ places }),
      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'olm-wizard',
      partialize: (state) => ({
        plan: state.plan,
        step: state.step,
        names: state.names,
        buyerName: state.buyerName,
        buyerPhone: state.buyerPhone,
        startDate: state.startDate,
        opening: state.opening,
        places: state.places.map(({ photo: _photo, ...p }) => ({ ...p, photo: null })),
        music: state.music,
        email: state.email,
        emailConfirm: state.emailConfirm,
        mapId: state.mapId,
      }),
    },
  ),
);
