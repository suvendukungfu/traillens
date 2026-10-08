/**
 * TrailLens - Spatial Coordinates & Normalization Utilities
 */

import type { BoundingBox, Centroid, RelativePosition } from './types';

/**
 * Computes human-readable 3x3 grid position from normalized centroid coordinates (0.0 to 1.0)
 */
export function calculateRelativePosition(centroid: Centroid): RelativePosition {
  const { x, y } = centroid;

  const col = x < 0.35 ? 'left' : x > 0.65 ? 'right' : 'center';
  const row = y < 0.35 ? 'upper' : y > 0.65 ? 'lower' : 'center';

  if (row === 'center' && col === 'center') {
    return 'center';
  }

  if (row === 'center') {
    return `center-${col}` as RelativePosition;
  }

  return `${row}-${col}` as RelativePosition;
}

/**
 * Bounds checking and normalization
 */
export function clamp01(val: number): number {
  return Math.max(0, Math.min(1, Math.round(val * 1000) / 1000));
}

export function computeCentroid(box: BoundingBox): Centroid {
  return {
    x: clamp01(box.x + box.width / 2),
    y: clamp01(box.y + box.height / 2),
  };
}
