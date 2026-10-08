# Contributing to TrailLens

Thank you for your interest in contributing to **TrailLens**!

TrailLens is an open-source, local-first AI field-experiment engine built for **Hacktoberfest 2026** (Week 1: *Touch Grass*, Track: *Best Use of Gemma*). We are committed to high engineering rigor, zero telemetry, strict physical safety, and truthful documentation.

---

## 🧭 Code of Conduct & Core Principles

1. **The "Touch Grass" Ethos:** Features should never optimize for screen retention. If an idea keeps the user staring at their phone for longer on a trail, it will be rejected.
2. **Absolute Truthfulness:** Never fabricate benchmarks, metrics, test fixtures, or capabilities. If something is tested only on local fixtures, call it fixture evaluation.
3. **Safety First:** The physical safety of explorers outdoors is non-negotiable. Never bypass, weaken, or mock out the production safety gate (`src/lib/safety/challenge.ts`).
4. **Local-First & Private:** TrailLens must operate with zero cloud dependencies. No third-party analytics, remote trackers, or cloud AI services may be added.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js:** v20.0.0+ (Tested through Node v25)
- **npm:** v10.0.0+
- **Ollama:** Installed locally from [ollama.com](https://ollama.com)

### 2. Prepare Local AI Model
Pull Google's Gemma 3 4B multimodal model via Ollama:

```bash
ollama pull gemma3:4b
ollama list
```

Ensure the Ollama service is active:
```bash
curl -s http://127.0.0.1:11434/api/tags
```

### 3. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/triallens.git
cd triallens
cp .env.example .env.local
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Verify the navbar displays `LOCAL AI ACTIVE (gemma3:4b)`.

---

## 🧪 Testing & Quality Standards

Before submitting any Pull Request, all automated checks must pass with zero errors and zero warnings:

```bash
# 1. Run full test suite (must pass 100/100 tests)
npm test

# 2. Run ESLint (must pass with zero warnings)
npm run lint

# 3. Verify production Next.js build
npm run build

# 4. Check for git whitespace/conflict issues
git diff --check
```

---

## 🔬 Adding Mission Quality Fixtures

Milestone 4 introduces a deterministic 5-dimension quality rubric for evaluating generated `FieldMission` objects (`src/lib/mission/quality.ts`).

To add a new specimen fixture:
1. Open `scripts/evaluate-mission-quality.mjs`.
2. Append a new fixture object conforming to the `MissionFixture` interface:
   ```javascript
   {
     id: 'K',
     subject: 'Lichen on Granite Boulder',
     mission: {
       missionType: 'COMPARE',
       title: 'Contrast Crustose vs Foliose Lichen Growth',
       target: 'Granite boulder surface',
       durationSeconds: 180,
       steps: [
         'Locate two distinct lichen patches on the rock face',
         'Compare their edge adhesion and surface textures',
         'Notice which patch receives more ambient moisture'
       ],
       successCriteria: 'Observed and noted differences in texture and rock adhesion',
       safetyConstraints: ['Stay on stable ground', 'Do not scrape or damage the lichen']
     }
   }
   ```
3. Run the benchmark evaluator:
   ```bash
   node scripts/evaluate-mission-quality.mjs
   ```
4. Check the score breakdown and updated statistics in `docs/benchmark-results/mission-quality.json`.

---

## 📊 Running Local Latency Benchmarks

If you have local hardware access and want to contribute empirical telemetry:
1. Ensure Ollama is running with `gemma3:4b`.
2. Run the automated latency benchmark script:
   ```bash
   node scripts/benchmark-gemma.mjs
   ```
3. The script will measure cold vs. warm model loads, token generation rates, and payload scaling, saving raw JSON output to `docs/benchmark-results/gemma-latency.json`.

*Never edit benchmark JSON files manually.* Only commit results generated directly by the benchmark script.

---

## 📐 Repository Structure

```text
src/
├── app/                  # Next.js App Router
│   ├── api/analyze/      # Local AI inference gateway & safety gate
│   ├── api/health/       # Ollama connectivity & warmup endpoint
│   ├── explore/          # Editorial dual-column capture & analysis UI
│   ├── session/          # Outdoor HUD, Pocket Mode, sensory reflection, field records
│   └── about/            # Project philosophy & Hacktoberfest mission
├── components/           # Reusable UI widgets (Viewfinder, PocketMode, ChallengeCard)
├── context/              # SessionContext (GPS watcher, Haversine distance state)
├── lib/
│   ├── distance.ts       # Haversine geodesic math & jitter filter
│   ├── geolocation.ts    # Browser GPS watcher with clean teardown
│   ├── ollama.ts         # Local Ollama client adapter with timeout & keep-alive
│   ├── prompts.ts        # Gemma 3 4B system instructions & structured schemas
│   ├── validation.ts     # Zod payload & FieldMission schemas
│   ├── mission/          # compiler.ts & quality.ts (M4 5-dimension rubric)
│   ├── safety/           # challenge.ts (deterministic production safety gate)
│   └── vision/           # Experimental colour-heuristic spatial summary
└── types/                # Domain types (FieldMission, AIAnalysisResult, SessionStats)
docs/
├── SDLC.md               # Complete 14-stage software lifecycle documentation
├── PROJECT-OVERVIEW.md   # High-level overview for judges and contributors
├── ENGINEERING-JOURNEY.md# Truthful three-day engineering retrospective
├── architecture.md       # C4 containers, sequence flows, trust boundaries
├── evaluation.md         # 7-tier evaluation taxonomy & empirical benchmark data
└── benchmark-results/    # Raw JSON telemetry files
```

---

## 📝 Pull Request Guidelines

1. **Branch Naming:** Use clear branch prefixes: `feat/`, `fix/`, `docs/`, `perf/`, `refactor/`.
2. **Commit Messages:** Follow Conventional Commits:
   - `feat: add audio narration for pocket mode`
   - `fix: prevent camera stream leak on page unmount`
   - `docs: update latency benchmark table for M3 Max`
3. **Scope:** Keep PRs focused. Do not combine visual UI redesigns with backend architectural changes in a single PR.
4. **Testing:** Include unit tests in `src/` for any new logic or algorithms.
5. **Documentation:** Update relevant documents in `docs/` if your change affects data contracts, system flows, or dependencies.

Thank you for helping explorers touch grass!
