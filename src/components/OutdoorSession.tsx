'use client';

import React from 'react';
import type { OutdoorSession as SessionType } from '@/types/trail';
import ExplorationScore from './ExplorationScore';
import {
  Play,
  Pause,
  Square,
  MapPin,
  Clock,
  Footprints,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';

interface OutdoorSessionProps {
  initialSession?: SessionType | null;
  onSessionComplete?: (session: SessionType) => void;
  observationsCount?: number;
  completedChallengesCount?: number;
}

export default function OutdoorSession({
  onSessionComplete,
}: OutdoorSessionProps = {}) {
  const {
    status,
    elapsedSeconds,
    totalDistanceMeters,
    trackPoints,
    observations,
    challenges,
    fieldRecords,
    observationsCount,
    completedChallengesCount,
    currentStats,
    geoError,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
  } = useSession();

  // Start / Resume session
  const handleStartOrResume = () => {
    if (status === 'paused') {
      resumeSession();
    } else {
      startSession();
    }
  };

  // Pause session
  const handlePause = () => {
    pauseSession();
  };

  // End session
  const handleEnd = () => {
    const completed = endSession();
    if (completed && onSessionComplete) {
      onSessionComplete(completed);
    }
  };

  // Reset to new session
  const handleReset = () => {
    resetSession();
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
                    : status === 'completed'
                      ? 'bg-emerald-600'
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
              {(totalDistanceMeters / 1000).toFixed(2)}{' '}
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
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-surface-muted hover:bg-border-subtle text-foreground border border-border-strong flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
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
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-colors"
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
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Observations logged during this session */}
      {observations.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-rock flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-moss" />
              Session Field Record
            </span>
            <span className="text-xs font-semibold text-moss">
              {observations.length} {observations.length === 1 ? 'Observation' : 'Observations'}
            </span>
          </div>

          <div className="space-y-2">
            {observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-muted border border-border-subtle text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-foreground">{obs.identification}</h4>
                  <p className="text-[11px] text-rock line-clamp-1 mt-0.5">{obs.description}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-moss-light text-moss-dark">
                  {obs.confidence}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges in this session */}
      {challenges.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-rock flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-moss" />
              Field Challenges
            </span>
            <span className="text-xs font-semibold text-moss">
              {completedChallengesCount} of {challenges.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-surface-muted border border-border-subtle text-xs flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {c.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                    <h4 className="font-bold text-foreground">{c.title}</h4>
                  </div>
                  <p className="text-[11px] text-rock line-clamp-1 mt-0.5 pl-5">{c.description}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {c.status === 'completed' ? `+${c.points} pts` : c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Field Records (M3 Naturalist Log) */}
      {fieldRecords.length > 0 && (
        <div className="bg-surface border border-emerald-300 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              Completed Field Records
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {fieldRecords.length} Grounded in Nature
            </span>
          </div>

          <div className="space-y-2.5">
            {fieldRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-surface-muted border border-border-subtle text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      {rec.missionTitle}
                    </h4>
                    <p className="text-[11px] text-rock mt-0.5">
                      Target: <strong className="text-foreground">{rec.target}</strong>
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    +{rec.pointsEarned} pts
                  </span>
                </div>

                {rec.userReflection && (
                  <div className="p-2.5 rounded-xl bg-surface border border-border-subtle">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-moss block mb-0.5">
                      Naturalist Reflection:
                    </span>
                    <blockquote className="text-xs italic text-foreground leading-relaxed pl-2 border-l-2 border-moss">
                      &ldquo;{rec.userReflection}&rdquo;
                    </blockquote>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-rock pt-1 border-t border-border-subtle/40">
                  <span>
                    Duration: ~{Math.round(rec.durationSeconds / 60)} mins
                  </span>
                  <span>
                    Recorded at{' '}
                    {new Date(rec.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exploration Score Display */}
      <ExplorationScore stats={currentStats} />
    </div>
  );
}
