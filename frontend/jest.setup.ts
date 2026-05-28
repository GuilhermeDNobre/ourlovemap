import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

if (typeof SVGElement !== 'undefined') {
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
    value: () => 100,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', {
    value: () => ({ x: 0, y: 0 }),
    configurable: true,
    writable: true,
  });
}

Object.assign(global, { TextDecoder, TextEncoder });

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn() },
  writable: true,
  configurable: true,
});

class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

URL.createObjectURL = jest.fn(() => 'blob:mock');
URL.revokeObjectURL = jest.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.randomUUID === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
    writable: true,
  });
}
