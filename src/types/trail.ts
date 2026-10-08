/**
 * TrailLens - Canonical Domain Types
 * Outdoor-first AI companion types
 */

export type AIConfidence = 'low' | 'medium' | 'high';

export type MissionType =
  | 'OBSERVE'
  | 'COMPARE'
  | 'COUNT'
  | 'NOTICE'
  | 'TRACE'
  | 'PATTERN';

export interface FieldMission {
  missionType: MissionType;
  title: string;
  target: string;
  durationSeconds: number; // bounded between 120 and 300
  steps: string[]; // 1 to 4 steps
  successCriteria: string;
  safetyConstraints: string[];
}

export interface InferenceTelemetry {
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalDurationMs?: number;
  generationDurationMs?: number;
  promptTokens?: number;
  outputTokens?: number;
}

export interface MissionQualityIssue {
  dimension: 'grounding' | 'specificity' | 'safety' | 'executability' | 'outdoorWorthwhile';
  severity: 'warning' | 'error';
  code: string;
  message: string;
  penalty: number;
}

export interface DimensionScores {
  grounding: number;
  specificity: number;
  safety: number;
  executability: number;
  outdoorWorthwhile: number;
}

export interface MissionQualityReport {
  totalScore: number;
  passed: boolean;
  grounded: boolean;
  specific: boolean;
  safe: boolean;
  executable: boolean;
  outdoorWorthwhile: boolean;
  dimensionScores: DimensionScores;
  issues: MissionQualityIssue[];
}

export interface FieldComparison {
  leftSubject: string;
  rightSubject: string;
  sharedFeatures: string[];
  differences: string[];
  uncertainty: string[];
  recommendedObservation: string;
}

export interface AIAnalysisResult {
  identification: string;
  confidence: AIConfidence;
  uncertaintyReason?: string;
  evidence: string[];
  description: string;
  observation: string;
  mission?: FieldMission; // Structured source of truth
  challenge: string; // Presentation projection (backward compatible)
  safety: string;
  inferenceDurationMs?: number;
  telemetry?: InferenceTelemetry;
  qualityReport?: MissionQualityReport; // M4: Deterministic quality evaluation
  comparison?: FieldComparison; // Field Twin comparison result
}

export type ChallengeDifficulty = 'easy' | 'moderate' | 'curious';
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface OutdoorChallenge {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  points: number;
  completedAt?: number;
  mission?: FieldMission;
  userReflection?: string; // M3: User-authored reflection recorded upon return
}

export interface FieldRecord {
  id: string;
  challengeId: string;
  timestamp: number;
  subjectIdentification: string;
  missionTitle: string;
  missionType: MissionType;
  target: string;
  durationSeconds: number;
  distanceMeters: number;
  userReflection?: string;
  pointsEarned: number;
  successCriteria: string;
  safetyConfirmed: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface SessionStats {
  elapsedSeconds: number;
  totalDistanceMeters: number;
  observationsCount: number;
  completedChallengesCount: number;
  explorationScore: number;
}

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface OutdoorSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: SessionStatus;
  trackPoints: GeoPoint[];
  observations: AIAnalysisResult[];
  challenges: OutdoorChallenge[];
  stats: SessionStats;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  ollamaConnected: boolean;
  modelAvailable: boolean;
  configuredModel: string;
  ollamaBaseUrl: string;
  availableModels: string[];
  timestamp: string;
  modelWarmed?: boolean;
}
