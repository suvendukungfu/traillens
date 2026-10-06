import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, calculateTrackDistance } from './distance';
import type { GeoPoint } from '@/types/trail';

describe('calculateHaversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    const p1 = { latitude: 37.7749, longitude: -122.4194 };
    const p2 = { latitude: 37.7749, longitude: -122.4194 };
    expect(calculateHaversineDistance(p1, p2)).toBe(0);
  });

  it('handles invalid coordinate bounds gracefully', () => {
    // Latitude > 90
    expect(calculateHaversineDistance({ latitude: 95, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    // Longitude > 180
    expect(calculateHaversineDistance({ latitude: 0, longitude: 185 }, { latitude: 0, longitude: 0 })).toBe(0);
  });

  it('handles NaN and Infinity safely without throwing', () => {
    expect(calculateHaversineDistance({ latitude: NaN, longitude: 10 }, { latitude: 20, longitude: 10 })).toBe(0);
    expect(calculateHaversineDistance({ latitude: Infinity, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
  });

  it('calculates 1 degree of latitude near the equator (~111.2 km)', () => {
    const p1 = { latitude: 0, longitude: 0 };
    const p2 = { latitude: 1, longitude: 0 };
    const distanceMeters = calculateHaversineDistance(p1, p2);
    // ~111,195 meters
    expect(distanceMeters).toBeGreaterThan(111000);
    expect(distanceMeters).toBeLessThan(112000);
  });

  it('accurately calculates known intercontinental distance (NYC to London)', () => {
    const nyc = { latitude: 40.7128, longitude: -74.006 };
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const distanceMeters = calculateHaversineDistance(nyc, london);
    // NYC to London is approximately 5,570 km (5,570,000 meters) ± 30km
    expect(distanceMeters).toBeGreaterThan(5550000);
    expect(distanceMeters).toBeLessThan(5600000);
  });
});

describe('calculateTrackDistance', () => {
  it('returns 0 for empty or single-point tracks', () => {
    expect(calculateTrackDistance([])).toBe(0);
    expect(
      calculateTrackDistance([{ latitude: 37.7749, longitude: -122.4194, timestamp: 1000 }])
    ).toBe(0);
  });

  it('filters out GPS jitter below threshold', () => {
    // 0.00001 deg latitude is approx 1.1 meters (below default 2.0m threshold)
    const points: GeoPoint[] = [
      { latitude: 37.7749, longitude: -122.4194, timestamp: 1000 },
      { latitude: 37.774908, longitude: -122.4194, timestamp: 2000 }, // ~0.9m drift
      { latitude: 37.774915, longitude: -122.4194, timestamp: 3000 }, // ~0.8m drift
    ];

    expect(calculateTrackDistance(points, 2.0)).toBe(0);
  });

  it('accumulates real track distances correctly', () => {
    // Step 1: 0.001 deg lat = ~111m
    // Step 2: another 0.001 deg lat = ~111m
    const points: GeoPoint[] = [
      { latitude: 37.774, longitude: -122.419, timestamp: 1000 },
      { latitude: 37.775, longitude: -122.419, timestamp: 2000 },
      { latitude: 37.776, longitude: -122.419, timestamp: 3000 },
    ];

    const dist = calculateTrackDistance(points, 2.0);
    expect(dist).toBeGreaterThan(220);
    expect(dist).toBeLessThan(225);
  });
});
