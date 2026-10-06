'use client';

import React from 'react';
import { OutdoorChallenge } from '@/types/trail';
import { Compass, CheckCircle2, Clock, Footprints, ArrowRight, EyeOff } from 'lucide-react';

interface ChallengeCardProps {
  challenge: OutdoorChallenge;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}

export default function ChallengeCard({
  challenge,
  onStart,
  onComplete,
  onSkip,
}: ChallengeCardProps) {
  const isPending = challenge.status === 'pending';
  const isActive = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';

  return (
    <div
      className={`rounded-2xl border transition-all p-5 shadow-xs ${
        isActive
          ? 'bg-[#192b1e] text-[#fbfaf6] border-[#2d5a37] ring-2 ring-[#e6a817]'
          : isCompleted
            ? 'bg-[#f4f7f4] text-[#1c261e] border-[#b8d6be]'
            : 'bg-surface text-foreground border-border-subtle'
      }`}
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-[#2d5a37] text-white'
                : isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-surface-muted text-rock'
            }`}
          >
            <Compass className="w-3 h-3" />
            Field Challenge
          </span>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isActive ? 'bg-white/10 text-emerald-200' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            {challenge.estimatedDuration}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            isActive ? 'bg-[#e6a817] text-black' : 'bg-amber-100 text-amber-900'
          }`}
        >
          +{challenge.points} pts
        </span>
      </div>

      {/* Title & Description */}
      <h3
        className={`text-lg font-bold tracking-tight mb-2 ${
          isActive ? 'text-white' : 'text-foreground'
        }`}
      >
        {challenge.title}
      </h3>
      <p
        className={`text-sm leading-relaxed mb-4 ${
          isActive ? 'text-emerald-100' : 'text-rock'
        }`}
      >
        {challenge.description}
      </p>

      {/* Screen-Off Mode Callout when Active */}
      {isActive && (
        <div className="my-4 p-3.5 rounded-xl bg-black/30 border border-emerald-500/30 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px] mb-0.5">
              Phone-Away Directive
            </p>
            <p className="text-gray-200 leading-normal">
              Put this phone in your pocket. Observe your physical surroundings with your eyes. Return
              and tap Complete when you are done.
            </p>
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-2 pt-3 border-t border-black/10 flex items-center justify-between gap-3">
        {isPending && (
          <button
            type="button"
            onClick={() => onStart?.(challenge.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm transition-transform active:scale-98"
          >
            <Footprints className="w-4 h-4" />
            <span>Accept Challenge & Put Phone Away</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}

        {isActive && (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={() => onComplete?.(challenge.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm transition-transform active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Did It — Complete</span>
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={() => onSkip(challenge.id)}
                className="py-3 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10"
              >
                Skip
              </button>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="w-full flex items-center justify-between py-1 text-emerald-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Challenge Completed in Nature</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Earned +{challenge.points}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
