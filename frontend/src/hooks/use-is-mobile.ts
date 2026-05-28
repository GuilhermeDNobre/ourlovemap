import { useSyncExternalStore } from 'react';

function getMobileQuery(): MediaQueryList | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.matchMedia('(pointer: coarse) and (max-width: 768px)');
}

function subscribe(callback: () => void) {
  const mql = getMobileQuery();
  if (!mql) return () => {};
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  const mql = getMobileQuery();
  return mql ? mql.matches : false;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
