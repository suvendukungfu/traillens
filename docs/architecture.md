# TrailLens Architecture & Technical Specification

> **Project Name:** TrailLens  
> **Tagline:** Look beyond the screen.  
> **Hacktoberfest 2026 Track:** Open-Source AI Challenge — Week 1 (*Touch Grass*)  
> **Target Category:** Best Use of Gemma  

---

## 1. Architectural Philosophy & Product Loop

TrailLens is an outdoor-first AI companion designed with a single contrarian thesis: **the screen is a temporary bridge, never the destination**.

Modern consumer mobile applications prioritize engagement loops, infinite feeds, and persistent screen retention. TrailLens inverts this pattern by using local, open-weight multimodal artificial intelligence to rapidly interpret nature observations and immediately challenge the user to put their device away.

```
       [USER ENTERS OUTDOORS]
                  │
                  ▼
       [CAPTURE SINGLE OBSERVATION]
       (Live Camera or Photo Upload)
                  │
                  ▼
       [CLIENT DOWNSCALING & SANITIZATION]
       (Canvas resize to ≤1024px, JPEG 0.82)
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

```
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
│  │  - AbortController timeout guard (120s limit)                       │  │
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

export interface AIAnalysisResult {
  identification: string;
  confidence: AIConfidence;
  evidence: string[];
  description: string;
  observation: string;
  challenge: string;
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
- **Independence:** Operates completely offline without external internet connectivity.

### Prompt Engineering & Structured Output
The prompt (`src/lib/prompts.ts`) instructs Gemma 3 to act as an expert field naturalist:

1. **Identification:** Direct, concise common name.
2. **Confidence:** Grounded classification (`high`, `medium`, or `low`).
3. **Visual Evidence:** 2 to 4 concrete anatomical or environmental features seen in the photo.
4. **Description:** Educational background (1–2 sentences).
5. **Observation:** What surrounding environmental details to inspect.
6. **Challenge:** An immediate real-world exploration task (2–5 minutes) that requires looking away from the device.
7. **Safety Notice:** Compulsory warning regarding wildlife distance, terrain safety, and strict prohibition on wild foraging/edibility.

---

## 5. Geolocation Engine & Geodesic Calculation

### The Haversine Distance Engine (`src/lib/distance.ts`)
Calculates great-circle distance between spherical coordinates on Earth (mean radius $R = 6,371,000$ meters):

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

### Jitter Mitigation & Sanity Filtering
Raw mobile GPS chips experience positional drift when stationary. TrailLens applies two filters:
1. **Accuracy Threshold:** GPS fixes with reported horizontal accuracy $> 45$ meters are rejected to prevent spurious distance spikes.
2. **Displacement Threshold:** Points separated by $< 3.0$ meters are treated as stationary noise and ignored.
3. **Speed Boundary Filter:** Displacements implying speeds $> 25\text{ m/s}$ ($90\text{ km/h}$) are rejected as teleportation anomalies.

### Lifecycle & Resource Management (`src/lib/geolocation.ts`)
- The browser watcher (`navigator.geolocation.watchPosition`) is encapsulated within `GeoManager`.
- Whenever a session pauses, completes, or unmounts, `geoManager.stopTracking()` clears the watcher ID (`clearWatch`) and resets internal callbacks.
- Timer intervals are explicitly tracked via React `useRef` and terminated in `useEffect` cleanup handlers to prevent background memory leaks and battery depletion.

---

## 6. Security, Privacy, and Offline Operation

1. **Offline Autonomy:** Inference occurs over loopback `127.0.0.1:11434`. Disconnecting cellular or Wi-Fi connectivity has zero impact on inference capability once model weights are stored locally.
2. **Input Hygiene:** Images uploaded to `/api/analyze` are bounded by strict payload size limits (Zod verification), sanitized against MIME spoofing, and validated before passing to the Ollama endpoint.
3. **Non-Edibility Safety Policy:** Because wild plant identification with computer vision models cannot guarantee toxicological safety, the system prompt and UI explicitly mandate that users **never consume or handle wild flora or fungi based on AI identification**.
