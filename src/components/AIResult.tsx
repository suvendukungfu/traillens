'use client';

import React from 'react';
import type { AIAnalysisResult, OutdoorChallenge } from '@/types/trail';
import ChallengeCard from './ChallengeCard';
import {
  ShieldAlert,
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface AIResultProps {
  result: AIAnalysisResult;
  onChallengeStart?: (challengeId: string) => void;
  onChallengeComplete?: (challengeId: string, userReflection?: string) => void;
  onChallengeSkip?: (challengeId: string) => void;
  activeChallenge?: OutdoorChallenge | null;
  onNewObservation?: () => void;
}

export default function AIResult({
  result,
  onChallengeStart,
  onChallengeComplete,
  onChallengeSkip,
  activeChallenge,
  onNewObservation,
}: AIResultProps) {
  // Confidence badge helpers
  const confidenceConfig = {
    high: {
      label: 'High Confidence',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle,
    },
    medium: {
      label: 'Moderate Confidence',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: AlertCircle,
    },
    low: {
      label: 'Tentative / Low Confidence',
      badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
      icon: HelpCircle,
    },
  }[result.confidence] || {
    label: 'Observation',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: HelpCircle,
  };

  const ConfidenceIcon = confidenceConfig.icon;

  // Synthesize or use existing challenge
  const challengeItem: OutdoorChallenge = activeChallenge || {
    id: 'ai-generated-field-challenge',
    title: result.mission?.title || 'Outdoor Field Challenge',
    description: result.challenge,
    estimatedDuration: result.mission
      ? `${Math.round(result.mission.durationSeconds / 60)} mins`
      : '2–5 mins',
    difficulty: 'moderate',
    status: 'pending',
    points: 15,
    mission: result.mission,
  };

  const isMissionActive = challengeItem.status === 'active';
  const isMissionCompleted = challengeItem.status === 'completed';

  // If in Pocket Mode (Active Mission), minimize all screen distractions
  if (isMissionActive) {
    return (
      <article
        className="space-y-4 animate-in fade-in-50 duration-200"
        aria-label="Pocket mode field mission"
      >
        <div className="flex items-center justify-between px-2 text-xs text-rock">
          <span className="font-semibold text-foreground">
            Subject: {result.identification}
          </span>
          <span>Mission in Progress</span>
        </div>

        {/* Pocket Mode takes full focus */}
        <ChallengeCard
          challenge={challengeItem}
          onStart={onChallengeStart}
          onComplete={onChallengeComplete}
          onSkip={onChallengeSkip}
          onNewObservation={onNewObservation}
        />
      </article>
    );
  }

  return (
    <article
      className="space-y-5 animate-in fade-in-50 duration-300"
      aria-label="Field guide observation result"
    >
      {/* 1. Field Guide Header */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rock flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-moss" />
            Field Identification
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${confidenceConfig.badgeClass}`}
          >
            <ConfidenceIcon className="w-3 h-3" />
            {confidenceConfig.label}
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          {result.identification}
        </h2>

        {/* Model Uncertainty Note */}
        {result.uncertaintyReason && (
          <div className="mb-3 text-xs text-rock bg-surface-muted px-3 py-2 rounded-xl border border-border-subtle flex items-start gap-2">
            <span className="font-semibold text-foreground shrink-0">Uncertainty Note:</span>
            <span>{result.uncertaintyReason}</span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-rock mb-4">
          {result.description}
        </p>

        {/* Visual Evidence Points */}
        {result.evidence && result.evidence.length > 0 && (
          <div className="pt-3 border-t border-border-subtle">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rock mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-moss" />
              Observed Visual Clues
            </h4>
            <ul className="space-y-1.5">
              {result.evidence.map((clue, idx) => (
                <li
                  key={idx}
                  className="text-xs text-foreground flex items-start gap-2 bg-surface-muted px-3 py-1.5 rounded-lg"
                >
                  <span className="text-moss font-bold mt-0.5">•</span>
                  <span>{clue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Primary Emphasis: Outdoor Challenge Card (MISSION READY or FIELD RECORD) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-moss-dark">
            {isMissionCompleted ? 'Field Record Summary' : 'Next Action: Explore Outdoors'}
          </h3>
          <span className="text-[11px] text-rock">
            {isMissionCompleted ? 'Grounded in Nature' : 'Put screen away'}
          </span>
        </div>
        <ChallengeCard
          challenge={challengeItem}
          onStart={onChallengeStart}
          onComplete={onChallengeComplete}
          onSkip={onChallengeSkip}
          onNewObservation={onNewObservation}
        />
      </div>

      {/* 3. Field Naturalist Observation (Only if not already completed, to keep screen concise) */}
      {!isMissionCompleted && (
        <div className="bg-surface-muted border border-border-subtle rounded-2xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">
            Field Observation
          </h4>
          <p className="text-xs leading-relaxed text-rock">
            {result.observation}
          </p>
        </div>
      )}

      {/* 4. Safety & Conservation Warning */}
      {!isMissionCompleted && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Safety & Conservation: </span>
            <span>{result.safety}</span>
          </div>
        </div>
      )}

      {/* 5. Safe diagnostics footer */}
      {result.inferenceDurationMs && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-rock px-1">
          <Cpu className="w-3 h-3 text-moss" />
          <span>Local Gemma 3 4B inference: {result.inferenceDurationMs}ms</span>
        </div>
      )}
    </article>
  );
}
