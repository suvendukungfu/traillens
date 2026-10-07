import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { analyzeOutdoorImage } from '@/lib/ollama';
import { SAFE_CHALLENGE_FALLBACK } from '@/lib/validation';

vi.mock('@/lib/ollama', () => ({
  analyzeOutdoorImage: vi.fn(),
  OllamaError: class OllamaError extends Error {
    constructor(
      message: string,
      public readonly code: string,
      public readonly statusCode: number = 500
    ) {
      super(message);
      this.name = 'OllamaError';
    }
  },
}));

describe('POST /api/analyze challenge safety gate', () => {
  const dummyImagePayload = 'data:image/jpeg;base64,' + 'a'.repeat(200);

  it('does not return an unsafe challenge, returns deterministic fallback, and preserves all other fields', async () => {
    vi.mocked(analyzeOutdoorImage).mockResolvedValueOnce({
      identification: 'Amanita muscaria (Fly Agaric)',
      confidence: 'high',
      uncertaintyReason: undefined,
      evidence: ['Bright red cap with white warts', 'White gills', 'Distinct volva'],
      description: 'Iconic mycorrhizal basidiomycete fungus.',
      observation: 'Check the soil near the conifer roots.',
      mission: {
        missionType: 'OBSERVE',
        title: 'Fungal Gills Study',
        target: 'Observe gills on wild mushroom',
        durationSeconds: 120,
        steps: ['Pick the mushroom and feel its gills'],
        successCriteria: 'Check for spores',
        safetyConstraints: ['None'],
      },
      challenge: 'Pick the mushroom and feel its gills to check for spores.',
      safety: 'Highly toxic. Do not consume.',
      inferenceDurationMs: 4200,
    });

    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image: dummyImagePayload,
        mimeType: 'image/jpeg',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();

    // 1. Unsafe challenge must NOT be returned
    expect(data.challenge).not.toBe('Pick the mushroom and feel its gills to check for spores.');
    // 2. Deterministic SAFE_CHALLENGE_FALLBACK is returned
    expect(data.challenge).toBe(SAFE_CHALLENGE_FALLBACK);
    // 3. Identification, confidence, evidence, description, observation, and safety remain intact
    expect(data.identification).toBe('Amanita muscaria (Fly Agaric)');
    expect(data.confidence).toBe('high');
    expect(data.evidence).toEqual(['Bright red cap with white warts', 'White gills', 'Distinct volva']);
    expect(data.description).toBe('Iconic mycorrhizal basidiomycete fungus.');
    expect(data.observation).toBe('Check the soil near the conifer roots.');
    expect(data.safety).toBe('Highly toxic. Do not consume.');
  });

  it('preserves valid safe observational challenge', async () => {
    const safeChallenge =
      'Put your phone away and search within 10 paces for an acorn or gall on the forest floor.';

    vi.mocked(analyzeOutdoorImage).mockResolvedValueOnce({
      identification: 'Quercus alba (White Oak)',
      confidence: 'high',
      uncertaintyReason: undefined,
      evidence: ['Lobed leaves without bristle tips'],
      description: 'Mature deciduous oak specimen.',
      observation: 'Check the bark furrowing patterns.',
      mission: {
        missionType: 'OBSERVE',
        title: 'Oak Acorn Search',
        target: 'Search for an acorn or gall on the forest floor',
        durationSeconds: 120,
        steps: ['Put your phone away and search within 10 paces'],
        successCriteria: 'Find an acorn or gall',
        safetyConstraints: ['Stay on trail'],
      },
      challenge: safeChallenge,
      safety: 'Stay on trail.',
      inferenceDurationMs: 3100,
    });

    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image: dummyImagePayload,
        mimeType: 'image/jpeg',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.challenge).toBe(safeChallenge);
    expect(data.identification).toBe('Quercus alba (White Oak)');
  });
});
