'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Compass, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { AIAnalysisResult } from '@/types/trail';
import { adaptToObservatoryViewModel } from '@/lib/observatory/observatoryData';

// Lazy-load 3D WebGL scene to preserve 100% lightweight initial page load
const Observatory3DScene = dynamic(() => import('./Observatory3DScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#19211B] flex items-center justify-center text-[#E8E3D8] text-xs font-mono">
      ALIGNING FIELD ORBITS...
    </div>
  ),
});

const HERO_SAMPLE_OBSERVATION: AIAnalysisResult = {
  identification: 'Quercus robur (English Oak)',
  confidence: 'high',
  evidence: [
    'Deep alternate sinuses between lobes',
    'Prominent radiating secondary veins',
    'Waxy upper leaf cuticle',
  ],
  description: 'Sinuses deeply lobed to harvest filtered sunlight in the lower forest canopy.',
  observation: 'Compare vein architecture with adjacent saplings on the windward slope.',
  mission: {
    missionType: 'COMPARE',
    title: 'Two leaves. One subtle difference.',
    target: 'Vein architecture in adjacent oak specimens',
    durationSeconds: 180,
    steps: [
      'Locate another nearby oak leaf',
      'Compare number of lobes and sinus depth',
      'Notice windward vs leeward vein symmetry',
    ],
    successCriteria: 'Compared lobe count and primary vein spacing',
    safetyConstraints: ['Stay on marked trail', 'Leave specimens in situ'],
  },
  challenge: 'Compare vein architecture in adjacent oak specimens.',
  safety: 'Observe without trampling understory vegetation.',
  qualityReport: {
    totalScore: 92,
    passed: true,
    grounded: true,
    specific: true,
    safe: true,
    executable: true,
    outdoorWorthwhile: true,
    dimensionScores: {
      grounding: 19,
      specificity: 18,
      safety: 20,
      executability: 18,
      outdoorWorthwhile: 17,
    },
    issues: [],
  },
};

export default function HeroObservatoryWindow() {
  const [viewMode, setViewMode] = useState<'photo' | 'observatory'>('photo');

  const viewModel = adaptToObservatoryViewModel(HERO_SAMPLE_OBSERVATION);

  return (
    <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none aspect-4/5 rounded-3xl overflow-hidden bg-stone-900 border border-stone-300/80 shadow-xl group">
      {/* View Switcher Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 text-[10px] font-sans">
        <button
          type="button"
          onClick={() => setViewMode('photo')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-medium transition-all ${
            viewMode === 'photo'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Specimen</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('observatory')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-medium transition-all ${
            viewMode === 'observatory'
              ? 'bg-[#B88B2A] text-white shadow-xs'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Compass className="w-3 h-3 text-white" />
          <span>Observatory 3D</span>
        </button>
      </div>

      {viewMode === 'photo' ? (
        <>
          <Image
            src="/samples/oak_leaf_optimized.jpg"
            alt="Quercus robur leaf observation on mossy forest floor"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />

          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Top Specimen Tag */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 shadow-xs">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-800 font-sans">
              SPECIMEN NO. 01 · QUERCUS ROBUR
            </span>
          </div>

          {/* Lower Metadata */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-medium block mb-1">
              FIELD OBSERVATION
            </span>
            <p className="text-lg font-serif italic text-white/95 leading-snug">
              &ldquo;Sinuses deeply lobed to harvest sunlight in the lower canopy.&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-stone-300 border-t border-white/15 pt-2">
              <span>LOCAL GEMMA 3 4B</span>
              <span className="text-emerald-400 font-semibold">92/100 QUALITY</span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full relative bg-[#19211B] flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 bg-[#19211B]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-[#E8E3D8]">
            <Sparkles className="w-3 h-3 text-[#B88B2A]" />
            <span className="font-mono tracking-wider uppercase">Field Observatory</span>
          </div>

          <div className="w-full h-full">
            <Observatory3DScene viewModel={viewModel} isPaused={false} />
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#19211B]/85 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#B88B2A]">
              <span>5 QUALITY RINGS • 3 CLUES</span>
              <span>ORBIT: COMPARE</span>
            </div>
            <p className="text-xs font-serif italic text-[#E8E3D8]">
              AI turns morphological observations into physical outdoor missions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
