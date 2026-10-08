/**
 * TrailLens - Spatial Computer Vision Ablation & Benchmark Suite
 * Evaluates Segmentation Latency, Spatial Quality, and Grounding against real samples
 */

import fs from 'fs';
import path from 'path';
import { SpatialSegmentationEngine } from './processor';
import { buildSpatialSceneSummary } from './summary';
import { buildSpatialFusionPrompt } from './fusion';
import { validateChallengeSafety } from './safety';
import type { SpatialSceneSummary } from './types';

export interface AblationBenchmarkRecord {
  sampleId: string;
  label: string;
  imagePath: string;
  imageSizeKb: number;
  segmentationLatencyMs: number;
  regionsDetected: number;
  primaryPlacement: string;
  summary: SpatialSceneSummary;
  fusedPromptLength: number;
  safetyCheck: { isSafe: boolean; violations: string[] };
}

export const EVALUATION_SAMPLES = [
  { id: 'oak_leaf', label: 'Oak Leaf Observation', file: 'public/samples/oak_leaf_optimized.jpg' },
  { id: 'tree_bark', label: 'Pine Bark & Lichen', file: 'public/samples/tree_bark_optimized.jpg' },
  { id: 'wildflower', label: 'Dandelion Wildflower', file: 'public/samples/wildflower_optimized.jpg' },
  { id: 'river_stones', label: 'River Stones & Pebbles', file: 'public/samples/river_stones_optimized.jpg' },
  { id: 'pine_cone', label: 'Fallen Pine Cone', file: 'public/samples/pine_cone_optimized.jpg' },
];

export async function runSegmentationBenchmark(): Promise<AblationBenchmarkRecord[]> {
  const engine = new SpatialSegmentationEngine();
  const records: AblationBenchmarkRecord[] = [];

  for (const sample of EVALUATION_SAMPLES) {
    const fullPath = path.resolve(process.cwd(), sample.file);
    const buffer = fs.readFileSync(fullPath);
    const sizeKb = Math.round(buffer.length / 1024);

    const startTime = Date.now();
    const segResult = await engine.segment(buffer);
    const summary = buildSpatialSceneSummary(segResult);
    const durationMs = Date.now() - startTime;

    const fusionPrompt = buildSpatialFusionPrompt(summary);
    const safetyCheck = validateChallengeSafety(
      `Look closely at the ${summary.primarySubjectPlacement} region. Put your phone away and search within 10 paces for another natural subject with different surface texture.`
    );

    records.push({
      sampleId: sample.id,
      label: sample.label,
      imagePath: sample.file,
      imageSizeKb: sizeKb,
      segmentationLatencyMs: durationMs,
      regionsDetected: segResult.regions.length,
      primaryPlacement: summary.primarySubjectPlacement,
      summary,
      fusedPromptLength: fusionPrompt.length,
      safetyCheck: {
        isSafe: safetyCheck.isSafe,
        violations: safetyCheck.violations,
      },
    });
  }

  return records;
}
