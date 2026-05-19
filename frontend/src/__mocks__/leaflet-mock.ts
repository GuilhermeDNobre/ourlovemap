const divIcon = jest.fn().mockReturnValue({});
const latLngBounds = jest.fn().mockReturnValue({ isEmpty: jest.fn().mockReturnValue(false) });

const L = { divIcon, latLngBounds };
export default L;
export { divIcon, latLngBounds };
