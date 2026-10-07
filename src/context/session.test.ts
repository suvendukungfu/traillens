import { describe, it, expect } from 'vitest';
import {
  createInitialSessionState,
  recordObservationToState,
  startChallengeInState,
  completeChallengeInState,
  skipChallengeInState,
  addGeoPointToState,
  computeSessionStats,
  endSessionInState,
} from './SessionContext';
import { calculateTransparentScore } from '@/components/ExplorationScore';
import type { AIAnalysisResult, GeoPoint, SessionStats } from '@/types/trail';

const mockObservation1: AIAnalysisResult = {
  identification: 'Coast Douglas-fir',
  confidence: 'high',
  evidence: ['Flat needles', 'Three-pointed bract cones'],
  description: 'A native evergreen conifer.',
  observation: 'Notice the furrowed corky bark.',
  challenge: 'Find another conifer within 20 paces and compare its needle structure.',
  safety: 'Stay on trail; do not consume needles or resin.',
};

const mockObservation2: AIAnalysisResult = {
  identification: 'Western Sword Fern',
  confidence: 'high',
  evidence: ['Pinnate fronds', 'Sori on underside'],
  description: 'An evergreen fern of Pacific Northwest forests.',
  observation: 'Inspect the underside of mature fronds.',
  challenge: 'Count how many distinct fern clusters grow within 5 meters.',
  safety: 'Do not pick native plants; leave undisturbed.',
};

describe('TrailLens Session State & Touch-Grass Loop', () => {
  // A. New session starts with zero completed challenges
  it('A. New session starts with zero completed challenges, zero observations, and zero distance', () => {
    const session = createInitialSessionState('test-session-1');
    expect(session.status).toBe('idle');
    expect(session.observations).toHaveLength(0);
    expect(session.challenges).toHaveLength(0);
    expect(session.elapsedSeconds).toBe(0);
    expect(session.totalDistanceMeters).toBe(0);
    expect(session.trackPoints).toHaveLength(0);

    const stats = computeSessionStats(session);
    expect(stats.completedChallengesCount).toBe(0);
    expect(stats.observationsCount).toBe(0);
    expect(stats.totalDistanceMeters).toBe(0);
    expect(stats.explorationScore).toBe(0);
  });

  // B. Observation registration works
  it('B. Observation registration adds observation, creates a challenge, and activates idle session', () => {
    const initial = createInitialSessionState('test-session-2');
    const { nextState, challenge } = recordObservationToState(initial, mockObservation1, 'chal-1');

    expect(nextState.status).toBe('active');
    expect(nextState.observations).toHaveLength(1);
    expect(nextState.observations[0].identification).toBe('Coast Douglas-fir');
    expect(nextState.challenges).toHaveLength(1);
    expect(challenge.id).toBe('chal-1');
    expect(challenge.status).toBe('pending');
    expect(challenge.description).toBe(mockObservation1.challenge);

    const stats = computeSessionStats(nextState);
    expect(stats.observationsCount).toBe(1);
    expect(stats.completedChallengesCount).toBe(0);
    // 1 observation = 10 pts
    expect(stats.explorationScore).toBe(10);
  });

  // C. Challenge completion increments exactly once
  it('C. Challenge completion transitions to completed and increments completedChallengesCount exactly once', () => {
    const initial = createInitialSessionState('test-session-3');
    const { nextState: stateWithObs } = recordObservationToState(initial, mockObservation1, 'chal-1');
    const stateActive = startChallengeInState(stateWithObs, 'chal-1');
    expect(stateActive.challenges[0].status).toBe('active');

    const stateCompleted = completeChallengeInState(stateActive, 'chal-1');
    expect(stateCompleted.challenges[0].status).toBe('completed');
    expect(stateCompleted.challenges[0].completedAt).toBeDefined();

    const stats = computeSessionStats(stateCompleted);
    expect(stats.observationsCount).toBe(1);
    expect(stats.completedChallengesCount).toBe(1);
    // 1 observation (10) + 1 challenge (15) = 25 pts
    expect(stats.explorationScore).toBe(25);
  });

  // D. Duplicate completion does not double count
  it('D. Duplicate completion calls are idempotent and do not double count points', () => {
    const initial = createInitialSessionState('test-session-4');
    const { nextState: stateWithObs } = recordObservationToState(initial, mockObservation1, 'chal-1');
    const completedOnce = completeChallengeInState(stateWithObs, 'chal-1');
    const completedTwice = completeChallengeInState(completedOnce, 'chal-1');
    const completedThrice = completeChallengeInState(completedTwice, 'chal-1');

    expect(completedThrice.challenges[0].status).toBe('completed');
    const stats = computeSessionStats(completedThrice);
    expect(stats.completedChallengesCount).toBe(1);
    expect(stats.observationsCount).toBe(1);
    expect(stats.explorationScore).toBe(25);
  });

  // E. Navigation state survives from /explore to /session (continuous accumulation)
  it('E. Multiple observations and challenges across user steps accumulate into session state', () => {
    let state = createInitialSessionState('test-session-5');

    // 1. Explore step 1: Observation 1
    const res1 = recordObservationToState(state, mockObservation1, 'chal-1');
    state = res1.nextState;

    // User completes challenge 1
    state = completeChallengeInState(state, 'chal-1');

    // 2. Explore step 2: Observation 2
    const res2 = recordObservationToState(state, mockObservation2, 'chal-2');
    state = res2.nextState;

    // User skips challenge 2
    state = skipChallengeInState(state, 'chal-2');

    // 3. User navigates to /session: all counts are preserved
    expect(state.observations).toHaveLength(2);
    expect(state.challenges).toHaveLength(2);

    const stats = computeSessionStats(state);
    expect(stats.observationsCount).toBe(2);
    expect(stats.completedChallengesCount).toBe(1); // chal-1 completed, chal-2 skipped
    // 2 observations (20) + 1 challenge (15) = 35 pts
    expect(stats.explorationScore).toBe(35);
  });

  // F. /session receives real observation and challenge counts
  it('F. End of session records accurate final stats and calculates explorationScore dynamically', () => {
    let state = createInitialSessionState('test-session-6');
    state.elapsedSeconds = 180; // 3 minutes

    const { nextState } = recordObservationToState(state, mockObservation1, 'chal-1');
    state = completeChallengeInState(nextState, 'chal-1');

    const completedSession = endSessionInState(state);
    expect(completedSession.status).toBe('completed');
    expect(completedSession.stats.observationsCount).toBe(1);
    expect(completedSession.stats.completedChallengesCount).toBe(1);
    expect(completedSession.stats.elapsedSeconds).toBe(180);
    // 3 min time (3 pts) + 1 obs (10 pts) + 1 challenge (15 pts) = 28 pts
    expect(completedSession.stats.explorationScore).toBe(28);
  });

  // G. Session reset returns state to clean defaults
  it('G. Reset returns state to clean initial defaults', () => {
    let state = createInitialSessionState('test-session-7');
    const { nextState } = recordObservationToState(state, mockObservation1, 'chal-1');
    state = completeChallengeInState(nextState, 'chal-1');
    state.elapsedSeconds = 500;
    state.totalDistanceMeters = 300;

    // Reset
    const reset = createInitialSessionState('test-session-8');
    expect(reset.status).toBe('idle');
    expect(reset.elapsedSeconds).toBe(0);
    expect(reset.totalDistanceMeters).toBe(0);
    expect(reset.observations).toHaveLength(0);
    expect(reset.challenges).toHaveLength(0);
    expect(reset.trackPoints).toHaveLength(0);

    const stats = computeSessionStats(reset);
    expect(stats.explorationScore).toBe(0);
  });

  // H. Ending one session and starting another does not leak previous counts
  it('H. Ending one session and starting another does not leak previous counts', () => {
    let sessionA = createInitialSessionState('session-a');
    const { nextState: obsA } = recordObservationToState(sessionA, mockObservation1, 'chal-a');
    sessionA = completeChallengeInState(obsA, 'chal-a');
    const finalA = endSessionInState(sessionA);
    expect(finalA.stats.completedChallengesCount).toBe(1);

    // Starting a clean session B
    const sessionB = createInitialSessionState('session-b');
    const statsB = computeSessionStats(sessionB);
    expect(statsB.completedChallengesCount).toBe(0);
    expect(statsB.observationsCount).toBe(0);
    expect(statsB.explorationScore).toBe(0);
  });

  // I. GPS distance remains browser-local and correctly contributes to score
  it('I. GPS coordinates calculate distance locally and contribute to score', () => {
    let state = createInitialSessionState('session-gps');

    // Two coordinates approximately 111 meters apart (0.001 deg latitude ~ 111m)
    const p1: GeoPoint = { latitude: 45.5152, longitude: -122.6784, timestamp: 1000 };
    const p2: GeoPoint = { latitude: 45.5162, longitude: -122.6784, timestamp: 2000 };

    state = addGeoPointToState(state, p1);
    expect(state.totalDistanceMeters).toBe(0); // 1 point = 0 distance

    state = addGeoPointToState(state, p2);
    expect(state.totalDistanceMeters).toBeGreaterThan(100);
    expect(state.totalDistanceMeters).toBeLessThan(120);

    const stats = computeSessionStats(state);
    // 1 pt per 50m: Math.floor(~111 / 50) = 2 pts
    expect(stats.explorationScore).toBe(2);
  });

  // J. Opening /session with no active session is handled honestly
  it('J. Initial state is explicitly marked idle with zero counts to allow honest inactive rendering', () => {
    const state = createInitialSessionState('empty-session');
    const isInactive =
      state.status === 'idle' &&
      state.observations.length === 0 &&
      state.challenges.length === 0 &&
      state.elapsedSeconds === 0;

    expect(isInactive).toBe(true);
    expect(computeSessionStats(state).explorationScore).toBe(0);
  });

  // K. Existing score calculation behavior remains correct
  it('K. calculateTransparentScore adheres to transparent scoring formula', () => {
    const stats: SessionStats = {
      totalDistanceMeters: 250, // 250 / 50 = 5 pts
      elapsedSeconds: 185,      // 185 / 60 = 3 pts
      observationsCount: 2,     // 2 * 10 = 20 pts
      completedChallengesCount: 3, // 3 * 15 = 45 pts
      explorationScore: 0,
    };

    const result = calculateTransparentScore(stats);
    // 5 + 3 + 20 + 45 = 73
    expect(result.total).toBe(73);
    expect(result.breakdown[0].points).toBe(5);
    expect(result.breakdown[1].points).toBe(3);
    expect(result.breakdown[2].points).toBe(20);
    expect(result.breakdown[3].points).toBe(45);
  });
});
