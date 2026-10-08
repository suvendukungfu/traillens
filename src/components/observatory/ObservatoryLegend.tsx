'use client';

import React from 'react';
import type { QualityDimensionName } from '@/lib/observatory/types';

interface ObservatoryLegendProps {
  activeDimension?: QualityDimensionName | null;
  onSelectDimension?: (dim: QualityDimensionName | null) => void;
  className?: string;
}

export function ObservatoryLegend({
  activeDimension,
  onSelectDimension,
  className = '',
}: ObservatoryLegendProps) {
  const dimensions: Array<{ name: QualityDimensionName; label: string; desc: string; color: string }> = [
    { name: 'grounding', label: 'Grounding', desc: 'Anchored to analyzed physical specimen', color: '#B88B2A' },
    { name: 'specificity', label: 'Specificity', desc: 'Concrete observable actions vs vague filler', color: '#C5A059' },
    { name: 'safety', label: 'Safety', desc: 'Leave No Trace & zero physical hazard gate', color: '#4A7C59' },
    { name: 'executability', label: 'Executability', desc: '120–300s duration achievable without tools', color: '#2C5E3B' },
    { name: 'outdoorWorthwhile', label: 'Outdoor Value', desc: 'Forces real-world physical engagement', color: '#1C3D2B' },
  ];

  return (
    <div className={`p-4 bg-[#F4F0E6]/95 border border-[#E8E3D8] rounded-xl text-xs space-y-3 font-sans ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E3D8]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#B88B2A] animate-pulse" />
          <span className="font-serif italic font-semibold text-[#19211B] text-sm">
            Field Observatory Instrument
          </span>
        </div>
        <span className="text-[10px] tracking-wider uppercase text-[#736B5E]">
          Spatial Data Layer
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-[#5A5245]">
        Every 3D spatial orbit and node is derived directly from Gemma&apos;s multimodal analysis and the deterministic
        Mission Quality rubric.
      </p>

      {/* Quality Ring Legend */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#736B5E] block">
          Orbital Quality Rings (0–20 pts)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {dimensions.map((dim) => {
            const isSelected = activeDimension === dim.name;
            return (
              <button
                key={dim.name}
                type="button"
                onClick={() => onSelectDimension?.(isSelected ? null : dim.name)}
                className={`flex items-center space-x-2 p-1.5 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-[#E8E3D8] ring-1 ring-[#B88B2A]'
                    : 'hover:bg-[#EFEADF]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: dim.color }}
                />
                <div className="min-w-0">
                  <div className="font-medium text-[#19211B] truncate">{dim.label}</div>
                  <div className="text-[9px] text-[#736B5E] truncate">{dim.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Geometry Element Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E8E3D8] text-[10px]">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rotate-45 bg-[#B88B2A]" />
          <span className="text-[#5A5245]">Center: Anchor</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <span className="text-[#5A5245]">Orbits: Clues</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-sm bg-[#10B981]" />
          <span className="text-[#5A5245]">Track: Steps</span>
        </div>
      </div>

      <div className="text-[9px] italic text-[#8A8275] pt-1">
        *Center object is an abstract visual field representation, not a 3D scan reconstruction.
      </div>
    </div>
  );
}
