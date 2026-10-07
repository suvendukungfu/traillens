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
        throw new Error(
          errorData.error || `Server responded with status ${response.status}`
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
    setAnalysisError(null);
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-moss">
            Field Guide
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Explore Outdoors
          </h1>
        </div>

        <Link
          href="/session"
          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-border-subtle text-foreground border border-border-subtle transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-moss" />
          <span>
            {completedChallengesCount > 0
              ? `Session (${completedChallengesCount} completed)`
              : observationsCount > 0
                ? `Session (${observationsCount} observed)`
                : isActive
                  ? 'Session (Tracking)'
                  : 'Active Session'}
          </span>
        </Link>
      </div>

      {/* Error Banner */}
      {analysisError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold mb-0.5">Inference Error</h4>
            <p className="leading-relaxed">{analysisError}</p>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="mt-2 text-rose-700 font-bold underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View: Camera Capture vs AI Result */}
      {!analysisResult ? (
        <section aria-label="Field camera capture">
          <CameraCapture onCapture={handleCapture} isAnalyzing={isAnalyzing} />
        </section>
      ) : (
        <section aria-label="AI field identification" className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 rounded-xl text-xs font-bold border border-border-strong text-foreground hover:bg-surface-muted flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Observation</span>
            </button>

            <span className="text-xs text-rock font-medium">
              Observation Recorded
            </span>
          </div>

          <AIResult
            result={analysisResult}
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
