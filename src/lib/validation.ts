import { z } from 'zod';

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
 * Zod schema for validating the structured JSON returned by Gemma 3
 */
export const aiAnalysisResultSchema = z.object({
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
  challenge: z
    .string()
    .min(1, 'Outdoor challenge required')
    .default('Find another natural object nearby with a distinctly different texture or color.'),
  safety: z
    .string()
    .min(1, 'Safety advice required')
    .default('Observe only. Do not touch or consume unfamiliar plants, fungi, or wildlife.'),
  inferenceDurationMs: z.number().optional(),
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
  // If raw base64 string without data: header
  return {
    mimeType: 'image/jpeg',
    base64Data: rawInput.trim(),
  };
}
