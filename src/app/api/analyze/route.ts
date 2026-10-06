import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutdoorImage, OllamaError } from '@/lib/ollama';
import { analyzeRequestSchema, sanitizeBase64Image } from '@/lib/validation';

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

    const totalServerDurationMs = Date.now() - requestStartTime;
    console.info(
      `[api/analyze] Analysis complete in ${totalServerDurationMs}ms (model inference: ${result.inferenceDurationMs ?? 0}ms)`
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
