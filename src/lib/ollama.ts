import 'server-only';
import { TRAILLENS_SYSTEM_PROMPT, TRAILLENS_USER_PROMPT } from './prompts';
import { aiAnalysisResultSchema, type ValidatedAIAnalysisResult } from './validation';

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

interface OllamaChatResponse {
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
  eval_count?: number;
  eval_duration?: number;
  error?: string;
}

export interface AnalyzeImageOptions {
  timeoutMs?: number;
  baseUrl?: string;
  model?: string;
}

/**
 * Server-side client wrapper for local Ollama multimodal inference.
 * Keeps boundaries clean, enforces JSON schema, and measures real inference latency.
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

  try {
    const endpoint = `${baseUrl}/api/chat`;

    const requestPayload = {
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
      options: {
        temperature: 0.2, // Low temperature for factual, grounded field guide observations
        top_p: 0.9,
      },
    };

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
      inferenceDurationMs: durationMs,
    };
  } catch {
    // If JSON parsing or schema validation fails, attempt fuzzy rescue
    const rescued = attemptJsonRescue(rawResponseBody);
    if (rescued) {
      return {
        ...rescued,
        inferenceDurationMs: durationMs,
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
