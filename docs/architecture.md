# TrailLens Architecture & Technical Specification

> **Project Name:** TrailLens
> **Tagline:** Look beyond the screen.
> **Hacktoberfest 2026 Track:** Open-Source AI Challenge — Week 1 (*Touch Grass*)
> **Target Category:** Best Use of Gemma
> **Architecture Pattern:** 3-Tier Decoupled Local-First AI Engine

---

## 1. Architectural Philosophy & Product Loop

TrailLens is an outdoor-first AI companion engineered around a single contrarian thesis: **the screen is a temporary bridge, never the destination**.

Modern consumer mobile applications prioritize engagement loops, infinite feeds, and persistent screen retention. TrailLens inverts this paradigm by using local, open-weight multimodal artificial intelligence to rapidly interpret nature observations and immediately command the explorer to put their device away.

```text
              TRAILLENS
         LOOK BEYOND THE SCREEN

                 SEE
                  │
                  ▼
        ┌──────────────────┐
        │   GEMMA 3 4B     │
        │  LOCAL INFERENCE │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  FIELD MISSION   │
        │ QUALITY + SAFETY │
        └────────┬─────────┘
                 │
                 ▼
             PHONE DOWN
                 │
                 ▼
          REAL WORLD
          EXPLORATION
                 │
                 ▼
            REFLECTION
                 │
                 ▼
           FIELD RECORD
```

---

## 2. System Architecture & C4 Container Model

The architecture is partitioned into three strictly decoupled runtime containers: **Client Browser Runtime**, **Next.js Server Runtime**, and the **Local Ollama Daemon**.

### 2.1 System Architecture Diagram

```mermaid
flowchart TB
    subgraph Browser ["1. Client Browser Runtime (Ephemeral State)"]
        direction TB
        CAM["Field Camera UI<br/>(MediaDevices / Canvas Scale)"]
        EXP["Editorial Explore UI<br/>(Viewfinder + Dossier)"]
        SESS["SessionContext Provider<br/>(GPS Watcher + Haversine)"]
        POC["Pocket Mode Modal<br/>(Tactile Timer + HUD)"]
        REF["Sensory Reflection HUD<br/>(Sight, Sound, Texture)"]
        REC["Field Record Dossier<br/>(Immutable Walk Summary)"]

        CAM --> EXP
        EXP --> SESS
        SESS --> POC
        POC --> REF
        REF --> REC
    end

    subgraph Server ["2. Next.js Server Runtime (Stateless Gateway)"]
        direction TB
        API["POST /api/analyze<br/>Route Handler"]
        VAL["Zod Payload Validation<br/>(MIME & Base64 Guard)"]
        ADAPT["Ollama Client Adapter<br/>(Timeout, Keep-Alive, Rescue)"]
        SAFE["Deterministic Safety Gate<br/>(Challenge Interceptor)"]
        QUAL["Mission Quality Rubric<br/>(5-Dimension Evaluator)"]

        API --> VAL
        VAL --> ADAPT
        ADAPT --> SAFE
        SAFE --> QUAL
    end

    subgraph Daemon ["3. Local Ollama Engine (Hardware Isolated)"]
        direction TB
        OLL["Ollama Daemon<br/>(127.0.0.1:11434)"]
        GEM["Google Gemma 3 4B<br/>(gemma3:4b-it Q4_K_M)"]

        OLL --> GEM
    end

    EXP ==>|HTTP POST JSON (Base64)| API
    ADAPT ==>|HTTP Loopback| OLL
    GEM ==>|Structured JSON| ADAPT
    QUAL ==>|Sanitized FieldMission Result| EXP

    classDef client fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef server fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef daemon fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;

    class CAM,EXP,SESS,POC,REF,REC client;
    class API,VAL,ADAPT,SAFE,QUAL server;
    class OLL,GEM daemon;
```

---

## 3. End-to-End Sequence Diagram

The interaction lifecycle begins with a tactile specimen capture and cleanly resolves through safety and mission quality evaluation before activating the outdoor immersion loop.

```mermaid
sequenceDiagram
    autonumber
    participant Explorer as User / Explorer
    participant Browser as Browser UI
    participant Canvas as HTML5 Canvas
    participant Next as Next.js (/api/analyze)
    participant Ollama as Ollama (127.0.0.1)
    participant Gemma as Gemma 3 4B

    Explorer->>Browser: Frame specimen & tap capture
    Browser->>Canvas: Downscale frame (≤512px, JPEG 0.80)
    Canvas-->>Browser: Optimized Base64 payload
    Browser->>Next: POST /api/analyze { image, mimeType }

    activate Next
    Next->>Next: Zod validate schema & payload bounds
    Next->>Ollama: POST /api/chat (prompt, format: json_schema, keep_alive: 10m)

    activate Ollama
    Ollama->>Gemma: Multimodal vision + structured inference
    activate Gemma
    Gemma-->>Ollama: Raw FieldMission JSON tokens
    deactivate Gemma
    Ollama-->>Next: Raw JSON text response
    deactivate Ollama

    Next->>Next: Sanitize JSON & parse FieldMission contract
    Next->>Next: validateChallengeSafety() [Regex Gate]
    alt Safety Hazard Detected
        Next->>Next: Log warning & substitute SAFE_CHALLENGE_FALLBACK
    end
    Next->>Next: evaluateMissionQuality() [5-Dimension Rubric]
    Next-->>Browser: HTTP 200 { identification, mission, safety, qualityReport }
    deactivate Next

    Browser->>Explorer: Render Mission Dossier (FIELD-READY)
    Explorer->>Browser: Accept Challenge
    Browser->>Browser: Enter Pocket Mode (Dim screen, start GPS)
    Explorer->>Explorer: Put phone in pocket & explore 2-5 mins
```

---

## 4. User Journey & State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Mount /explore
    Idle --> ViewfinderReady: Camera Permission Granted
    ViewfinderReady --> Capturing: Tap Reticle Capture
    Capturing --> Analyzing: Dispatch POST /api/analyze
    Analyzing --> MissionReady: Analysis & Safety Gate Pass
    Analyzing --> Error: Inference Timeout / Validation Fail
    Error --> ViewfinderReady: Dismiss Error

    MissionReady --> PocketMode: Tap "Accept Mission"
    PocketMode --> Exploring: Phone Placed in Pocket
    Exploring --> Reflecting: Return & Tap "I'm Back"
    Reflecting --> FieldRecord: Log Sights / Sounds / Textures
    FieldRecord --> ViewfinderReady: Capture Next Specimen
    FieldRecord --> CompletedSession: Tap "Finish Session"
    CompletedSession --> [*]
```

---

## 5. Data Lifecycle & Trust Boundaries

TrailLens is architected with strict, explicit boundaries separating memory scopes, transport layers, and persistence guarantees:

```mermaid
flowchart TD
    subgraph ClientMem ["Ephemeral Client Memory (Zero Persistence)"]
        RAW["Raw WebCam Stream Frames"]
        GPS["Real-Time Geolocation Fixes (lat/long)"]
        HUD["In-Memory Distance & Timer Accumulator"]
        NOTES["User Sensory Reflection Text"]
    end

    subgraph Transit ["Local Loopback Transit (In-Flight Only)"]
        IMG["Base64 JPEG (512px Downscaled)"]
        TOK["Model Chat Tokens"]
    end

    subgraph ServerMem ["Server Runtime (Stateless)"]
        ZOD["Zod Schema Interceptor"]
        GATE["Safety Filter Audit Logs"]
        RUBRIC["In-Memory Quality Deductions"]
    end

    subgraph Hardware ["Hardware Daemon"]
        VRAM["Model Weights & KV Cache (Pinned 10m)"]
    end

    RAW -->|Downscaled Canvas| IMG
    IMG -->|HTTP POST| ZOD
    ZOD -->|Loopback| TOK
    TOK --> VRAM
    VRAM --> TOK
    TOK --> GATE
    GATE --> RUBRIC
    RUBRIC -->|Sanitized JSON| ClientMem

    classDef ephemeral fill:#1e293b,stroke:#38bdf8,stroke-width:1px,color:#f8fafc;
    classDef transit fill:#334155,stroke:#94a3b8,stroke-width:1px,color:#f8fafc;
    classDef server fill:#064e3b,stroke:#10b981,stroke-width:1px,color:#f8fafc;
    classDef daemon fill:#451a03,stroke:#f59e0b,stroke-width:1px,color:#f8fafc;

    class RAW,GPS,HUD,NOTES ephemeral;
    class IMG,TOK transit;
    class ZOD,GATE,RUBRIC server;
    class VRAM daemon;
```

### Boundary Guarantees
1. **The Browser Never Communicates with Ollama Directly:** All requests route through `POST /api/analyze` to enforce schema constraints, guard against payload abuse, and avoid exposing local network ports.
2. **Ephemeral Geolocation:** Geolocation coordinates are never stored in browser `localStorage`, cookies, or indexedDB, and are never transmitted to any server. When the browser tab closes, all trail traces are erased from memory.
3. **Zero Third-Party Telemetry:** No external tracking scripts, cloud analytics, or closed API tokens exist in the runtime.
4. **Air-Gapped Operation:** When running locally, the entire application functions with airplane mode enabled.

---

## 6. Data Contracts & Type Definitions

Domain contracts are enforced at compile time via TypeScript and at runtime via Zod schemas (`src/types/trail.ts` & `src/lib/validation.ts`).

### 6.1 Primary Domain Model (`src/types/trail.ts`)

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
  durationSeconds: number; // Bounded: 120 <= duration <= 300
  steps: string[];          // Bounded: 1 <= steps <= 4
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
  mission?: FieldMission;   // Canonical structured contract
  challenge: string;        // Backward-compatible projection
  safety: string;
  inferenceDurationMs?: number;
  qualityReport?: MissionQualityReport;
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

## 7. Multimodal AI Integration (Gemma 3 4B)

### 7.1 Model Selection & Resource Footprint
- **Model:** Google Gemma 3 4B (`gemma3:4b-it`, GGUF Q4_K_M).
- **Footprint:** ~3.3 GB disk footprint, ~4.3B parameter footprint.
- **Multimodal Visual Reasoning:** Emits structured morphological clues over botanical cuticles, conifer scales, quartz mineral banding, and lichen crusts.
- **Memory Residency (`keep_alive`):** Pinned in host unified memory using `keep_alive: '10m'` and `num_ctx: 2048` to prevent multi-second cold load penalties.

### 7.2 Structured JSON Schema Generation
Gemma 3 4B outputs structured JSON conforming to `rawAIAnalysisOutputSchema`. This schema compiles via Zod into standard JSON Schema passed directly in the Ollama request payload (`format: json_schema`).

```mermaid
flowchart LR
    ZOD["rawAIAnalysisOutputSchema<br/>(Zod 4 Definition)"] --> JSON["JSON Schema Object<br/>(z.toJSONSchema())"]
    JSON --> REQ["Ollama Payload<br/>format: json_schema"]
    REQ --> GEM["Gemma 3 4B Tokenizer<br/>Grammar Constrained"]
    GEM --> RES["Structured FieldMission<br/>Guaranteed Valid JSON"]
```

---

## 8. Safety Engineering: Two-Layer Defense-in-Depth

The safety gate operates downstream of the generative model. Generative AI is treated as an untrusted agent regarding physical safety.

```mermaid
flowchart TD
    G["Raw Model Output"] --> L1["Layer 1: Schema Sanitization (src/lib/validation.ts)<br/>Strip Negations & Evaluate Blacklist"]
    L1 --> CHK1{Hazard Detected?}
    CHK1 -- Yes --> SUB1["Substitute SAFE_CHALLENGE_FALLBACK"]
    CHK1 -- No --> L2["Layer 2: API Route Boundary Gate (src/app/api/analyze/route.ts)<br/>validateChallengeSafety()"]
    SUB1 --> L2
    L2 --> CHK2{Hazard Detected?}
    CHK2 -- Yes --> SUB2["Intercept & Substitute Fallback"]
    CHK2 -- No --> OUT["Approved Safe Mission Emitted to Client"]
    SUB2 --> OUT
```

### Safety Categories Intercepted
1. **Toxic Fungi & Foraging:** Tasting, eating, picking, or tactile handling of mushrooms or unknown berries.
2. **Terrain Peril:** Commands to approach cliff edges, deep water, waterfalls, steep scree slopes, or off-trail ravines.
3. **Wildlife Contact:** Touching, feeding, approaching, or cornering wild animals.
4. **Conservation / Leave No Trace:** Uprooting flora, snapping branches, or disturbing soil habitats.

---

## 9. Geolocation & Geodesic Engine

### Haversine Formula (`src/lib/distance.ts`)
Calculates the great-circle distance between consecutive GPS coordinates on Earth (mean radius $R = 6,371,000$ meters):

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

### Jitter Mitigation & Stationary Noise Filter
Raw mobile GPS hardware experiences positional drift even while the user is standing still. `calculateTrackDistance` applies a displacement threshold:
- Any coordinate delta $< 2.0\text{ meters}$ (`jitterThresholdMeters`) from the last accepted coordinate is rejected as noise.
- Non-finite coordinates (`NaN`, `null`, out-of-bound latitudes/longitudes) contribute 0 meters.

---

## 10. Failure Modes & Recovery Strategies

| Failure Mode | Trigger | System Behavior | Explorer Recovery |
| :--- | :--- | :--- | :--- |
| **Ollama Daemon Unreachable** | Port 11434 down / Ollama stopped | Next.js catches connection error; logs diagnostic | Clean error card; prompt to run `ollama serve` |
| **Model Weight Eviction** | System under memory pressure | Cold load penalty incurred (~4.6s–7.5s) | Progressive loading status indicates warm-up |
| **Inference Timeout** | Host compute stalled (>180s) | `AbortController` triggers timeout signal | Request aborted; error presented to explorer |
| **Malformed Model Output** | Token truncation or stray markdown | `attemptJsonRescue()` strips fences & balances brackets | Recovers valid fields or falls back to schema defaults |
| **Dangerous AI Mission** | Model suggests foraging / steep climbs | Safety gate flags pattern match | Silently substituted with safe observation mission |
| **Camera Access Denied** | User blocks webcam permission | Browser rejects `getUserMedia` promise | Fallback file uploader appears with specimen presets |
