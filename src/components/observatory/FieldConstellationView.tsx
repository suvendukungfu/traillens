'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Compass, Layers, CheckCircle2 } from 'lucide-react';
import type { AIAnalysisResult } from '@/types/trail';
import { adaptToObservatoryViewModel } from '@/lib/observatory/observatoryData';
import { Observatory2DFallback } from './Observatory2DFallback';

const Observatory3DScene = dynamic(() => import('./Observatory3DScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-75 bg-[#19211B] rounded-2xl flex items-center justify-center text-[#E8E3D8] text-xs font-mono">
      CHARTING TRAIL CONSTELLATION...
    </div>
  ),
});

interface FieldConstellationViewProps {
  observations: AIAnalysisResult[];
  className?: string;
}

export function FieldConstellationView({
  observations,
  className = '',
}: FieldConstellationViewProps) {
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');
  const [selectedObsIndex, setSelectedObsIndex] = useState<number>(0);

  if (!observations || observations.length === 0) {
    return null;
  }

  const activeObs = observations[selectedObsIndex] || observations[0];
  const viewModel = adaptToObservatoryViewModel(activeObs, observations);

  return (
    <div className={`bg-[#FBF9F5] border border-[#E8E3D8] rounded-3xl p-5 sm:p-6 space-y-4 font-sans shadow-xs ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D8]">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#B88B2A]" />
            <h3 className="font-serif font-bold text-base text-[#19211B]">
              Field Constellation & Discovery Graph
            </h3>
          </div>
          <p className="text-[11px] text-[#736B5E]">
            {observations.length} specimen{observations.length > 1 ? 's' : ''} charted in active field session
          </p>
        </div>

        {/* 3D vs 2D Switcher */}
        <div className="inline-flex bg-[#F4F0E6] p-0.5 rounded-lg border border-[#E8E3D8]">
          <button
            type="button"
            onClick={() => setRenderMode('3d')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              renderMode === '3d' ? 'bg-white text-[#19211B] shadow-xs' : 'text-[#736B5E]'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>3D</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderMode('2d')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              renderMode === '2d' ? 'bg-white text-[#19211B] shadow-xs' : 'text-[#736B5E]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>2D</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="aspect-16/10 w-full rounded-2xl overflow-hidden bg-[#19211B] relative">
        {renderMode === '3d' ? (
          <Observatory3DScene viewModel={viewModel} />
        ) : (
          <Observatory2DFallback viewModel={viewModel} />
        )}
      </div>

      {/* Specimen Observation Node Selectors */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#736B5E] block">
          Select Observation Focus
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {observations.map((obs, idx) => {
            const isSelected = selectedObsIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedObsIndex(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-white border-[#B88B2A] ring-1 ring-[#B88B2A]/40 shadow-xs'
                    : 'bg-[#F4F0E6] border-[#E8E3D8] hover:bg-white/80'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-serif font-semibold text-xs text-[#19211B] truncate">
                    {obs.identification}
                  </div>
                  <div className="text-[10px] text-[#736B5E] flex items-center gap-1.5">
                    <span>{obs.mission?.missionType || 'OBSERVE'}</span>
                    <span>•</span>
                    <span className="capitalize">{obs.confidence} confidence</span>
                  </div>
                </div>
                {obs.qualityReport?.passed && (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
