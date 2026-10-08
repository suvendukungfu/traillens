import { describe, it, expect } from 'vitest';
import { evaluateMissionQuality } from './quality';
import { MISSION_QUALITY_FIXTURES } from './fixtures';
import type { FieldMission } from '@/types/trail';

describe('TrailLens Milestone 4 — Mission Quality & Grounding Rubric', () => {
  // 1. Full Benchmark Fixture Suite (A through J)
  describe('Benchmark Fixture Suite (A to J)', () => {
    MISSION_QUALITY_FIXTURES.forEach((fixture) => {
      it(`evaluates ${fixture.name} as expected (${fixture.category})`, () => {
        const report = evaluateMissionQuality(fixture.mission, fixture.context);

        // Verify pass / fail outcome
        expect(report.passed).toBe(fixture.expected.passed);

        // Verify minimum or maximum score bounds if specified
        if (fixture.expected.minScore !== undefined) {
          expect(report.totalScore).toBeGreaterThanOrEqual(fixture.expected.minScore);
        }
        if (fixture.expected.maxScore !== undefined) {
          expect(report.totalScore).toBeLessThanOrEqual(fixture.expected.maxScore);
        }

        // Verify expected failed dimensions
        if (fixture.expected.expectedFails) {
          const dimToFlag: Record<string, keyof Pick<typeof report, 'grounded' | 'specific' | 'safe' | 'executable' | 'outdoorWorthwhile'>> = {
            grounding: 'grounded',
            specificity: 'specific',
            safety: 'safe',
            executability: 'executable',
            outdoorWorthwhile: 'outdoorWorthwhile',
          };
          fixture.expected.expectedFails.forEach((dim) => {
            const flagKey = dimToFlag[dim];
            if (flagKey) {
              expect(report[flagKey]).toBe(false);
            }
            expect(report.dimensionScores[dim as keyof typeof report.dimensionScores]).toBeLessThan(14);
          });
        }

        // Verify specific primary issue code if expected
        if (fixture.expected.primaryIssueCode) {
          const issueCodes = report.issues.map((i) => i.code);
          expect(issueCodes).toContain(fixture.expected.primaryIssueCode);
        }

        // Check score boundaries
        expect(report.totalScore).toBeGreaterThanOrEqual(0);
        expect(report.totalScore).toBeLessThanOrEqual(100);
      });
    });
  });

  // 2. Focused Dimension Unit Tests
  describe('Dimension 1: Grounding', () => {
    const baseMission: FieldMission = {
      missionType: 'OBSERVE',
      title: 'Pine Needle Study',
      target: 'Examine needle fascicle bundles on pine branch',
      durationSeconds: 180,
      steps: [
        'Put phone away and step 3 paces to the branch',
        'Count needles per cluster bundle',
      ],
      successCriteria: 'Visually verify whether needles grow in bundles of 2, 3, or 5',
      safetyConstraints: ['Observe only; leave attached to branch'],
    };

    it('rewards mission connected to identification tokens', () => {
      const report = evaluateMissionQuality(baseMission, {
        identification: 'Ponderosa Pine (Pinus ponderosa)',
      });
      expect(report.grounded).toBe(true);
      expect(report.dimensionScores.grounding).toBe(20);
    });

    it('penalizes irrelevant non-outdoor domain / sensor terms', () => {
      const irrelevantMission: FieldMission = {
        ...baseMission,
        target: 'Measure barometric air pressure conditions near the branch',
      };
      const report = evaluateMissionQuality(irrelevantMission, {
        identification: 'Ponderosa Pine',
      });
      expect(report.dimensionScores.grounding).toBeLessThan(14);
      expect(report.issues.some((i) => i.code === 'GROUNDING_IRRELEVANT_DOMAIN')).toBe(true);
    });

    it('penalizes complete disconnect from identification tokens and natural morphology', () => {
      const disconnectedMission: FieldMission = {
        ...baseMission,
        title: 'Random Investigation',
        target: 'Inspect the unrelated item nearby',
        steps: ['Look at it carefully'],
      };
      const report = evaluateMissionQuality(disconnectedMission, {
        identification: 'Western Hemlock',
      });
      expect(report.dimensionScores.grounding).toBeLessThan(14);
      expect(report.issues.some((i) => i.code === 'GROUNDING_TARGET_DISCONNECTED')).toBe(true);
    });
  });

  describe('Dimension 2: Specificity', () => {
    it('penalizes vague filler phrases like "explore the area" and "look around"', () => {
      const vagueMission: FieldMission = {
        missionType: 'OBSERVE',
        title: 'Area Survey',
        target: 'Explore the area and look around',
        durationSeconds: 180,
        steps: ['Observe nature', 'Study the object'],
        successCriteria: 'Confirm you looked around',
        safetyConstraints: ['Stay on trail'],
      };
      const report = evaluateMissionQuality(vagueMission, {
        identification: 'Douglas-fir',
      });
      expect(report.specific).toBe(false);
      expect(report.issues.some((i) => i.code === 'SPECIFICITY_VAGUE_PHRASE')).toBe(true);
    });

    it('rewards concrete observable properties (veins, margins, lobes, bark)', () => {
      const detailedMission: FieldMission = {
        missionType: 'COMPARE',
        title: 'Leaf Margin Contrast',
        target: 'Compare serrated leaf margins and radiating vein patterns between two leaves',
        durationSeconds: 180,
        steps: [
          'Put phone away and find two adjacent leaves',
          'Inspect the leaf margins and count tooth notches',
        ],
        successCriteria: 'Identify tooth frequency per centimeter along margin',
        safetyConstraints: ['Observe only'],
      };
      const report = evaluateMissionQuality(detailedMission, {
        identification: 'Red Alder Leaf',
      });
      expect(report.dimensionScores.specificity).toBe(20);
    });
  });

  describe('Dimension 3: Safety Integration', () => {
    it('integrates production safety gate and zeroes safety score on toxic foraging hazard', () => {
      const toxicMission: FieldMission = {
        missionType: 'OBSERVE',
        title: 'Berry Tasting',
        target: 'Taste the red berries and chew a sample',
        durationSeconds: 180,
        steps: ['Pick 3 berries from the shrub', 'Taste and chew them'],
        successCriteria: 'Note flavor',
        safetyConstraints: [],
      };
      const report = evaluateMissionQuality(toxicMission, {
        identification: 'Red Baneberry (Actaea rubra)',
      });
      expect(report.safe).toBe(false);
      expect(report.dimensionScores.safety).toBe(0);
      expect(report.issues.some((i) => i.code === 'SAFETY_HAZARD_DETECTED')).toBe(true);
    });

    it('penalizes missions missing explicit Leave No Trace safety constraints', () => {
      const unconstrainedMission: FieldMission = {
        missionType: 'OBSERVE',
        title: 'Fissure Inspection',
        target: 'Inspect tree bark fissures',
        durationSeconds: 180,
        steps: ['Walk to trunk and observe fissures'],
        successCriteria: 'Visually identify fissure depth',
        safetyConstraints: [], // Empty
      };
      const report = evaluateMissionQuality(unconstrainedMission, {
        identification: 'Douglas-fir',
      });
      expect(report.dimensionScores.safety).toBe(14); // 20 - 6
      expect(report.issues.some((i) => i.code === 'SAFETY_MISSING_EXPLICIT_CONSTRAINTS')).toBe(true);
    });
  });

  describe('Dimension 4: Executability', () => {
    const validMission: FieldMission = {
      missionType: 'OBSERVE',
      title: 'Pine Needle Study',
      target: 'Examine needle fascicle bundles on pine branch',
      durationSeconds: 180,
      steps: ['Walk 3 paces', 'Count needles per bundle'],
      successCriteria: 'Visually identify 3 needles per bundle',
      safetyConstraints: ['Stay on trail'],
    };

    it('penalizes durations outside the 120s–300s window', () => {
      const shortReport = evaluateMissionQuality({ ...validMission, durationSeconds: 60 });
      expect(shortReport.dimensionScores.executability).toBeLessThan(20);
      expect(shortReport.issues.some((i) => i.code === 'EXECUTABILITY_DURATION_OUT_OF_BOUNDS')).toBe(true);

      const longReport = evaluateMissionQuality({ ...validMission, durationSeconds: 600 });
      expect(longReport.issues.some((i) => i.code === 'EXECUTABILITY_DURATION_OUT_OF_BOUNDS')).toBe(true);
    });

    it('penalizes step counts outside 1 to 4 steps', () => {
      const noStepsReport = evaluateMissionQuality({ ...validMission, steps: [] });
      expect(noStepsReport.issues.some((i) => i.code === 'EXECUTABILITY_INVALID_STEP_COUNT')).toBe(true);

      const tooManyStepsReport = evaluateMissionQuality({
        ...validMission,
        steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
      });
      expect(tooManyStepsReport.issues.some((i) => i.code === 'EXECUTABILITY_INVALID_STEP_COUNT')).toBe(true);
    });

    it('penalizes specialized lab equipment requirements', () => {
      const labMission: FieldMission = {
        ...validMission,
        steps: ['Use a microscope and calipers to measure needle cells'],
      };
      const report = evaluateMissionQuality(labMission);
      expect(report.dimensionScores.executability).toBeLessThan(15);
      expect(report.issues.some((i) => i.code === 'EXECUTABILITY_REQUIRES_SPECIALIZED_EQUIPMENT')).toBe(true);
    });
  });

  describe('Dimension 5: Outdoor-Worthwhile', () => {
    it('severely penalizes screen-only / cognitive-only tasks that keep user staring at phone', () => {
      const screenMission: FieldMission = {
        missionType: 'NOTICE',
        title: 'Memorize Facts',
        target: 'Read the description and remember two facts from your screen',
        durationSeconds: 180,
        steps: [
          'Stare at the phone screen',
          'Read the description and memorize two facts',
        ],
        successCriteria: 'Recall facts',
        safetyConstraints: ['Stay on trail'],
      };
      const report = evaluateMissionQuality(screenMission);
      expect(report.outdoorWorthwhile).toBe(false);
      expect(report.dimensionScores.outdoorWorthwhile).toBeLessThan(10);
      expect(report.issues.some((i) => i.code === 'OUTDOOR_SCREEN_ONLY_TASK')).toBe(true);
    });

    it('rewards physical movement away from phone (walk, paces, underside, canopy)', () => {
      const physicalMission: FieldMission = {
        missionType: 'COMPARE',
        title: 'Canopy vs Ground Morphology',
        target: 'Walk 15 paces to locate a fallen leaf and look up at canopy branches',
        durationSeconds: 180,
        steps: [
          'Put your phone in your pocket and take 15 paces',
          'Crouch to ground level to inspect the leaf underside',
          'Look up at the canopy to compare branch angle',
        ],
        successCriteria: 'Visually confirm underside vein prominence',
        safetyConstraints: ['Observe only; stay on trail'],
      };
      const report = evaluateMissionQuality(physicalMission, { identification: 'Oak Tree' });
      expect(report.dimensionScores.outdoorWorthwhile).toBe(20);
      expect(report.outdoorWorthwhile).toBe(true);
    });
  });
});
