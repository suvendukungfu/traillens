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
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface ChallengeCardProps {
  challenge: OutdoorChallenge;
  safetyText?: string;
  onStart?: (id: string) => void;
  onComplete?: (id: string, userReflection?: string) => void;
  onSkip?: (id: string) => void;
  onNewObservation?: () => void;
}

export default function ChallengeCard({
  challenge,
  safetyText,
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
          className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-mono">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              Return from Field
            </span>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
              +{challenge.points} pts upon save
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold tracking-tight text-foreground">
              WHAT DID YOU NOTICE?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
              Take 30 seconds to record what you observed with your own senses.
            </p>
          </div>

          {/* Reflection Prompts / Cues */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
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
                  className="text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 rounded-xl px-2.5 py-1 text-left transition-colors cursor-pointer"
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
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 p-3.5 text-sm text-foreground placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 focus:outline-none transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500">
                <span>
                  Strictly user-authored. Gemma will never fabricate your notes.
                </span>
                <span>{reflectionText.length}/500</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-[#1A3324] hover:bg-[#234230] text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE FIELD RECORD</span>
              </button>

              <button
                type="button"
                onClick={handleSkipReflection}
                className="w-full sm:w-auto py-3.5 px-4 rounded-xl font-semibold text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950 font-mono">
            <EyeOff className="w-3.5 h-3.5" />
            Pocket Mode
          </span>
          <span className="text-xs font-bold text-stone-400 font-mono">
            +{challenge.points} pts
          </span>
        </div>

        {/* Big Typography: PHONE DOWN */}
        <div className="space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-sans">
            PHONE DOWN
          </h2>
          <p className="text-sm font-semibold text-amber-300">
            The phone is no longer the tool. The real world is.
          </p>
        </div>

        {/* Your Mission */}
        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
            Your Mission:
          </span>
          <p className="text-base font-bold text-white leading-snug">
            {mission?.target || challenge.description}
          </p>
          {mission && (
            <p className="text-xs text-stone-400 mt-1 font-mono">
              Target duration: ~{durationText}
            </p>
          )}
        </div>

        {/* Physical Rhythm */}
        <div className="p-4 rounded-2xl bg-stone-800/50 border border-stone-700/60 space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300 block">
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
            className="w-full py-4 px-6 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
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
        className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in-50 duration-200"
      >
        {/* Field Record Stamp */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-mono">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              FIELD RECORD
            </span>
            {mission?.missionType && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                {mission.missionType}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono">
            +{challenge.points} pts Earned
          </span>
        </div>

        {/* Title & Target */}
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold tracking-tight text-foreground">
            {challenge.title}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Target: <strong className="text-stone-900">{mission?.target || challenge.description}</strong>
          </p>
        </div>

        {/* User-Authored Reflection */}
        {challenge.userReflection ? (
          <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-stone-200/80 space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 block">
              Naturalist Reflection:
            </span>
            <blockquote className="text-sm italic text-stone-900 leading-relaxed pl-3 border-l-2 border-emerald-800">
              &ldquo;{challenge.userReflection}&rdquo;
            </blockquote>
            <span className="text-[10px] text-stone-500 block pt-1">
              — Recorded by you in the field
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-600 italic">
            Physical observation completed without notes.
          </div>
        )}

        {/* Metadata info */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
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

        <p className="text-[10px] text-stone-400 border-t border-stone-100 pt-2.5">
          Recorded in active browser session. Resets when tab is closed.
        </p>

        {/* Action Controls */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          {onNewObservation && (
            <button
              type="button"
              onClick={onNewObservation}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#1A3324] hover:bg-[#234230] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Capture Next Subject</span>
            </button>
          )}

          <Link
            href="/session"
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-800" />
            <span>View Session HUD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // =========================================================================
  // STATE 1: MISSION READY (HERO OF THE PAGE)
  // =========================================================================
  const safetyConstraintText =
    mission?.safetyConstraints && mission.safetyConstraints.length > 0
      ? mission.safetyConstraints.join('. ')
      : safetyText ||
        'Observe non-destructively. Stay on trail and leave specimens undisturbed.';

  return (
    <section
      aria-label="Field mission ready"
      className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in-50 duration-200"
    >
      {/* Header Context Bar */}
      <div className="space-y-3 border-b border-stone-100 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-900">
              NEXT ACTION
            </span>
            <span className="h-1 w-1 rounded-full bg-stone-300" />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2.5 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" />
              FIELD-READY
            </span>
          </div>

          <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
            +{challenge.points} pts
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
            MISSION READY
          </h2>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            {mission?.missionType && (
              <span className="uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold">
                {mission.missionType}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              {durationText}
            </span>
          </div>
        </div>
      </div>

      {/* Mission Title & Intro */}
      <div className="space-y-1.5">
        <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-foreground leading-snug">
          {challenge.title}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
          Gemma formulated an on-trail investigation for this specimen. Step away from the screen and observe in nature.
        </p>
      </div>

      {/* Section 9: Target to Investigate (Tinted field-paper container) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F4EF] border border-stone-200/90 space-y-1.5 shadow-2xs">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-emerald-900 block">
          TARGET TO INVESTIGATE
        </span>
        <p className="text-sm sm:text-base font-semibold text-stone-900 leading-snug">
          {mission?.target || challenge.description}
        </p>
      </div>

      {/* Section 10: Field Steps (Deliberate numbered actions) */}
      {mission && mission.steps && mission.steps.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-stone-500 block">
            FIELD STEPS
          </span>
          <div className="space-y-2.5">
            {mission.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70"
              >
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800 shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans font-medium">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 11: Success Criteria (Visually distinct) */}
      {mission?.successCriteria && (
        <div className="p-3.5 rounded-xl bg-stone-50/60 border border-dashed border-stone-300 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-stone-500 block">
            SUCCESS CRITERIA
          </span>
          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            {mission.successCriteria}
          </p>
        </div>
      )}

      {/* Section 12: Safety (Small icon + short readable constraint) */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono uppercase font-bold text-[10px] tracking-wider text-amber-950 block mb-0.5">
            Safety Constraint
          </span>
          <p className="text-amber-900 leading-relaxed">
            {safetyConstraintText}
          </p>
        </div>
      </div>

      {/* Section 14 & 15: Primary CTA & Pocket Mode Transition Notice */}
      <div className="pt-2 space-y-2">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 text-center block font-mono">
          PUT THE SCREEN AWAY WHEN YOU START.
        </span>

        <button
          type="button"
          onClick={handleStartMission}
          className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base bg-[#1A3324] hover:bg-[#234230] text-white shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none cursor-pointer tracking-wide"
          aria-label="Start outdoor field mission and enter Pocket Mode"
        >
          <Footprints className="w-4 h-4" />
          <span>START FIELD MISSION</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-[11px] text-stone-500 leading-normal">
          Transitions into Pocket Mode. The screen goes into low-distraction mode.
        </p>
      </div>
    </section>
  );
}
