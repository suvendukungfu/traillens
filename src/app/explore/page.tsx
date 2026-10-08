'use client';

import React, { useState, useEffect } from 'react';
import CameraCapture from '@/components/CameraCapture';
import AIResult from '@/components/AIResult';
import type { AIAnalysisResult } from '@/types/trail';
import { RefreshCw, AlertCircle, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';

export default function ExplorePage() {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    // Non-blocking background model warmup when the user enters Explore mode
    fetch('/api/health?warmup=true', { cache: 'no-store' }).catch(() => {
      // Warmup is best-effort; silently ignore network or abort errors
    });
  }, []);

  const {
    recordObservation,
    activeChallenge,
    startChallenge,
    completeChallenge,
    skipChallenge,
    observationsCount,
    completedChallengesCount,
    isActive,
  } = useSession();

  const handleCapture = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCapturedImage(base64Image);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const fieldDetails = errorData.details
          ? Object.values(errorData.details).flat().join('. ')
          : '';
        throw new Error(
          fieldDetails
            ? `${errorData.error || 'Validation failed'}: ${fieldDetails}`
            : errorData.error || `Server responded with status ${response.status}`
        );
      }

      const data = (await response.json()) as AIAnalysisResult;
      setAnalysisResult(data);

      // Register observation and generate challenge in active session
      recordObservation(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze observation';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChallengeStart = (challengeId: string) => {
    startChallenge(challengeId);
  };

  const handleChallengeComplete = (challengeId: string, userReflection?: string) => {
    completeChallenge(challengeId, userReflection);
  };

  const handleChallengeSkip = (challengeId: string) => {
    skipChallenge(challengeId);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setCapturedImage(null);
    setAnalysisError(null);
  };

  return (
    <div className="flex-1 max-w-310 mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-10 space-y-8">
      {/* Top Header / Context Bar */}
      <header className="border-b border-stone-200/80 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-px w-5 bg-stone-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 font-mono">
                Field Station
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground">
              Explore Outdoors
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-sans">
              {analysisResult
                ? `Observation Active • Subject: ${analysisResult.identification}`
                : 'Live specimen capture & on-device botanical and geological observation'}
            </p>
          </div>

          {/* Secondary Context Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {analysisResult && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>New Observation</span>
              </button>
            )}

            <Link
              href="/session"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200/90 shadow-2xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-800" />
              <span>
                {completedChallengesCount > 0
                  ? `Session (${completedChallengesCount})`
                  : observationsCount > 0
                    ? `Session (${observationsCount})`
                    : isActive
                      ? 'Session (Tracking)'
                      : 'Field Journal'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {analysisError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-0.5">Inference Error</h4>
            <p className="leading-relaxed text-rose-800">{analysisError}</p>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="mt-2 text-rose-700 font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View: Camera Capture vs AI Result */}
      {!analysisResult ? (
        <section aria-label="Field camera capture">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Camera Viewfinder & Controls (7 cols) */}
            <div className="lg:col-span-7">
              <CameraCapture onCapture={handleCapture} isAnalyzing={isAnalyzing} />
            </div>

            {/* Right: Naturalist Protocol Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-900 block mb-1">
                    FIELD PROTOCOL
                  </span>
                  <h3 className="text-xl font-serif font-bold tracking-tight text-foreground">
                    Documenting Wild Specimens
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-xs font-bold text-emerald-800 shrink-0 mt-0.5">
                      01
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 mb-0.5 font-sans">
                        Frame Diagnostic Details
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        Capture close-up natural traits such as leaf margins, tree bark furrows, flower petals, or rock striations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-xs font-bold text-emerald-800 shrink-0 mt-0.5">
                      02
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 mb-0.5 font-sans">
                        Leave Specimens In Situ
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        TrailLens is designed for non-destructive observation. Never pick, peel bark, or disturb wildlife habitats.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-xs font-bold text-emerald-800 shrink-0 mt-0.5">
                      03
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 mb-0.5 font-sans">
                        100% Offline AI Inference
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        Specimens are processed entirely on-device by Gemma 3 4B via Ollama. No photos or GPS data leave this machine.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                    <strong>Quick Test:</strong> If you are indoors or testing without camera access, select one of the four sample natural specimens below the viewfinder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="AI field identification">
          <AIResult
            result={analysisResult}
            capturedImage={capturedImage}
            activeChallenge={activeChallenge}
            onChallengeStart={handleChallengeStart}
            onChallengeComplete={handleChallengeComplete}
            onChallengeSkip={handleChallengeSkip}
            onNewObservation={handleReset}
          />
        </section>
      )}
    </div>
  );
}
