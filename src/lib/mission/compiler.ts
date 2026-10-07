import type { FieldMission } from '@/types/trail';

export const SAFE_MISSION_FALLBACK: FieldMission = {
  missionType: 'OBSERVE',
  title: 'Natural Texture & Color Study',
  target: 'Observe three distinct natural textures or color gradients in your immediate surroundings',
  durationSeconds: 120,
  steps: [
    'Put your phone in your pocket',
    'Look closely at your natural surroundings without touching anything',
    'Locate three different patterns or textures in bark, leaves, or stones',
  ],
  successCriteria: 'Visually identify three distinct natural textures or color gradients',
  safetyConstraints: [
    'Observe only; do not touch, pick, or taste unfamiliar specimens',
    'Stay on established trails and observe from a safe distance',
  ],
};

/**
 * Deterministically compiles a structured FieldMission into user-facing challenge text.
 * Pure, deterministic function: identical mission inputs always produce the identical challenge string.
 */
export function compileMissionToChallenge(mission: FieldMission): string {
  const minutes = Math.max(2, Math.min(5, Math.round(mission.durationSeconds / 60)));
  const targetClean = mission.target.trim().replace(/\.$/, '');
  const stepsClean = mission.steps.map((s) => s.trim().replace(/\.$/, '')).join('; ');
  const successClean = mission.successCriteria.trim().replace(/\.$/, '');
  const safetyClean = mission.safetyConstraints
    .map((s) => s.trim().replace(/\.$/, ''))
    .join('; ');

  const safetySuffix = safetyClean ? ` Safety: ${safetyClean}.` : '';

  return `Put your phone away for ${minutes} minutes. ${targetClean}. Steps: ${stepsClean}. Success: ${successClean}.${safetySuffix}`;
}
