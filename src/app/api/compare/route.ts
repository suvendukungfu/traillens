import { NextRequest, NextResponse } from 'next/server';
import { compareOutdoorImages } from '@/lib/ollama';
import { sanitizeBase64Image } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const compareRequestSchema = z.object({
  imageA: z.string().min(100, 'Image A required'),
  imageB: z.string().min(100, 'Image B required'),
  subjectA: z.string().min(1, 'Subject A name required'),
  subjectB: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body provided' }, { status: 400 });
    }

    const parseResult = compareRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { imageA: rawA, imageB: rawB, subjectA, subjectB } = parseResult.data;

    const { base64Data: b64A } = sanitizeBase64Image(rawA);
    const { base64Data: b64B } = sanitizeBase64Image(rawB);

    const comparison = await compareOutdoorImages(b64A, b64B, subjectA, subjectB);

    return NextResponse.json({ comparison });
  } catch (error: unknown) {
    console.error('[api/compare] Comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to execute comparative analysis' },
      { status: 500 }
    );
  }
}
