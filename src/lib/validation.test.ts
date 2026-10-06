import { describe, it, expect } from 'vitest';
import {
  analyzeRequestSchema,
  aiAnalysisResultSchema,
  sanitizeBase64Image,
} from './validation';

describe('analyzeRequestSchema', () => {
  it('accepts valid base64 payload', () => {
    const validPayload = {
      image: 'data:image/jpeg;base64,' + 'a'.repeat(200),
      mimeType: 'image/jpeg',
    };
    const result = analyzeRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects payloads with empty or tiny image data', () => {
    const invalidPayload = {
      image: 'too-short',
    };
    const result = analyzeRequestSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});

describe('aiAnalysisResultSchema', () => {
  it('parses valid structured field guide response', () => {
    const sampleAIOutput = {
      identification: 'Quercus robur (English Oak)',
      confidence: 'high',
      evidence: ['Lobed leaves with short petioles', 'Clustered terminal buds'],
      description: 'A mature deciduous oak specimen showing classic leaf serrations.',
      observation: 'Look at the bark furrow patterns near the lower trunk.',
      challenge: 'Put your phone away and search within 15 paces for an acorn or gall.',
      safety: 'Watch for uneven roots underfoot. Do not ingest fallen acorns raw.',
    };

    const parsed = aiAnalysisResultSchema.parse(sampleAIOutput);
    expect(parsed.identification).toBe('Quercus robur (English Oak)');
    expect(parsed.confidence).toBe('high');
    expect(parsed.evidence).toHaveLength(2);
    expect(parsed.challenge).toContain('Put your phone away');
  });

  it('safely recovers defaults when confidence or evidence are missing', () => {
    const incompleteOutput = {
      identification: 'Uncertain Fern',
      description: 'Green fronds in shaded forest floor.',
      observation: 'Check the undersides of the fronds.',
      challenge: 'Find another fern of a different species.',
      safety: 'Stay on the trail to avoid disturbing undergrowth.',
    };

    const parsed = aiAnalysisResultSchema.parse(incompleteOutput);
    // Missing confidence falls back to 'low'
    expect(parsed.confidence).toBe('low');
    // Missing evidence falls back to safe array
    expect(parsed.evidence.length).toBeGreaterThan(0);
  });
});

describe('sanitizeBase64Image', () => {
  it('extracts mimeType and base64Data from data URL', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
    const result = sanitizeBase64Image(dataUrl);
    expect(result.mimeType).toBe('image/png');
    expect(result.base64Data).toBe('iVBORw0KGgoAAAANSUhEUgAA');
  });

  it('handles raw base64 string without data prefix', () => {
    const raw = 'dGVzdGluZw==';
    const result = sanitizeBase64Image(raw);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.base64Data).toBe('dGVzdGluZw==');
  });
});
