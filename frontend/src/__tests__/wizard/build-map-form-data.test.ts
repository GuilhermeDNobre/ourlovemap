import { buildMapFormData } from '../../lib/build-map-form-data';
import type { WizardStore } from '../../stores/wizard-store';

function makeStore(overrides: Partial<WizardStore> = {}): WizardStore {
  return {
    plan: 'basic',
    step: 4,
    names: 'Ana e Pedro',
    buyerName: 'Pedro Silva',
    buyerPhone: '11999999999',
    startDate: '2020-06-15',
    opening: '',
    places: [],
    music: { videoId: '', query: '', startTime: 0, endTime: 0, loop: false },
    email: 'pedro@example.com',
    emailConfirm: 'pedro@example.com',
    mapId: null,
    setPlan: jest.fn(),
    setStep: jest.fn(),
    setField: jest.fn(),
    addPlace: jest.fn(),
    removePlace: jest.fn(),
    updatePlace: jest.fn(),
    reorderPlaces: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  } as unknown as WizardStore;
}

describe('buildMapFormData', () => {
  it('should append all required scalar fields', () => {
    const store = makeStore();
    const form = buildMapFormData(store);
    expect(form.get('couple_name')).toBe('Ana e Pedro');
    expect(form.get('buyer_name')).toBe('Pedro Silva');
    expect(form.get('buyer_phone')).toBe('11999999999');
    expect(form.get('email')).toBe('pedro@example.com');
    expect(form.get('plan')).toBe('basic');
    expect(form.get('relationship_start_date')).toBe('2020-06-15');
  });

  it('should append opening when provided', () => {
    const store = makeStore({ opening: 'Nossa história começou...' });
    const form = buildMapFormData(store);
    expect(form.get('opening')).toBe('Nossa história começou...');
  });

  it('should not append opening when empty', () => {
    const store = makeStore({ opening: '' });
    const form = buildMapFormData(store);
    expect(form.get('opening')).toBeNull();
  });

  it('should not append youtube fields when no music is selected', () => {
    const store = makeStore({ music: { videoId: '', query: '', startTime: 0, endTime: 0, loop: false } });
    const form = buildMapFormData(store);
    expect(form.get('youtube_url')).toBeNull();
    expect(form.get('youtube_start_time')).toBeNull();
    expect(form.get('youtube_end_time')).toBeNull();
  });

  it('should append youtube fields when music is selected', () => {
    const store = makeStore({
      music: { videoId: 'dQw4w9WgXcQ', query: 'Never Gonna', startTime: 10, endTime: 40, loop: false },
    });
    const form = buildMapFormData(store);
    expect(form.get('youtube_url')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(form.get('youtube_start_time')).toBe('10');
    expect(form.get('youtube_end_time')).toBe('40');
  });

  it('should append locations with bracket notation', () => {
    const store = makeStore({
      places: [
        {
          id: '1',
          title: 'Parque',
          address: 'Rua A',
          description: 'Lindo lugar',
          photo: null,
          latitude: -23.5,
          longitude: -46.6,
        },
        {
          id: '2',
          title: 'Café',
          address: 'Rua B',
          description: '',
          photo: null,
          latitude: -23.6,
          longitude: -46.7,
        },
      ],
    });
    const form = buildMapFormData(store);
    expect(form.get('locations[0][title]')).toBe('Parque');
    expect(form.get('locations[0][address]')).toBe('Rua A');
    expect(form.get('locations[0][description]')).toBe('Lindo lugar');
    expect(form.get('locations[0][latitude]')).toBe('-23.5');
    expect(form.get('locations[0][longitude]')).toBe('-46.6');
    expect(form.get('locations[0][order]')).toBe('0');
    expect(form.get('locations[1][title]')).toBe('Café');
    expect(form.get('locations[1][order]')).toBe('1');
  });

  it('should append photo file when provided', () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const store = makeStore({
      places: [
        {
          id: '1',
          title: 'Parque',
          address: 'Rua A',
          description: '',
          photo: file,
          latitude: -23.5,
          longitude: -46.6,
        },
      ],
    });
    const form = buildMapFormData(store);
    expect(form.get('locations[0][photo]')).toBe(file);
  });

  it('should not append photo when null', () => {
    const store = makeStore({
      places: [
        {
          id: '1',
          title: 'Parque',
          address: 'Rua A',
          description: '',
          photo: null,
          latitude: -23.5,
          longitude: -46.6,
        },
      ],
    });
    const form = buildMapFormData(store);
    expect(form.get('locations[0][photo]')).toBeNull();
  });
});
