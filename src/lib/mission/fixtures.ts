/**
 * TrailLens — Milestone 4: Evaluation Fixture Suite
 * Deterministic benchmark test fixtures representing diverse quality, grounding,
 * specificity, safety, executability, and outdoor-worthwhile states.
 */

import type { FieldMission } from '@/types/trail';
import type { MissionAnalysisContext } from './quality';

export interface MissionQualityFixture {
  id: string;
  name: string;
  category: 'strong' | 'failing';
  description: string;
  context: MissionAnalysisContext;
  mission: FieldMission;
  expected: {
    passed: boolean;
    minScore?: number;
    maxScore?: number;
    expectedFails?: Array<
      'grounding' | 'specificity' | 'safety' | 'executability' | 'outdoorWorthwhile'
    >;
    primaryIssueCode?: string;
  };
}

export const MISSION_QUALITY_FIXTURES: MissionQualityFixture[] = [
  // A. Strong grounded leaf mission
  {
    id: 'fixture-a-grounded-leaf',
    name: 'A. Strong Grounded Leaf Mission',
    category: 'strong',
    description: 'Exemplary grounded observation of Coast Live Oak leaf morphology.',
    context: {
      identification: 'Coast Live Oak (Quercus agrifolia)',
      description: 'An evergreen oak tree with dark green, convex, oval leaves having spiny-toothed margins.',
      evidence: ['Oval convex leaves', 'Spiny toothed leaf margins', 'Grown on spreading oak branches'],
    },
    mission: {
      missionType: 'COMPARE',
      title: 'Oak Leaf Margin Tooth Study',
      target: 'Compare leaf margin serrations between two nearby oak leaves',
      durationSeconds: 180,
      steps: [
        'Put your phone in your pocket and take 10-15 paces to locate a second oak branch or fallen leaf',
        'Look closely at the leaf margins of both specimens',
        'Count the pointed lobes or spine-tipped teeth along each leaf edge',
      ],
      successCriteria: 'Visually identify whether the two leaves have identical or differing numbers of spiny teeth',
      safetyConstraints: [
        'Observe only; do not pluck leaves from living branches',
        'Stay on established trails and mind low branches',
      ],
    },
    expected: {
      passed: true,
      minScore: 85,
    },
  },

  // B. Vague generic mission
  {
    id: 'fixture-b-vague-generic',
    name: 'B. Vague Generic Mission',
    category: 'failing',
    description: 'Fails specificity by using generic empty filler phrases.',
    context: {
      identification: 'Western Hemlock (Tsuga heterophylla)',
      description: 'A large evergreen conifer with droop-topped leader and short flat needles.',
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'General Nature Exploration',
      target: 'Explore the area around the forest',
      durationSeconds: 180,
      steps: [
        'Look around the area and observe nature',
        'Study the object and check it out',
        'See what you can find nearby',
      ],
      successCriteria: 'Enjoy your time observing nature',
      safetyConstraints: ['Stay safe outdoors'],
    },
    expected: {
      passed: false,
      maxScore: 75,
      expectedFails: ['specificity'],
      primaryIssueCode: 'SPECIFICITY_VAGUE_PHRASE',
    },
  },

  // C. Grounding mismatch
  {
    id: 'fixture-c-grounding-mismatch',
    name: 'C. Grounding Mismatch',
    category: 'failing',
    description: 'Fails grounding by asking user to measure irrelevant atmospheric air pressure.',
    context: {
      identification: 'Western Sword Fern (Polystichum munitum)',
      description: 'An evergreen fern with pinnate fronds and circular spore clusters.',
      evidence: ['Pinnate fronds', 'Sori on frond underside'],
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'Atmospheric Sensor Check',
      target: 'Estimate the current barometric air pressure and relative humidity',
      durationSeconds: 180,
      steps: [
        'Walk around the clearing and check barometric air pressure conditions',
        'Estimate whether atmospheric humidity is rising or falling',
      ],
      successCriteria: 'Record estimated barometric air pressure',
      safetyConstraints: ['Stay on trail'],
    },
    expected: {
      passed: false,
      maxScore: 75,
      expectedFails: ['grounding'],
      primaryIssueCode: 'GROUNDING_IRRELEVANT_DOMAIN',
    },
  },

  // D. Invalid duration
  {
    id: 'fixture-d-invalid-duration',
    name: 'D. Invalid Duration Out of Bounds',
    category: 'failing',
    description: 'Fails executability by setting a 60-second duration (below 120s minimum).',
    context: {
      identification: 'Coast Douglas-fir (Pseudotsuga menziesii)',
      description: 'A tall conifer with deeply furrowed reddish-brown bark.',
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'Bark Fissure Depth Inspection',
      target: 'Inspect furrowed ridges on lower Douglas-fir trunk bark',
      durationSeconds: 60, // Invalid: < 120s
      steps: [
        'Walk 3 paces to the tree trunk',
        'Look closely at the depth of the longitudinal bark ridges',
      ],
      successCriteria: 'Visually identify at least two ridges deeper than two fingers',
      safetyConstraints: ['Observe only; do not peel bark from the living tree'],
    },
    expected: {
      passed: false,
      expectedFails: ['executability'],
      primaryIssueCode: 'EXECUTABILITY_DURATION_OUT_OF_BOUNDS',
    },
  },

  // E. Empty success criteria
  {
    id: 'fixture-e-empty-success',
    name: 'E. Empty Success Criteria',
    category: 'failing',
    description: 'Fails executability with trivial non-verifiable success criteria.',
    context: {
      identification: 'Pacific Madrone (Arbutus menziesii)',
      description: 'Broadleaf evergreen tree with chartreuse and cinnamon-red peeling bark.',
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'Madrone Peeling Bark Study',
      target: 'Observe the exfoliating paper-thin bark curling on trunk branches',
      durationSeconds: 180,
      steps: [
        'Step within 4 paces of the smooth trunk',
        'Examine where red bark separates from fresh green wood underneath',
      ],
      successCriteria: 'Done.', // Trivial
      safetyConstraints: ['Leave all peeling bark undisturbed on the trunk'],
    },
    expected: {
      passed: false,
      expectedFails: ['executability'],
      primaryIssueCode: 'EXECUTABILITY_UNVERIFIABLE_SUCCESS_CRITERIA',
    },
  },

  // F. Unsafe activity
  {
    id: 'fixture-f-unsafe-activity',
    name: 'F. Unsafe Activity (Foraging / Ingestion)',
    category: 'failing',
    description: 'Fails safety gate by instructing user to pick and taste fungi.',
    context: {
      identification: 'Fly Agaric (Amanita muscaria)',
      description: 'Toxic mushroom with bright red cap adorned with white warts.',
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'Mushroom Cap Taste Test',
      target: 'Pick the mushroom cap and brew a small wild tea',
      durationSeconds: 180,
      steps: [
        'Pick the bright red mushroom cap from the forest floor',
        'Touch and crush the fungus gills between your fingers',
        'Taste a tiny piece or steep in water for tea',
      ],
      successCriteria: 'Harvest one mushroom and note its flavor',
      safetyConstraints: [], // Missing constraints
    },
    expected: {
      passed: false,
      maxScore: 65,
      expectedFails: ['safety'],
      primaryIssueCode: 'SAFETY_HAZARD_DETECTED',
    },
  },

  // G. Screen-only activity
  {
    id: 'fixture-g-screen-only',
    name: 'G. Screen-Only Cognitive Activity',
    category: 'failing',
    description: 'Fails outdoor-worthwhile dimension by demanding the user stare at the phone screen.',
    context: {
      identification: 'Red Alder (Alnus rubra)',
      description: 'Deciduous tree with smooth gray bark mottled with white lichens.',
    },
    mission: {
      missionType: 'NOTICE',
      title: 'Screen Fact Memorization',
      target: 'Read the description on your screen and memorize three facts',
      durationSeconds: 180,
      steps: [
        'Stare at the phone screen',
        'Read the description and remember three facts about Red Alder',
        'Think about why this species is interesting in your head',
      ],
      successCriteria: 'Recall three botanical facts from memory without looking at nature',
      safetyConstraints: ['Stay on trail'],
    },
    expected: {
      passed: false,
      maxScore: 75,
      expectedFails: ['outdoorWorthwhile'],
      primaryIssueCode: 'OUTDOOR_SCREEN_ONLY_TASK',
    },
  },

  // H. Strong comparison mission
  {
    id: 'fixture-h-strong-comparison',
    name: 'H. Strong Comparison Mission',
    category: 'strong',
    description: 'Exemplary comparative field mission exploring Bigleaf Maple canopy vs ground leaves.',
    context: {
      identification: 'Bigleaf Maple (Acer macrophyllum)',
      description: 'Deciduous tree bearing large 5-lobed leaves up to 30 cm across.',
      evidence: ['Deeply 5-lobed leaves', 'Opposite branching pattern', 'Prominent palmate veins'],
    },
    mission: {
      missionType: 'COMPARE',
      title: 'Maple Canopy vs Leaf Litter Symmetry',
      target: 'Compare leaf lobe symmetry between a canopy leaf and a fallen ground leaf',
      durationSeconds: 240,
      steps: [
        'Put your phone in your pocket and scan the forest floor for a fallen maple leaf',
        'Look up at the overhead canopy branches to locate a leaf still attached',
        'Compare the five palmate lobes and primary vein radiating angles between both leaves',
      ],
      successCriteria: 'Visually confirm whether the shaded ground leaf exhibits deeper sinus cuts than the canopy leaf',
      safetyConstraints: [
        'Observe only; do not break living branches',
        'Watch your footing on slippery wet leaf litter',
      ],
    },
    expected: {
      passed: true,
      minScore: 85,
    },
  },

  // I. Strong counting mission
  {
    id: 'fixture-i-strong-counting',
    name: 'I. Strong Counting Mission',
    category: 'strong',
    description: 'Exemplary counting mission mapping pine cone Fibonacci spirals in nature.',
    context: {
      identification: 'Lodgepole Pine Cone (Pinus contorta)',
      description: 'Small, woody serotinous cone with asymmetrical base and prickly scale prickles.',
      evidence: ['Asymmetrical woody cone', 'Prickle on scale umbo'],
    },
    mission: {
      missionType: 'COUNT',
      title: 'Pine Cone Fibonacci Spiral Tally',
      target: 'Tally the spiral rows of woody scales on the pine cone',
      durationSeconds: 180,
      steps: [
        'Put your phone away and choose a stable vantage point 2 paces away from the cone',
        'Count the clockwise spiral rows of seed scales from base to apex',
        'Count the counter-clockwise spiral rows on the same cone',
      ],
      successCriteria: 'Confirm whether the clockwise and counter-clockwise counts form adjacent Fibonacci numbers (e.g. 5 and 8)',
      safetyConstraints: [
        'Observe in place without collecting cones or taking specimens home',
        'Stay on designated trails',
      ],
    },
    expected: {
      passed: true,
      minScore: 85,
    },
  },

  // J. Strong observation mission
  {
    id: 'fixture-j-strong-observation',
    name: 'J. Strong Observation Mission',
    category: 'strong',
    description: 'Exemplary observation mission studying concentric growth zones of crustose rock lichen.',
    context: {
      identification: 'Crustose Lichen on Basalt Rock',
      description: 'Tightly adhering saxicolous lichen forming circular crust patches on weathered dark stone.',
      evidence: ['Crust-like thallus', 'Concentric circular rings', 'Dark basalt substrate'],
    },
    mission: {
      missionType: 'OBSERVE',
      title: 'Crustose Lichen Concentric Growth Ring Study',
      target: 'Map the concentric circular growth zones of the crustose lichen patch',
      durationSeconds: 180,
      steps: [
        'Step 3 paces closer and crouch to eye level with the basalt rock face',
        'Trace the outer margin edge where the lichen meets bare stone without touching',
        'Notice the color gradient between the pale outer ring and dark fungal center',
      ],
      successCriteria: 'Visually confirm distinct color transition between inner apothecia and outer growth margin',
      safetyConstraints: [
        'Observe only without scraping, scratching, or abrading rock surfaces',
        'Watch your footing on uneven or damp stone surfaces',
      ],
    },
    expected: {
      passed: true,
      minScore: 85,
    },
  },
];
