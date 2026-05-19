import { useWizardStore } from '../../stores/wizard-store';
import type { Place } from '../../stores/wizard-store';

const makePlace = (overrides: Partial<Place> = {}): Place => ({
  id: 'test-id',
  title: 'Test Place',
  address: 'Rua Test, 123',
  description: 'A test place',
  photo: null,
  latitude: -23.5,
  longitude: -46.6,
  ...overrides,
});

beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('wizard-store: addPlace', () => {
  it('should add a place to the store', () => {
    const place = makePlace({ id: 'p1' });
    useWizardStore.getState().addPlace(place);
    const places = useWizardStore.getState().places;
    expect(places).toHaveLength(3);
    expect(places.find((p) => p.id === 'p1')).toBeDefined();
  });
  it('should accumulate multiple places', () => {
    useWizardStore.getState().addPlace(makePlace({ id: 'p1' }));
    useWizardStore.getState().addPlace(makePlace({ id: 'p2' }));
    expect(useWizardStore.getState().places).toHaveLength(4);
  });
});

describe('wizard-store: removePlace', () => {
  it('should remove a place by id', () => {
    useWizardStore.getState().addPlace(makePlace({ id: 'p1' }));
    useWizardStore.getState().addPlace(makePlace({ id: 'p2' }));
    useWizardStore.getState().removePlace('p1');
    const places = useWizardStore.getState().places;
    expect(places).toHaveLength(3);
    expect(places.find((p) => p.id === 'p1')).toBeUndefined();
    expect(places.find((p) => p.id === 'p2')).toBeDefined();
  });
  it('should not affect other places when removing', () => {
    useWizardStore.getState().addPlace(makePlace({ id: 'p1', title: 'Place 1' }));
    useWizardStore.getState().addPlace(makePlace({ id: 'p2', title: 'Place 2' }));
    useWizardStore.getState().removePlace('p2');
    const places = useWizardStore.getState().places;
    expect(places.find((p) => p.id === 'p1')?.title).toBe('Place 1');
  });
});

describe('wizard-store: reorderPlaces', () => {
  it('should reorder places correctly', () => {
    const p1 = makePlace({ id: 'p1', title: 'First' });
    const p2 = makePlace({ id: 'p2', title: 'Second' });
    useWizardStore.getState().addPlace(p1);
    useWizardStore.getState().addPlace(p2);
    useWizardStore.getState().reorderPlaces([p2, p1]);
    const places = useWizardStore.getState().places;
    expect(places[0].id).toBe('p2');
    expect(places[1].id).toBe('p1');
  });
});

describe('wizard-store: reset', () => {
  it('should clear all state back to defaults', () => {
    useWizardStore.getState().setField('names', 'Ana e Lucas');
    useWizardStore.getState().addPlace(makePlace());
    useWizardStore.getState().setField('step', 3);
    useWizardStore.getState().reset();
    const state = useWizardStore.getState();
    expect(state.names).toBe('');
    expect(state.places).toHaveLength(2);
    expect(state.step).toBe(0);
    expect(state.plan).toBe('basic');
  });
});

describe('wizard-store: setField', () => {
  it('should update a string field', () => {
    useWizardStore.getState().setField('names', 'Maria e João');
    expect(useWizardStore.getState().names).toBe('Maria e João');
  });
  it('should update plan', () => {
    useWizardStore.getState().setPlan('premium');
    expect(useWizardStore.getState().plan).toBe('premium');
  });
});

describe('wizard-store: updatePlace', () => {
  it('should update a specific place by id', () => {
    useWizardStore.getState().addPlace(makePlace({ id: 'p1', title: 'Old Title' }));
    useWizardStore.getState().updatePlace('p1', { title: 'New Title' });
    const updated = useWizardStore.getState().places.find((p) => p.id === 'p1');
    expect(updated?.title).toBe('New Title');
  });
});

describe('wizard-store: persist', () => {
  it('should call localStorage.setItem when state changes', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem');
    useWizardStore.getState().setField('names', 'Test');
    expect(spy).toHaveBeenCalledWith('olm-wizard', expect.any(String));
    spy.mockRestore();
  });
});
