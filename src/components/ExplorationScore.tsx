'use client';

import React from 'react';
import type { SessionStats } from '@/types/trail';
import { Award } from 'lucide-react';

interface ExplorationScoreProps {
  stats: SessionStats;
}

/**
 * Transparent scoring model:
 * - 1 point per 50m walked
 * - 1 point per 60s spent outside
 * - 10 points per outdoor observation made
 * - 15 points per completed challenge
 */
export function calculateTransparentScore(stats: SessionStats): {
  total: number;
  breakdown: { label: string; count: string; points: number }[];
} {
  const distancePts = Math.floor(stats.totalDistanceMeters / 50);
  const timePts = Math.floor(stats.elapsedSeconds / 60);
  const observationPts = stats.observationsCount * 10;
  const challengePts = stats.completedChallengesCount * 15;

  const total = distancePts + timePts + observationPts + challengePts;

  const breakdown = [
    {
      label: 'Distance Explored',
      count: `${(stats.totalDistanceMeters / 1000).toFixed(2)} km`,
      points: distancePts,
    },
    {
      label: 'Time Spent Outside',
      count: `${Math.floor(stats.elapsedSeconds / 60)} min`,
      points: timePts,
    },
    {
      label: 'Nature Observations',
      count: `${stats.observationsCount}`,
      points: observationPts,
    },
    {
      label: 'Challenges Completed',
      count: `${stats.completedChallengesCount}`,
      points: challengePts,
    },
  ];

  return { total, breakdown };
}

export default function ExplorationScore({ stats }: ExplorationScoreProps) {
  const { total, breakdown } = calculateTransparentScore(stats);

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-moss-light text-moss-dark flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Exploration Summary</h3>
            <p className="text-[11px] text-rock">Transparent outdoor activity score</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-moss">{total}</span>
          <span className="text-xs text-rock font-medium ml-1">pts</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border-subtle">
        {breakdown.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-surface-muted"
          >
            <span className="text-rock font-medium">{item.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-foreground font-semibold">{item.count}</span>
              <span className="font-bold text-moss w-12 text-right">
                +{item.points}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-rock text-center italic">
        Scores exist solely to celebrate your time outdoors, never to trap you on a screen.
      </p>
    </div>
  );
}
