import { z } from 'zod';
import {
  validateChallengeSafety,
  SAFE_CHALLENGE_FALLBACK,
  type SafetyValidationResult,
  stripNegatedSafetyClauses,
} from './safety/challenge';
import {
  compileMissionToChallenge,
  SAFE_MISSION_FALLBACK,
} from './mission/compiler';
import type { InferenceTelemetry } from '@/types/trail';

export {
  validateChallengeSafety,
  SAFE_CHALLENGE_FALLBACK,
  type SafetyValidationResult,
  stripNegatedSafetyClauses,
  compileMissionToChallenge,
  SAFE_MISSION_FALLBACK,
};

/**
 * Zod schema for incoming image analysis requests
 */
export const analyzeRequestSchema = z.object({
  image: z
    .string()
    .min(100, 'Image payload too small or missing')
    // Guard against massive payloads (>15MB base64)
    .max(20 * 1024 * 1024, 'Image payload exceeds 20MB limit'),
  mimeType: z
    .enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
    .optional()
    .default('image/jpeg'),
});

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;

/**
 * Supported field mission types
 */
export const missionTypeEnum = z.enum([
  'OBSERVE',
  'COMPARE',
  'COUNT',
  'NOTICE',
  'TRACE',
  'PATTERN',
]);
export type MissionType = z.infer<typeof missionTypeEnum>;

/**
 * Strict Zod schema for the Field Mission Contract
 */
export const fieldMissionSchema = z.object({
  missionType: missionTypeEnum,
  title: z.string().min(1, 'Title cannot be empty'),
  target: z.string().min(1, 'Target cannot be empty'),
  durationSeconds: z
    .number()
    .int('Duration must be a whole number of seconds')
    .min(120, 'Mission duration must be at least 120 seconds (2 minutes)')
    .max(300, 'Mission duration must not exceed 300 seconds (5 minutes)'),
  steps: z
    .array(z.string().min(1, 'Step instruction cannot be empty'))
    .min(1, 'At least one step is required')
    .max(4, 'No more than 4 steps permitted'),
  successCriteria: z.string().min(1, 'Success criteria required'),
  safetyConstraints: z
    .array(z.string().min(1, 'Safety constraint cannot be empty')),
});

export type FieldMission = z.infer<typeof fieldMissionSchema>;

/**
 * Pure structural Zod schema representing the raw model output.
 * Contains no transforms or catch blocks so it can be cleanly compiled
 * into a standard JSON Schema via z.toJSONSchema for Ollama.
 */
export const rawAIAnalysisOutputSchema = z.object({
  identification: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  uncertaintyReason: z.string().optional(),
  evidence: z.array(z.string()),
  description: z.string(),
  observation: z.string(),
  mission: fieldMissionSchema,
  safety: z.string(),
});

/**
 * Pre-compiled JSON Schema object passed to Ollama's `format` field.
 * Enforces structured schema generation on local Ollama (v0.35.1+).
 */
export const aiAnalysisJsonSchema = z.toJSONSchema(rawAIAnalysisOutputSchema);

/**
 * Zod schema for validating structured JSON returned by Gemma 3.
 * Preserves backward compatibility by maintaining `challenge` while
 * making `mission` the authoritative structured contract.
 */
export const aiAnalysisResultSchema = z
  .object({
    identification: z
      .string()
      .min(1, 'Identification cannot be empty')
      .default('Unidentified Outdoor Subject'),
    confidence: z
      .union([
        z.enum(['low', 'medium', 'high']),
        z.number().transform((val) => {
          if (val >= 0.75) return 'high' as const;
          if (val >= 0.45) return 'medium' as const;
          return 'low' as const;
        }),
        z.string().transform((val) => {
          const lower = val.toLowerCase();
          if (lower.includes('high') || lower.includes('certain')) return 'high' as const;
          if (lower.includes('med')) return 'medium' as const;
          return 'low' as const;
        }),
      ])
      .catch('low'),
    uncertaintyReason: z.string().optional(),
    evidence: z
      .union([
        z.array(z.string()),
        z.string().transform((s) => [s]),
      ])
      .catch(['Distinct morphological traits visible in outdoor specimen']),
    description: z
      .string()
      .min(1, 'Description required')
      .default('Outdoor observation captured for field study.'),
    observation: z
      .string()
      .min(1, 'Outdoor observation required')
      .default('Look closely at the surrounding natural context and notice how light and shade interact with it.'),
    mission: fieldMissionSchema.optional(),
    challenge: z.string().optional(),
    safety: z
      .string()
      .min(1, 'Safety advice required')
      .default('Observe only. Do not touch or consume unfamiliar plants, fungi, or wildlife.'),
    inferenceDurationMs: z.number().optional(),
    telemetry: z
      .object({
        totalDurationMs: z.number().optional(),
        loadDurationMs: z.number().optional(),
        promptEvalDurationMs: z.number().optional(),
        generationDurationMs: z.number().optional(),
        promptTokens: z.number().optional(),
        outputTokens: z.number().optional(),
      })
      .optional(),
  })
  .transform((data) => {
    let finalMission = data.mission;
    let finalChallenge = data.challenge;

    if (finalMission) {
      // 1. Mission is provided: compile to challenge
      const compiled = compileMissionToChallenge(finalMission);
      const safetyCheck = validateChallengeSafety(compiled);

      if (safetyCheck.isSafe) {
        finalChallenge = compiled;
      } else {
        finalMission = SAFE_MISSION_FALLBACK;
        finalChallenge = SAFE_CHALLENGE_FALLBACK;
      }
    } else if (finalChallenge) {
      // 2. Legacy format: challenge string provided without mission
      const safetyCheck = validateChallengeSafety(finalChallenge);
      finalChallenge = safetyCheck.isSafe ? finalChallenge : safetyCheck.sanitizedChallenge;

      finalMission = {
        missionType: 'OBSERVE',
        title: 'Outdoor Field Observation',
        target: 'Observe your natural surroundings closely',
        durationSeconds: 120,
        steps: ['Put your phone in your pocket', 'Look closely at your natural surroundings'],
        successCriteria: 'Visually inspect the habitat without disturbing specimens',
        safetyConstraints: ['Observe only; do not touch, pick, or taste unfamiliar specimens'],
      };
    } else {
      // 3. Neither provided: safe fallbacks
      finalMission = SAFE_MISSION_FALLBACK;
      finalChallenge = SAFE_CHALLENGE_FALLBACK;
    }

    const result: {
      identification: string;
      confidence: 'low' | 'medium' | 'high';
      uncertaintyReason?: string;
      evidence: string[];
      description: string;
      observation: string;
      mission: FieldMission;
      challenge: string;
      safety: string;
      inferenceDurationMs?: number;
      telemetry?: InferenceTelemetry;
    } = {
      identification: data.identification,
      confidence: data.confidence,
      evidence: data.evidence,
      description: data.description,
      observation: data.observation,
      mission: finalMission,
      challenge: finalChallenge,
      safety: data.safety,
    };

    if (data.uncertaintyReason !== undefined) {
      result.uncertaintyReason = data.uncertaintyReason;
    }
    if (data.inferenceDurationMs !== undefined) {
      result.inferenceDurationMs = data.inferenceDurationMs;
    }
    if (data.telemetry !== undefined) {
      result.telemetry = data.telemetry;
    }

    return result;
  });

export type ValidatedAIAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;

/**
 * Helper to safely extract base64 data and mimeType from data URL if present
 */
export function sanitizeBase64Image(rawInput: string): { base64Data: string; mimeType: string } {
  const match = rawInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      base64Data: match[2],
    };
  }

  return {
    mimeType: 'image/jpeg',
    base64Data: rawInput,
  };
}
