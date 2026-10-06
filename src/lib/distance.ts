import type { GeoPoint } from '@/types/trail';

const EARTH_RADIUS_METERS = 6371000; // Mean Earth radius in meters

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates geodesic distance between two latitude/longitude points
 * using the Haversine formula.
 *
 * Guaranteed properties:
 * - Returns 0 for identical or near-identical coordinates
 * - Validates coordinate bounds (-90 <= lat <= 90, -180 <= lon <= 180)
 * - Returns 0 or throws safe error for NaN / invalid numbers
 * - Handles small floating-point precision inaccuracies safely
 *
 * @param p1 Starting GeoPoint or { latitude, longitude }
 * @param p2 Ending GeoPoint or { latitude, longitude }
 * @returns Distance in meters (>= 0)
 */
export function calculateHaversineDistance(
  p1: Pick<GeoPoint, 'latitude' | 'longitude'>,
  p2: Pick<GeoPoint, 'latitude' | 'longitude'>
): number {
  if (!p1 || !p2) return 0;

  const lat1 = p1.latitude;
  const lon1 = p1.longitude;
  const lat2 = p2.latitude;
  const lon2 = p2.longitude;

  // Numerical validity checks
  if (
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2) ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }

  // Bounds checks
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
    return 0;
  }

  // Identical coordinates check
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  // Clamp to [0, 1] to prevent NaN due to floating-point rounding
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  const distance = EARTH_RADIUS_METERS * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place (10cm precision)
}

/**
 * Calculates cumulative distance over an array of GeoPoints.
 * Suppresses GPS jitter (ignores increments < thresholdMeters).
 */
export function calculateTrackDistance(points: GeoPoint[], jitterThresholdMeters = 2.0): number {
  if (!points || points.length < 2) return 0;

  let totalDistance = 0;
  let lastValidPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const currentPoint = points[i];
    const segment = calculateHaversineDistance(lastValidPoint, currentPoint);

    // Filter out minor GPS drift and duplicate points
    if (segment >= jitterThresholdMeters) {
      totalDistance += segment;
      lastValidPoint = currentPoint;
    }
  }

  return Math.round(totalDistance);
}
