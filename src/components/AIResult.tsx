'use client';

import React from 'react';
import type { AIAnalysisResult, OutdoorChallenge } from '@/types/trail';
import ChallengeCard from './ChallengeCard';
import {
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Cpu,
  Sparkles,
  Compass,
} from 'lucide-react';
import { FieldObservatory } from './observatory/FieldObservatory';
import { useSession } from '@/context/SessionContext';

interface AIResultProps {
  result: AIAnalysisResult;
  capturedImage?: string | null;
  onChallengeStart?: (challengeId: string) => void;
  onChallengeComplete?: (challengeId: string, userReflection?: string) => void;
  onChallengeSkip?: (challengeId: string) => void;
  activeChallenge?: OutdoorChallenge | null;
  onNewObservation?: () => void;
}

export default function AIResult({
  result,
  capturedImage,
  onChallengeStart,
  onChallengeComplete,
  onChallengeSkip,
  activeChallenge,
  onNewObservation,
}: AIResultProps) {
  const [isObservatoryOpen, setIsObservatoryOpen] = React.useState(false);
  const { observations } = useSession();

  // Confidence badge helpers
  const confidenceConfig = {
    high: {
      label: 'High Confidence',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      icon: CheckCircle,
    },
    medium: {
      label: 'Moderate Confidence',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: AlertCircle,
    },
    low: {
      label: 'Tentative Observation',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: HelpCircle,
    },
  }[result.confidence] || {
    label: 'Observation',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
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

  // If in Pocket Mode (Active Mission), minimize all screen distractions
  if (isMissionActive) {
    return (
      <article
        className="max-w-2xl mx-auto space-y-4 animate-in fade-in-50 duration-200"
        aria-label="Pocket mode field mission"
      >
        <div className="flex items-center justify-between px-2 text-xs font-mono text-stone-500 uppercase tracking-wider">
          <span className="font-semibold text-foreground">
            Subject: {result.identification}
          </span>
          <span>Pocket Mode Active</span>
        </div>

        {/* Pocket Mode takes full focus */}
        <ChallengeCard
          challenge={challengeItem}
          safetyText={result.safety}
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
      className="space-y-8 animate-in fade-in-50 duration-300"
      aria-label="Field guide observation result"
    >
      {/* Two-Column Editorial Grid on Desktop */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ===================================================================
            LEFT COLUMN: FIELD IDENTIFICATION & SPECIMEN NOTE (~60% = col-span-7)
           =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Specimen Frame (Image Preview) */}
          {capturedImage && (
            <div className="relative aspect-16/10 sm:aspect-video w-full rounded-2xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt={`Captured natural specimen: ${result.identification}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-stone-950/75 backdrop-blur-xs text-[10px] font-mono uppercase tracking-widest text-stone-200 border border-white/10">
                Specimen Frame • In Situ Observation
              </div>
            </div>
          )}

          {/* 2. Identification Card */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                Field Identification
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${confidenceConfig.badgeClass}`}
              >
                <ConfidenceIcon className="w-3.5 h-3.5" />
                {confidenceConfig.label}
              </span>
            </div>

            {/* Largest text inside card */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
              {result.identification}
            </h2>

            {/* Model Uncertainty Note */}
            {result.uncertaintyReason && (
              <div className="text-xs text-stone-700 bg-amber-50/60 px-3.5 py-2.5 rounded-xl border border-amber-200/60 flex items-start gap-2">
                <span className="font-semibold text-stone-900 shrink-0 font-mono uppercase text-[10px] mt-0.5">
                  Uncertainty Note:
                </span>
                <span>{result.uncertaintyReason}</span>
              </div>
            )}

            {/* Softer supporting paragraph width */}
            <p className="text-sm sm:text-base leading-relaxed text-stone-600 max-w-prose font-sans">
              {result.description}
            </p>

            {/* Field Observatory Interactive Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsObservatoryOpen(!isObservatoryOpen)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#F4F0E6] border border-[#B88B2A]/40 text-[#19211B] hover:bg-[#EFEADF] transition-all shadow-2xs group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#B88B2A]/15 text-[#B88B2A] group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-semibold font-serif text-[#19211B]">
                      {isObservatoryOpen ? 'Close Field Observatory' : 'Open Field Observatory'}
                    </div>
                    <div className="text-[11px] text-[#736B5E]">
                      Spatial specimen anchor, evidence orbits, & quality rings
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B88B2A] bg-white/80 px-2.5 py-1 rounded-full border border-[#B88B2A]/20">
                  {isObservatoryOpen ? 'Active' : 'Inspect 3D'}
                </span>
              </button>
            </div>

            {/* Field Observatory Active Layer */}
            {isObservatoryOpen && (
              <div className="pt-2 animate-fade-in">
                <FieldObservatory
                  analysis={result}
                  sessionObservations={observations}
                  capturedImageUrl={capturedImage || undefined}
                  onStartMission={() => onChallengeStart?.(challengeItem.id)}
                />
              </div>
            )}
          </div>

          {/* 3. Observed Visual Clues (Clean editorial list with 01, 02, 03) */}
          {result.evidence && result.evidence.length > 0 && (
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-800" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 font-mono">
                  Observed Visual Clues
                </h4>
              </div>

              <div className="divide-y divide-stone-200/70">
                {result.evidence.map((clue, idx) => (
                  <div
                    key={idx}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-4"
                  >
                    <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800 shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans font-medium">
                      {clue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Naturalist Field Observation Note (if present) */}
          {result.observation && (
            <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-2xl p-5 space-y-1.5 shadow-2xs">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-stone-500">
                Field Observation Context
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                &ldquo;{result.observation}&rdquo;
              </p>
            </div>
          )}

          {/* 5. Refined Analysis Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-stone-500 px-2 pt-2 border-t border-stone-200/80">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-800" />
              <span>Local Gemma 3 4B</span>
              <span>•</span>
              <span>On-Device Neural Weights</span>
            </div>

            {result.inferenceDurationMs && (
              <span>
                Inference: {(result.inferenceDurationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: MISSION READY CARD (~40% = col-span-5, sticky on desktop)
           =================================================================== */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <ChallengeCard
            challenge={challengeItem}
            safetyText={result.safety}
            onStart={onChallengeStart}
            onComplete={onChallengeComplete}
            onSkip={onChallengeSkip}
            onNewObservation={onNewObservation}
          />
        </div>
      </div>
    </article>
  );
}
