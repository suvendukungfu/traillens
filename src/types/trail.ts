/**
 * TrailLens - Canonical Domain Types
 * Outdoor-first AI companion types
 */

export type AIConfidence = 'low' | 'medium' | 'high';

export interface AIAnalysisResult {
  identification: string;
  confidence: AIConfidence;
  evidence: string[];
  description: string;
  observation: string;
  challenge: string;
  safety: string;
  inferenceDurationMs?: number;
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
}
