import { useState, useCallback } from 'react';

export function useActivePlace() {
  const [activeIndex, setActiveIndex] = useState(0);
  const updateVisibility = useCallback((index: number, inView: boolean) => {
    if (inView) setActiveIndex(index);
  }, []);
  return { activeIndex, updateVisibility };
}
