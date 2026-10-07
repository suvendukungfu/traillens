import 'server-only';
import { TRAILLENS_SYSTEM_PROMPT, TRAILLENS_USER_PROMPT } from './prompts';
import {
  aiAnalysisResultSchema,
  aiAnalysisJsonSchema,
  type ValidatedAIAnalysisResult,
} from './validation';

export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONNECTION_REFUSED' | 'TIMEOUT' | 'MODEL_NOT_FOUND' | 'INVALID_RESPONSE' | 'UNKNOWN',
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  error?: string;
}

export interface InferenceTelemetry {
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalDurationMs?: number;
  generationDurationMs?: number;
  promptTokens?: number;
  outputTokens?: number;
}

/**
 * Parses and converts nanosecond timing telemetry from Ollama response into milliseconds.
 * Returns safe undefined for any missing or non-numeric metrics.
 */
export function parseOllamaTelemetry(data?: Partial<OllamaChatResponse> | null): InferenceTelemetry {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const nsToMs = (ns?: number): number | undefined => {
    if (typeof ns !== 'number' || isNaN(ns) || ns < 0) return undefined;
    return Math.round((ns / 1_000_000) * 100) / 100;
  };

  return {
    totalDurationMs: nsToMs(data.total_duration),
    loadDurationMs: nsToMs(data.load_duration),
    promptEvalDurationMs: nsToMs(data.prompt_eval_duration),
    generationDurationMs: nsToMs(data.eval_duration),
    promptTokens: typeof data.prompt_eval_count === 'number' && data.prompt_eval_count >= 0 ? data.prompt_eval_count : undefined,
    outputTokens: typeof data.eval_count === 'number' && data.eval_count >= 0 ? data.eval_count : undefined,
  };
}

export interface AnalyzeImageOptions {
  timeoutMs?: number;
  baseUrl?: string;
  model?: string;
}

/**
 * Builds the Ollama chat request payload with structured JSON Schema format constraint,
 * resident model keep_alive TTL, and bounded generation token headroom.
 */
export function buildOllamaChatPayload(base64Image: string, model: string) {
  return {
    model,
    messages: [
      {
        role: 'system',
        content: TRAILLENS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: TRAILLENS_USER_PROMPT,
        images: [base64Image],
      },
    ],
    stream: false,
    format: aiAnalysisJsonSchema,
    keep_alive: process.env.OLLAMA_KEEP_ALIVE || '10m',
    options: {
      temperature: 0.2, // Low temperature for factual, grounded field guide observations
      top_p: 0.9,
      num_predict: 512, // Bounded headroom for complete FieldMission contract (measured avg 310-330 tokens)
    },
  };
}

let lastWarmupTimestamp = 0;
let inflightWarmup: Promise<boolean> | null = null;
const WARMUP_COOLDOWN_MS = 60_000; // 60-second idempotency cooldown to prevent resource exhaustion

/**
 * Explicit non-blocking model warm-up function.
 * Pre-loads Gemma 3 4B into memory with keep_alive='10m' without image inference,
 * eliminating the 4.6s-20s cold load penalty for first capture.
 * Protected by an in-memory 60s cooldown and concurrent promise deduplication.
 */
export async function warmupOllamaModel(baseUrl?: string, model?: string): Promise<boolean> {
  const now = Date.now();
  if (now - lastWarmupTimestamp < WARMUP_COOLDOWN_MS) {
    return true; // Already warm within cooldown window; no-op
  }

  if (inflightWarmup) {
    return inflightWarmup;
  }

  const url = baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const targetModel = model || process.env.OLLAMA_MODEL || 'gemma3:4b';
  const keepAlive = process.env.OLLAMA_KEEP_ALIVE || '10m';

  inflightWarmup = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          prompt: '',
          keep_alive: keepAlive,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        lastWarmupTimestamp = Date.now();
      }
      return res.ok;
    } catch {
      return false;
    } finally {
      inflightWarmup = null;
    }
  })();

  return inflightWarmup;
}

/**
 * Server-side client wrapper for local Ollama multimodal inference.
 * Keeps boundaries clean, passes JSON Schema constraint to Ollama, validates output with Zod, and measures real inference latency.
 */
export async function analyzeOutdoorImage(
  base64Image: string,
  options: AnalyzeImageOptions = {}
): Promise<ValidatedAIAnalysisResult> {
  const baseUrl = options.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = options.model || process.env.OLLAMA_MODEL || 'gemma3:4b';
  const timeoutMs = options.timeoutMs ?? 180000; // 180s timeout for local multimodal inference on consumer hardware

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let rawResponseBody: string | null = null;
  let telemetry: InferenceTelemetry = {};

  try {
    const endpoint = `${baseUrl}/api/chat`;
    const requestPayload = buildOllamaChatPayload(base64Image, model);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 404 || errText.toLowerCase().includes('not found')) {
        throw new OllamaError(
          `Configured model "${model}" is not installed or available in Ollama. Run "ollama pull ${model}" to install.`,
          'MODEL_NOT_FOUND',
          404
        );
      }
      throw new OllamaError(
        `Ollama returned HTTP error ${response.status}: ${errText.slice(0, 200)}`,
        'INVALID_RESPONSE',
        response.status
      );
    }

    const data = (await response.json()) as OllamaChatResponse;
    if (data.error) {
      throw new OllamaError(`Ollama runtime error: ${data.error}`, 'INVALID_RESPONSE', 500);
    }

    rawResponseBody = data.message?.content || data.response || '';
    telemetry = parseOllamaTelemetry(data);
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof OllamaError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new OllamaError(
        `Inference request to Ollama timed out after ${timeoutMs / 1000}s. The local hardware may be constrained.`,
        'TIMEOUT',
        504
      );
    }

    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes('ECONNREFUSED') || errMessage.includes('fetch failed')) {
      throw new OllamaError(
        `Could not connect to Ollama at ${baseUrl}. Ensure the Ollama daemon is running locally.`,
        'CONNECTION_REFUSED',
        503
      );
    }

    throw new OllamaError(`Unexpected Ollama error: ${errMessage}`, 'UNKNOWN', 500);
  }

  const durationMs = Date.now() - startTime;

  // Extract JSON payload safely
  const cleanedJson = sanitizeJsonText(rawResponseBody);

  try {
    const parsed = JSON.parse(cleanedJson);
    const validated = aiAnalysisResultSchema.parse(parsed);

    return {
      ...validated,
      inferenceDurationMs: telemetry.totalDurationMs ?? durationMs,
      telemetry,
    };
  } catch {
    // If JSON parsing or schema validation fails, attempt fuzzy rescue
    const rescued = attemptJsonRescue(rawResponseBody);
    if (rescued) {
      return {
        ...rescued,
        inferenceDurationMs: telemetry.totalDurationMs ?? durationMs,
        telemetry,
      };
    }

    throw new OllamaError(
      'Gemma model returned invalid or unparseable structured JSON.',
      'INVALID_RESPONSE',
      502
    );
  }
}

/**
 * Strips markdown code blocks and excess whitespace
 */
function sanitizeJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Fallback parser to salvage observation text if LLM dropped trailing braces or punctuation
 */
function attemptJsonRescue(raw: string): ValidatedAIAnalysisResult | null {
  try {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = raw.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(slice);
      return aiAnalysisResultSchema.parse(parsed);
    }
  } catch {
    // Ignore rescue failure
  }
  return null;
}
