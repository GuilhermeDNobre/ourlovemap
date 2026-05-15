import { renderHook, act } from '@testing-library/react';
import { useActivePlace } from '../../hooks/use-active-place';

describe('useActivePlace', () => {
  it('should start with activeIndex 0', () => {
    const { result } = renderHook(() => useActivePlace());
    expect(result.current.activeIndex).toBe(0);
  });

  it('should update activeIndex when inView is true', () => {
    const { result } = renderHook(() => useActivePlace());
    act(() => {
      result.current.updateVisibility(2, true);
    });
    expect(result.current.activeIndex).toBe(2);
  });

  it('should not update activeIndex when inView is false', () => {
    const { result } = renderHook(() => useActivePlace());
    act(() => {
      result.current.updateVisibility(2, true);
    });
    act(() => {
      result.current.updateVisibility(3, false);
    });
    expect(result.current.activeIndex).toBe(2);
  });

  it('should update to the latest visible index', () => {
    const { result } = renderHook(() => useActivePlace());
    act(() => {
      result.current.updateVisibility(1, true);
    });
    act(() => {
      result.current.updateVisibility(4, true);
    });
    expect(result.current.activeIndex).toBe(4);
  });

  it('should expose a stable updateVisibility reference', () => {
    const { result, rerender } = renderHook(() => useActivePlace());
    const first = result.current.updateVisibility;
    rerender();
    expect(result.current.updateVisibility).toBe(first);
  });
});
