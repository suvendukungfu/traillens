'use client';

import React, { useState } from 'react';
import OutdoorSession from '@/components/OutdoorSession';
import type { OutdoorSession as SessionType } from '@/types/trail';
import Link from 'next/link';
import { Sparkles, EyeOff, Compass, Play } from 'lucide-react';
import { useSession } from '@/context/SessionContext';

export default function SessionPage() {
  const [completedSessions, setCompletedSessions] = useState<SessionType[]>([]);
  const {
    status,
    observationsCount,
    completedChallengesCount,
    elapsedSeconds,
    startSession,
  } = useSession();

  const handleSessionComplete = (session: SessionType) => {
    setCompletedSessions((prev) => [session, ...prev]);
  };

  const hasNoActiveSession =
    status === 'idle' &&
    observationsCount === 0 &&
    completedChallengesCount === 0 &&
    elapsedSeconds === 0;

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-moss">
            Field Activity
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Outdoor Session
          </h1>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-moss hover:bg-moss-dark text-white shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Capture Subject</span>
        </Link>
      </div>

      {/* Screen-off reminder banner */}
      <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle flex items-start gap-3 text-xs text-rock">
        <EyeOff className="w-4 h-4 text-moss shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Field Tip:</strong> Start your session,
          put your phone in your pocket, and let your senses explore the outdoors. TrailLens logs your
          distance privately in the background.
        </p>
      </div>

      {/* Honest Inactive / Empty State if no active session */}
      {hasNoActiveSession ? (
        <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-muted border border-border-subtle flex items-center justify-center text-moss">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-foreground">
              No Active Outdoor Session
            </h2>
            <p className="text-xs text-rock leading-relaxed">
              TrailLens reports honest exploration metrics. You do not currently have a session running. Start one below to track your outdoor time and distance, or visit Explore to identify a nature specimen and get an outdoor field challenge.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={startSession}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Outdoor Session</span>
            </button>
            <Link
              href="/explore"
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-xs bg-surface-muted hover:bg-border-subtle text-foreground border border-border-subtle flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-moss" />
              <span>Explore & Capture</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Primary Session Manager */
        <OutdoorSession onSessionComplete={handleSessionComplete} />
      )}

      {/* History of Completed Sessions (Local Session state) */}
      {completedSessions.length > 0 && (
        <div className="pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rock">
            Recent Completed Sessions (This Visit)
          </h3>
          <div className="space-y-2">
            {completedSessions.map((s, idx) => (
              <div
                key={s.id || idx}
                className="p-3.5 rounded-2xl bg-surface border border-border-subtle text-xs flex items-center justify-between shadow-2xs"
              >
                <div>
                  <span className="font-bold text-foreground">
                    Session #{completedSessions.length - idx}
                  </span>
                  <div className="text-[11px] text-rock mt-0.5">
                    {Math.floor(s.stats.elapsedSeconds / 60)}m duration •{' '}
                    {(s.stats.totalDistanceMeters / 1000).toFixed(2)} km • Score: {s.stats.explorationScore} pts
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Finished
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
