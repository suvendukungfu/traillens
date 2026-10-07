import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutdoorImage, OllamaError } from '@/lib/ollama';
import {
  analyzeRequestSchema,
  sanitizeBase64Image,
  validateChallengeSafety,
} from '@/lib/validation';
import { evaluateMissionQuality } from '@/lib/mission/quality';

export const dynamic = 'force-dynamic';

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
