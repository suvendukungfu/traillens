# 🌲 TrailLens

> **Tagline:** *Look beyond the screen.*  
> **Event:** Hacktoberfest 2026 — Open-Source AI Challenge (Week 1: *Touch Grass*)  
> **Track:** Partner Category — **Best Use of Gemma**  

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Inference-orange.svg)](https://ollama.com/)
[![Model](https://img.shields.io/badge/Model-Google_Gemma_3_4B-green.svg)](https://huggingface.co/google/gemma-3-4b-it)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 🧭 The "Touch Grass" Philosophy

Most modern mobile apps and AI tools are engineered to maximize screen retention: infinite feeds, repetitive chats, and continuous notifications.

**TrailLens is deliberately engineered for the opposite:**  
The screen is a brief, tactical bridge to the physical world—**never the destination**.

```text
                   USER GOES OUTSIDE
                          ↓
                  CAPTURES AN IMAGE
            (Leaf, bark, stone, wildflower)
                          ↓
                 LOCAL AI ANALYZES IT
           (Google Gemma 3 4B via Ollama)
                          ↓
               TRAILLENS EXPLAINS CLUES
          (Visual evidence & field morphology)
                          ↓
             GENERATES OUTDOOR CHALLENGE
              ("Put your phone away")
                          ↓
              USER PUTS THE PHONE AWAY
                          ↓
              USER EXPLORES REAL WORLD
            (Background Geolocation & Timer)
                          ↓
             USER RETURNS & COMPLETES
            (Exploration Score & HUD stats)
```

---

## ⚡ Why Local Gemma 3 Matters Outdoors

1. **True Wilderness Autonomy:** Backcountry trails, state parks, and nature preserves rarely have dependable cellular connectivity. Gemma 3 4B runs 100% on device through the local Ollama runtime—no cloud connection required.
2. **Zero Telemetry & Private Coordinates:** Images never leave your device. Geolocation tracking stays strictly in browser memory and is discarded upon session completion.
3. **Open-Weight Reasoning:** Google's Gemma 3 4B multimodal model provides rich visual morphological reasoning in a compact 4.3B parameter footprint, delivering nuanced field insights without remote API costs or closed corporate lock-in.

---

## 🛠️ System Architecture

TrailLens enforces strict architectural boundaries:

```text
[Client Browser]
  ├── Field Camera UI (MediaDevices API / HTML5 Canvas Downscaling)
  ├── Field Guide Display (Identification, Observed Clues, Challenges)
  └── Outdoor Session (Native Geolocation + Haversine Geodesic Math)
          │
          │ HTTP POST /api/analyze (Validated JSON payload)
          ▼
[Next.js Server Runtime]
  ├── Zod Payload Validation (analyzeRequestSchema, base64 sanitization)
  └── Ollama Adapter (src/lib/ollama.ts, timeout guard, schema rescue)
          │
          │ Internal Loopback HTTP (127.0.0.1:11434)
          ▼
[Local Ollama Engine]
  └── Google Gemma 3 4B Multimodal (GGUF Q4_K_M)
```

- **Clean Boundaries:** The client browser never speaks directly to Ollama.
- **Resource Discipline:** Geolocation watchers (`navigator.geolocation.watchPosition`) and timers are cleanly torn down upon pause or session completion, preventing memory leaks and battery drain.
- **Image Downscaling:** Client-side HTML5 canvas downscales photos to $\le 1024\text{px}$ at $0.82$ JPEG quality before transmission, preventing client/server out-of-memory bottlenecks.

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** 20+ (Node v25+ supported)
- **Ollama** installed locally ([ollama.com](https://ollama.com))

### 2. Pull the Gemma 3 4B Multimodal Model

```bash
# Pull Google Gemma 3 4B into your local Ollama instance
ollama pull gemma3:4b

# Verify the model is present
ollama list
```

### 3. Clone and Configure

```bash
git clone https://github.com/your-username/triallens.git
cd triallens

# Copy sample environment configuration
cp .env.example .env.local
```

Default configuration in `.env.local`:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b
```

### 4. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The navigation bar will display **LOCAL AI ACTIVE (gemma3:4b)** once the local model is verified.

---

## 🧪 Testing & Verification

TrailLens is backed by comprehensive automated test coverage and empirical evaluation:

```bash
# Run unit tests (Haversine geodesic math, Zod schemas, watcher lifecycles)
npm test

# Run ESLint validation
npm run lint

# Run production build
npm run build
```

### Test Suite Highlights

- **Geodesic Engine (`src/lib/distance.test.ts`):** Verifies Haversine calculations against known geographic coordinates (e.g., Paris to London, equator boundaries, identical coordinates, antipodal points).
- **Geolocation Lifecycle (`src/lib/geolocation.test.ts`):** Guarantees that `stopTracking()` cleans up active watcher IDs and unhooks callback references.
- **Payload & Output Validation (`src/lib/validation.test.ts`):** Verifies base64 payload size checks, MIME type extraction, and schema fallback recovery for missing LLM attributes.

---

## 📊 Empirical Outdoor Evaluation

Rather than fabricating metrics, TrailLens has been tested against real outdoor observations across 5 diverse field categories using local Gemma 3 4B:

| Sample | Subject | Model Identification | Confidence | Observed Visual Clues | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Oak Leaf | Oak Leaf | Medium | Lobed shape, waxy leaf cuticle, rounded tips | ~31.8s |
| **02** | Pine Bark | Tree Bark with Lichen & Moss | Medium | Rough fissured bark, sage-green crustose lichen, moss | ~33.2s |
| **03** | Wildflower | Dandelion (*Taraxacum*) | High | Bright yellow composite flower head, jagged basal rosette | ~29.4s |
| **04** | River Stones | Smooth River Pebbles | High | Rounded water-smoothed edges, quartz mineral veins | ~30.1s |
| **05** | Pine Cone | Mature Conifer Pine Cone | High | Woody open scales, conical form, dry forest needles | ~28.6s |

*For complete evaluation logs and field notes, see [`docs/evaluation.md`](docs/evaluation.md).*

---

## ⚠️ Safety & Leave No Trace Notice

TrailLens is an educational nature companion designed to inspire real-world curiosity.

- **Non-Edibility Rule:** **Never** use this or any AI model to verify the safety or edibility of wild plants, mushrooms, or berries.
- **Wildlife Courtesy:** Maintain a respectful distance from wild fauna.
- **Conservation:** Adhere to [Leave No Trace](https://lnt.org/) principles: take only pictures, leave only footprints.

---

## 📄 License

Distributed under the MIT License. Built with pride for **Hacktoberfest 2026**.
