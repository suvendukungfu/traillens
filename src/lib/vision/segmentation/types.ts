/**
 * TrailLens - Spatial Segmentation Domain Types
 * Model-agnostic contracts for outdoor spatial reasoning
 */

export type RelativePosition =
  | 'upper-left'
  | 'upper-center'
  | 'upper-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'lower-left'
  | 'lower-center'
  | 'lower-right';

export interface BoundingBox {
  /** Normalized X coordinate of top-left corner (0.0 to 1.0) */
  x: number;
  /** Normalized Y coordinate of top-left corner (0.0 to 1.0) */
  y: number;
  /** Normalized width (0.0 to 1.0) */
  width: number;
  /** Normalized height (0.0 to 1.0) */
  height: number;
}

export interface Centroid {
  x: number;
  y: number;
}

export interface SegmentRegion {
  instanceId: string;
  className: string;
  confidence: number;
  boundingBox: BoundingBox;
  centroid: Centroid;
  relativePosition: RelativePosition;
  /** Percentage of image area occupied by this region (0.0 to 1.0) */
  areaRatio: number;
  /** Dominant color or environmental cue */
  visualCue?: string;
}

export interface SegmentationResult {
  imageWidth: number;
  imageHeight: number;
  regions: SegmentRegion[];
  primarySubjectRegion?: SegmentRegion;
  substrateRegion?: SegmentRegion;
  backgroundRegion?: SegmentRegion;
  processingTimeMs: number;
  algorithm: string;
}

export interface SpatialSceneSummary {
  regionCount: number;
  summaryText: string;
  primarySubjectPlacement: RelativePosition | 'unknown';
  substrateContext: string;
  regions: SegmentRegion[];
  processingDurationMs: number;
}
