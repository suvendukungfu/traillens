import { describe, it, expect } from 'vitest';
import {
  analyzeRequestSchema,
  aiAnalysisResultSchema,
  sanitizeBase64Image,
  validateChallengeSafety,
  SAFE_CHALLENGE_FALLBACK,
  aiAnalysisJsonSchema,
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

describe('validateChallengeSafety & Challenge Safety Gate', () => {
  describe('Safe observational challenges', () => {
    it('allows purely visual and sensory observation instructions', () => {
      const safeChallenges = [
        'Put your phone in your pocket and observe the bark pattern on three adjacent trees.',
        'Spend 2 minutes examining the texture and shape of three different pebbles.',
        'Listen carefully for three distinct bird calls in the canopy above.',
        'Count how many shades of green you can spot from this vantage point.',
        'Look at how sunlight and shadows interact on the forest floor.',
      ];

      for (const challenge of safeChallenges) {
        const result = validateChallengeSafety(challenge);
        expect(result.isSafe).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.sanitizedChallenge).toBe(challenge);
      }
    });

    it('allows safe observation with potential false positive keywords (edible-looking, taste, drink)', () => {
      const falsePositiveEdgeCases = [
        // 1. "edible-looking" (visual descriptive adjective, not an ingestion command)
        'Observe the edible-looking red berries from where you stand and note their clustered arrangement.',
        // 2. "taste" used in a non-instructional observation context (figurative / experiential)
        'Pause for a moment and enjoy a taste of wilderness while listening to the wind in the pine branches.',
        'This scenic ridge offers a taste of quiet nature; observe how distant ridges layer in the haze.',
        // 3. "drink" used in a non-foraging context (idiomatic visual appreciation and personal hydration)
        'Drink in the view of the valley below, noting how sunlight illuminates the tree canopy.',
        'Take a drink from your water bottle and visually count five distinct rock formations nearby.',
      ];

      for (const challenge of falsePositiveEdgeCases) {
        const result = validateChallengeSafety(challenge);
        expect(result.isSafe).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.sanitizedChallenge).toBe(challenge);
      }
    });
  });

  describe('Hazard vocabulary detection (Requirement 6)', () => {
    it('rejects eat / ingest / taste / lick / nibble / forage / brew / chew', () => {
      const hazards = [
        { text: 'Eat the wild berries growing on the bush.', keyword: 'eat' },
        { text: 'Ingest a small droplet of sap from the pine tree.', keyword: 'ingest' },
        { text: 'Taste the clover leaf to see if it is sour.', keyword: 'taste' },
        { text: 'Lick the tree resin to identify its scent.', keyword: 'lick' },
        { text: 'Nibble on the mushroom stem to test for bitterness.', keyword: 'nibble' },
        { text: 'Forage for wild edibles along the forest floor.', keyword: 'forage' },
        { text: 'Brew a tea from the fresh pine needles.', keyword: 'brew' },
        { text: 'Steep the wild roots in boiling water to make tea.', keyword: 'steep' },
        { text: 'Chew on the sweet grass stem.', keyword: 'chew' },
      ];

      for (const { text } of hazards) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });

    it('rejects collect / pick / pluck / harvest', () => {
      const collectingHazards = [
        'Collect five different wild mushrooms to take home for study.',
        'Pick a bouquet of wildflowers from the meadow.',
        'Pluck several petals from the flower to study under magnification.',
        'Harvest some wild moss from the granite boulder.',
        'Uproot a small plant specimen to examine the root nodules.',
        'Strip the bark from the fallen birch branch.',
      ];

      for (const text of collectingHazards) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });

    it('rejects unsafe touch / handle of fungi and toxic flora', () => {
      const touchHazards = [
        'Touch the wild mushroom to feel if the cap is slimy.',
        'Handle the poison ivy leaves to check their texture.',
        'Crush the wild leaf between your fingers to smell the oils.',
        'Rub the stinging nettle leaf against your palm.',
      ];

      for (const text of touchHazards) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });

    it('rejects disturb wildlife and approach wildlife', () => {
      const wildlifeHazards = [
        'Catch a frog near the pond bank and hold it.',
        'Disturb the bird nest in the low branch to see if eggs are inside.',
        'Approach the resting deer quietly to get a close-up photo.',
        'Try to pet the wild squirrel near the tree trunk.',
        'Stalk the hawk until you get within touching distance.',
        'Feed the ducks with leftover breadcrumbs.',
        'Poke the spider web to see the spider react.',
      ];

      for (const text of wildlifeHazards) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });

    it('rejects terrain fall and water hazards', () => {
      const terrainHazards = [
        'Climb up the steep cliff edge to get a better vantage point.',
        'Wade into the river rapids to check the water depth.',
        'Scale the rock face next to the waterfall.',
        'Jump across the wide ravine onto the opposite ledge.',
      ];

      for (const text of terrainHazards) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });
  });

  describe('Negated cautionary phrases (safe phrases with hazard words)', () => {
    it('allows safe instructions containing explicit negative cautions', () => {
      const safeNegated = [
        'Without touching anything, observe the surrounding area and count five distinct shades of green.',
        'Without touching the leaves, observe the vein structure with your eyes.',
        'Do not pick or eat any berries; simply count how many are on the branch.',
        'Never touch unknown fungi; observe the mushroom cap shape from a distance.',
        'Observe the deer from a distance without approaching it.',
        'Avoid disturbing the nesting birds while looking up at the canopy.',
        'Refrain from touching the poison ivy, and note its characteristic three-leaf cluster.',
      ];

      for (const text of safeNegated) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.sanitizedChallenge).toBe(text);
      }
    });

    it('rejects sentences where a negated caution is followed by an unsafe command', () => {
      const unsafeCompound = [
        'Do not touch the leaves, but taste the red berries.',
        'Without touching the bark, pick the wild flower.',
        'Never approach the bear, but try to catch the squirrel.',
      ];

      for (const text of unsafeCompound) {
        const result = validateChallengeSafety(text);
        expect(result.isSafe).toBe(false);
        expect(result.sanitizedChallenge).toBe(SAFE_CHALLENGE_FALLBACK);
      }
    });
  });

  describe('Integration with aiAnalysisResultSchema', () => {
    it('sanitizes unsafe challenge in model response while preserving all other fields', () => {
      const unsafeModelResponse = {
        identification: 'Wild Blackberry (Rubus fruticosus)',
        confidence: 'high',
        evidence: ['Compound leaves with 3-5 serrated leaflets', 'Prickly stems'],
        description: 'Common bramble shrub bearing clusters of dark drupelets.',
        observation: 'Notice the thorny canes arching across the pathway.',
        challenge: 'Taste one of the ripe blackberries to sample its sweetness.',
        safety: 'Watch out for sharp thorns on the stems.',
      };

      const parsed = aiAnalysisResultSchema.parse(unsafeModelResponse);

      // Challenge must be sanitized to deterministic safe fallback
      expect(parsed.challenge).toBe(SAFE_CHALLENGE_FALLBACK);

      // All other fields must remain completely unchanged
      expect(parsed.identification).toBe('Wild Blackberry (Rubus fruticosus)');
      expect(parsed.confidence).toBe('high');
      expect(parsed.evidence).toEqual(['Compound leaves with 3-5 serrated leaflets', 'Prickly stems']);
      expect(parsed.description).toBe('Common bramble shrub bearing clusters of dark drupelets.');
      expect(parsed.observation).toBe('Notice the thorny canes arching across the pathway.');
      expect(parsed.safety).toBe('Watch out for sharp thorns on the stems.');
    });

    it('preserves valid safe challenge in model response', () => {
      const safeModelResponse = {
        identification: 'Granite Boulder',
        confidence: 'high',
        evidence: ['Crystalline quartz and feldspar grain structure'],
        description: 'Coarse-grained igneous rock weathered by elements.',
        observation: 'Look at the tiny lichen crusts spreading on the sunward side.',
        challenge: 'Put your phone away and search within 10 paces for another stone with banded mineral veins.',
        safety: 'Watch your footing on loose scree.',
      };

      const parsed = aiAnalysisResultSchema.parse(safeModelResponse);
      expect(parsed.challenge).toBe(safeModelResponse.challenge);
      expect(parsed.identification).toBe('Granite Boulder');
    });
  });

  describe('aiAnalysisJsonSchema', () => {
    it('produces a valid JSON Schema object with properties and required constraints', () => {
      expect(aiAnalysisJsonSchema).toBeDefined();
      expect(typeof aiAnalysisJsonSchema).toBe('object');

      interface JsonSchemaNode {
        type?: string;
        properties?: Record<string, JsonSchemaNode>;
        required?: string[];
        enum?: string[];
        minimum?: number;
        maximum?: number;
      }

      const schemaObj = aiAnalysisJsonSchema as JsonSchemaNode;
      expect(schemaObj.type).toBe('object');
      expect(schemaObj.properties).toBeDefined();
      expect(schemaObj.properties?.identification?.type).toBe('string');
      expect(schemaObj.properties?.confidence?.enum).toEqual(['low', 'medium', 'high']);
      expect(schemaObj.properties?.mission?.type).toBe('object');
      expect(schemaObj.properties?.mission?.properties?.durationSeconds?.minimum).toBe(120);
      expect(schemaObj.properties?.mission?.properties?.durationSeconds?.maximum).toBe(300);
      expect(schemaObj.required).toContain('mission');
      expect(schemaObj.required).toContain('identification');
    });
  });
});
