'use client';

import React, { useState } from 'react';
import type { OutdoorChallenge } from '@/types/trail';
import {
  Compass,
  CheckCircle2,
  Clock,
  Footprints,
  ArrowRight,
  EyeOff,
  MessageSquare,
  ShieldAlert,
  FileText,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface ChallengeCardProps {
  challenge: OutdoorChallenge;
  onStart?: (id: string) => void;
  onComplete?: (id: string, userReflection?: string) => void;
  onSkip?: (id: string) => void;
  onNewObservation?: () => void;
}

export default function ChallengeCard({
  challenge,
  onStart,
  onComplete,
  onSkip,
  onNewObservation,
}: ChallengeCardProps) {
  const [isReflecting, setIsReflecting] = useState<boolean>(false);
  const [reflectionText, setReflectionText] = useState<string>('');

  const isActive = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';

  const mission = challenge.mission;
  const durationText = mission
    ? `${Math.round(mission.durationSeconds / 60)} mins`
    : challenge.estimatedDuration || '2–5 mins';

  const handleStartMission = () => {
    onStart?.(challenge.id);
  };

  const handleEnterReflection = () => {
    setIsReflecting(true);
  };

  const handleSaveReflection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onComplete?.(challenge.id, reflectionText);
    setIsReflecting(false);
  };

  const handleSkipReflection = () => {
    onComplete?.(challenge.id, undefined);
    setIsReflecting(false);
  };

  // =========================================================================
  // STATE 2 & 4: ACTIVE CHALLENGE (POCKET MODE & RETURN REFLECTION)
  // =========================================================================
  if (isActive) {
    if (isReflecting) {
      // STATE 4 — RETURN EXPERIENCE: WHAT DID YOU NOTICE?
      return (
        <section
          aria-label="Outdoor reflection"
          className="rounded-3xl border border-moss/40 bg-surface p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-moss-light text-moss-dark">
              <MessageSquare className="w-3.5 h-3.5 text-moss" />
              Return from Field
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              +{challenge.points} pts upon save
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              WHAT DID YOU NOTICE?
            </h3>
            <p className="text-xs text-rock leading-relaxed">
              Take 30 seconds to record what you observed with your own senses.
            </p>
          </div>

          {/* Reflection Prompts / Cues */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rock block">
              Inspiration Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'What surprised you?',
                'What changed when you looked more closely?',
                'What did you notice that you would normally miss?',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!reflectionText.includes(prompt)) {
                      setReflectionText((prev) =>
                        prev ? `${prev} ${prompt} ` : `${prompt} `
                      );
                    }
                  }}
                  className="text-[11px] font-medium bg-surface-muted hover:bg-border-subtle text-foreground border border-border-subtle rounded-xl px-2.5 py-1 text-left transition-colors cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Textarea */}
          <form onSubmit={handleSaveReflection} className="space-y-3">
            <div>
              <label
                htmlFor="field-reflection-input"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Your Field Reflection
              </label>
              <textarea
                id="field-reflection-input"
                aria-label="Your field reflection"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="I noticed the bark had deeper ridges on the north side, and small lichen patches grew in clusters..."
                rows={4}
                maxLength={500}
                className="w-full rounded-2xl border border-border-strong bg-surface-muted p-3.5 text-sm text-foreground placeholder:text-rock/60 focus:border-moss focus:ring-2 focus:ring-moss/20 focus:outline-none transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-rock">
                <span>
                  Strictly user-authored. Gemma will never fabricate your notes.
                </span>
                <span>{reflectionText.length}/500</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE FIELD RECORD</span>
              </button>

              <button
                type="button"
                onClick={handleSkipReflection}
                className="w-full sm:w-auto py-3.5 px-4 rounded-xl font-semibold text-xs text-rock hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Skip reflection
              </button>
            </div>
          </form>
        </section>
      );
    }

    // STATE 2 — POCKET MODE: PHONE DOWN
    return (
      <section
        aria-label="Pocket Mode active"
        className="rounded-3xl border border-stone-800 bg-stone-900 text-stone-100 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in-50 duration-200"
      >
        {/* Header Directive */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950">
            <EyeOff className="w-3.5 h-3.5" />
            Pocket Mode
          </span>
          <span className="text-xs font-bold text-stone-400">
            +{challenge.points} pts
          </span>
        </div>

        {/* Big Typography: PHONE DOWN */}
        <div className="space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            PHONE DOWN
          </h2>
          <p className="text-sm font-semibold text-amber-300">
            The phone is no longer the tool. The real world is.
          </p>
        </div>

        {/* Your Mission */}
        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Your Mission:
          </span>
          <p className="text-base font-bold text-white leading-snug">
            {mission?.target || challenge.description}
          </p>
          {mission && (
            <p className="text-xs text-stone-400 mt-1">
              Target duration: ~{durationText}
            </p>
          )}
        </div>

        {/* Physical Rhythm */}
        <div className="p-4 rounded-2xl bg-stone-800/50 border border-stone-700/60 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300 block">
            Field Directives:
          </span>
          <ul className="space-y-1.5 text-sm font-medium text-stone-200">
            <li className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>Put your phone away.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>Look.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>Walk.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>Notice.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>Compare.</span>
            </li>
          </ul>
        </div>

        {/* Honest note */}
        <p className="text-[11px] text-stone-400 leading-normal">
          Screen stays awake so your session is safe. No fake phone-locking tricks — keep this in your pocket or facedown while exploring.
        </p>

        {/* Primary Completion Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleEnterReflection}
            className="w-full py-4 px-6 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            aria-label="I am done exploring, return to record observation"
          >
            <CheckCircle2 className="w-5 h-5 text-stone-950" />
            <span>I&apos;M DONE</span>
          </button>

          {onSkip && (
            <button
              type="button"
              onClick={() => onSkip(challenge.id)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors cursor-pointer text-center"
            >
              Cancel mission
            </button>
          )}
        </div>
      </section>
    );
  }

  // =========================================================================
  // STATE 5: FIELD RECORD (COMPLETED MISSION)
  // =========================================================================
  if (isCompleted) {
    return (
      <section
        aria-label="Field record"
        className="rounded-3xl border border-emerald-300 bg-surface p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in-50 duration-200"
      >
        {/* Field Record Stamp */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              FIELD RECORD
            </span>
            {mission?.missionType && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-muted text-rock">
                {mission.missionType}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
            +{challenge.points} pts Earned
          </span>
        </div>

        {/* Title & Target */}
        <div className="space-y-1">
          <h3 className="text-xl font-black tracking-tight text-foreground">
            {challenge.title}
          </h3>
          <p className="text-xs text-rock leading-relaxed">
            Target: <strong className="text-foreground">{mission?.target || challenge.description}</strong>
          </p>
        </div>

        {/* User-Authored Reflection */}
        {challenge.userReflection ? (
          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-moss block">
              Naturalist Reflection:
            </span>
            <blockquote className="text-sm italic text-foreground leading-relaxed pl-2 border-l-2 border-moss">
              &ldquo;{challenge.userReflection}&rdquo;
            </blockquote>
            <span className="text-[10px] text-rock block pt-1">
              — Recorded by you in the field
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-muted border border-border-subtle text-xs text-rock italic">
            Physical observation completed without notes.
          </div>
        )}

        {/* Metadata info */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-rock pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-moss" />
            <span>Target: {durationText}</span>
          </div>

          {challenge.completedAt && (
            <span>
              Recorded at{' '}
              {new Date(challenge.completedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <p className="text-[10px] text-rock/80 border-t border-border-subtle pt-2.5">
          Recorded in active browser session. Resets when tab is closed.
        </p>

        {/* Action Controls */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          {onNewObservation && (
            <button
              type="button"
              onClick={onNewObservation}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-moss hover:bg-moss-dark text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Capture Next Subject</span>
            </button>
          )}

          <Link
            href="/session"
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs bg-surface-muted hover:bg-border-subtle text-foreground border border-border-subtle flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-moss" />
            <span>View Session HUD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // =========================================================================
  // STATE 1: MISSION READY (PENDING CHALLENGE)
  // =========================================================================
  return (
    <section
      aria-label="Field mission ready"
      className="rounded-3xl border border-moss/30 bg-surface p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in-50 duration-200"
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-moss text-white">
            <Compass className="w-3.5 h-3.5" />
            MISSION READY
          </span>

          {mission?.missionType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              {mission.missionType}
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-muted text-rock">
            <Clock className="w-3 h-3" />
            {durationText}
          </span>
        </div>

        <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
          +{challenge.points} pts
        </span>
      </div>

      {/* Mission Title */}
      <div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {challenge.title}
        </h3>
        <p className="text-xs text-rock mt-1 leading-relaxed">
          Gemma wants you to step outside the screen and investigate this natural subject.
        </p>
      </div>

      {/* Target & Steps */}
      <div className="space-y-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-surface-muted border border-border-subtle">
          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 text-moss">
            Target to Investigate:
          </span>
          <p className="font-medium text-foreground">
            {mission?.target || challenge.description}
          </p>
        </div>

        {mission && mission.steps.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-surface-muted border border-border-subtle">
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-1.5 text-moss">
              Field Steps:
            </span>
            <ol className="space-y-1.5 list-decimal list-inside text-foreground font-medium">
              {mission.steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Success Criteria */}
        {mission?.successCriteria && (
          <div className="px-1 text-[11px] text-rock">
            <strong className="text-foreground">Success Criteria: </strong>
            {mission.successCriteria}
          </div>
        )}

        {/* Safety Note */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Safety Constraint: </strong>
            {mission?.safetyConstraints && mission.safetyConstraints.length > 0
              ? mission.safetyConstraints.join('. ')
              : 'Observe non-destructively. Stay on trail and leave specimens undisturbed.'}
          </span>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartMission}
          className="w-full py-4 px-5 rounded-2xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          aria-label="Start outdoor field mission and enter Pocket Mode"
        >
          <Footprints className="w-4 h-4" />
          <span>START FIELD MISSION</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
        <p className="text-center text-[11px] text-rock mt-2">
          Transitions into Pocket Mode. The screen goes into low-distraction mode.
        </p>
      </div>
    </section>
  );
}
