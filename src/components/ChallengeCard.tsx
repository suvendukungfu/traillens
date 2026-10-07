'use client';

import React from 'react';
import { OutdoorChallenge } from '@/types/trail';
import { Compass, CheckCircle2, Clock, Footprints, ArrowRight, EyeOff } from 'lucide-react';
import Link from 'next/link';

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
          ? 'bg-moss-dark text-white border-moss ring-2 ring-amber-400'
          : isCompleted
            ? 'bg-surface-muted text-foreground border-emerald-300'
            : 'bg-surface text-foreground border-border-subtle'
      }`}
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-moss text-white'
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
              isActive ? 'bg-white/15 text-emerald-100' : 'bg-surface-muted text-rock'
            }`}
          >
            <Clock className="w-3 h-3" />
            {challenge.estimatedDuration || '2–5 mins'}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
            isActive ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-900'
          }`}
        >
          +{challenge.points} pts
        </span>
      </div>

      {/* Title & Description / Mission Details */}
      <h3
        className={`text-lg font-bold tracking-tight mb-2 ${
          isActive ? 'text-white' : 'text-foreground'
        }`}
      >
        {challenge.title}
      </h3>

      {challenge.mission ? (
        <div className="space-y-2.5 mb-4 text-xs">
          <div className={`p-3 rounded-xl border ${isActive ? 'bg-white/10 border-white/20' : 'bg-surface-muted border-border-subtle'}`}>
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 text-moss">
              What to look for:
            </span>
            <p className={`font-medium ${isActive ? 'text-emerald-50' : 'text-foreground'}`}>
              {challenge.mission.target}
            </p>
          </div>

          {challenge.mission.steps.length > 0 && (
            <div className={`p-3 rounded-xl border ${isActive ? 'bg-white/10 border-white/20' : 'bg-surface-muted border-border-subtle'}`}>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 text-moss">
                Mission Steps:
              </span>
              <ol className={`space-y-1 list-decimal list-inside ${isActive ? 'text-emerald-100' : 'text-rock'}`}>
                {challenge.mission.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-1 px-1">
            <span className={`text-[11px] ${isActive ? 'text-emerald-200' : 'text-rock'}`}>
              <strong className={isActive ? 'text-white' : 'text-foreground'}>Success: </strong>
              {challenge.mission.successCriteria}
            </span>
          </div>
        </div>
      ) : (
        <p
          className={`text-sm leading-relaxed mb-4 ${
            isActive ? 'text-emerald-100' : 'text-rock'
          }`}
        >
          {challenge.description}
        </p>
      )}

      {/* Screen-Off Mode Callout when Active */}
      {isActive && (
        <div className="my-4 p-3.5 rounded-xl bg-black/20 border border-emerald-400/30 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px] mb-0.5">
              Phone-Away Directive
            </p>
            <p className="text-gray-100 leading-normal">
              Put your phone away for 2 minutes. Observe your physical surroundings with your eyes. Return and tap &ldquo;I&apos;m done&rdquo; when finished.
            </p>
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-2 pt-3 border-t border-border-subtle/50 flex flex-col gap-3">
        {isPending && (
          <button
            type="button"
            onClick={() => onStart?.(challenge.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm transition-transform active:scale-98 cursor-pointer"
            aria-label="Accept field challenge and put phone away"
          >
            <Footprints className="w-4 h-4" />
            <span>Put Phone Away & Explore</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}

        {isActive && (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={() => onComplete?.(challenge.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm transition-transform active:scale-98 cursor-pointer"
              aria-label="Mark challenge completed in nature"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I&apos;m done</span>
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={() => onSkip(challenge.id)}
                className="py-3 px-3 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                Skip
              </button>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-emerald-800">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Challenge complete ✓</span>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Earned +{challenge.points} pts
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-rock">Observation and challenge recorded.</span>
              <Link
                href="/session"
                className="inline-flex items-center gap-1 text-xs font-bold text-moss hover:text-moss-dark underline"
              >
                <span>View Session</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
