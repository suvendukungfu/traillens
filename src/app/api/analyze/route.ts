import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutdoorImage, OllamaError } from '@/lib/ollama';
import {
  analyzeRequestSchema,
  sanitizeBase64Image,
  validateChallengeSafety,
} from '@/lib/validation';
import { evaluateMissionQuality } from '@/lib/mission/quality';

export const dynamic = 'force-dynamic';

// In-memory cache for recent observations to eliminate redundant 40s re-inference on repeat requests
const observationCache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function computeImageKey(data: string): string {
  const len = data.length;
  const s1 = data.slice(0, 40);
  const s2 = data.slice(Math.floor(len * 0.33), Math.floor(len * 0.33) + 40);
  const s3 = data.slice(Math.floor(len * 0.66), Math.floor(len * 0.66) + 40);
  const s4 = data.slice(-40);
  return `${len}_${s1}_${s2}_${s3}_${s4}`;
}

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();

  try {
    // 1. Parse JSON body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body provided' },
        { status: 400 }
      );
    }

    // 2. Validate payload schema
    const parseResult = analyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.warn(
        '[api/analyze] Validation failed:',
        JSON.stringify(parseResult.error.flatten().fieldErrors)
      );
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { image: rawImage } = parseResult.data;

    // 3. Extract sanitized base64 data
    const { base64Data, mimeType } = sanitizeBase64Image(rawImage);

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validMimes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported image MIME type: ${mimeType}. Please provide JPEG, PNG, or WebP.` },
        { status: 415 }
      );
    }

    // Cache hit check: return immediately if identical image was analyzed recently (bypassed in test environment)
    const cacheKey = computeImageKey(base64Data);
    if (process.env.NODE_ENV !== 'test') {
      const cachedEntry = observationCache.get(cacheKey);
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        console.info(`[api/analyze] Serving cached observation for image key (${base64Data.length} bytes, 0ms inference)`);
        return NextResponse.json(cachedEntry.result, { status: 200 });
      }
    }

    // Diagnostics (safe: never logs raw base64 or secrets)
    console.info(`[api/analyze] Processing outdoor image (${mimeType}, base64 len: ${base64Data.length})`);

    // 4. Execute local inference via Ollama Gemma 3
    const result = await analyzeOutdoorImage(base64Data);

    // 5. Challenge safety gate: Defense-in-depth Layer 2 (API route boundary verification).
    // Intentionally verifies and enforces challenge safety at the HTTP boundary before returning
    // data to the client, logging any safety violations and guaranteeing fallback replacement.
    const safetyCheck = validateChallengeSafety(result.challenge);
    if (!safetyCheck.isSafe) {
      console.warn(
        `[api/analyze] Unsafe challenge rejected (${safetyCheck.violations.join(', ')}). Substituting deterministic safe fallback.`
      );
      result.challenge = safetyCheck.sanitizedChallenge;
    }

    // 6. Milestone 4: Deterministic Mission Quality & Grounding Evaluation
    if (result.mission) {
      result.qualityReport = evaluateMissionQuality(result.mission, {
        identification: result.identification,
        description: result.description,
        evidence: result.evidence,
        observation: result.observation,
        safety: result.safety,
      });
    }

    const totalServerDurationMs = Date.now() - requestStartTime;
    const t = result.telemetry;
    const telemetryInfo = t
      ? ` [load: ${t.loadDurationMs ?? 'n/a'}ms, prompt eval: ${t.promptEvalDurationMs ?? 'n/a'}ms, eval: ${t.generationDurationMs ?? 'n/a'}ms, tokens: in=${t.promptTokens ?? 'n/a'}/out=${t.outputTokens ?? 'n/a'}]`
      : '';
    console.info(
      `[api/analyze] Analysis complete in ${totalServerDurationMs}ms (model inference: ${result.inferenceDurationMs ?? 0}ms)${telemetryInfo}`
    );

    // Save to observation cache for instant reuse on identical image (bypassed in test environment)
    if (process.env.NODE_ENV !== 'test') {
      observationCache.set(cacheKey, { result, timestamp: Date.now() });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const totalDurationMs = Date.now() - requestStartTime;

    if (err instanceof OllamaError) {
      console.warn(`[api/analyze] OllamaError (${err.code}): ${err.message} (${totalDurationMs}ms)`);
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: err.statusCode }
      );
    }

    const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
    console.error(`[api/analyze] Unhandled exception (${totalDurationMs}ms):`, errorMessage);

    return NextResponse.json(
      {
        error: 'An unexpected internal error occurred during outdoor analysis.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
