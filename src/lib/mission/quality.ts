/**
 * TrailLens — Milestone 4: Mission Quality & Grounding Rubric
 * Deterministic, offline evaluator for FieldMission quality, physical grounding,
 * specificity, executability, and outdoor value.
 *
 * NOTE: This module never invokes external LLMs or heuristics with hidden weights.
 * All scoring is deterministic, bounded (0–100), and transparently inspectable.
 */

import type { FieldMission } from '@/types/trail';
import { validateChallengeSafety } from '@/lib/safety/challenge';

export type QualityDimension =
  | 'grounding'
  | 'specificity'
  | 'safety'
  | 'executability'
  | 'outdoorWorthwhile';

export interface MissionQualityIssue {
  dimension: QualityDimension;
  severity: 'warning' | 'error';
  code: string;
  message: string;
  penalty: number;
}

export interface DimensionScores {
  grounding: number;        // 0 to 20
  specificity: number;      // 0 to 20
  safety: number;           // 0 to 20
  executability: number;    // 0 to 20
  outdoorWorthwhile: number;// 0 to 20
}

export interface MissionQualityReport {
  totalScore: number; // 0 to 100
  passed: boolean;    // totalScore >= 70 && all dimensions passing threshold (>= 14)
  grounded: boolean;
  specific: boolean;
  safe: boolean;
  executable: boolean;
  outdoorWorthwhile: boolean;
  dimensionScores: DimensionScores;
  issues: MissionQualityIssue[];
}

export interface MissionAnalysisContext {
  identification?: string;
  description?: string;
  evidence?: string[];
  observation?: string;
  safety?: string;
}

export const RUBRIC_CONFIG = {
  maxScore: 100,
  maxDimensionScore: 20,
  passingScore: 70,
  passingDimensionScore: 14,
  dimensions: [
    { key: 'grounding', name: 'Grounding', maxScore: 20, minScore: 14 },
    { key: 'specificity', name: 'Specificity', maxScore: 20, minScore: 14 },
    { key: 'safety', name: 'Safety', maxScore: 20, minScore: 14 },
    { key: 'executability', name: 'Executability', maxScore: 20, minScore: 14 },
    { key: 'outdoorWorthwhile', name: 'Outdoor Value', maxScore: 20, minScore: 14 },
  ] as const,
};

// ============================================================================
// DETERMINISTIC PATTERNS & LEXICONS
// ============================================================================

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'from', 'about', 'is', 'are', 'was', 'were', 'it', 'its', 'this',
  'that', 'these', 'those', 'as', 'into', 'shows', 'image', 'photo', 'picture',
  'observation', 'specimen', 'species', 'natural', 'nature',
]);

const GENERIC_VAGUE_PATTERNS: RegExp[] = [
  /\b(?:explore\s+(?:the\s+)?area)\b/i,
  /\b(?:look\s+around)\b/i,
  /\b(?:observe\s+nature)\b/i,
  /\b(?:study\s+the\s+object)\b/i,
  /\b(?:experience\s+nature)\b/i,
  /\b(?:look\s+at\s+stuff)\b/i,
  /\b(?:check\s+(?:it\s+)?out)\b/i,
  /\b(?:see\s+what\s+you\s+can\s+find)\b/i,
];

const OBSERVABLE_PROPERTIES = /\b(?:lobe|lobes|vein|veins|margin|margins|edge|edges|texture|textures|color|colors|colour|colours|bark|ridge|ridges|ring|rings|scale|scales|spore|spores|cluster|clusters|fissure|fissures|angle|serrated|smooth|rough|height|width|pattern|symmetry|arrangement|stem|stems|surface|surfaces|layer|layers|banding|groove|grooves)\b/i;

const OPERATIONAL_ACTION_VERBS = /\b(?:compare|count|locate|find|trace|inspect|differentiate|match|tally|estimate|examine|identify|measure|contrast|seek)\b/i;

const BOUNDED_SCOPE_CUES = /\b(?:two|three|four|five|2|3|4|5|pair|single|both|within|nearby|closest|paces|steps|meters|adjacent|next\s+to|surrounding|few)\b/i;

const SPECIALIZED_LAB_EQUIPMENT = /\b(?:microscope|magnifying\s+glass|hand\s+lens|ruler|calipers|chemical|acid|test\s+kit|scale|balance|ph\s+meter|spectrometer|telescope|drill|hammer|chisel|tweezers|pipette)\b/i;

const SCREEN_COGNITIVE_PATTERNS: RegExp[] = [
  /\b(?:read\s+(?:the\s+)?(?:description|text|screen|app))\b/i,
  /\b(?:remember\s+(?:\d+|two|three|several)?\s*facts?)\b/i,
  /\b(?:think\s+about\s+(?:why|how|what))\b/i,
  /\b(?:memorize|ponder|recall|quiz\s+yourself)\b/i,
  /\b(?:stare\s+at\s+(?:the\s+)?(?:phone|screen))\b/i,
  /\b(?:google|search\s+online|look\s+up\s+on\s+wikipedia)\b/i,
  /\b(?:use\s+your\s+phone\s+to\s+calculate)\b/i,
];

const PHYSICAL_DISENGAGEMENT_CUES = /\b(?:walk|walked|step|steps|paces?|turn|circle|move|stand|crouch|look\s+closely|look\s+up|look\s+down|underside|underneath|ground|canopy|branches?|trunk|nearby|find\s+another|put\s+your\s+phone\s+(?:away|in\s+your\s+pocket))\b/i;

const IRRELEVANT_OUTDOOR_DOMAINS = /\b(?:air\s+pressure|barometer|barometric|relative\s+humidity|dew\s+point|satellite|traffic|car|cars|highway|motorcycle|kitchen|refrigerator|computer|cpu|keyboard|screen\s+time|wifi|bluetooth)\b/i;

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

// ============================================================================
// CORE EVALUATOR
// ============================================================================

/**
 * Deterministically evaluates a FieldMission against the 5-dimension TrailLens quality rubric.
 *
 * Scoring Rubric (Total = 100):
 * - Grounding:       0–20 pts (threshold: 14)
 * - Specificity:     0–20 pts (threshold: 14)
 * - Safety:          0–20 pts (threshold: 14)
 * - Executability:   0–20 pts (threshold: 14)
 * - Outdoor Value:   0–20 pts (threshold: 14)
 *
 * A mission passes if totalScore >= 70 AND every individual dimension meets its threshold.
 */
export function evaluateMissionQuality(
  mission: FieldMission,
  context?: MissionAnalysisContext
): MissionQualityReport {
  const issues: MissionQualityIssue[] = [];

  let groundingScore = 20;
  let specificityScore = 20;
  let safetyScore = 20;
  let executabilityScore = 20;
  let outdoorScore = 20;

  const combinedMissionText = [
    mission.title,
    mission.target,
    ...mission.steps,
    mission.successCriteria,
  ].join(' ');

  // --------------------------------------------------------------------------
  // 1. GROUNDING (0–20 points)
  // --------------------------------------------------------------------------
  const idText = context?.identification || '';
  const descText = context?.description || '';
  const idTokens = tokenizeText(idText);
  const descTokens = tokenizeText(descText);
  const subjectTokens = [...new Set([...idTokens, ...descTokens])];

  // Check 1.1: Obvious irrelevant domain or sensor hallucination
  if (IRRELEVANT_OUTDOOR_DOMAINS.test(combinedMissionText)) {
    groundingScore -= 12;
    issues.push({
      dimension: 'grounding',
      severity: 'error',
      code: 'GROUNDING_IRRELEVANT_DOMAIN',
      message: 'Mission introduces irrelevant physical measurements or non-outdoor domain concepts.',
      penalty: 12,
    });
  }

  // Check 1.2: Subject connection
  // Mission must connect to at least one meaningful token from identification/description,
  // or describe concrete botanical/morphological components typical of outdoor specimens.
  if (subjectTokens.length > 0) {
    const missionTokens = new Set(tokenizeText(combinedMissionText));
    const tokenOverlap = subjectTokens.some((t) => missionTokens.has(t));
    const morphologicalMatch = OBSERVABLE_PROPERTIES.test(combinedMissionText);

    if (!tokenOverlap && !morphologicalMatch) {
      groundingScore -= 10;
      issues.push({
        dimension: 'grounding',
        severity: 'error',
        code: 'GROUNDING_TARGET_DISCONNECTED',
        message: 'Mission target and steps show no identifiable connection to the observed subject.',
        penalty: 10,
      });
    } else if (!tokenOverlap && morphologicalMatch) {
      // Connects generically to morphology but misses specific subject name
      groundingScore -= 4;
      issues.push({
        dimension: 'grounding',
        severity: 'warning',
        code: 'GROUNDING_GENERIC_SUBJECT_LINK',
        message: 'Mission connects to general botanical properties but omits specific subject naming.',
        penalty: 4,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. SPECIFICITY (0–20 points)
  // --------------------------------------------------------------------------
  // Check 2.1: Reject vague generic instructions
  let vagueCount = 0;
  for (const pattern of GENERIC_VAGUE_PATTERNS) {
    if (pattern.test(combinedMissionText)) {
      vagueCount++;
    }
  }
  if (vagueCount > 0) {
    const penalty = Math.min(14, 8 + vagueCount * 3);
    specificityScore -= penalty;
    issues.push({
      dimension: 'specificity',
      severity: 'error',
      code: 'SPECIFICITY_VAGUE_PHRASE',
      message: 'Mission contains vague non-operational phrasing (e.g., "explore the area", "look around").',
      penalty,
    });
  }

  // Check 2.2: Concrete observable properties present
  if (!OBSERVABLE_PROPERTIES.test(combinedMissionText)) {
    specificityScore -= 6;
    issues.push({
      dimension: 'specificity',
      severity: 'warning',
      code: 'SPECIFICITY_NO_OBSERVABLE_PROPERTY',
      message: 'Mission lacks concrete observable physical properties (e.g., veins, margins, bark, clusters).',
      penalty: 6,
    });
  }

  // Check 2.3: Operational action verb present
  if (!OPERATIONAL_ACTION_VERBS.test(combinedMissionText)) {
    specificityScore -= 4;
    issues.push({
      dimension: 'specificity',
      severity: 'warning',
      code: 'SPECIFICITY_NO_OPERATIONAL_VERB',
      message: 'Mission lacks operational action verbs (e.g., compare, count, locate, inspect).',
      penalty: 4,
    });
  }

  // Check 2.4: Bounded scope / count / spatial anchor
  if (!BOUNDED_SCOPE_CUES.test(combinedMissionText)) {
    specificityScore -= 4;
    issues.push({
      dimension: 'specificity',
      severity: 'warning',
      code: 'SPECIFICITY_UNBOUNDED_SCOPE',
      message: 'Mission lacks bounding constraints (e.g., quantities, proximity, or spatial bounds).',
      penalty: 4,
    });
  }

  // --------------------------------------------------------------------------
  // 3. SAFETY (0–20 points)
  // --------------------------------------------------------------------------
  // Reuse existing production safety gate
  const fullTextToValidate = `${mission.title}. ${mission.target}. ${mission.steps.join(' ')}. ${mission.successCriteria}`;
  const safetyGateResult = validateChallengeSafety(fullTextToValidate);

  if (!safetyGateResult.isSafe) {
    safetyScore = 0;
    issues.push({
      dimension: 'safety',
      severity: 'error',
      code: 'SAFETY_HAZARD_DETECTED',
      message: `Production safety gate flagged outdoor hazard: ${safetyGateResult.violations.join(', ')}`,
      penalty: 20,
    });
  } else {
    // Check 3.2: Explicit safety constraints present in mission
    if (!mission.safetyConstraints || mission.safetyConstraints.length === 0) {
      safetyScore -= 6;
      issues.push({
        dimension: 'safety',
        severity: 'warning',
        code: 'SAFETY_MISSING_EXPLICIT_CONSTRAINTS',
        message: 'Mission does not declare explicit Leave No Trace safety constraints.',
        penalty: 6,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 4. EXECUTABILITY (0–20 points)
  // --------------------------------------------------------------------------
  // Check 4.1: Duration bounds (120 to 300 seconds)
  if (
    typeof mission.durationSeconds !== 'number' ||
    mission.durationSeconds < 120 ||
    mission.durationSeconds > 300
  ) {
    executabilityScore -= 8;
    issues.push({
      dimension: 'executability',
      severity: 'error',
      code: 'EXECUTABILITY_DURATION_OUT_OF_BOUNDS',
      message: `Duration (${mission.durationSeconds}s) is outside required 120s–300s field exploration window.`,
      penalty: 8,
    });
  }

  // Check 4.2: Step count bounds (1 to 4 steps)
  if (
    !Array.isArray(mission.steps) ||
    mission.steps.length < 1 ||
    mission.steps.length > 4
  ) {
    executabilityScore -= 8;
    issues.push({
      dimension: 'executability',
      severity: 'error',
      code: 'EXECUTABILITY_INVALID_STEP_COUNT',
      message: `Step count (${mission.steps?.length ?? 0}) is outside 1–4 sequential steps requirement.`,
      penalty: 8,
    });
  }

  // Check 4.3: Verifiable success criteria present
  if (
    !mission.successCriteria ||
    mission.successCriteria.trim().length < 10 ||
    /^(done|completed|finished|ok)\.?$/i.test(mission.successCriteria.trim())
  ) {
    executabilityScore -= 8;
    issues.push({
      dimension: 'executability',
      severity: 'error',
      code: 'EXECUTABILITY_UNVERIFIABLE_SUCCESS_CRITERIA',
      message: 'Success criteria is missing, trivial, or does not declare verifiable physical outcome.',
      penalty: 8,
    });
  }

  // Check 4.4: Action requires specialized lab or invasive equipment
  if (SPECIALIZED_LAB_EQUIPMENT.test(combinedMissionText)) {
    executabilityScore -= 8;
    issues.push({
      dimension: 'executability',
      severity: 'error',
      code: 'EXECUTABILITY_REQUIRES_SPECIALIZED_EQUIPMENT',
      message: 'Mission requires specialized lab tools not available to typical outdoor walkers.',
      penalty: 8,
    });
  }

  // Check 4.5: Target completeness
  if (!mission.target || mission.target.trim().length < 5) {
    executabilityScore -= 8;
    issues.push({
      dimension: 'executability',
      severity: 'error',
      code: 'EXECUTABILITY_EMPTY_TARGET',
      message: 'Mission target is empty or under-specified.',
      penalty: 8,
    });
  }

  // --------------------------------------------------------------------------
  // 5. OUTDOOR-WORTHWHILE (0–20 points)
  // --------------------------------------------------------------------------
  // Check 5.1: Screen-only / cognitive-only tasks
  let screenOnlyFound = false;
  for (const pattern of SCREEN_COGNITIVE_PATTERNS) {
    if (pattern.test(combinedMissionText)) {
      screenOnlyFound = true;
      break;
    }
  }
  if (screenOnlyFound) {
    outdoorScore -= 14;
    issues.push({
      dimension: 'outdoorWorthwhile',
      severity: 'error',
      code: 'OUTDOOR_SCREEN_ONLY_TASK',
      message: 'Mission can be completed on-screen or cognitively without physical outdoor investigation.',
      penalty: 14,
    });
  }

  // Check 5.2: Physical disengagement cues
  if (!PHYSICAL_DISENGAGEMENT_CUES.test(combinedMissionText)) {
    outdoorScore -= 6;
    issues.push({
      dimension: 'outdoorWorthwhile',
      severity: 'warning',
      code: 'OUTDOOR_LACKS_PHYSICAL_DISENGAGEMENT',
      message: 'Mission does not explicitly encourage stepping away from phone or spatial movement.',
      penalty: 6,
    });
  }

  // --------------------------------------------------------------------------
  // BOUNDING & AGGREGATION
  // --------------------------------------------------------------------------
  const finalGrounding = Math.max(0, Math.min(20, groundingScore));
  const finalSpecificity = Math.max(0, Math.min(20, specificityScore));
  const finalSafety = Math.max(0, Math.min(20, safetyScore));
  const finalExecutability = Math.max(0, Math.min(20, executabilityScore));
  const finalOutdoor = Math.max(0, Math.min(20, outdoorScore));

  const totalScore =
    finalGrounding +
    finalSpecificity +
    finalSafety +
    finalExecutability +
    finalOutdoor;

  const grounded = finalGrounding >= 14;
  const specific = finalSpecificity >= 14;
  const safe = finalSafety >= 14;
  const executable = finalExecutability >= 14;
  const outdoorWorthwhile = finalOutdoor >= 14;

  const passed =
    totalScore >= 70 &&
    grounded &&
    specific &&
    safe &&
    executable &&
    outdoorWorthwhile;

  return {
    totalScore,
    passed,
    grounded,
    specific,
    safe,
    executable,
    outdoorWorthwhile,
    dimensionScores: {
      grounding: finalGrounding,
      specificity: finalSpecificity,
      safety: finalSafety,
      executability: finalExecutability,
      outdoorWorthwhile: finalOutdoor,
    },
    issues,
  };
}
