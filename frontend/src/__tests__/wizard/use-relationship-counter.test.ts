import { renderHook, act } from '@testing-library/react';
import { useRelationshipCounter } from '../../hooks/use-relationship-counter';

describe('useRelationshipCounter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return zero values for empty startDate', () => {
    const { result } = renderHook(() => useRelationshipCounter(''));
    expect(result.current.years).toBe(0);
    expect(result.current.months).toBe(0);
    expect(result.current.days).toBe(0);
  });

  it('should calculate years and months correctly', () => {
    const mockNow = new Date('2026-05-11T12:00:00Z');
    jest.setSystemTime(mockNow);
    const startDate = '2024-01-01';
    const { result } = renderHook(() => useRelationshipCounter(startDate));
    expect(result.current.years).toBe(2);
    expect(result.current.months).toBe(4);
  });

  it('should return zero for future startDate', () => {
    jest.setSystemTime(new Date('2026-05-11'));
    const { result } = renderHook(() => useRelationshipCounter('2030-01-01'));
    expect(result.current.years).toBe(0);
    expect(result.current.months).toBe(0);
  });

  it('should update every second via setInterval', () => {
    const startDate = '2024-01-01';
    const spy = jest.spyOn(global, 'setInterval');
    renderHook(() => useRelationshipCounter(startDate));
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 1000);
    spy.mockRestore();
  });

  it('should clear interval on unmount', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useRelationshipCounter('2024-01-01'));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('should update seconds when time advances', () => {
    jest.setSystemTime(new Date('2026-05-11T12:00:00Z'));
    const { result } = renderHook(() => useRelationshipCounter('2024-01-01'));
    const initialSeconds = result.current.seconds;
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe((initialSeconds + 1) % 60);
  });
});
