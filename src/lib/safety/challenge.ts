/**
 * TrailLens - Production Challenge Safety Validation Layer
 * Enforces Leave No Trace principles, toxicological safety, and outdoor injury prevention.
 *
 * SCOPE & SYSTEM BOUNDARIES:
 * This validator is a deterministic, regex-based keyword and structural heuristic gate.
 * It is designed as a defense-in-depth safety guardrail to catch explicit outdoor hazards
 * (ingestion, foraging, toxic/fungal handling, specimen harvesting, wildlife disturbance/approach,
 * and dangerous terrain falls/water hazards) before model-generated challenges reach the user.
 *
 * NOTE: It is NOT an omniscient natural-language semantic reasoning engine or complete safety guarantee.
 * Outdoor users must always exercise personal situational awareness and field prudence.
 */

export interface SafetyValidationResult {
  isSafe: boolean;
  violations: string[];
  sanitizedChallenge: string;
}

export const SAFE_CHALLENGE_FALLBACK =
  'Put your phone in your pocket for 2 minutes. Without touching anything, observe the surrounding area and visually identify three distinct natural textures or color gradients.';

/**
 * Strips safe metaphorical idioms, sensory descriptions, and non-foraging phrasing
 * to prevent false positives on valid observational challenges.
 * E.g., "edible-looking", "drink in the view", "drink from your water bottle", "a taste of wilderness".
 */
export function stripSafeObservationIdioms(text: string): string {
  let cleaned = text;

  // 1. Visual appearance descriptors like "edible-looking" or "tasty-looking"
  cleaned = cleaned.replace(/\b(?:edible|tasty|delicious)-looking\b/gi, 'observed-looking');

  // 2. Metaphorical nature appreciation: "drink in the view / scenery / beauty / air"
  cleaned = cleaned.replace(
    /\bdrink\s+in\s+(?:the\s+)?(?:view|scenery|landscape|beauty|atmosphere|air|surroundings|nature|solitude|forest|mountains?)\b/gi,
    'admire the view'
  );

  // 3. Hydration from own gear: "take a drink from your water bottle / canteen"
  cleaned = cleaned.replace(
    /\b(?:take\s+a\s+)?drink\s+(?:from\s+)?(?:your|a)\s+(?:own\s+)?(?:water\s+bottle|bottle|flask|canteen|hydration\s+pack)\b/gi,
    'hydrate'
  );

  // 4. Experiential / figurative "taste": "enjoy a taste of wilderness / solitude / nature"
  cleaned = cleaned.replace(
    /\b(?:get|enjoy|experience|take\s+in|offers?|a)\s+taste\s+of\s+(?:the\s+)?(?:wilderness|nature|solitude|forest|silence|peace|calm|quiet|adventure|outdoors)\b/gi,
    'experience of nature'
  );

  // 5. Aesthetic taste: "good taste", "matter of taste"
  cleaned = cleaned.replace(/\b(?:good|poor|artistic|matter\s+of)\s+taste\b/gi, 'aesthetic');

  return cleaned;
}

/**
 * Strips explicitly negated cautionary clauses to avoid false positives on safe instructions.
 * E.g., "Without touching the leaves, observe...", "Do not pick or eat any berries", "Avoid approaching the deer".
 */
export function stripNegatedSafetyClauses(text: string): string {
  const negationPattern =
    /\b(?:without|do\s+not|don't|never|avoid|refrain\s+from|no\s+need\s+to)\s+(?:to\s+|ever\s+|even\s+|trying\s+to\s+|attempting\s+to\s+)?(?:(?:touching|touch|feeling|feel|handling|handle|picking|pick|plucking|pluck|eating|eat|tasting|taste|ingesting|ingest|chewing|chew|licking|lick|nibbling|nibble|swallowing|swallow|drinking|drink|brewing|brew|foraging|forage|harvesting|harvest|collecting|collect|gathering|gather|disturbing|disturb|approaching|approach|feeding|feed|chasing|chase|catching|catch|petting|pet|climbing|climb|wading|wade|swimming|swim|jumping|jump|scaling|scale|harming|harm)\s*(?:and|or|nor)?\s*)+[^,.;:!?]*(?=[,.;:!?]|\s+(?:but|however|yet)\b|$)/gi;

  return text.replace(negationPattern, ' ');
}

const HAZARD_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  // 1. Foraging, Ingestion, Tasting, and Brewing Hazard
  {
    regex: /\b(eat|eating|eats|eaten|edible|edibility|taste|tasting|tastes|chew|chewing|chews|ingest|ingesting|ingests|ingestion|consume|consuming|consumes|bite|biting|bites|swallow|swallowing|swallows|lick|licking|licks|nibble|nibbling|nibbles|forage|foraging|foraged|brew|brewing|brews|brewed|steep|steeping|infuse|infusing)\b/i,
    reason: 'Wild foraging or ingestion hazard',
  },
  {
    regex: /\b(drink|drinking|sip|sipping)\b.*\b(tea|water|creek|stream|sap|dew)\b/i,
    reason: 'Wild foraging or ingestion hazard',
  },
  {
    regex: /\b(?:make|brew)\s+(?:a\s+)?tea\b/i,
    reason: 'Wild foraging or ingestion hazard',
  },
  {
    regex: /\bsample\b.*\b(flavor|taste|leaf|berry|berries|mushroom|plant)\b/i,
    reason: 'Wild foraging or ingestion hazard',
  },

  // 2. Direct tactile contact with fungi / unknown mushrooms
  {
    regex: /\b(touch|touching|feel|feeling|pick|picking|handle|handling|gather|gathering|harvest|harvesting|pluck|plucking|rub|rubbing|hold|holding|crush|crushing)\b.*\b(mushroom|mushrooms|fungus|fungi|toadstool|toadstools|spore|spores|bracket\s+fungus)\b/i,
    reason: 'Tactile interaction with potentially toxic fungi',
  },

  // 3. Harvesting, picking, plucking, or collecting natural specimens (Leave No Trace)
  {
    regex: /\b(pick|picking|picks|pluck|plucking|plucks|harvest|harvesting|harvests|collect|collecting|collects|gather|gathering|gathers|uproot|uprooting|cut|cutting|strip|stripping)\b.*\b(wildflower|wildflowers|bouquet|flower|flowers|petal|petals|leaf|leaves|foliage|mushroom|mushrooms|fungus|fungi|toadstool|toadstools|plant|plants|weed|weeds|berry|berries|acorn|acorns|seed|seeds|bark|stem|stems|branch|branches|moss|lichen|flora|specimen|specimens)\b/i,
    reason: 'Harvesting, picking, or collecting wild flora or specimens',
  },

  // 4. Direct contact with potentially irritating or toxic flora
  {
    regex: /\b(touch|touching|rub|rubbing|brush|brushing|crush|crushing|smell\s+up\s+close|handle|handling)\b.*\b(nettle|nettles|poison\s+(?:ivy|oak|sumac)|sumac|toxic|poisonous|thorn|thorns|spines?|cactus|sap)\b/i,
    reason: 'Direct contact with potentially irritating or toxic flora',
  },
  {
    regex: /\b(crush|crushing|rub|rubbing)\b.*\b(leaf|leaves|plant|flower|weed)\b/i,
    reason: 'Direct contact with potentially irritating or toxic flora',
  },

  // 5. Fauna harassment / wildlife disturbance
  {
    regex: /\b(catch|catching|grab|grabbing|hold|holding|chase|chasing|corner|cornering|feed|feeding|pet|petting|pick\s+up|picking\s+up|disturb|disturbing|trap|trapping|poke|poking|scare|scaring|frighten|harass|harassing|touch|touching|handle|handling)\b.*\b(animal|animals|wildlife|snake|snakes|insect|insects|bug|bugs|spider|spiders|web|webs|bee|bees|wasp|wasps|bird|birds|hawk|hawks|owl|owls|raptor|raptors|nest|nests|mammal|mammals|creature|creatures|reptile|reptiles|amphibian|amphibians|frog|frogs|toad|toads|lizard|lizards|salamander|salamanders|rodent|rodents|squirrel|squirrels|deer|duck|ducks)\b/i,
    reason: 'Wildlife disturbance or envenomation risk',
  },
  {
    regex: /\b(animal|animals|wildlife|snake|snakes|bird|birds|hawk|hawks|owl|owls|nest|nests|spider|spiders|frog|frogs|lizard|lizards|squirrel|squirrels|deer)\b.*\b(catch|grab|hold|chase|corner|feed|pet|pick\s+up|disturb|trap|poke|harass|touch|handle)\b/i,
    reason: 'Wildlife disturbance or envenomation risk',
  },

  // 6. Wildlife approach / stalking
  {
    regex: /\b(approach|approaching|approaches|get\s+close(?:\s+to)?|step\s+close(?:\s+to)?|walk\s+up\s+to|stalk|stalking|creep\s+up\s+on|sneak\s+up\s+on)\b.*\b(animal|animals|wildlife|snake|snakes|bird|birds|hawk|hawks|owl|owls|raptor|raptors|nest|nests|insect|insects|spider|spiders|mammal|mammals|creature|creatures|reptile|reptiles|amphibian|amphibians|frog|frogs|toad|toads|lizard|lizards|rodent|rodents|squirrel|squirrels|deer)\b/i,
    reason: 'Wildlife disturbance or envenomation risk',
  },
  {
    regex: /\b(animal|animals|wildlife|snake|snakes|bird|birds|hawk|hawks|owl|owls|mammal|creature|deer|squirrel)\b.*\b(approach|get\s+close|stalk)\b/i,
    reason: 'Wildlife disturbance or envenomation risk',
  },

  // 7. Dangerous physical terrain or structural climbing
  {
    regex: /\b(climb|climbing|jump|jumping|scale|scaling|cross|crossing|wade\s+into|swim|swimming|lean\s+over)\b.*\b(cliff|cliffs|ravine|ravines|ledge|ledges|waterfall|waterfalls|river|rivers|current|currents|tree\s+top|tree\s+tops|roof|roofs|rapids|chasm|chasms)\b/i,
    reason: 'Fall or water hazard',
  },
];

export function validateChallengeSafety(challengeText: string): SafetyValidationResult {
  const violations: string[] = [];
  const textWithoutIdioms = stripSafeObservationIdioms(challengeText);
  const textToCheck = stripNegatedSafetyClauses(textWithoutIdioms);

  for (const rule of HAZARD_PATTERNS) {
    if (rule.regex.test(textToCheck)) {
      if (!violations.includes(rule.reason)) {
        violations.push(rule.reason);
      }
    }
  }

  if (violations.length === 0) {
    return {
      isSafe: true,
      violations: [],
      sanitizedChallenge: challengeText,
    };
  }

  return {
    isSafe: false,
    violations,
    sanitizedChallenge: SAFE_CHALLENGE_FALLBACK,
  };
}
