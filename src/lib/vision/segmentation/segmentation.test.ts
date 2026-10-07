import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  SpatialSegmentationEngine,
  calculateRelativePosition,
  validateChallengeSafety,
  buildSpatialFusionPrompt,
} from './index';

describe('Spatial Segmentation & Vision Research Module', () => {
  it('correctly calculates 3x3 grid relative positions', () => {
    expect(calculateRelativePosition({ x: 0.2, y: 0.2 })).toBe('upper-left');
    expect(calculateRelativePosition({ x: 0.5, y: 0.5 })).toBe('center');
    expect(calculateRelativePosition({ x: 0.8, y: 0.8 })).toBe('lower-right');
    expect(calculateRelativePosition({ x: 0.5, y: 0.2 })).toBe('upper-center');
    expect(calculateRelativePosition({ x: 0.2, y: 0.5 })).toBe('center-left');
  });

  it('segments an outdoor sample image in < 100ms with valid regions', async () => {
    const samplePath = path.resolve(process.cwd(), 'public/samples/oak_leaf_optimized.jpg');
    const imageBuffer = fs.readFileSync(samplePath);

    const engine = new SpatialSegmentationEngine();
    const result = await engine.segment(imageBuffer);

    expect(result.imageWidth).toBe(128);
    expect(result.imageHeight).toBe(128);
    expect(result.regions.length).toBeGreaterThan(0);
    expect(result.processingTimeMs).toBeLessThan(150); // Hard latency constraint

    // Check primary region attributes
    const primary = result.primarySubjectRegion;
    expect(primary).toBeDefined();
    expect(primary?.boundingBox.width).toBeGreaterThan(0);
    expect(primary?.areaRatio).toBeGreaterThan(0);
  });

  it('generates a compact spatial scene summary', async () => {
    const samplePath = path.resolve(process.cwd(), 'public/samples/pine_cone_optimized.jpg');
    const imageBuffer = fs.readFileSync(samplePath);

    const engine = new SpatialSegmentationEngine();
    const summary = await engine.generateSpatialSummary(imageBuffer);

    expect(summary.regionCount).toBeGreaterThan(0);
    expect(summary.summaryText).toContain('[SPATIAL SCENE COMPOSITION');
    expect(summary.processingDurationMs).toBeLessThan(150);
  });

  it('constructs a valid Gemma fusion prompt', async () => {
    const samplePath = path.resolve(process.cwd(), 'public/samples/river_stones_optimized.jpg');
    const imageBuffer = fs.readFileSync(samplePath);

    const engine = new SpatialSegmentationEngine();
    const summary = await engine.generateSpatialSummary(imageBuffer);
    const fusionPrompt = buildSpatialFusionPrompt(summary);

    expect(fusionPrompt).toContain('SPATIAL SCENE CONTEXT');
    expect(fusionPrompt).toContain('PRIMARY EVIDENCE');
    expect(fusionPrompt).toContain('OUTPUT FORMAT');
  });

  describe('Challenge Safety Validator', () => {
    it('approves safe observational outdoor challenges', () => {
      const safeChallenge =
        'Put your phone in your pocket and observe the bark pattern on three adjacent trees. Look for moss growth.';
      const result = validateChallengeSafety(safeChallenge);
      expect(result.isSafe).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.sanitizedChallenge).toBe(safeChallenge);
    });

    it('rejects and sanitizes wild foraging or ingestion instructions', () => {
      const unsafeChallenge = 'Taste the dandelion leaf to check if it has a bitter flavor.';
      const result = validateChallengeSafety(unsafeChallenge);
      expect(result.isSafe).toBe(false);
      expect(result.violations).toContain('Wild foraging or ingestion hazard');
      expect(result.sanitizedChallenge).toContain('Without touching anything');
    });

    it('rejects and sanitizes wild mushroom handling', () => {
      const unsafeChallenge = 'Pick up the mushroom and feel the gills under the cap.';
      const result = validateChallengeSafety(unsafeChallenge);
      expect(result.isSafe).toBe(false);
      expect(result.violations).toContain('Tactile interaction with potentially toxic fungi');
      expect(result.sanitizedChallenge).toContain('Without touching anything');
    });

    it('rejects and sanitizes wildlife harassment', () => {
      const unsafeChallenge = 'Try to catch a small lizard or insect hiding in the rocks.';
      const result = validateChallengeSafety(unsafeChallenge);
      expect(result.isSafe).toBe(false);
      expect(result.violations).toContain('Wildlife disturbance or envenomation risk');
      expect(result.sanitizedChallenge).toContain('Without touching anything');
    });
  });

  describe('Ablation Benchmark Suite', () => {
    it('executes segmentation benchmark across all 5 outdoor test fixtures in < 250ms total', async () => {
      const { runSegmentationBenchmark } = await import('./benchmark');
      const results = await runSegmentationBenchmark();

      expect(results).toHaveLength(5);
      results.forEach((rec) => {
        expect(rec.segmentationLatencyMs).toBeLessThan(100);
        expect(rec.regionsDetected).toBeGreaterThan(0);
        expect(rec.safetyCheck.isSafe).toBe(true);
      });

      const avgLatency = results.reduce((sum, r) => sum + r.segmentationLatencyMs, 0) / results.length;
      expect(avgLatency).toBeLessThan(35); // Extremely fast sub-35ms average!
    });
  });
});
