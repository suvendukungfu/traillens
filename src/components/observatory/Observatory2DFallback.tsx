'use client';

import React, { useState } from 'react';
import type { ObservatoryViewModel } from '@/lib/observatory/types';

interface Observatory2DFallbackProps {
  viewModel: ObservatoryViewModel;
  onSelectNode?: (node: { type: 'evidence' | 'waypoint' | 'quality' | 'specimen'; title: string; detail: string }) => void;
  className?: string;
}

export function Observatory2DFallback({
  viewModel,
  onSelectNode,
  className = '',
}: Observatory2DFallbackProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const viewBoxSize = 500;
  const center = viewBoxSize / 2;
  const scale = 50; // Scale unit factor for radii

  return (
    <div className={`relative w-full aspect-square max-w-135 mx-auto bg-[#FBF9F5] border border-[#E8E3D8] rounded-2xl overflow-hidden p-4 select-none ${className}`}>
      {/* Top Header Label */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#736B5E] bg-[#F4F0E6] px-2 py-0.5 rounded border border-[#E8E3D8]">
          2D Field Plate • Data Visualization
        </span>
      </div>

      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        aria-label="2D Field Observatory Diagram"
      >
        <defs>
          <radialGradient id="specimenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B88B2A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#B88B2A" stopOpacity="0" />
          </radialGradient>
          <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#19211B" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Background Coordinate Crosshairs */}
        <line x1={center} y1={20} x2={center} y2={viewBoxSize - 20} stroke="#E8E3D8" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={20} y1={center} x2={viewBoxSize - 20} y2={center} stroke="#E8E3D8" strokeWidth="1" strokeDasharray="4 4" />

        {/* 1. Quality Rings (Concentric circles from 1.4 to 3.7 scale) */}
        {viewModel.qualityRings.map((ring) => {
          const r = ring.radius * scale;
          const isHovered = hoveredId === ring.id;
          return (
            <g key={ring.id} className="cursor-pointer">
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={ring.color}
                strokeWidth={isHovered ? ring.thickness + 1.5 : ring.thickness}
                strokeOpacity={isHovered ? ring.opacity + 0.3 : ring.opacity}
                strokeDasharray={ring.passed ? '6 4' : '2 6'}
                onMouseEnter={() => setHoveredId(ring.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  onSelectNode?.({
                    type: 'quality',
                    title: `Quality: ${ring.label}`,
                    detail: `Score: ${ring.score} / ${ring.maxScore} pts (${ring.passed ? 'PASSED' : 'FLAGGED'}).`,
                  })
                }
              />
              <text
                x={center + 6}
                y={center - r + 10}
                fill={ring.color}
                fontSize="8"
                fontFamily="sans-serif"
                opacity={isHovered ? 0.9 : 0.6}
              >
                {ring.label} ({ring.score})
              </text>
            </g>
          );
        })}

        {/* 2. Mission Orbit (Elliptical path for the FieldMission) */}
        <ellipse
          cx={center}
          cy={center}
          rx={viewModel.missionOrbit.orbitRadius * scale}
          ry={viewModel.missionOrbit.orbitRadius * scale * 0.85}
          fill="none"
          stroke="#1C3D2B"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* 3. Evidence Nodes */}
        {viewModel.evidenceNodes.map((node) => {
          const x = center + Math.cos(node.angle) * node.radius * scale;
          const y = center + Math.sin(node.angle) * node.radius * scale;
          const isHovered = hoveredId === node.id;

          return (
            <g key={node.id} className="cursor-pointer">
              {/* Radial connector line back to specimen anchor */}
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#B88B2A"
                strokeWidth="0.75"
                strokeOpacity={isHovered ? 0.7 : 0.25}
                strokeDasharray="2 2"
              />
              {/* Evidence Node Circle */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : 5}
                fill={isHovered ? '#B88B2A' : '#F4F0E6'}
                stroke="#B88B2A"
                strokeWidth="1.5"
                filter="url(#subtleShadow)"
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  onSelectNode?.({
                    type: 'evidence',
                    title: 'Observed Visual Clue',
                    detail: node.label,
                  })
                }
              />
              <text
                x={x + 8}
                y={y + 3}
                fill="#19211B"
                fontSize="8.5"
                fontFamily="sans-serif"
                fontWeight={isHovered ? '600' : '400'}
                opacity={isHovered ? 1 : 0.75}
              >
                {node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label}
              </text>
            </g>
          );
        })}

        {/* 4. Mission Waypoints along Orbit */}
        {viewModel.missionOrbit.waypoints.map((wp) => {
          const rx = viewModel.missionOrbit.orbitRadius * scale;
          const ry = rx * 0.85;
          const angle = (wp.stepNumber / Math.max(1, viewModel.missionOrbit.waypoints.length + 1)) * Math.PI * 1.5;
          const x = center + Math.cos(angle) * rx;
          const y = center + Math.sin(angle) * ry;
          const isHovered = hoveredId === `wp-${wp.stepNumber}`;

          return (
            <g key={`wp-${wp.stepNumber}`} className="cursor-pointer">
              <rect
                x={x - 10}
                y={y - 8}
                width="20"
                height="16"
                rx="3"
                fill={isHovered ? '#1C3D2B' : '#F4F0E6'}
                stroke="#1C3D2B"
                strokeWidth="1.2"
                filter="url(#subtleShadow)"
                onMouseEnter={() => setHoveredId(`wp-${wp.stepNumber}`)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  onSelectNode?.({
                    type: 'waypoint',
                    title: `Mission Step 0${wp.stepNumber}`,
                    detail: wp.instruction,
                  })
                }
              />
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fill={isHovered ? '#FBF9F5' : '#1C3D2B'}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                0{wp.stepNumber}
              </text>
            </g>
          );
        })}

        {/* 5. Center Specimen Anchor Representation */}
        <g
          className="cursor-pointer"
          onClick={() =>
            onSelectNode?.({
              type: 'specimen',
              title: viewModel.subject,
              detail: `${viewModel.specimenDescription} Morphology category: ${viewModel.morphologyType}.`,
            })
          }
        >
          <circle cx={center} cy={center} r={42} fill="url(#specimenGlow)" />
          <circle
            cx={center}
            cy={center}
            r={24}
            fill="#F4F0E6"
            stroke="#B88B2A"
            strokeWidth="2"
            filter="url(#subtleShadow)"
          />

          {/* Morphological Iconography */}
          {viewModel.morphologyType === 'leaf' && (
            <path
              d={`M ${center} ${center - 14} C ${center + 12} ${center - 4}, ${center + 12} ${center + 8}, ${center} ${center + 14} C ${center - 12} ${center + 8}, ${center - 12} ${center - 4}, ${center} ${center - 14} Z`}
              fill="none"
              stroke="#1C3D2B"
              strokeWidth="1.5"
            />
          )}
          {viewModel.morphologyType === 'bark' && (
            <g stroke="#736B5E" strokeWidth="1.2">
              <line x1={center - 8} y1={center - 10} x2={center - 8} y2={center + 10} />
              <line x1={center} y1={center - 12} x2={center} y2={center + 12} />
              <line x1={center + 8} y1={center - 10} x2={center + 8} y2={center + 10} />
            </g>
          )}
          {viewModel.morphologyType === 'flower' && (
            <g stroke="#B88B2A" strokeWidth="1.2" fill="none">
              <circle cx={center} cy={center - 7} r="5" />
              <circle cx={center + 7} cy={center} r="5" />
              <circle cx={center} cy={center + 7} r="5" />
              <circle cx={center - 7} cy={center} r="5" />
            </g>
          )}
          {viewModel.morphologyType === 'stone' && (
            <polygon
              points={`${center - 10},${center - 5} ${center - 3},${center - 12} ${center + 10},${center - 7} ${center + 12},${center + 6} ${center - 2},${center + 11} ${center - 11},${center + 4}`}
              fill="none"
              stroke="#5A5245"
              strokeWidth="1.5"
            />
          )}
          {viewModel.morphologyType === 'cone' && (
            <g stroke="#8A5A2B" strokeWidth="1.2" fill="none">
              <ellipse cx={center} cy={center} rx="8" ry="12" />
              <line x1={center - 6} y1={center - 4} x2={center + 6} y2={center + 4} />
              <line x1={center - 6} y1={center + 4} x2={center + 6} y2={center - 4} />
            </g>
          )}
          {viewModel.morphologyType === 'ambient' && (
            <circle cx={center} cy={center} r="10" fill="none" stroke="#B88B2A" strokeWidth="1.5" />
          )}

          <text
            x={center}
            y={center + 34}
            textAnchor="middle"
            fill="#19211B"
            fontSize="9"
            fontFamily="serif"
            fontStyle="italic"
            fontWeight="bold"
          >
            {viewModel.subject.length > 20 ? `${viewModel.subject.slice(0, 18)}...` : viewModel.subject}
          </text>
        </g>
      </svg>

      {/* Subtle Legend Footer */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-[#736B5E] border-t border-[#E8E3D8] pt-2">
        <span>Gemma 3 4B Field Orbit</span>
        <span className="font-mono">{viewModel.confidence.toUpperCase()} CONFIDENCE</span>
      </div>
    </div>
  );
}
