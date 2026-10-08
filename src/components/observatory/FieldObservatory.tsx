'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Compass, Play, Pause, Sparkles, ArrowRight, Info } from 'lucide-react';
import type { AIAnalysisResult, FieldComparison } from '@/types/trail';
import { adaptToObservatoryViewModel } from '@/lib/observatory/observatoryData';
import { Observatory2DFallback } from './Observatory2DFallback';
import { ObservatoryLegend } from './ObservatoryLegend';
import { FieldTwinModal } from './FieldTwinModal';

// Dynamically import 3D WebGL scene to maintain SSR purity and light initial bundle
const Observatory3DScene = dynamic(() => import('./Observatory3DScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-95 bg-[#19211B] rounded-2xl flex items-center justify-center text-[#E8E3D8] text-xs font-mono">
      INITIALIZING FIELD OBSERVATORY WEBGL...
    </div>
  ),
});

interface FieldObservatoryProps {
  analysis: AIAnalysisResult;
  sessionObservations?: AIAnalysisResult[];
  capturedImageUrl?: string;
  onStartMission?: () => void;
  className?: string;
}

export function FieldObservatory({
  analysis,
  sessionObservations,
  capturedImageUrl,
  onStartMission,
  className = '',
}: FieldObservatoryProps) {
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');
  const [isPaused, setIsPaused] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [localComparison, setLocalComparison] = useState<FieldComparison | undefined>(analysis.comparison);
  const [selectedNode, setSelectedNode] = useState<{
    type: 'evidence' | 'waypoint' | 'quality' | 'specimen';
    title: string;
    detail: string;
  } | null>(null);

  // Derive pure view model
  const viewModel = adaptToObservatoryViewModel(
    analysis,
    sessionObservations,
    localComparison
  );

  const handleComparisonComplete = (comp: FieldComparison) => {
    setLocalComparison(comp);
  };

  return (
    <section
      aria-label="Field Observatory Spatial Data Visualization"
      className={`relative bg-[#FBF9F5] border border-[#E8E3D8] rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 font-sans ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E3D8]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#B88B2A]" />
            <h3 className="font-serif font-bold text-lg text-[#19211B] tracking-tight">
              The Field Observatory
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#F4F0E6] text-[#736B5E] px-2 py-0.5 rounded border border-[#E8E3D8]">
              Spatial Field Instrument
            </span>
          </div>
          <p className="text-xs text-[#736B5E]">
            Gemma visual morphology mapped to orbital field data
          </p>
        </div>

        {/* View Controls & Mode Switch */}
        <div className="flex items-center space-x-2">
          {/* 3D vs 2D Mode Switch */}
          <div className="inline-flex bg-[#F4F0E6] p-0.5 rounded-lg border border-[#E8E3D8]">
            <button
              type="button"
              onClick={() => setRenderMode('3d')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                renderMode === '3d'
                  ? 'bg-white text-[#19211B] shadow-xs'
                  : 'text-[#736B5E] hover:text-[#19211B]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D Orbit</span>
            </button>
            <button
              type="button"
              onClick={() => setRenderMode('2d')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                renderMode === '2d'
                  ? 'bg-white text-[#19211B] shadow-xs'
                  : 'text-[#736B5E] hover:text-[#19211B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Plate</span>
            </button>
          </div>

          {/* Pause / Play for 3D */}
          {renderMode === '3d' && (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume 3D Rotation' : 'Pause 3D Rotation'}
              className="p-1.5 rounded-lg bg-[#F4F0E6] border border-[#E8E3D8] text-[#736B5E] hover:text-[#19211B] transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Toggle Legend */}
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isLegendOpen
                ? 'bg-[#E8E3D8] border-[#B88B2A] text-[#19211B]'
                : 'bg-[#F4F0E6] border-[#E8E3D8] text-[#736B5E] hover:text-[#19211B]'
            }`}
            title="Toggle Observatory Legend"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Canvas / Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 relative">
          <div className="aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-[#19211B] relative">
            {renderMode === '3d' ? (
              <Observatory3DScene
                viewModel={viewModel}
                onSelectNode={(node) => setSelectedNode(node)}
                isPaused={isPaused}
              />
            ) : (
              <Observatory2DFallback
                viewModel={viewModel}
                onSelectNode={(node) => setSelectedNode(node)}
              />
            )}

            {/* In-Canvas Badge Overlays */}
            <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-[#19211B]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-[#E8E3D8] pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="font-mono uppercase">{viewModel.missionOrbit.grammar.replace('_', ' ')}</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#19211B]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-[#E8E3D8] pointer-events-none">
              <span className="font-mono text-[#B88B2A]">{viewModel.qualityOverallScore}/100</span>
              <span className="text-white/60">RUBRIC SCORE</span>
            </div>
          </div>

          {/* Interactive Inspection Drawer */}
          {selectedNode && (
            <div className="mt-3 p-3.5 bg-[#F4F0E6] border border-[#B88B2A]/40 rounded-xl flex items-start justify-between gap-3 animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-[#B88B2A]/15 text-[#B88B2A] px-1.5 py-0.5 rounded font-semibold">
                    {selectedNode.type.toUpperCase()}
                  </span>
                  <span className="font-medium text-xs text-[#19211B]">
                    {selectedNode.title}
                  </span>
                </div>
                <p className="text-xs text-[#5A5245] leading-relaxed">
                  {selectedNode.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-[#736B5E] hover:text-[#19211B] text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 3. Side Panel (Field Twin & Mission Summary) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mission Orbit Card */}
          <div className="p-4 bg-[#F4F0E6] border border-[#E8E3D8] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#736B5E]">
                Active Mission Orbit
              </span>
              <span className="text-[10px] font-mono bg-[#1C3D2B]/10 text-[#1C3D2B] px-1.5 py-0.5 rounded font-semibold">
                {viewModel.missionOrbit.durationSeconds}s Outdoor
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-sm text-[#19211B] leading-snug">
                {viewModel.missionOrbit.title}
              </h4>
              <p className="text-[11px] text-[#5A5245] leading-relaxed line-clamp-2">
                Target: {viewModel.missionOrbit.target}
              </p>
            </div>

            {/* Waypoint Steps */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-[#736B5E] block">
                SPATIAL WAYPOINTS ({viewModel.missionOrbit.waypoints.length})
              </span>
              <div className="space-y-1">
                {viewModel.missionOrbit.waypoints.map((wp) => (
                  <div
                    key={wp.stepNumber}
                    className="flex items-start space-x-2 text-[11px] text-[#19211B] p-1.5 rounded-lg bg-white/60 border border-[#E8E3D8]"
                  >
                    <span className="font-mono text-[#10B981] font-bold text-[10px] shrink-0 mt-0.5">
                      0{wp.stepNumber}
                    </span>
                    <span className="line-clamp-2 leading-tight">{wp.instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Twin Feature Trigger */}
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white border border-[#B88B2A]/40 text-[#B88B2A] hover:bg-[#FBF9F5] text-xs font-semibold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {viewModel.comparison ? 'Morphology Bridge Active' : 'Compare Another Specimen'}
              </span>
            </button>

            {/* Primary Action CTA */}
            {onStartMission && (
              <button
                type="button"
                onClick={onStartMission}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#1C3D2B] text-[#FBF9F5] text-xs font-semibold hover:bg-[#153022] transition-all shadow-md mt-2"
              >
                <span>Start Field Mission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsible Legend Drawer */}
          {isLegendOpen && (
            <ObservatoryLegend />
          )}
        </div>
      </div>

      {/* 4. Accessible DOM Equivalent (Screen Readers & Plain Text Review) */}
      <div className="sr-only" aria-live="polite">
        <h4>Accessible Field Observatory Summary</h4>
        <p>Subject: {viewModel.subject}</p>
        <p>Confidence: {viewModel.confidence}</p>
        <p>Morphology category: {viewModel.morphologyType}</p>
        <h5>Evidence Clues:</h5>
        <ul>
          {viewModel.evidenceNodes.map((n) => (
            <li key={n.id}>{n.label}</li>
          ))}
        </ul>
        <h5>Quality Dimensions:</h5>
        <ul>
          {viewModel.qualityRings.map((r) => (
            <li key={r.id}>
              {r.label}: {r.score} out of 20 points ({r.passed ? 'passed' : 'flagged'})
            </li>
          ))}
        </ul>
        <h5>Mission Waypoints:</h5>
        <ol>
          {viewModel.missionOrbit.waypoints.map((w) => (
            <li key={w.stepNumber}>{w.instruction}</li>
          ))}
        </ol>
      </div>

      {/* 5. Field Twin Modal */}
      {capturedImageUrl && (
        <FieldTwinModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          specimenAName={viewModel.subject}
          specimenAImage={capturedImageUrl}
          onComparisonComplete={handleComparisonComplete}
        />
      )}
    </section>
  );
}
