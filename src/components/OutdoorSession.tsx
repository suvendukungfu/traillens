'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { OutdoorSession as SessionType, GeoPoint, SessionStats } from '@/types/trail';
import { geoManager, GeoTrackingError } from '@/lib/geolocation';
import { calculateTrackDistance } from '@/lib/distance';
import ExplorationScore from './ExplorationScore';
import { Play, Pause, Square, MapPin, Clock, Footprints, AlertTriangle, Sparkles } from 'lucide-react';

interface OutdoorSessionProps {
  initialSession?: SessionType | null;
  onSessionComplete?: (session: SessionType) => void;
  observationsCount?: number;
  completedChallengesCount?: number;
}

export default function OutdoorSession({
  initialSession,
  onSessionComplete,
  observationsCount = 0,
  completedChallengesCount = 0,
}: OutdoorSessionProps) {
  const [status, setStatus] = useState<SessionType['status']>(
    initialSession?.status || 'idle'
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    initialSession?.stats.elapsedSeconds || 0
  );
  const [trackPoints, setTrackPoints] = useState<GeoPoint[]>(
    initialSession?.trackPoints || []
  );
  const [distanceMeters, setDistanceMeters] = useState<number>(
    initialSession?.stats.totalDistanceMeters || 0
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopGeoRef = useRef<(() => void) | null>(null);

  // Stop all timers and watchers cleanly
  const teardownResources = useCallback(() => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownResources();
    };
  }, [teardownResources]);

  // Handle incoming geolocation coordinates
  const handleGeoPoint = useCallback((newPoint: GeoPoint) => {
    setTrackPoints((prev) => {
      const updated = [...prev, newPoint];
      const newDistance = calculateTrackDistance(updated);
      setDistanceMeters(newDistance);
      return updated;
    });
    setGeoError(null);
  }, []);

  const handleGeoError = useCallback((err: GeoTrackingError) => {
    setGeoError(err.message);
  }, []);

  // Start / Resume session
  const handleStartOrResume = () => {
    teardownResources();
    setStatus('active');
    setGeoError(null);

    // Start timer interval
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Start geolocation tracking
    stopGeoRef.current = geoManager.startTracking({
      onPoint: handleGeoPoint,
      onError: handleGeoError,
    });
  };

  // Pause session
  const handlePause = () => {
    teardownResources();
    setStatus('paused');
  };

  // End session
  const handleEnd = () => {
    teardownResources();
    setStatus('completed');

    const completedSession: SessionType = {
      id: initialSession?.id || 'session-' + Date.now(),
      startTime: initialSession?.startTime || Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      status: 'completed',
      trackPoints,
      observations: [],
      challenges: [],
      stats: {
        elapsedSeconds,
        totalDistanceMeters: distanceMeters,
        observationsCount,
        completedChallengesCount,
        explorationScore: 0, // Calculated dynamically
      },
    };

    onSessionComplete?.(completedSession);
  };

  // Reset to new session
  const handleReset = () => {
    teardownResources();
    setStatus('idle');
    setElapsedSeconds(0);
    setTrackPoints([]);
    setDistanceMeters(0);
    setGeoError(null);
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentStats: SessionStats = {
    elapsedSeconds,
    totalDistanceMeters: distanceMeters,
    observationsCount,
    completedChallengesCount,
    explorationScore: 0,
  };

  return (
    <div className="space-y-4">
      {/* Metrics Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'active'
                  ? 'bg-emerald-500 animate-pulse'
                  : status === 'paused'
                    ? 'bg-amber-400'
                    : 'bg-stone-300'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {status === 'active'
                ? 'Session Live Outdoors'
                : status === 'paused'
                  ? 'Session Paused'
                  : status === 'completed'
                    ? 'Session Completed'
                    : 'Ready to Explore'}
            </span>
          </div>

          <span className="text-xs font-semibold text-rock">
            {trackPoints.length} GPS Fixes
          </span>
        </div>

        {/* Big HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <div className="bg-surface-muted p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rock uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-moss" />
              Time
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="bg-surface-muted p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rock uppercase tracking-wider mb-1">
              <Footprints className="w-3.5 h-3.5 text-moss" />
              Distance
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {(distanceMeters / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-rock">km</span>
            </div>
          </div>

          <div className="bg-surface-muted p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rock uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-moss" />
              Observations
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {observationsCount}
            </div>
          </div>

          <div className="bg-surface-muted p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rock uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-moss" />
              Challenges
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {completedChallengesCount}
            </div>
          </div>
        </div>

        {/* Geolocation status warning */}
        {geoError && (
          <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Primary Controls */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {status === 'idle' && (
            <button
              type="button"
              onClick={handleStartOrResume}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Outdoor Session</span>
            </button>
          )}

          {status === 'active' && (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-surface-muted hover:bg-border-subtle text-foreground border border-border-strong flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-xs"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>End Session</span>
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                type="button"
                onClick={handleStartOrResume}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>End Session</span>
              </button>
            </>
          )}

          {status === 'completed' && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Exploration Score Display */}
      <ExplorationScore stats={currentStats} />
    </div>
  );
}
