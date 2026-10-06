'use client';

import React, { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import AIResult from '@/components/AIResult';
import type { AIAnalysisResult, OutdoorChallenge } from '@/types/trail';
import { RefreshCw, AlertCircle, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<OutdoorChallenge | null>(null);

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

      // Initialize challenge item
      const initialChallenge: OutdoorChallenge = {
        id: 'challenge-' + Date.now(),
        title: 'Outdoor Field Challenge',
        description: data.challenge,
        estimatedDuration: '2–5 mins',
        difficulty: 'moderate',
        status: 'pending',
        points: 15,
      };
      setActiveChallenge(initialChallenge);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze observation';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChallengeStart = (challengeId: string) => {
    if (activeChallenge && activeChallenge.id === challengeId) {
      setActiveChallenge({
        ...activeChallenge,
        status: 'active',
      });
    }
  };

  const handleChallengeComplete = (challengeId: string) => {
    if (activeChallenge && activeChallenge.id === challengeId) {
      setActiveChallenge({
        ...activeChallenge,
        status: 'completed',
        completedAt: Date.now(),
      });
    }
  };

  const handleChallengeSkip = (challengeId: string) => {
    if (activeChallenge && activeChallenge.id === challengeId) {
      setActiveChallenge({
        ...activeChallenge,
        status: 'skipped',
      });
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setActiveChallenge(null);
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
          <span>Active Session</span>
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
          />
        </section>
      )}
    </div>
  );
}
