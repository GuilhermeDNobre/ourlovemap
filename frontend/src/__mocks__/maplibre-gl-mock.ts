const createMapInstance = () => ({
  on: jest.fn((event: string, cb: () => void) => {
    if (event === 'load') cb();
  }),
  remove: jest.fn(),
  addControl: jest.fn(),
  setCenter: jest.fn(),
  flyTo: jest.fn(),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  getSource: jest.fn().mockReturnValue({ setData: jest.fn() }),
  fitBounds: jest.fn(),
});

const Map = jest.fn().mockImplementation(createMapInstance);

const createMarkerInstance = () => {
  const el = document.createElement('div');
  return {
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    getElement: jest.fn().mockReturnValue(el),
  };
};

const createPopupInstance = () => ({
  setLngLat: jest.fn().mockReturnThis(),
  setDOMContent: jest.fn().mockReturnThis(),
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn(),
});

const createBoundsInstance = () => ({
  extend: jest.fn().mockReturnThis(),
  isEmpty: jest.fn().mockReturnValue(false),
});

const Marker = jest.fn().mockImplementation(createMarkerInstance);
const Popup = jest.fn().mockImplementation(createPopupInstance);
const LngLatBounds = jest.fn().mockImplementation(createBoundsInstance);
const NavigationControl = jest.fn();

export default { Map, Marker, Popup, LngLatBounds, NavigationControl };
