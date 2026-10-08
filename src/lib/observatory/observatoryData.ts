/**
 * TrailLens - Field Observatory Data Adapter
 * Pure functional adapter mapping domain state to serializable 3D/2D view model.
 */

import type { AIAnalysisResult, MissionType } from '@/types/trail';
import type {
  EvidenceNode,
  FieldConstellationNode,
  MissionOrbitData,
  MissionOrbitGrammar,
  MissionWaypoint,
  ObservatoryViewModel,
  QualityDimensionName,
  QualityRingData,
  SpecimenMorphologyType,
} from './types';

/**
 * Classifies specimen into an abstract naturalist morphology representation.
 * Explicitly designated as an illustrative visual abstraction, not a 3D reconstruction.
 */
export function classifySpecimenMorphology(identification: string, observation: string): SpecimenMorphologyType {
  const text = `${identification} ${observation}`.toLowerCase();

  if (/leaf|foliage|frond|plant|maple|oak|fern|ivy|herb/.test(text)) {
    return 'leaf';
  }
  if (/bark|trunk|wood|log|branch|lichen|moss|fungi|shelf/.test(text)) {
    return 'bark';
  }
  if (/flower|blossom|petal|wildflower|dandelion|bloom|daisy|violet/.test(text)) {
    return 'flower';
  }
  if (/stone|rock|pebble|quartz|granite|mineral|boulder|flint|slate/.test(text)) {
    return 'stone';
  }
  if (/cone|pine cone|conifer|needle|spruce|fir|pod|acorn/.test(text)) {
    return 'cone';
  }

  return 'ambient';
}

/**
 * Maps mission type to spatial orbit geometry grammar.
 */
export function getMissionOrbitGrammar(missionType: MissionType): MissionOrbitGrammar {
  switch (missionType) {
    case 'OBSERVE':
      return 'single_stable';
    case 'COMPARE':
      return 'dual_intertwined';
    case 'COUNT':
      return 'segmented_count';
    case 'NOTICE':
      return 'radial_beacon';
    case 'TRACE':
      return 'open_arc';
    case 'PATTERN':
      return 'harmonic_rosette';
    default:
      return 'single_stable';
  }
}

/**
 * Adapts visual evidence clues into spatial nodes orbiting the specimen.
 */
export function adaptEvidenceNodes(evidence: string[]): EvidenceNode[] {
  if (!evidence || evidence.length === 0) {
    return [
      {
        id: 'evidence-0',
        label: 'Morphological structure observed',
        angle: 0,
        radius: 2.4,
        elevation: 0,
        importance: 0.8,
      },
    ];
  }

  const count = evidence.length;
  return evidence.map((clue, idx) => {
    // Golden angle distribution for natural harmonic spacing
    const angle = (idx / count) * Math.PI * 2 + 0.35;
    const radius = 2.3 + (idx % 2 === 0 ? 0.35 : -0.2);
    const elevation = Math.sin(idx * 1.8) * 0.45;
    const importance = Math.max(0.4, 0.95 - idx * 0.12);

    return {
      id: `evidence-${idx}`,
      label: clue.trim(),
      angle,
      radius,
      elevation,
      importance,
    };
  });
}

/**
 * Generates the 5 deterministic quality rings from MissionQualityReport.
 */
export function adaptQualityRings(
  report?: AIAnalysisResult['qualityReport']
): { rings: QualityRingData[]; overallScore: number; hasReport: boolean } {
  const dimensions: Array<{ name: QualityDimensionName; label: string; radius: number; color: string }> = [
    { name: 'grounding', label: 'Grounding', radius: 1.4, color: '#B88B2A' },
    { name: 'specificity', label: 'Specificity', radius: 1.9, color: '#C5A059' },
    { name: 'safety', label: 'Safety', radius: 2.5, color: '#4A7C59' },
    { name: 'executability', label: 'Executability', radius: 3.1, color: '#2C5E3B' },
    { name: 'outdoorWorthwhile', label: 'Outdoor Value', radius: 3.7, color: '#1C3D2B' },
  ];

  if (!report || !report.dimensionScores) {
    // Neutral fallback representing unmeasured state
    const rings: QualityRingData[] = dimensions.map((dim, idx) => ({
      id: `ring-${dim.name}`,
      name: dim.name,
      label: dim.label,
      score: 16,
      maxScore: 20,
      radius: dim.radius,
      thickness: 1.0,
      opacity: 0.45,
      passed: true,
      color: dim.color,
      dashCount: 24 + idx * 8,
    }));

    return { rings, overallScore: 80, hasReport: false };
  }

  const scores = report.dimensionScores;
  const rings: QualityRingData[] = dimensions.map((dim) => {
    const score = Math.max(0, Math.min(20, scores[dim.name] ?? 0));
    const passed = score >= 14;
    // Map score 0-20 to geometry attributes
    const thickness = 0.5 + (score / 20) * 1.5;
    const opacity = 0.3 + (score / 20) * 0.55;
    const dashCount = passed ? 36 : 12;

    return {
      id: `ring-${dim.name}`,
      name: dim.name,
      label: dim.label,
      score,
      maxScore: 20,
      radius: dim.radius,
      thickness,
      opacity,
      passed,
      color: passed ? dim.color : '#8C3B3B',
      dashCount,
    };
  });

  return {
    rings,
    overallScore: report.totalScore,
    hasReport: true,
  };
}

/**
 * Projects FieldMission steps into spatial waypoints along the mission orbit.
 */
export function adaptMissionOrbit(mission?: AIAnalysisResult['mission']): MissionOrbitData {
  const missionType = mission?.missionType ?? 'OBSERVE';
  const grammar = getMissionOrbitGrammar(missionType);
  const orbitRadius = 4.4;
  const inclination = 0.26; // ~15 degrees tilt for visual depth

  const steps = mission?.steps && mission.steps.length > 0
    ? mission.steps
    : ['Observe surrounding specimen context and physical habitat.'];

  const waypoints: MissionWaypoint[] = steps.map((step, idx) => {
    // Space waypoints evenly along the tilted orbit
    const stepAngle = (idx / Math.max(1, steps.length)) * Math.PI * 1.6 + 0.4;
    const x = Math.cos(stepAngle) * orbitRadius;
    const z = Math.sin(stepAngle) * orbitRadius;
    const y = Math.sin(stepAngle) * Math.sin(inclination) * orbitRadius;

    return {
      stepNumber: idx + 1,
      instruction: step,
      position: [x, y, z],
    };
  });

  return {
    missionType,
    title: mission?.title ?? 'Tactile Field Observation',
    target: mission?.target ?? 'Physical Specimen',
    durationSeconds: mission?.durationSeconds ?? 180,
    grammar,
    orbitRadius,
    inclination,
    waypoints,
    successCriteria: mission?.successCriteria ?? 'Physical field observation completed',
  };
}

/**
 * Builds the Field Constellation graph from all observations in the current session.
 */
export function buildFieldConstellation(
  observations?: AIAnalysisResult[]
): FieldConstellationNode[] {
  if (!observations || observations.length === 0) {
    return [];
  }

  const nodes: FieldConstellationNode[] = observations.map((obs, idx) => {
    const morphologyType = classifySpecimenMorphology(obs.identification, obs.observation);
    const missionType = obs.mission?.missionType ?? 'OBSERVE';
    
    // Position outer constellation nodes in a delicate celestial sphere (radius 6.0 to 8.5)
    const phi = (idx / Math.max(1, observations.length)) * Math.PI * 2;
    const theta = Math.sin(idx * 1.5) * 0.7; // Gentle elevation variance
    const r = 6.2 + (idx % 3) * 0.7;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(theta);
    const z = r * Math.sin(phi) * Math.cos(theta);

    return {
      id: `constellation-${idx}`,
      subject: obs.identification,
      morphologyType,
      missionType,
      timestamp: Date.now() - (observations.length - idx) * 120000,
      position: [x, y, z],
      score: obs.qualityReport?.totalScore ?? 85,
      hasReflection: true,
      connections: [],
    };
  });

  // Calculate deterministic relationships (connect sequential trail steps + shared mission types)
  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    // 1. Sequential trail breadcrumb connection
    if (i > 0) {
      current.connections.push(nodes[i - 1].id);
    }
    // 2. Shared missionType or morphology connection
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        const other = nodes[j];
        if (
          (current.missionType === other.missionType || current.morphologyType === other.morphologyType) &&
          !current.connections.includes(other.id)
        ) {
          current.connections.push(other.id);
        }
      }
    }
  }

  return nodes;
}

/**
 * Canonical entry point: transforms an AIAnalysisResult into the complete ObservatoryViewModel.
 */
export function adaptToObservatoryViewModel(
  analysis: AIAnalysisResult,
  sessionObservations?: AIAnalysisResult[],
  comparison?: AIAnalysisResult['comparison'] | ObservatoryViewModel['comparison']
): ObservatoryViewModel {
  const morphologyType = classifySpecimenMorphology(analysis.identification, analysis.observation);
  const evidenceNodes = adaptEvidenceNodes(analysis.evidence);
  const { rings, overallScore, hasReport } = adaptQualityRings(analysis.qualityReport);
  const missionOrbit = adaptMissionOrbit(analysis.mission);
  const constellationNodes = buildFieldConstellation(sessionObservations);

  return {
    subject: analysis.identification,
    morphologyType,
    confidence: analysis.confidence,
    specimenDescription: analysis.description,
    observationPrompt: analysis.observation,
    evidenceNodes,
    qualityRings: rings,
    qualityOverallScore: overallScore,
    hasQualityReport: hasReport,
    missionOrbit,
    constellationNodes,
    comparison: comparison as ObservatoryViewModel['comparison'],
  };
}
