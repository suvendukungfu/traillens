import { describe, it, expect } from 'vitest';
import {
  fieldMissionSchema,
  aiAnalysisResultSchema,
  type FieldMission,
} from '@/lib/validation';
import {
  compileMissionToChallenge,
  SAFE_MISSION_FALLBACK,
} from './compiler';
import { SAFE_CHALLENGE_FALLBACK } from '@/lib/safety/challenge';

describe('FieldMission Contract & Compiler', () => {
  const validMission: FieldMission = {
    missionType: 'COMPARE',
    title: 'Foliage Comparison',
    target: 'Find another leaf nearby with a different lobe pattern',
    durationSeconds: 120,
    steps: [
      'Put your phone in your pocket',
      'Locate another tree or shrub within 10 paces',
      'Compare leaf margins and primary veins',
    ],
    successCriteria: 'Identify two visible structural differences',
    safetyConstraints: ['Observe only; do not touch or pluck leaves'],
  };

  // 1. Valid FieldMission parses
  it('1. Valid FieldMission parses successfully against schema', () => {
    const parsed = fieldMissionSchema.parse(validMission);
    expect(parsed.missionType).toBe('COMPARE');
    expect(parsed.durationSeconds).toBe(120);
    expect(parsed.steps).toHaveLength(3);
  });

  // 2. Missing required field fails
  it('2. Missing required field fails schema validation', () => {
    const invalid = {
      missionType: 'COMPARE',
      title: 'Missing target',
      durationSeconds: 120,
      steps: ['Step 1'],
      successCriteria: 'Done',
      safetyConstraints: ['Safe'],
    };
    expect(() => fieldMissionSchema.parse(invalid)).toThrow();
  });

  // 3. durationSeconds below 120 is rejected
  it('3. durationSeconds below 120 is rejected', () => {
    const tooShort = {
      ...validMission,
      durationSeconds: 60,
    };
    expect(() => fieldMissionSchema.parse(tooShort)).toThrow(/at least 120/);
  });

  // 4. durationSeconds above 300 is rejected
  it('4. durationSeconds above 300 is rejected', () => {
    const tooLong = {
      ...validMission,
      durationSeconds: 600,
    };
    expect(() => fieldMissionSchema.parse(tooLong)).toThrow(/not exceed 300/);
  });

  // 5. invalid missionType is rejected
  it('5. invalid missionType is rejected', () => {
    const badType = {
      ...validMission,
      missionType: 'DESTROY',
    };
    expect(() => fieldMissionSchema.parse(badType)).toThrow();
  });

  // 6. empty successCriteria is rejected
  it('6. empty successCriteria is rejected', () => {
    const emptySuccess = {
      ...validMission,
      successCriteria: '',
    };
    expect(() => fieldMissionSchema.parse(emptySuccess)).toThrow(/Success criteria required/);
  });

  // 7. unsafe mission produces safe fallback when processed in analysis result
  it('7. unsafe mission produces safe fallback and does not leak hazardous instructions', () => {
    const unsafeMissionInput = {
      identification: 'Amanita Mushroom',
      confidence: 'medium',
      evidence: ['White gills', 'Volva present'],
      description: 'Potentially toxic wild fungus.',
      observation: 'Notice the gills under the cap.',
      mission: {
        missionType: 'OBSERVE' as const,
        title: 'Taste test',
        target: 'Pick and taste the mushroom to check flavor',
        durationSeconds: 120,
        steps: ['Pick the mushroom cap', 'Eat a small bite'],
        successCriteria: 'Report flavor',
        safetyConstraints: ['None'],
      },
      safety: 'Do not eat wild mushrooms.',
    };

    const parsed = aiAnalysisResultSchema.parse(unsafeMissionInput);
    expect(parsed.challenge).toBe(SAFE_CHALLENGE_FALLBACK);
    expect(parsed.mission?.title).toBe(SAFE_MISSION_FALLBACK.title);
    expect(parsed.mission?.target).toBe(SAFE_MISSION_FALLBACK.target);
    expect(parsed.challenge).not.toMatch(/eat|taste|pick/i);
  });

  // 8. safe mission compiles deterministically
  it('8. safe mission compiles deterministically into formatted challenge text', () => {
    const compiled = compileMissionToChallenge(validMission);
    expect(compiled).toContain('Put your phone away for 2 minutes.');
    expect(compiled).toContain('Find another leaf nearby with a different lobe pattern.');
    expect(compiled).toContain('Steps: Put your phone in your pocket; Locate another tree or shrub within 10 paces; Compare leaf margins and primary veins.');
    expect(compiled).toContain('Success: Identify two visible structural differences.');
    expect(compiled).toContain('Safety: Observe only; do not touch or pluck leaves.');
  });

  // 9. same mission always produces the identical challenge string
  it('9. same mission always produces the exact identical challenge string (pure function)', () => {
    const run1 = compileMissionToChallenge(validMission);
    const run2 = compileMissionToChallenge(validMission);
    const run3 = compileMissionToChallenge({ ...validMission });
    expect(run1).toBe(run2);
    expect(run2).toBe(run3);
  });

  // 10. malformed Gemma JSON is recovered safely by aiAnalysisResultSchema
  it('10. missing mission safely defaults and maintains backward compatibility', () => {
    const legacyPayload = {
      identification: 'Coast Redwood',
      confidence: 'high',
      evidence: ['Fibrous reddish bark', 'Needle-like foliage'],
      description: 'Ancient conifer.',
      observation: 'Check the canopy height.',
      challenge: 'Walk 30 paces and find another redwood trunk.',
      safety: 'Stay on trail.',
    };

    const parsed = aiAnalysisResultSchema.parse(legacyPayload);
    expect(parsed.mission).toBeDefined();
    expect(parsed.mission?.missionType).toBe('OBSERVE');
    expect(parsed.challenge).toBe('Walk 30 paces and find another redwood trunk.');
  });

  // 11. existing AIAnalysisResult compatibility remains intact
  it('11. all core identification, confidence, evidence, description, and safety fields remain intact', () => {
    const fullPayload = {
      identification: 'Western Sword Fern',
      confidence: 'high',
      uncertaintyReason: undefined,
      evidence: ['Deep green pinnate fronds', 'Linear spore clusters'],
      description: 'Abundant native Pacific Northwest fern.',
      observation: 'Inspect the underside of older fronds.',
      mission: {
        missionType: 'COUNT' as const,
        title: 'Frond Count',
        target: 'Count distinct frond clumps in 5 meters',
        durationSeconds: 180,
        steps: [
          'Put your phone in your pocket',
          'Scan the forest floor in a 5-meter radius',
          'Count healthy frond clumps',
        ],
        successCriteria: 'Count at least three distinct frond clusters',
        safetyConstraints: ['Leave all native plants undisturbed'],
      },
      safety: 'Do not harvest wild ferns.',
    };

    const parsed = aiAnalysisResultSchema.parse(fullPayload);
    expect(parsed.identification).toBe('Western Sword Fern');
    expect(parsed.confidence).toBe('high');
    expect(parsed.evidence).toHaveLength(2);
    expect(parsed.mission?.durationSeconds).toBe(180);
    expect(parsed.challenge).toContain('Put your phone away for 3 minutes.');
  });
});

describe('Gemma Output Fixtures Conformance', () => {
  // Fixture 1: Oak Leaf
  it('Fixture 1: Oak leaf observation generates grounded COMPARE mission', () => {
    const oakFixture = {
      identification: 'White Oak (Quercus alba)',
      confidence: 'medium',
      uncertaintyReason: 'Acorns are not visible in the frame; identification based on leaf lobe structure.',
      evidence: ['Deeply rounded lobes', 'Sinuses between lobes reach over halfway to midrib'],
      description: 'Native deciduous tree leaf displaying characteristic rounded lobes.',
      observation: 'Look at the bark of the nearest mature oak.',
      mission: {
        missionType: 'COMPARE' as const,
        title: 'Oak Lobe Variation',
        target: 'Find a fallen oak leaf nearby and compare lobe depth and texture',
        durationSeconds: 120,
        steps: [
          'Put your phone away',
          'Find a second fallen oak leaf on the trail border',
          'Observe the depth of the lobes without tearing the leaf',
        ],
        successCriteria: 'Note whether the second leaf has deeper or shallower lobes',
        safetyConstraints: ['Do not pull live leaves from tree branches'],
      },
      safety: 'Watch for slippery wet leaves on the trail surface.',
    };

    const parsed = aiAnalysisResultSchema.parse(oakFixture);
    expect(parsed.identification).toBe('White Oak (Quercus alba)');
    expect(parsed.confidence).toBe('medium');
    expect(parsed.uncertaintyReason).toBeDefined();
    expect(parsed.mission?.missionType).toBe('COMPARE');
    expect(parsed.challenge).toContain('Put your phone away for 2 minutes.');
  });

  // Fixture 2: Pine Cone
  it('Fixture 2: Pine cone observation generates grounded COUNT mission', () => {
    const pineConeFixture = {
      identification: 'Ponderosa Pine Cone',
      confidence: 'high',
      evidence: ['Woody scales with small prickles', 'Ovoid cone geometry'],
      description: 'Mature seed-bearing female cone of a pine tree.',
      observation: 'Look for resin droplets on the scale tips.',
      mission: {
        missionType: 'COUNT' as const,
        title: 'Cone Scale Spiral Study',
        target: 'Count the spiral rows of woody scales on a fallen cone',
        durationSeconds: 120,
        steps: [
          'Put your phone in your pocket',
          'Observe the fallen cone from above',
          'Trace the clockwise spiral of scales with your eyes',
        ],
        successCriteria: 'Visually identify at least two spiral pathways of scales',
        safetyConstraints: ['Leave all cones on the forest floor for seed dispersal'],
      },
      safety: 'Prickly scale tips can be sharp; observe without grasping tightly.',
    };

    const parsed = aiAnalysisResultSchema.parse(pineConeFixture);
    expect(parsed.mission?.missionType).toBe('COUNT');
    expect(parsed.mission?.durationSeconds).toBe(120);
    expect(parsed.challenge).toContain('Put your phone away for 2 minutes.');
  });

  // Fixture 3: River Stone
  it('Fixture 3: River stone observation generates grounded PATTERN mission', () => {
    const stoneFixture = {
      identification: 'River Quartzite Pebble',
      confidence: 'medium',
      uncertaintyReason: 'Mineral composition cannot be verified without petrographic testing.',
      evidence: ['Water-smoothed rounded contour', 'Pale translucent banding'],
      description: 'Fluvially eroded pebble displaying sedimentary or metamorphic banding.',
      observation: 'Notice how sediment accumulates around stone edges.',
      mission: {
        missionType: 'PATTERN' as const,
        title: 'Fluvial Sorting Pattern',
        target: 'Observe how pebble sizes change closer to the water line or path edge',
        durationSeconds: 180,
        steps: [
          'Put your phone in your pocket',
          'Scan a 3-meter section of trail gravel or riverbed',
          'Notice where smaller versus larger stones settle',
        ],
        successCriteria: 'Identify a visible transition from coarse gravel to fine sand',
        safetyConstraints: ['Do not wade into fast-flowing water or steep riverbanks'],
      },
      safety: 'Stay on stable dry ground; wet river rocks are slippery.',
    };

    const parsed = aiAnalysisResultSchema.parse(stoneFixture);
    expect(parsed.mission?.missionType).toBe('PATTERN');
    expect(parsed.challenge).toContain('Put your phone away for 3 minutes.');
  });

  // Fixture 4: Flower
  it('Fixture 4: Flower observation generates grounded NOTICE mission', () => {
    const flowerFixture = {
      identification: 'Wild Blackberry Blossom (Rubus armeniacus)',
      confidence: 'high',
      evidence: ['Five white-pink petals', 'Prominent central stamens', 'Thorny cane visible'],
      description: 'Five-petaled blossom growing on a thorny bramble.',
      observation: 'Watch for pollinators visiting the blossoms.',
      mission: {
        missionType: 'NOTICE' as const,
        title: 'Floral Pollinator Watch',
        target: 'Spend 2 minutes watching for insect activity around nearby blossoms',
        durationSeconds: 120,
        steps: [
          'Put your phone away',
          'Step back 1 meter from the thorny bramble',
          'Quietly observe the flowers for any visiting insects',
        ],
        successCriteria: 'Notice whether any bees, hoverflies, or beetles visit the flowers',
        safetyConstraints: ['Do not touch thorny canes; do not disturb visiting bees'],
      },
      safety: 'Bramble thorns can snag clothing and scratch skin; maintain distance.',
    };

    const parsed = aiAnalysisResultSchema.parse(flowerFixture);
    expect(parsed.mission?.missionType).toBe('NOTICE');
    expect(parsed.challenge).toContain('Put your phone away for 2 minutes.');
  });

  // Fixture 5: Bark / Lichen
  it('Fixture 5: Bark and lichen observation generates grounded TRACE mission', () => {
    const lichenFixture = {
      identification: 'Foliose Lichen on Douglas-fir Bark',
      confidence: 'medium',
      uncertaintyReason: 'Lichen species require chemical spot tests for precise taxonomy.',
      evidence: ['Leaf-like lobed thallus', 'Deeply furrowed coniferous bark substrate'],
      description: 'Symbiotic organism growing as an epiphyte on mature bark ridges.',
      observation: 'Look at the north versus south facing side of the trunk.',
      mission: {
        missionType: 'TRACE' as const,
        title: 'Trunk Micro-Habitat Mapping',
        target: 'Trace the boundary where lichen growth transitions into bare bark',
        durationSeconds: 150,
        steps: [
          'Put your phone away',
          'Walk slowly around the tree trunk at a comfortable distance',
          'Notice which side of the trunk supports the thickest lichen coverage',
        ],
        successCriteria: 'Identify the side of the trunk with the greatest lichen density',
        safetyConstraints: ['Do not scrape or peel lichen from the tree bark'],
      },
      safety: 'Watch for exposed tree roots and uneven terrain.',
    };

    const parsed = aiAnalysisResultSchema.parse(lichenFixture);
    expect(parsed.mission?.missionType).toBe('TRACE');
    expect(parsed.challenge).toContain('Put your phone away for 3 minutes.');
  });
});
