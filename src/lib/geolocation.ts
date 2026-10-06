import type { GeoPoint } from '@/types/trail';

export type GeoErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';

export class GeoTrackingError extends Error {
  constructor(
    message: string,
    public readonly code: GeoErrorCode
  ) {
    super(message);
    this.name = 'GeoTrackingError';
  }
}

export interface TrackerCallbacks {
  onPoint: (point: GeoPoint) => void;
  onError: (error: GeoTrackingError) => void;
}

export interface TrackerOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Manages clean lifecycle of browser geolocation tracking.
 * Guarantees zero zombie watchers and keeps coordinates purely local in browser memory.
 */
export class GeolocationManager {
  private watchId: number | null = null;
  private isTracking = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  public getStatus(): { isTracking: boolean; isSupported: boolean } {
    return {
      isTracking: this.isTracking,
      isSupported: this.isSupported(),
    };
  }

  /**
   * Starts geolocation tracking using watchPosition.
   * Returns a cleanup function that unconditionally stops tracking.
   */
  public startTracking(callbacks: TrackerCallbacks, options: TrackerOptions = {}): () => void {
    if (!this.isSupported()) {
      callbacks.onError(
        new GeoTrackingError('Geolocation is not supported by this browser.', 'NOT_SUPPORTED')
      );
      return () => this.stopTracking();
    }

    // If an existing watcher is active, clear it first
    this.stopTracking();

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 5000,
    };

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const point: GeoPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
            accuracy: pos.coords.accuracy,
          };
          callbacks.onPoint(point);
        },
        (err) => {
          let code: GeoErrorCode = 'POSITION_UNAVAILABLE';
          let message = 'Unable to determine your current location.';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              code = 'PERMISSION_DENIED';
              message = 'Location permission was denied. Please allow location access to track trail distance.';
              break;
            case err.POSITION_UNAVAILABLE:
              code = 'POSITION_UNAVAILABLE';
              message = 'GPS signal unavailable. Move to an area with clear sky view.';
              break;
            case err.TIMEOUT:
              code = 'TIMEOUT';
              message = 'Location request timed out.';
              break;
          }

          callbacks.onError(new GeoTrackingError(message, code));
        },
        geoOptions
      );

      this.isTracking = true;
    } catch {
      callbacks.onError(
        new GeoTrackingError('Unexpected error starting geolocation tracking.', 'POSITION_UNAVAILABLE')
      );
    }

    return () => this.stopTracking();
  }

  /**
   * Stops tracking and cleans up any active browser watcher.
   */
  public stopTracking(): void {
    if (this.watchId !== null && this.isSupported()) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch {
        // Safe ignore
      }
      this.watchId = null;
    }
    this.isTracking = false;
  }
}

// Export singleton instance for app-wide lifecycle management
export const geoManager = new GeolocationManager();
