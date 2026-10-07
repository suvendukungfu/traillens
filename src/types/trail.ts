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
