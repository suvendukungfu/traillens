'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  OutdoorSession,
  OutdoorChallenge,
  AIAnalysisResult,
  GeoPoint,
  SessionStats,
  SessionStatus,
} from '@/types/trail';
import { geoManager, GeoTrackingError } from '@/lib/geolocation';
import { calculateTrackDistance } from '@/lib/distance';
import { calculateTransparentScore } from '@/components/ExplorationScore';

/**
 * Pure session state representation (in-memory, browser-local)
 */
export interface ActiveSessionState {
  sessionId: string;
  startTime: number;
  status: SessionStatus;
  elapsedSeconds: number;
  trackPoints: GeoPoint[];
  totalDistanceMeters: number;
  observations: AIAnalysisResult[];
  challenges: OutdoorChallenge[];
  activeChallenge: OutdoorChallenge | null;
  geoError: string | null;
}

export function createInitialSessionState(sessionId?: string): ActiveSessionState {
  return {
    sessionId: sessionId || 'session-' + Date.now(),
    startTime: Date.now(),
    status: 'idle',
    elapsedSeconds: 0,
    trackPoints: [],
    totalDistanceMeters: 0,
    observations: [],
    challenges: [],
    activeChallenge: null,
    geoError: null,
  };
}

export function recordObservationToState(
  state: ActiveSessionState,
  observation: AIAnalysisResult,
  challengeId?: string
): { nextState: ActiveSessionState; challenge: OutdoorChallenge } {
  const challengeItem: OutdoorChallenge = {
    id: challengeId || 'challenge-' + Date.now(),
    title: observation.mission?.title || 'Outdoor Field Challenge',
    description: observation.challenge,
    estimatedDuration: observation.mission
      ? `${Math.round(observation.mission.durationSeconds / 60)} mins`
      : '2–5 mins',
    difficulty: 'moderate',
    status: 'pending',
    points: 15,
    mission: observation.mission,
  };

  const nextState: ActiveSessionState = {
    ...state,
    status: state.status === 'idle' ? 'active' : state.status,
    startTime: state.status === 'idle' ? Date.now() : state.startTime,
    observations: [...state.observations, observation],
    challenges: [...state.challenges, challengeItem],
    activeChallenge: challengeItem,
  };

  return { nextState, challenge: challengeItem };
}

export function startChallengeInState(
  state: ActiveSessionState,
  challengeId: string
): ActiveSessionState {
  return {
    ...state,
    challenges: state.challenges.map((c) =>
      c.id === challengeId ? { ...c, status: 'active' } : c
    ),
    activeChallenge:
      state.activeChallenge && state.activeChallenge.id === challengeId
        ? { ...state.activeChallenge, status: 'active' }
        : state.activeChallenge,
  };
}

export function completeChallengeInState(
  state: ActiveSessionState,
  challengeId: string
): ActiveSessionState {
  // Idempotent: check if already completed
  const target = state.challenges.find((c) => c.id === challengeId);
  if (!target || target.status === 'completed') {
    return state;
  }

  const completedAt = Date.now();
  return {
    ...state,
    challenges: state.challenges.map((c) =>
      c.id === challengeId ? { ...c, status: 'completed', completedAt } : c
    ),
    activeChallenge:
      state.activeChallenge && state.activeChallenge.id === challengeId
        ? { ...state.activeChallenge, status: 'completed', completedAt }
        : state.activeChallenge,
  };
}

export function skipChallengeInState(
  state: ActiveSessionState,
  challengeId: string
): ActiveSessionState {
  return {
    ...state,
    challenges: state.challenges.map((c) =>
      c.id === challengeId ? { ...c, status: 'skipped' } : c
    ),
    activeChallenge:
      state.activeChallenge && state.activeChallenge.id === challengeId
        ? { ...state.activeChallenge, status: 'skipped' }
        : state.activeChallenge,
  };
}

export function addGeoPointToState(
  state: ActiveSessionState,
  newPoint: GeoPoint
): ActiveSessionState {
  const updatedPoints = [...state.trackPoints, newPoint];
  const newDistance = calculateTrackDistance(updatedPoints);
  return {
    ...state,
    trackPoints: updatedPoints,
    totalDistanceMeters: newDistance,
    geoError: null,
  };
}

export function computeSessionStats(state: ActiveSessionState): SessionStats {
  const stats: SessionStats = {
    elapsedSeconds: state.elapsedSeconds,
    totalDistanceMeters: state.totalDistanceMeters,
    observationsCount: state.observations.length,
    completedChallengesCount: state.challenges.filter((c) => c.status === 'completed').length,
    explorationScore: 0,
  };
  stats.explorationScore = calculateTransparentScore(stats).total;
  return stats;
}

export function endSessionInState(state: ActiveSessionState): OutdoorSession {
  const stats = computeSessionStats(state);
  return {
    id: state.sessionId,
    startTime: state.startTime,
    endTime: Date.now(),
    status: 'completed',
    trackPoints: state.trackPoints,
    observations: state.observations,
    challenges: state.challenges,
    stats,
  };
}

export interface SessionContextValue {
  session: OutdoorSession | null;
  status: SessionStatus;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  elapsedSeconds: number;
  totalDistanceMeters: number;
  trackPoints: GeoPoint[];
  observations: AIAnalysisResult[];
  challenges: OutdoorChallenge[];
  activeChallenge: OutdoorChallenge | null;
  observationsCount: number;
  completedChallengesCount: number;
  currentStats: SessionStats;
  currentScore: number;
  geoError: string | null;

  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => OutdoorSession | null;
  resetSession: () => void;

  recordObservation: (observation: AIAnalysisResult) => OutdoorChallenge;
  startChallenge: (challengeId: string) => void;
  completeChallenge: (challengeId: string) => void;
  skipChallenge: (challengeId: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveSessionState>(() => createInitialSessionState());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopGeoRef = useRef<(() => void) | null>(null);

  // Stop background timer and GPS watchers
  const stopResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopGeoRef.current) {
      stopGeoRef.current();
      stopGeoRef.current = null;
    }
    geoManager.stopTracking();
  }, []);

  // Teardown resources when provider unmounts
  useEffect(() => {
    return () => {
      stopResources();
    };
  }, [stopResources]);

  // Handle GPS coordinate updates
  const handleGeoPoint = useCallback((newPoint: GeoPoint) => {
    setState((prev) => addGeoPointToState(prev, newPoint));
  }, []);

  const handleGeoError = useCallback((err: GeoTrackingError) => {
    setState((prev) => ({ ...prev, geoError: err.message }));
  }, []);

  // Internal helper to start or resume timers and GPS
  const startTrackingResources = useCallback(() => {
    stopResources();

    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);

    stopGeoRef.current = geoManager.startTracking({
      onPoint: handleGeoPoint,
      onError: handleGeoError,
    });
  }, [stopResources, handleGeoPoint, handleGeoError]);

  // 1. Explicitly start session
  const startSession = useCallback(() => {
    if (state.status === 'active') return;
    setState((prev) => ({
      ...prev,
      status: 'active',
      startTime: prev.status === 'idle' ? Date.now() : prev.startTime,
      geoError: null,
    }));
    startTrackingResources();
  }, [state.status, startTrackingResources]);

  // 2. Pause session
  const pauseSession = useCallback(() => {
    stopResources();
    setState((prev) => ({ ...prev, status: 'paused' }));
  }, [stopResources]);

  // 3. Resume session
  const resumeSession = useCallback(() => {
    if (state.status !== 'paused') return;
    setState((prev) => ({ ...prev, status: 'active', geoError: null }));
    startTrackingResources();
  }, [state.status, startTrackingResources]);

  // 4. End session
  const endSession = useCallback((): OutdoorSession | null => {
    stopResources();
    const completedSession = endSessionInState(state);
    setState((prev) => ({ ...prev, status: 'completed' }));
    return completedSession;
  }, [stopResources, state]);

  // 5. Reset to clean defaults
  const resetSession = useCallback(() => {
    stopResources();
    setState(createInitialSessionState());
  }, [stopResources]);

  // 6. Record observation from /explore
  const recordObservation = useCallback(
    (observation: AIAnalysisResult): OutdoorChallenge => {
      let createdChallenge: OutdoorChallenge | null = null;

      setState((prev) => {
        if (prev.status === 'idle') {
          startTrackingResources();
        }
        const { nextState, challenge } = recordObservationToState(prev, observation);
        createdChallenge = challenge;
        return nextState;
      });

      return (
        createdChallenge || {
          id: 'challenge-' + Date.now(),
          title: observation.mission?.title || 'Outdoor Field Challenge',
          description: observation.challenge,
          estimatedDuration: observation.mission
            ? `${Math.round(observation.mission.durationSeconds / 60)} mins`
            : '2–5 mins',
          difficulty: 'moderate',
          status: 'pending',
          points: 15,
          mission: observation.mission,
        }
      );
    },
    [startTrackingResources]
  );

  // 7. Challenge state controls
  const startChallenge = useCallback((challengeId: string) => {
    setState((prev) => startChallengeInState(prev, challengeId));
  }, []);

  const completeChallenge = useCallback((challengeId: string) => {
    setState((prev) => completeChallengeInState(prev, challengeId));
  }, []);

  const skipChallenge = useCallback((challengeId: string) => {
    setState((prev) => skipChallengeInState(prev, challengeId));
  }, []);

  // Computed metrics and transparent score
  const observationsCount = state.observations.length;
  const completedChallengesCount = useMemo(
    () => state.challenges.filter((c) => c.status === 'completed').length,
    [state.challenges]
  );

  const currentStats: SessionStats = useMemo(
    () => computeSessionStats(state),
    [state]
  );

  const currentScore = currentStats.explorationScore;

  const sessionObject: OutdoorSession = useMemo(
    () => ({
      id: state.sessionId,
      startTime: state.startTime,
      status: state.status,
      trackPoints: state.trackPoints,
      observations: state.observations,
      challenges: state.challenges,
      stats: currentStats,
    }),
    [state, currentStats]
  );

  const value: SessionContextValue = {
    session: sessionObject,
    status: state.status,
    isActive: state.status === 'active',
    isPaused: state.status === 'paused',
    isCompleted: state.status === 'completed',
    elapsedSeconds: state.elapsedSeconds,
    totalDistanceMeters: state.totalDistanceMeters,
    trackPoints: state.trackPoints,
    observations: state.observations,
    challenges: state.challenges,
    activeChallenge: state.activeChallenge,
    observationsCount,
    completedChallengesCount,
    currentStats,
    currentScore,
    geoError: state.geoError,

    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,

    recordObservation,
    startChallenge,
    completeChallenge,
    skipChallenge,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
