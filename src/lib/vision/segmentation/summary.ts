/**
 * TrailLens - Spatial Scene Summary Builder
 * Distills segmentation regions into compact, token-efficient text for Gemma 3
 */

import type { SegmentationResult, SpatialSceneSummary } from './types';

export function buildSpatialSceneSummary(result: SegmentationResult): SpatialSceneSummary {
  const { regions, processingTimeMs } = result;

  if (regions.length === 0) {
    return {
      regionCount: 0,
      summaryText: 'No prominent discrete visual clusters detected.',
      primarySubjectPlacement: 'unknown',
      substrateContext: 'undetermined natural setting',
      regions: [],
      processingDurationMs: processingTimeMs,
    };
  }

  // Sort regions by area descending
  const sorted = [...regions].sort((a, b) => b.areaRatio - a.areaRatio);
  const primary = sorted[0];

  const primaryPlacement = primary ? primary.relativePosition : 'unknown';

  // Substrate is typically lower or background
  const substrateCandidates = sorted.filter(
    (r) => r.relativePosition.startsWith('lower') || r.className.includes('ground') || r.className.includes('substrate')
  );
  const substrateContext = substrateCandidates.length > 0
    ? `${substrateCandidates[0].className} in ${substrateCandidates[0].relativePosition}`
    : 'natural background';

  const lines: string[] = [
    `[SPATIAL SCENE COMPOSITION (${regions.length} salient regions)]`,
  ];

  sorted.forEach((r, idx) => {
    const areaPct = Math.round(r.areaRatio * 100);
    const cue = r.visualCue ? ` (${r.visualCue})` : '';
    lines.push(
      `- Region ${idx + 1} [${r.className}${cue}]: ${r.relativePosition} position, ~${areaPct}% of visual frame`
    );
  });

  lines.push(`- Focal Placement: Primary subject occupies ${primaryPlacement} quadrant.`);
  lines.push(`- Ground Context: ${substrateContext}.`);

  return {
    regionCount: regions.length,
    summaryText: lines.join('\n'),
    primarySubjectPlacement: primaryPlacement,
    substrateContext,
    regions: sorted,
    processingDurationMs: processingTimeMs,
  };
}
