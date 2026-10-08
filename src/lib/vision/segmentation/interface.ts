/**
 * TrailLens - Segmentation Engine Interface
 * Decouples model implementations (SegFormer, OpenCV/Sharp, YOLO) from the TrailLens pipeline
 */

import type { SegmentationResult, SpatialSceneSummary } from './types';

export interface ISegmentationEngine {
  readonly name: string;
  readonly version: string;

  /**
   * Performs segmentation on an image buffer (JPEG, PNG, or WebP)
   */
  segment(imageBuffer: Buffer): Promise<SegmentationResult>;

  /**
   * Convenience method to extract a compact textual spatial summary for LLM prompt fusion
   */
  generateSpatialSummary(imageBuffer: Buffer): Promise<SpatialSceneSummary>;
}
