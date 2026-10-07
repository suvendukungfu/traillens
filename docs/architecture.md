# TrailLens Architecture & Technical Specification

> **Project Name:** TrailLens  
> **Tagline:** Look beyond the screen.  
> **Hacktoberfest 2026 Track:** Open-Source AI Challenge — Week 1 (*Touch Grass*)  
> **Target Category:** Best Use of Gemma  

---

## 1. Architectural Philosophy & Product Loop

TrailLens is an outdoor-first AI companion designed with a single contrarian thesis: **the screen is a temporary bridge, never the destination**.

Modern consumer mobile applications prioritize engagement loops, infinite feeds, and persistent screen retention. TrailLens inverts this pattern by using local, open-weight multimodal artificial intelligence to rapidly interpret nature observations and immediately challenge the user to put their device away.

```text
       [USER ENTERS OUTDOORS]
                  │
                  ▼
       [CAPTURE SINGLE OBSERVATION]
       (Live Camera or Photo Upload)
                  │
                  ▼
       [CLIENT DOWNSCALING & SANITIZATION]
       (Canvas resize to ≤640px, JPEG 0.80)
                  │
                  ▼
       [SERVER-SIDE ROUTE HANDLER]
       (POST /api/analyze with strict Zod validation)
                  │
                  ▼
       [LOCAL OLLAMA INFERENCE ENGINE]
       (Google Gemma 3 4B Multimodal via Loopback HTTP)
                  │
                  ▼
       [STRUCTURED FIELD GUIDE EXTRACTION]
       (Identification, Clues, Description, Safety)
                  │
                  ▼
       [FIELD CHALLENGE GENERATED]
       ("Put phone in pocket for 2-5 minutes")
                  │
                  ▼
       [USER EXPLORES PHYSICAL ENVIRONMENT]
       (Background Geolocation & Haversine Distance)
                  │
                  ▼
       [SESSION COMPLETION & EXPLORATION SCORE]
```

---

## 2. System Architecture & Boundaries

The system is partitioned into three strictly decoupled layers: Client Browser, Next.js Server Runtime, and Local Ollama Inference Engine.

```text
+───────────────────────────────────────────────────────────────────────────+
│                            1. CLIENT BROWSER                              │
│                                                                           │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐  │
│  │   Field Camera UI     │ │  Field Guide Card    │ │  Outdoor Session │  │
│  │  (MediaDevices API /  │ │ (Identification,     │ │ (GPS Watcher,    │  │
│  │   HTML5 Canvas Scale) │ │  Evidence, Challenge)│ │  Haversine HUD)  │  │
│  └───────────┬───────────┘ └──────────┬───────────┘ └────────┬─────────┘  │
│              │                        ▲                      │            │
│              │ Base64 Image (POST)    │ Structured JSON      │ Local GPS  │
│              ▼                        │ Response             │ Fixes      │
+──────────────┼────────────────────────┼──────────────────────┼────────────+
               │                        │                      │
               ▼                        │                      ▼
+───────────────────────────────────────┴──────────────────────┴────────────+
│                        2. NEXT.JS SERVER RUNTIME                          │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Route Handler: POST /api/analyze                                    │  │
│  │  - JSON payload validation (analyzeRequestSchema)                   │  │
│  │  - MIME type verification (JPEG, PNG, WebP)                         │  │
│  │  - Safe timing diagnostics (no raw base64 or secrets in logs)       │  │
│  └──────────────────────────────────┬──────────────────────────────────┘  │
│                                     │                                     │
│  ┌──────────────────────────────────▼──────────────────────────────────┐  │
│  │ Ollama Client Adapter (src/lib/ollama.ts)                           │  │
│  │  - Loopback endpoint: http://127.0.0.1:11434                        │  │
│  │  - Configurable model: gemma3:4b (via OLLAMA_MODEL)                 │  │
│  │  - AbortController timeout guard (180s limit)                       │  │
│  │  - Strict JSON sanitation & rescue fallback parser                  │  │
│  └──────────────────────────────────┬──────────────────────────────────┘  │
│                                     │                                     │
+─────────────────────────────────────┼─────────────────────────────────────+
                                      │
                                      ▼ Internal Loopback HTTP (127.0.0.1)
+───────────────────────────────────────────────────────────────────────────+
│                     3. LOCAL OLLAMA INFERENCE ENGINE                      │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Google Gemma 3 4B (Multimodal GGUF / Q4_K_M)                        │  │
│  │  - Visual reasoning over botanical, geological, & zoological traits │  │
│  │  - Structured field guide schema emission                           │  │
│  │  - Conservation & non-edibility safety guardrails                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
+───────────────────────────────────────────────────────────────────────────+
```

### Boundary Guarantees

1. **The browser never communicates with Ollama directly.** All inference flows through `POST /api/analyze` to enforce validation, guard against unconstrained client payloads, and prevent CORS/network exposure.
2. **Ephemeral Geolocation:** Geolocation coordinates never leave the browser. Coordinates are processed entirely in client memory and discarded upon session completion or navigation.
3. **Zero Third-Party Telemetry:** No external tracking scripts, cloud analytics, or closed API tokens exist in the runtime.

---

## 3. Data Contracts & Type Definitions

Data contracts are enforced at compile time via TypeScript and at runtime via Zod schemas.

### Primary Domain Types (`src/types/trail.ts`)

```typescript
export type AIConfidence = 'low' | 'medium' | 'high';

export type MissionType =
  | 'OBSERVE'
  | 'COMPARE'
  | 'COUNT'
  | 'NOTICE'
  | 'TRACE'
  | 'PATTERN';

export interface FieldMission {
  missionType: MissionType;
  title: string;
  target: string;
  durationSeconds: number; // bounded between 120 and 300
  steps: string[]; // 1 to 4 steps
  successCriteria: string;
  safetyConstraints: string[];
}

export interface AIAnalysisResult {
  identification: string;
  confidence: AIConfidence;
  uncertaintyReason?: string;
  evidence: string[];
  description: string;
  observation: string;
  mission?: FieldMission; // Structured source of truth
  challenge: string; // Presentation projection (backward compatible)
  safety: string;
  inferenceDurationMs?: number;
}

export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface OutdoorChallenge {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'easy' | 'moderate' | 'curious';
  status: ChallengeStatus;
  points: number;
  completedAt?: number;
  mission?: FieldMission;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface SessionStats {
  elapsedSeconds: number;
  totalDistanceMeters: number;
  observationsCount: number;
  completedChallengesCount: number;
  explorationScore: number;
}
```

---

## 4. Multimodal AI Integration (Gemma 3 4B)

### Model Selection Rationale

- **Model:** `gemma3:4b` (`gemma3:4b-it` multimodal, 4.3B parameters, GGUF Q4_K_M quantization).
- **Footprint:** ~3.3 GB disk footprint, runs at low latency on modern laptop unified memory (Apple Metal, NVIDIA CUDA, or modern CPU).
- **Multimodal Competence:** Demonstrates morphological awareness for botanical structures (leaf lobes, waxy cuticles, venation), geological textures (river pebbles, quartz veins), and fungal/lichen growths.
- **Local-First Independence:** Can execute inference without external internet connectivity when Next.js, Ollama, and model weights reside on the same host machine.

### Prompt Engineering & Structured Output

The prompt (`src/lib/prompts.ts`) instructs Gemma 3 to act as an offline AI field-experiment engine producing grounded observations and a structured Field Mission Contract:

1. **Identification:** Direct, concise common name.
2. **Confidence:** Self-reported label (`high`, `medium`, or `low`) emitted as text by the model. It is not a calibrated model probability.
3. **Uncertainty Reason:** Explicit justification when confidence is medium or low.
4. **Visual Evidence:** 2 to 4 concrete anatomical or environmental features seen in the photo.
5. **Description:** Educational background (1–2 sentences).
6. **Observation:** What surrounding environmental details to inspect.
7. **Field Mission:** Structured experiment (`missionType`, `target`, `durationSeconds`, `steps`, `successCriteria`, `safetyConstraints`).
8. **Safety Notice:** Compulsory warning regarding wildlife distance, terrain safety, and strict prohibition on wild foraging/edibility.

#### Structured Output Mechanism (`src/lib/ollama.ts` & `src/lib/validation.ts`)

1. **Ollama JSON Schema Format:** Local Ollama (v0.35.1+) supports passing a JSON Schema object directly through the chat `format` parameter.
2. **Schema Compilation via Zod 4:** A pure structural schema (`rawAIAnalysisOutputSchema`) is compiled into standard JSON Schema via `z.toJSONSchema()` and passed in the `format` field of the Ollama request payload, guiding token generation to conform to the Field Mission structure.
3. **Runtime Validation & Transformations:** The model response is validated through `aiAnalysisResultSchema.parse()`, applying Leave No Trace safety sanitization, compiling the deterministic challenge string, and providing fallbacks.
4. **Resilient Fallback Parser:** If the local daemon drops punctuation or wraps in markdown fences, `sanitizeJsonText` and `attemptJsonRescue` provide robust recovery before throwing.

---

## 5. Geolocation Engine & Geodesic Calculation

### The Haversine Distance Engine (`src/lib/distance.ts`)

Calculates great-circle distance between spherical coordinates on Earth (mean radius $R = 6,371,000$ meters):

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

### Jitter Mitigation

Raw mobile GPS chips experience positional drift when stationary. `calculateTrackDistance` applies one filter:

1. **Displacement Threshold:** A new point closer than $2.0$ meters (default `jitterThresholdMeters`) to the last accepted point is treated as stationary noise and not added to the distance; the last accepted point is kept as the reference.

Invalid coordinates (NaN, non-finite, or out of latitude/longitude bounds) contribute 0 meters. The reported GPS `accuracy` is stored on each `GeoPoint` but is not used for filtering, and there is no speed-based filter.

### Lifecycle & Resource Management (`src/lib/geolocation.ts`)

- The browser watcher (`navigator.geolocation.watchPosition`) is encapsulated within `GeolocationManager` (exported singleton `geoManager`).
- Whenever a session pauses, completes, or unmounts, `geoManager.stopTracking()` clears the watcher (`clearWatch`) and resets the tracking state.
- Timer intervals are explicitly tracked via React `useRef` and terminated in `useEffect` cleanup handlers to prevent background memory leaks and battery depletion.
- *Browser Limitation Note:* Standard web geolocation operates while the application tab remains active. Mobile operating systems may throttle or suspend web timers and geolocation watchers if the browser is backgrounded.

---

## 6. Security, Privacy, Offline Operation, and Challenge Safety Gate

1. **Local-First Offline Operation:** Inference occurs over loopback `127.0.0.1:11434`. TrailLens executes without internet connectivity when the web application, local Ollama service, and model weights are running locally on the same host machine. (If hosted remotely, network connectivity between client browser and Next.js server is required, but no third-party cloud AI is ever contacted).
2. **Input Hygiene:** Images uploaded to `/api/analyze` are bounded by strict payload limits (20MB base64 ceiling in Zod) and validated against allowed declared data-URL MIME types (`image/jpeg`, `image/png`, `image/webp`). (Validation inspects the declared data-URL header and payload length rather than performing binary magic-byte decoding).
3. **Production Challenge Safety Gate (`src/lib/safety/challenge.ts`):** Because wild plant and fungi identification cannot guarantee toxicological safety, a two-layer defense-in-depth safety gate inspects every AI-generated outdoor challenge:
   - **Layer 1 (Schema Sanitization):** Enforced during Zod parsing (`src/lib/validation.ts`). Negated safety warnings ("do not taste...") are stripped before keyword evaluation so safe instructions are not misflagged, while genuine hazards (foraging, ingestion, tactile contact with toxic specimens, climbing cliffs, deep water) trigger substitution with `SAFE_CHALLENGE_FALLBACK`.
   - **Layer 2 (API Route Boundary Verification):** Enforced in `src/app/api/analyze/route.ts` prior to returning JSON to the browser, guaranteeing no unsafe challenge can reach the client even if upstream schema processing is bypassed.
4. **Ephemeral Geolocation:** Geolocation coordinates never leave the browser. Coordinates are processed entirely in client memory and discarded upon session completion or navigation.
5. **Model Warmup Protection (`GET /api/health?warmup=true`):** Optional non-blocking pre-warmup is guarded by an in-memory 60-second idempotency cooldown and in-flight promise deduplication in `src/lib/ollama.ts`, preventing repeated or concurrent model loading spikes without requiring authentication.

---

## 7. Active Session State & Touch-Grass Loop

### Architecture & Data Flow

TrailLens connects field identification (`/explore`) with outdoor tracking (`/session`) via a lightweight, typed in-memory React Context (`src/context/SessionContext.tsx`).

```text
[Field Camera / Explore Page]
              │
              ▼
    [POST /api/analyze]
              │
              ▼
     [AIAnalysisResult]
              │
              ▼
   [useSession().recordObservation]
              │
  ┌───────────┴────────────────────────────────────────┐
  │         Root Layout SessionProvider                │
  │  - Status: 'active' (auto-started or manual)       │
  │  - In-memory Timer Interval (1-second tick)        │
  │  - In-memory GeolocationManager (GPS watcher)      │
  │  - Observations Array [AIAnalysisResult, ...]      │
  │  - Challenges Array [OutdoorChallenge, ...]        │
  │  - Challenge Completion Deduplication              │
  │  - Transparent Score Calculation                   │
  └───────────┬────────────────────────────────────────┘
              │ Client Navigation (next/link)
              ▼
     [/session Page HUD]
  - Real elapsed duration (live or finished)
  - Real GPS distance traversed (Haversine km)
  - Real observation count & field species log
  - Real completed challenges count & status
  - Transparent score breakdown
  - Clean inactive state if no session started
```

### Key Design Principles

1. **Root Layout In-Memory Persistence:** Because Next.js App Router root layout (`src/app/layout.tsx`) remains mounted during client navigation (`next/link`), `SessionProvider` retains active tracking state without requiring external state management libraries (Redux, Zustand). (State is held in-memory; a hard browser reload or tab close resets the session by design).
2. **Zero Server Session Telemetry:** Session duration, GPS coordinates, and observations are never transmitted to any database or backend server.
3. **Pocket Mode UX ("Screen-Shortening"):** After an identification challenge is generated, the UI presents an explicit directive: *"Put your phone away for 2 minutes."* The browser does not claim fake screen-off detection; the user physically explores nature, returns, and taps *"I'm done"*.
4. **Idempotent Challenge Completion:** Challenges can only be completed once; duplicate clicks or component re-renders do not double count points.
5. **Honest Inactive State:** Direct visits to `/session` when no session is active display a clear inactive state instead of a fabricated zero-score completion.
6. **Transparent Exploration Score (`src/components/ExplorationScore.tsx`):**
   - **Distance:** 1 point per 50 meters walked (`Math.floor(distance / 50)`)
   - **Time Outside:** 1 point per 60 seconds (`Math.floor(seconds / 60)`)
   - **Observations:** 10 points per identified specimen
   - **Challenges:** 15 points per completed field challenge

---

## 8. Experimental Colour-Heuristic Spatial Summary Module

### Architectural Purpose & Design Boundaries

To investigate whether coarse spatial context could improve outdoor challenge grounding, an isolated prototype was constructed under `src/lib/vision/segmentation/`. Despite the directory name, it is an **experimental colour-heuristic spatial summary**. It is **not** learned semantic segmentation, instance segmentation, or object detection, and it uses no trained model.

```text
[Input Image Buffer]
         │
         ▼
[SpatialSegmentationEngine (Sharp resize + fixed RGB thresholds)]
         │
         ├── Resize to 128x128 (fit: 'fill'; aspect ratio not preserved)
         ├── Per-pixel colour bucket (foliage, flower, stone, bark/soil, ambient)
         ├── Per bucket ≥4% of frame: one bounding box + mean centroid over all its pixels
         └── Normalization to 3x3 directional grid (e.g., center, lower-right)
         │
         ▼
[Compact Spatial Scene Summary (text)]
         │
         ▼
[buildSpatialFusionPrompt — prompt builder only; never sent to Gemma]
```

### Limitations (Verified in Source)

- Bucket names (e.g., "foliage / vegetation", "mineral / stone surface") are inferred from colour alone, not from object recognition.
- There is no connected-component labelling: each colour bucket yields at most one "region", even if its pixels are scattered across the frame. The `algorithm` string `'SpatialColorDensity-ConnectedComponents'` and the `instanceId` field do not reflect actual connected components or object instances.
- The "primary subject" is simply the largest colour bucket, which may be background.
- The per-region `confidence` value is computed from region area (`0.70 + areaRatio × 0.3`, clamped to 0.65–0.96); it is not a model confidence.

### Key Engineering Decisions

1. **Isolated Module:** Kept strictly behind the `ISegmentationEngine` contract (`src/lib/vision/segmentation/interface.ts`) to avoid coupling production Next.js routes to a specific CV library.
2. **Low Latency:** Uses simple raster analysis rather than loading a model into memory. Unit tests assert < 100 ms per sample on the development machine.
3. **Separation from Production Safety:** Production challenge safety lives in `src/lib/safety/challenge.ts` and is actively enforced in `/api/analyze`. The experimental vision module under `src/lib/vision/segmentation/` remains isolated from the production pipeline.
4. **Integration Gate Status:** Maintained as an **experimental research module**; the core production pipeline continues to rely directly on Gemma 3 4B multimodal vision to avoid unnecessary runtime dependencies. No source file in `src/app` or `src/components` imports this module.
