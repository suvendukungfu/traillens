import { describe, expect, it } from 'vitest';
import type { AIAnalysisResult, FieldMission, MissionQualityReport } from '@/types/trail';
import {
  adaptEvidenceNodes,
  adaptMissionOrbit,
  adaptQualityRings,
  adaptToObservatoryViewModel,
  buildFieldConstellation,
  classifySpecimenMorphology,
  getMissionOrbitGrammar,
} from './observatoryData';
import { parseFieldComparison } from './comparison';

describe('Field Observatory Data Adapter', () => {
  const mockMission: FieldMission = {
    missionType: 'COMPARE',
    title: 'Compare Leaf Venation Patterns',
    target: 'Oak leaf on forest trail',
    durationSeconds: 180,
    steps: [
      'Locate a fallen leaf nearby of similar size',
      'Compare primary vein angle with the first specimen',
      'Note whether lobes are rounded or pointed',
    ],
    successCriteria: 'Compared lobe shape and primary vein symmetry',
    safetyConstraints: ['Stay on marked trail', 'Do not tear living leaves'],
  };

  const mockQualityReport: MissionQualityReport = {
    totalScore: 92,
    passed: true,
    grounded: true,
    specific: true,
    safe: true,
    executable: true,
    outdoorWorthwhile: true,
    dimensionScores: {
      grounding: 19,
      specificity: 18,
      safety: 20,
      executability: 18,
      outdoorWorthwhile: 17,
    },
    issues: [],
  };

  const mockAnalysis: AIAnalysisResult = {
    identification: 'White Oak Leaf (Quercus alba)',
    confidence: 'high',
    evidence: [
      'Distinct rounded lobes without bristle tips',
      'Smooth waxy green cuticle surface',
      'Prominent alternating secondary veins',
    ],
    description: 'A characteristic deciduous white oak leaf showing classic rounded margin lobes.',
    observation: 'Notice the depth of the sinuses between the leaf lobes.',
    mission: mockMission,
    challenge: 'Compare Leaf Venation Patterns: Locate a fallen leaf nearby...',
    safety: 'Observe without trampling off-trail vegetation.',
    qualityReport: mockQualityReport,
  };

  it('1. transforms FieldMission and analysis into ObservatoryViewModel', () => {
    const viewModel = adaptToObservatoryViewModel(mockAnalysis);

    expect(viewModel.subject).toBe('White Oak Leaf (Quercus alba)');
    expect(viewModel.morphologyType).toBe('leaf');
    expect(viewModel.confidence).toBe('high');
    expect(viewModel.evidenceNodes.length).toBe(3);
    expect(viewModel.qualityRings.length).toBe(5);
    expect(viewModel.qualityOverallScore).toBe(92);
    expect(viewModel.hasQualityReport).toBe(true);
    expect(viewModel.missionOrbit.grammar).toBe('dual_intertwined');
    expect(viewModel.missionOrbit.waypoints.length).toBe(3);
  });

  it('2. maps qualityReport dimension scores into 5 distinct quality rings', () => {
    const { rings, overallScore, hasReport } = adaptQualityRings(mockQualityReport);

    expect(hasReport).toBe(true);
    expect(overallScore).toBe(92);
    expect(rings).toHaveLength(5);

    const safetyRing = rings.find((r) => r.name === 'safety');
    expect(safetyRing?.score).toBe(20);
    expect(safetyRing?.passed).toBe(true);
    expect(safetyRing?.radius).toBe(2.5);

    const groundingRing = rings.find((r) => r.name === 'grounding');
    expect(groundingRing?.score).toBe(19);
    expect(groundingRing?.radius).toBe(1.4);
  });

  it('3. converts evidence strings into spatial 3D nodes', () => {
    const evidence = [
      'Lobed margin geometry',
      'Waxy cuticle texture',
      'Quartz crystal veins',
    ];
    const nodes = adaptEvidenceNodes(evidence);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].label).toBe('Lobed margin geometry');
    expect(nodes[0].angle).toBeGreaterThan(0);
    expect(nodes[0].radius).toBeGreaterThan(1.5);
    expect(nodes[0].importance).toBeGreaterThan(0.5);
  });

  it('4. assigns deterministic visual grammar per mission type', () => {
    expect(getMissionOrbitGrammar('OBSERVE')).toBe('single_stable');
    expect(getMissionOrbitGrammar('COMPARE')).toBe('dual_intertwined');
    expect(getMissionOrbitGrammar('COUNT')).toBe('segmented_count');
    expect(getMissionOrbitGrammar('NOTICE')).toBe('radial_beacon');
    expect(getMissionOrbitGrammar('TRACE')).toBe('open_arc');
    expect(getMissionOrbitGrammar('PATTERN')).toBe('harmonic_rosette');
  });

  it('5. projects mission steps into sequential spatial waypoints', () => {
    const orbit = adaptMissionOrbit(mockMission);

    expect(orbit.grammar).toBe('dual_intertwined');
    expect(orbit.waypoints).toHaveLength(3);
    expect(orbit.waypoints[0].stepNumber).toBe(1);
    expect(orbit.waypoints[0].instruction).toContain('Locate a fallen leaf nearby');
    expect(orbit.waypoints[0].position).toHaveLength(3);
    expect(orbit.waypoints[1].stepNumber).toBe(2);
    expect(orbit.waypoints[2].stepNumber).toBe(3);
  });

  it('6. connects multiple session observations into a Field Constellation', () => {
    const obsA: AIAnalysisResult = {
      ...mockAnalysis,
      identification: 'White Oak Leaf',
    };
    const obsB: AIAnalysisResult = {
      ...mockAnalysis,
      identification: 'Crustose Lichen on Bark',
      observation: 'Examine tree bark fissures and moss growth',
      mission: { ...mockMission, missionType: 'OBSERVE' },
    };
    const obsC: AIAnalysisResult = {
      ...mockAnalysis,
      identification: 'River Quartz Pebble',
      observation: 'Examine quartz veins on wet river stone',
      mission: { ...mockMission, missionType: 'COMPARE' },
    };

    const constellation = buildFieldConstellation([obsA, obsB, obsC]);

    expect(constellation).toHaveLength(3);
    expect(constellation[0].subject).toBe('White Oak Leaf');
    expect(constellation[1].subject).toBe('Crustose Lichen on Bark');
    expect(constellation[2].subject).toBe('River Quartz Pebble');

    // Sequential trail breadcrumb connection
    expect(constellation[1].connections).toContain(constellation[0].id);
    expect(constellation[2].connections).toContain(constellation[1].id);

    // Shared mission type connection (obsA and obsC both have missionType 'COMPARE')
    expect(constellation[2].connections).toContain(constellation[0].id);
  });

  it('7. renders neutral state when qualityReport is missing', () => {
    const { rings, overallScore, hasReport } = adaptQualityRings(undefined);

    expect(hasReport).toBe(false);
    expect(overallScore).toBe(80);
    expect(rings).toHaveLength(5);
    rings.forEach((ring) => {
      expect(ring.passed).toBe(true);
      expect(ring.score).toBe(16);
      expect(ring.opacity).toBe(0.45);
    });
  });

  it('8. validates comparison results into Field Twin model', () => {
    const validComparison = {
      leftSubject: 'White Oak Leaf',
      rightSubject: 'Red Oak Leaf',
      sharedFeatures: ['Distinct multi-lobed shape', 'Alternating leaf venation'],
      differences: ['Rounded lobe tips vs sharp bristle-pointed lobe tips'],
      uncertainty: ['Exact tannin concentration'],
      recommendedObservation: 'Touch the leaf tips to feel whether they have minute sharp bristles.',
    };

    const parsed = parseFieldComparison(validComparison);

    expect(parsed.leftSubject).toBe('White Oak Leaf');
    expect(parsed.rightSubject).toBe('Red Oak Leaf');
    expect(parsed.sharedFeatures).toHaveLength(2);
    expect(parsed.differences).toHaveLength(1);
    expect(parsed.recommendedObservation).toContain('Touch the leaf tips');
  });

  it('9. classifies specimen morphology accurately', () => {
    expect(classifySpecimenMorphology('Oak Leaf', 'Green foliage')).toBe('leaf');
    expect(classifySpecimenMorphology('Pine Bark with Lichen', 'Rough trunk')).toBe('bark');
    expect(classifySpecimenMorphology('Yellow Dandelion', 'Flower blossom')).toBe('flower');
    expect(classifySpecimenMorphology('Quartzite Pebbles', 'Smooth river stone')).toBe('stone');
    expect(classifySpecimenMorphology('Conifer Cone', 'Pine cone scales')).toBe('cone');
    expect(classifySpecimenMorphology('Unknown Specimen', 'Ambient natural sample')).toBe('ambient');
  });
});
