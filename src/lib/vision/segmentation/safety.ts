/**
 * TrailLens - Challenge Safety Validation Layer
 * Enforces Leave No Trace, toxicological safety, and outdoor injury prevention.
 */

export interface SafetyValidationResult {
  isSafe: boolean;
  violations: string[];
  sanitizedChallenge: string;
}

const HAZARD_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  // Foraging / Ingestion
  { regex: /\b(eat|taste|chew|ingest|consume|bite|swallow|flavor|sample|tea|drink)\b/i, reason: 'Wild foraging or ingestion hazard' },
  // Direct tactile contact with fungi / unknown mushrooms
  { regex: /\b(touch|feel|pick|handle|gather|harvest|pluck|pluck|rub)\b.*\b(mushroom|fungus|fungi|toadstool|spore)\b/i, reason: 'Tactile interaction with potentially toxic fungi' },
  // Direct contact with toxic or stinging foliage
  { regex: /\b(touch|rub|brush|crush|smell up close)\b.*\b(nettle|ivy|oak|sumac|leaf|plant|weed)\b/i, reason: 'Direct contact with potentially irritating or toxic flora' },
  // Fauna harassment / wildlife disturbance
  { regex: /\b(catch|grab|hold|chase|corner|feed|pet|pick up|disturb|trap)\b.*\b(animal|snake|insect|bird|nest|spider|bee|wasp|mammal)\b/i, reason: 'Wildlife disturbance or envenomation risk' },
  // Dangerous physical terrain or structural climbing
  { regex: /\b(climb|jump|scale|cross|wade into|swim|lean over)\b.*\b(cliff|ravine|ledge|waterfall|river|current|tree top|roof)\b/i, reason: 'Fall or water hazard' },
];

export function validateChallengeSafety(challengeText: string): SafetyValidationResult {
  const violations: string[] = [];

  for (const rule of HAZARD_PATTERNS) {
    if (rule.regex.test(challengeText)) {
      violations.push(rule.reason);
    }
  }

  if (violations.length === 0) {
    return {
      isSafe: true,
      violations: [],
      sanitizedChallenge: challengeText,
    };
  }

  // Safe fallback challenge prioritizing non-invasive visual and sensory observation
  const safeFallback =
    'Put your phone in your pocket for 2 minutes. Without touching anything, observe the surrounding area and visually identify three distinct natural textures or color gradients.';

  return {
    isSafe: false,
    violations,
    sanitizedChallenge: safeFallback,
  };
}
