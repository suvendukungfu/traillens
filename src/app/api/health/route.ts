import { NextResponse } from 'next/server';
import type { HealthCheckResponse } from '@/types/trail';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const configuredModel = process.env.OLLAMA_MODEL || 'gemma3:4b';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const responseBody: HealthCheckResponse = {
        status: 'error',
        ollamaConnected: false,
        modelAvailable: false,
        configuredModel,
        ollamaBaseUrl,
        availableModels: [],
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(responseBody, { status: 503 });
    }

    const data = await res.json() as { models?: Array<{ name: string; model: string }> };
    const availableModels = (data.models || []).map((m) => m.name);
    
    // Check if configured model or its base tag matches
    const modelAvailable = availableModels.some(
      (name) => name === configuredModel || name.startsWith(`${configuredModel}:`) || `${name}:latest` === configuredModel
    );

    const responseBody: HealthCheckResponse = {
      status: modelAvailable ? 'ok' : 'degraded',
      ollamaConnected: true,
      modelAvailable,
      configuredModel,
      ollamaBaseUrl,
      availableModels,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    const responseBody: HealthCheckResponse = {
      status: 'error',
      ollamaConnected: false,
      modelAvailable: false,
      configuredModel,
      ollamaBaseUrl,
      availableModels: [],
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(responseBody, { status: 503 });
  }
}
