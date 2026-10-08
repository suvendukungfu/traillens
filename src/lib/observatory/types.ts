/**
 * TrailLens - Field Observatory Types & Contracts
 * Pure, serializable view model isolating 3D & 2D visualization from domain state.
 */

import type { AIConfidence, FieldComparison, MissionType } from '@/types/trail';

export type { FieldComparison };

export type SpecimenMorphologyType = 'leaf' | 'bark' | 'flower' | 'stone' | 'cone' | 'ambient';

export interface EvidenceNode {
  id: string;
  label: string;
  angle: number; // In radians [0, 2*PI]
  radius: number; // Spatial distance from center
  elevation: number; // Vertical offset
  importance: number; // Normalized [0, 1]
}

export type QualityDimensionName =
  | 'grounding'
  | 'specificity'
  | 'safety'
  | 'executability'
  | 'outdoorWorthwhile';

export interface QualityRingData {
  id: string;
  name: QualityDimensionName;
  label: string;
  score: number; // Actual score (0 to 20)
  maxScore: number; // 20
  radius: number; // Radial band radius
  thickness: number; // Geometric line thickness
  opacity: number; // Computed visibility opacity
  passed: boolean; // >= 14
  color: string; // Theme hex
  dashCount: number; // Segment pattern
}

export interface MissionWaypoint {
  stepNumber: number;
  instruction: string;
  position: [number, number, number]; // [x, y, z] in spatial coords
}

export type MissionOrbitGrammar =
  | 'single_stable' // OBSERVE: Single continuous elliptical ring
  | 'dual_intertwined' // COMPARE: Paired interlaced orbits
  | 'segmented_count' // COUNT: Dotted, repeated waypoint segments
  | 'radial_beacon' // NOTICE: Concentrated inner orbit with focal nodes
  | 'open_arc' // TRACE: Open sweeping spiral curve
  | 'harmonic_rosette'; // PATTERN: Multi-lobed harmonic geometry

export interface MissionOrbitData {
  missionType: MissionType;
  title: string;
  target: string;
  durationSeconds: number;
  grammar: MissionOrbitGrammar;
  orbitRadius: number;
  inclination: number; // Tilt angle in radians
  waypoints: MissionWaypoint[];
  successCriteria: string;
}

export interface FieldConstellationNode {
  id: string;
  subject: string;
  morphologyType: SpecimenMorphologyType;
  missionType: MissionType;
  timestamp: number;
  position: [number, number, number];
  score: number;
  hasReflection: boolean;
  connections: string[]; // IDs of related observation nodes
}


export interface ObservatoryViewModel {
  subject: string;
  morphologyType: SpecimenMorphologyType;
  confidence: AIConfidence;
  specimenDescription: string;
  observationPrompt: string;
  evidenceNodes: EvidenceNode[];
  qualityRings: QualityRingData[];
  qualityOverallScore: number;
  hasQualityReport: boolean;
  missionOrbit: MissionOrbitData;
  constellationNodes: FieldConstellationNode[];
  comparison?: FieldComparison;
}
