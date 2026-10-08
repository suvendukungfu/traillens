import { describe, it, expect } from 'vitest';
import { buildOllamaChatPayload, parseOllamaTelemetry } from './ollama';
import { aiAnalysisJsonSchema } from './validation';

describe('buildOllamaChatPayload', () => {
  it('constructs Ollama request payload with JSON Schema format constraint object', () => {
    const payload = buildOllamaChatPayload('sample-base64-data', 'gemma3:4b');
    expect(payload.model).toBe('gemma3:4b');
    expect(payload.stream).toBe(false);
    expect(payload.format).toBe(aiAnalysisJsonSchema);
    expect(typeof payload.format).toBe('object');

    interface JsonSchemaNode {
      type?: string;
      properties?: Record<string, JsonSchemaNode>;
      minimum?: number;
      maximum?: number;
    }

    const formatObj = payload.format as JsonSchemaNode;
    expect(formatObj.type).toBe('object');
    expect(formatObj.properties).toBeDefined();

    const props = formatObj.properties!;
    expect(props.identification).toBeDefined();
    expect(props.mission).toBeDefined();
    expect(props.mission.properties?.durationSeconds?.minimum).toBe(120);
    expect(props.mission.properties?.durationSeconds?.maximum).toBe(300);

    expect(payload.messages).toHaveLength(2);
    expect(payload.messages[0].role).toBe('system');
    expect(payload.messages[1].role).toBe('user');
    expect(payload.messages[1].images).toEqual(['sample-base64-data']);
    expect(payload.options.temperature).toBe(0.2);
  });
});

describe('parseOllamaTelemetry', () => {
  it('correctly converts nanoseconds to milliseconds with two decimal precision', () => {
    const sampleResponse = {
      model: 'gemma3:4b',
      created_at: '2026-10-07T07:06:23.082757Z',
      done: true,
      total_duration: 12716379000,
      load_duration: 8698434375,
      prompt_eval_count: 11,
      prompt_eval_duration: 427375000,
      eval_count: 34,
      eval_duration: 3543021000,
    };

    const telemetry = parseOllamaTelemetry(sampleResponse);
    expect(telemetry.totalDurationMs).toBe(12716.38);
    expect(telemetry.loadDurationMs).toBe(8698.43);
    expect(telemetry.promptEvalDurationMs).toBe(427.38);
    expect(telemetry.generationDurationMs).toBe(3543.02);
    expect(telemetry.promptTokens).toBe(11);
    expect(telemetry.outputTokens).toBe(34);
  });

  it('safely handles missing or empty telemetry without crashing', () => {
    expect(parseOllamaTelemetry(null)).toEqual({});
    expect(parseOllamaTelemetry(undefined)).toEqual({});
    expect(parseOllamaTelemetry({})).toEqual({
      totalDurationMs: undefined,
      loadDurationMs: undefined,
      promptEvalDurationMs: undefined,
      generationDurationMs: undefined,
      promptTokens: undefined,
      outputTokens: undefined,
    });
  });

  it('rejects invalid or negative nanosecond inputs safely', () => {
    const telemetry = parseOllamaTelemetry({
      total_duration: -500,
      load_duration: NaN,
      prompt_eval_count: -1,
    });
    expect(telemetry.totalDurationMs).toBeUndefined();
    expect(telemetry.loadDurationMs).toBeUndefined();
    expect(telemetry.promptTokens).toBeUndefined();
  });
});

describe('warmupOllamaModel', () => {
  it('handles network failure gracefully without throwing', async () => {
    // Calling warmup on a port that does not exist should safely return false
    const { warmupOllamaModel } = await import('./ollama');
    const result = await warmupOllamaModel('http://127.0.0.1:59999', 'gemma3:4b');
    expect(typeof result).toBe('boolean');
  });
});
