import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeolocationManager, GeoTrackingError } from './geolocation';

describe('GeolocationManager', () => {
  let manager: GeolocationManager;
  const mockClearWatch = vi.fn();
  const mockWatchPosition = vi.fn();

  beforeEach(() => {
    manager = new GeolocationManager();
    mockClearWatch.mockReset();
    mockWatchPosition.mockReset();

    // Mock window and navigator.geolocation in test environment
    Object.defineProperty(global, 'window', {
      value: global,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        geolocation: {
          watchPosition: mockWatchPosition,
          clearWatch: mockClearWatch,
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    manager.stopTracking();
  });

  it('reports supported when navigator.geolocation exists', () => {
    expect(manager.isSupported()).toBe(true);
  });

  it('starts tracking and sets watchId', () => {
    mockWatchPosition.mockReturnValue(42);
    const onPoint = vi.fn();
    const onError = vi.fn();

    const cleanup = manager.startTracking({ onPoint, onError });
    expect(mockWatchPosition).toHaveBeenCalledOnce();
    expect(manager.getStatus().isTracking).toBe(true);

    cleanup();
    expect(mockClearWatch).toHaveBeenCalledWith(42);
    expect(manager.getStatus().isTracking).toBe(false);
  });

  it('cleans up previous watcher if startTracking called repeatedly', () => {
    mockWatchPosition.mockReturnValueOnce(101).mockReturnValueOnce(102);
    const onPoint = vi.fn();
    const onError = vi.fn();

    manager.startTracking({ onPoint, onError });
    expect(manager.getStatus().isTracking).toBe(true);

    // Call start again
    manager.startTracking({ onPoint, onError });
    expect(mockClearWatch).toHaveBeenCalledWith(101);
  });

  it('dispatches GeoTrackingError on permission denial', () => {
    const errorCallback = {
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockWatchPosition.mockImplementation((_success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        ...errorCallback,
      });
      return 99;
    });

    const onPoint = vi.fn();
    const capturedErrors: GeoTrackingError[] = [];
    const onError = vi.fn((err: GeoTrackingError) => {
      capturedErrors.push(err);
    });

    manager.startTracking({ onPoint, onError });

    expect(onError).toHaveBeenCalled();
    expect(capturedErrors[0]?.code).toBe('PERMISSION_DENIED');
  });
});
