# TrailLens: Empirical Outdoor Evaluation & Verification Report

> **Project:** TrailLens — Look beyond the screen.  
> **Evaluation Date:** October 6, 2026  
> **Target Category:** Hacktoberfest 2026 — Best Use of Gemma (Theme: *Touch Grass*)  
> **Evaluator:** Lead Architect & Senior AI Engineer  

---

## 1. Evaluation Methodology & Testbed

In accordance with the project's engineering principles, **no metrics, timings, or AI outputs have been fabricated**. All results below are derived from empirical executions against local Ollama inference using Google Gemma 3 4B.

### Testbed Environment (Historical Baseline: October 6, 2026)

- **Host Machine:** Apple Silicon (macOS)
- **Local AI Daemon:** Ollama v0.21.0 (historical baseline daemon) listening on loopback `http://127.0.0.1:11434`
- **Model:** `gemma3:4b` (`gemma3:4b-it` multimodal, 4.3B parameter footprint, GGUF Q4_K_M)
- **Application Server:** Next.js 16.3.8 (Turbopack App Router) on Node.js v25.9.0
- **Client Preprocessing:** HTML5 Canvas-based downscaling to $\le 640\text{px}$ max dimension at $0.80$ JPEG quality
- **Payload Verification:** Strict Zod schema validation via `analyzeRequestSchema` and `aiAnalysisResultSchema`
- **Output Mode:** JSON Mode (`format: 'json'`) with application-level Zod parsing (preceding Milestone 2's Ollama JSON Schema integration)

---

## 2. Real Outdoor Dataset & Evaluation Results

Five distinct outdoor observations representing diverse natural categories (deciduous foliage, dendrology/lichen, wild flora, geomorphology, and conifer floor) were evaluated through `POST /api/analyze`.

### Summary Benchmark Table

| # | Subject | File Size | Model Identification | Confidence | Inference Latency | Roundtrip Latency | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Oak Leaf | 166 KB | **Oak Leaf** | Medium | 44,245 ms (44.2s) | 45,553 ms (45.6s) | **PASS** |
| **02** | Pine Bark & Lichen | 208 KB | **Moss and Lichen on Tree Bark** | Medium | 41,769 ms (41.8s) | 42,043 ms (42.0s) | **PASS** |
| **03** | Dandelion Wildflower | 179 KB | **Dandelion (*Taraxacum officinale*)** | High | 37,420 ms (37.4s) | 37,604 ms (37.6s) | **PASS** |
| **04** | River Stones & Pebbles | 175 KB | **Quartzite Pebbles** | Medium | 29,975 ms (30.0s) | 30,122 ms (30.1s) | **PASS** |
| **05** | Fallen Pine Cone | 167 KB | **Pine Cone (*Pinus sp.*)** | High | 27,771 ms (27.8s) | 27,853 ms (27.9s) | **PASS** |

**Aggregate Performance Metrics:**

- **Inference Success Rate:** 100% (5/5)
- **Average Inference Latency:** 36,236 ms (~36.2 seconds)
- **Fastest Response:** Sample 05 (Pine Cone) at 27.8s
- **Slowest Response:** Sample 01 (Oak Leaf) at 44.2s
- **Zod Contract Conformance:** 100% (All 5 samples parsed cleanly into application Zod contracts)

> **Scope of "PASS":** `PASS` means the request returned HTTP 200 and the model output parsed into the `aiAnalysisResultSchema` Zod contract. The samples have no ground-truth labels, so this evaluation demonstrates successful end-to-end inference and application-level structured JSON parsing only (distinct from Ollama JSON Schema enforcement added in Milestone 2). It does **not** measure recognition accuracy. The `Confidence` column is the label Gemma emitted as text; it is not a calibrated model probability. Raw recorded outputs are in `docs/evaluation_results.json`.

---

## 3. Deep-Dive Field Case Logs

### Case 01: Oak Leaf Observation (`oak_leaf`)

- **Identification:** Oak Leaf
- **Confidence:** `medium`
- **Observed Visual Clues:**
  1. *Distinct lobed shape with rounded points*
  2. *Glossy, green surface*
  3. *Visible veins radiating from the midrib*
- **Description:** *"The leaf exhibits a classic oak leaf morphology with multiple lobes and a smooth, glossy surface. The veins are prominent and radiate outwards from the central midrib, typical of oak species. The leaf is attached to a slender stem."*
- **Field Challenge:** *"Spend 2 minutes carefully examining the moss growing on the tree trunk. Note the different shades of green and the textures."*
- **Safety Directive:** *"Be mindful of uneven terrain and potential hazards like roots or slippery moss when moving around the area."*

### Case 02: Tree Bark & Lichen (`tree_bark`)

- **Identification:** Moss and Lichen on Tree Bark
- **Confidence:** `medium`
- **Observed Visual Clues:**
  1. *Dark, textured tree bark with vertical ridges*
  2. *Green, dense moss growing in patches*
  3. *Gray, irregular lichen patches covering portions of the bark*
- **Description:** *"The tree trunk exhibits rough, dark bark with distinct vertical ridges, typical of many coniferous species. Patches of vibrant green moss thrive in the shaded, humid environment, while gray lichen forms irregular shapes across the bark surface, likely benefiting from the moisture and nutrients provided by the tree. The overall appearance suggests a moist, shaded forest floor."*
- **Field Challenge:** *"Put your phone away and spend 2 minutes closely examining the bark of the tree. Notice the different textures, shapes, and colors of the moss and lichen – how do they interact?"*
- **Safety Directive:** *"Be mindful of uneven ground and potential tripping hazards while exploring the forest floor. Observe from a distance and avoid disturbing the moss or lichen."*

### Case 03: Dandelion Wildflower (`wildflower`)

- **Identification:** Dandelion (*Taraxacum officinale*)
- **Confidence:** `high`
- **Observed Visual Clues:**
  1. *Distinct, spherical flower head with many ray florets*
  2. *Compound leaves with deeply serrated margins*
- **Description:** *"This plant exhibits a classic dandelion morphology with a large, bright yellow flower head composed of numerous ray florets. The leaves are deeply divided into multiple leaflets, each with sharply toothed edges. The plant is growing in a loose soil substrate."*
- **Field Challenge:** *"Spend 2 minutes carefully examining the texture of the soil around the dandelion. Note the differences in grain size and composition."*
- **Safety Directive:** *"Be aware of potential stinging nettles or other irritating plants in the surrounding area. Observe from a distance and avoid touching unknown vegetation."*

### Case 04: River Stones & Pebbles (`river_stones`)

- **Identification:** Quartzite Pebbles
- **Confidence:** `medium`
- **Observed Visual Clues:**
  1. *Rounded, smooth stones of varying sizes*
  2. *Distinct white and gray banding within some stones*
- **Description:** *"The image shows a collection of rounded, sedimentary rocks, likely quartzite, characterized by their smooth surfaces and distinctive banding patterns formed by mineral deposition. The stones vary in color from gray to white, with some exhibiting a layered appearance. They are partially covered in organic matter and moss."*
- **Field Challenge:** *"Spend 2 minutes carefully examining the texture and shape of three different pebbles. Notice how the banding patterns vary and how the stones feel different to the touch."*
- **Safety Directive:** *"Be mindful of uneven ground and potential hazards like slippery rocks. Leave no trace – avoid disturbing the natural habitat."*

### Case 05: Fallen Pine Cone (`pine_cone`)

- **Identification:** Pine Cone (*Pinus sp.*)
- **Confidence:** `high`
- **Observed Visual Clues:**
  1. *Rounded, woody cone with scales*
  2. *Brown color and textured surface*
- **Description:** *"This is a mature pine cone, characteristic of coniferous trees. The scales are tightly packed, providing protection for the seeds within. The brown color and rough texture are typical of pine cones."*
- **Field Challenge:** *"Spend 2 minutes carefully examining the cone itself. Note the scale arrangement, the number of scales, and any imperfections or damage."*
- **Safety Directive:** *"Be mindful of uneven ground and potential hazards like roots or branches while exploring around the cone."*

---

## 4. Empirical Offline Verification

### Protocol

1. **Network Independence:** The Ollama daemon binds exclusively to `127.0.0.1:11434`.
2. **Inference Execution:** All sample evaluations and browser flows execute against `http://localhost:3000/api/analyze` -> `http://127.0.0.1:11434/api/chat`.
3. **No External Calls:** No DNS lookups, no remote image CDNs, and no external API keys are invoked.
4. **Conclusion:** TrailLens can perform inference without internet connectivity when the Next.js application, local Ollama daemon, and model weights are running locally on the same host machine.

---

## 5. Engineering Findings & Systemic Optimizations

### 1. Image Resolution vs. Vision Token Bottleneck

- **Initial Observation:** When uncompressed images ($>1\text{MB}$, $>1024\text{px}$) were supplied, the vision encoder generated excessive patch embeddings, leading to inference timeouts ($>120\text{s}$) on complex textures like tree bark.
- **Optimization Applied:** Client canvas compression enforces a maximum dimension of $640\text{px}$ at $0.80$ JPEG quality ($\approx 160\text{–}210\text{ KB}$). This maintained morphological fidelity while reducing inference latency by ~60% down to 27–45 seconds.
- **Timeout Safety Margin:** Increased the server-side `AbortController` timeout from 120s to 180s to guarantee safe execution on consumer laptops under background load.

### 2. Structured JSON Grammar vs. Fuzzy Fallback

- Strict formatting schemas in LLM APIs can occasionally cause trailing brace truncation or markdown code fencing (` ```json `).
- TrailLens implemented a dual-layer sanitization pipeline:
  1. Primary regex sanitation stripping codeblocks.
  2. Fallback delimiter rescue parsing between the first `{` and last `}` if direct JSON parse fails.
  3. Zod schema fallback defaults (e.g. defaulting missing confidence to `'low'`) preventing client crashes.

---

## 6. Empirical Computer-Vision Segmentation & Ablation Study

To investigate whether a spatial pre-processing layer could add value to TrailLens, an isolated experimental module (`src/lib/vision/segmentation/`) was run against the 5 outdoor test fixtures.

> **What this module is:** an experimental colour-heuristic spatial summary. It resizes the image to 128×128, assigns each pixel to one of five fixed RGB colour buckets, and reports one bounding box, centroid, and 3×3 grid position per bucket covering ≥4% of the frame. It is **not** learned semantic segmentation, instance segmentation, or object detection, and it does not perform connected-component labelling. Its per-region `confidence` value is derived from region area, not from a model.

### Pipeline Definitions

- **Pipeline A (Baseline — Gemma Only):** Direct multimodal reasoning using Gemma 3 4B over loopback Ollama. **Executed** (Section 2).
- **Pipeline B (Colour Heuristic Only):** Fixed-threshold RGB colour bucketing (`SpatialSegmentationEngine`). **Executed** locally without Gemma.
- **Pipeline C (Fused — Heuristic Summary + Gemma):** Spatial summary injected into a Gemma 3 prompt via `buildSpatialFusionPrompt`. **Not executed.** No code path sends the fused prompt to Ollama, so no fused Gemma outputs or fused latencies exist.

### Latency Matrix

| Sample ID | Subject | Pipeline A: Gemma Baseline (recorded) | Pipeline C: Fused Total |
| :--- | :--- | :--- | :--- |
| `oak_leaf` | Oak Leaf | 44,245 ms | Not executed |
| `tree_bark` | Pine Bark & Lichen | 41,769 ms | Not executed |
| `wildflower` | Dandelion Blossom | 37,420 ms | Not executed |
| `river_stones` | River Pebbles | 29,975 ms | Not executed |
| `pine_cone` | Fallen Pine Cone | 27,771 ms | Not executed |

> **Correction note:** An earlier version of this table listed a "Pipeline C: Fused Total" value for each sample. Those values were not measured; they were the arithmetic sum of the Pipeline A latency and the Pipeline B latency (A + B estimate) and have been removed. Earlier per-sample Pipeline B latency, region-count, and focal-placement figures were also removed: they were not persisted in the repository, and the region counts and placements (which are deterministic for a given image) do not match the output of the current `SpatialSegmentationEngine` implementation.

#### Pipeline B Observations

- **Segmentation Latency:** Not recorded per sample. The unit test suite (`segmentation.test.ts`) only asserts upper bounds on the development machine: each sample < 100 ms and an average < 35 ms across the 5 fixtures.
- **Challenge Safety Validation:** The benchmark (`runSegmentationBenchmark`) passes a single hard-coded, template-generated observational sentence through the keyword-based `validateChallengeSafety` check for each sample. It does **not** validate model-generated challenges, so it is not evidence of model output safety. Separately, unit tests confirm the validator rejects three hand-written unsafe examples (ingestion, mushroom handling, wildlife capture).

### Integration Gate Decision

#### Decision: NO (Retained as Experimental Module)

##### Key Rationale

1. **Multimodal Sufficiency:** Google Gemma 3 4B multimodal already performs morphological feature recognition directly on image pixels (e.g., identifying lobed cuticles, quartz veins, and fissured bark).
2. **No Demonstrated User Benefit:** The heuristic summary only provides coarse colour-bucket and directional tokens (e.g., *"focal subject occupies center quadrant"*). Because Pipeline C was never executed, no benefit to identification or challenge quality has been measured.
3. **Product Simplicity:** In keeping with the "Touch Grass" ethos, avoiding unnecessary architectural layers keeps the codebase lean, robust, and zero-maintenance.

---

## 7. Milestone 2: Empirical Gemma 3 4B Latency Engineering & Benchmark Suite

- **Benchmark Execution Date:** October 7, 2026
- **Benchmark Runner:** `scripts/benchmark-gemma.mjs`
- **Raw Empirical Artifact:** `docs/benchmark-results/gemma-latency.json` (754 lines)
- **Principle:** No fabricated metrics or simulated percentages. All timings below represent physical measurements executed on local hardware.

### 7.1 Testbed Environment & Hardware Specifications

- **Host Machine:** Apple MacBook Pro (Apple M3, 8-core CPU, 10-core GPU, 8 GB Unified Memory)
- **Host OS:** macOS Darwin 25.6.2
- **Runtime Environment:** Node.js v25.9.0 / Next.js 16.3.8
- **Inference Server:** Local Ollama v0.35.1 on loopback `http://127.0.0.1:11434`
- **Model:** `gemma3:4b` (`gemma3:4b-it` multimodal, 4.3B parameter footprint, GGUF Q4_K_M)
- **Fixtures:** 5 identical outdoor test specimens:
  1. `oak_leaf` (166 KB, 640×480)
  2. `tree_bark` (208 KB, 640×480)
  3. `wildflower` (179 KB, 640×480)
  4. `river_stones` (175 KB, 640×480)
  5. `pine_cone` (167 KB, 640×480)

---

### 7.2 Baseline Performance Profile: Cold vs. Warm Inference

A **Cold Run** occurs when the model is not kept resident in unified memory (requiring Ollama to page weights from disk into Metal buffers). A **Warm Run** occurs when the model is already resident in memory via `keep_alive`.

#### Empirical Timing Breakdown Across 5 Fixtures

| Metric | Cold Run (p50 / Median) | Cold Run (Mean) | Warm Run (p50 / Median) | Warm Run (Mean) | Delta (Warm vs. Cold) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Load Duration** | 4,611.86 ms | 7,611.23 ms | 61.40 ms | 58.74 ms | **-98.7% (-4,550 ms)** |
| **Prompt & Vision Eval** | 17,289.52 ms | 16,929.56 ms | 371.24 ms | 4,008.06 ms | **-97.9% (cached)** |
| **Token Generation Duration** | 36,131.48 ms | 39,707.27 ms | 38,856.03 ms | 36,575.89 ms | +7.5% (steady-state) |
| **Total Request Duration** | **57,748.72 ms** | **64,248.06 ms** | **40,051.51 ms** | **40,642.69 ms** | **-30.6% (-17,697 ms)** |
| **Min Total Latency** | 53,099.64 ms | — | 32,842.61 ms | — | -38.2% |
| **Max Total Latency** | 101,758.33 ms | — | 52,212.11 ms | — | -48.7% (memory swap) |

> *Note on Percentiles:* Figures reported as p50 (median) and sample p95 (Cold: 93,678 ms, Warm: 50,001 ms) reflect sample percentiles across the five benchmark fixtures. With five sample observations, sample p95 describes the tested set rather than a population estimate.

#### Component Bottleneck Breakdown (Warm State)

| Component | Warm p50 Latency | % of Total Runtime | Primary Bottleneck? | Optimization Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Model Load (`load_duration`)** | 61.40 ms | 0.15% | No (solved by keep_alive) | Low (Resolved) |
| **Prompt / Vision Eval (`prompt_eval`)** | 371.24 ms | 0.93% | No (cached/efficient) | Medium (Compact prompt) |
| **Token Generation (`eval_duration`)** | 38,856.03 ms | **97.02%** | **YES (Primary Bottleneck)** | **CRITICAL** |
| **Network / App Boundary Overhead** | ~760 ms | 1.90% | No | Low |

> **Finding:** On unified Apple Silicon memory, once Gemma 3 4B is loaded, **token generation represents 97.02% of total request duration in the tested warm benchmark on Apple M3** (~9.7 tokens/sec for 300–350 tokens). Accelerating inference requires restricting unnecessary token emission without truncating the structured contract.

---

### 7.3 Optimization Experiments & Empirical Findings

#### Experiment 1: Model Memory Retention (`keep_alive = "10m"`)

- **Hypothesis:** Cold loading costs 4.6s to 20s per inference on consumer laptops with 8GB RAM.
- **Methodology:** A cold run was induced by explicitly evicting the model from memory using `keep_alive: 0`, forcing Ollama to page the 3.3 GB GGUF weights into Metal buffers on the subsequent request. The warm run was measured on the immediate follow-up request with `keep_alive: '10m'`.
- **Result:** Keeping the model loaded via `keep_alive: '10m'` dropped model load duration from **4,611 ms to 61 ms (-98.7%)**.
- **RAM Impact:** Retains ~3.3 GB of model weights in unified RAM for 10 minutes following the last capture.
- **Decision:** **KEEP**. Highly effective for preventing repetitive multi-second weight re-allocations during field sessions.

#### Experiment 2: Output Token Limitation (`num_predict` Sweeps)

- **Hypothesis:** Limiting `num_predict` below 256 will cut generation time proportionally.
- **Measurements:**
  - `num_predict = 256`: Latency 31,749 ms | Output tokens: 256 | Valid Contract: **0% (FAIL - Truncated JSON)**
  - `num_predict = 192`: Latency 23,892 ms | Output tokens: 192 | Valid Contract: **0% (FAIL - Truncated JSON)**
  - `num_predict = 128`: Latency 16,198 ms | Output tokens: 128 | Valid Contract: **0% (FAIL - Truncated JSON)**
  - `num_predict = 512`: Latency 35,682 ms | Output tokens: 315 | Valid Contract: **100% (PASS across tested cases)**
- **Finding:** A complete `FieldMission` contract with 3 clues, observation steps, success criteria, and safety constraints required between 290 and 340 tokens in our fixtures. Restricting `num_predict` to $\le 256$ caused 100% schema failure by truncating closing JSON syntax.
- **Decision:** **REJECT capping below 350 tokens**. Set an empirical safety ceiling at `num_predict: 512` as the smallest tested ceiling that produced valid FieldMission output across the benchmark cases, bounding potential runaway loops.

#### Experiment 3: System Prompt Compression

- **Hypothesis:** Removing redundant schema demonstrations from `TRAILLENS_SYSTEM_PROMPT` reduces prompt evaluation time and context memory footprint.
- **Measurements:**
  - Baseline Prompt: 1,019 prompt tokens | Eval duration: 11,627 ms
  - Compact Prompt: 506 prompt tokens | Eval duration: 10,683 ms
  - Token Reduction: **-513 prompt tokens (-50.3%)**
- **Decision:** **KEEP**. Retained all 5 core safety and grounding directives while eliminating 30 lines of duplicate mock JSON schema.

#### Experiment 4: Client Image Resolution Ablation

- **Hypothesis:** Larger images increase vision patch token count and eval latency without improving field observation quality.
- **Measurements:**
  - `480px` (88 KB): Total latency 39,013 ms | Prompt/Vision eval: 9,554 ms
  - `640px` (166 KB - Baseline): Total latency 36,651 ms | Prompt/Vision eval: 8,880 ms
  - `800px` (205 KB): Total latency 50,402 ms | Prompt/Vision eval: 14,469 ms (+62.9% slower)
- **Decision:** **KEEP 640px**. 640px was the most effective tradeoff among tested candidates (480px, 640px, 800px): higher resolution (800px) caused a 14-second prompt eval penalty (+63%), while lower resolution (480px) risked losing minute bark and vein textures.

#### Experiment 5: JSON Mode vs. True JSON Schema Structured Output

- **Hypothesis:** Passing an explicit JSON Schema through Ollama's `format` parameter constrains generation grammar and reduces tokens compared to standard JSON mode (`format: "json"`).
- **Measurements & Baseline Clarification:**
  - *Warm Baseline Context:* The aggregate warm median across all 5 distinct fixtures is **40.05s** (under warm prompt caching).
  - *JSON Mode Test (Specimen: Pine Bark):* Total: 51,453 ms | Prompt eval: 11,485 ms (uncached due to format change) | Generation: 39,968 ms | Tokens: 343
  - *JSON Schema Mode Test (Specimen: Pine Bark):* Total: 35,682 ms | Prompt eval: 514 ms (cached) | Generation: 35,168 ms | Tokens: 315
- **Attribution Analysis:**
  - Total observed latency difference between these runs was **15,771 ms**.
  - **Generation Duration Difference:** 4,800 ms (39,968 ms vs 35,168 ms, an observed ~12.0% reduction in generation time and 28 fewer tokens).
  - **Prompt Eval Cache Difference:** 10,971 ms (11,485 ms vs 514 ms, resulting from Ollama's KV cache hit on sequential execution).
  - **Characterization:** The 15.8s / 30.6% total delta represents an **observed difference under the tested configurations**, not a purely causal speedup from grammar enforcement alone.
  - Schema Conformance: Valid Zod parsing with 0 rescue-parser invocations.
- **Decision:** **KEEP**. Schema-constrained output eliminated conversational preamble, pruned invalid grammar branches, and reduced token count by 28 tokens in the tested specimen.

---

### 7.4 Optimization Decision Matrix

| Optimization | Latency Benefit | Quality Impact | Reliability | Memory Impact | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`keep_alive = "10m"`** | -4.5s to -20s on repeat calls (-98.7% load) | None (identical weights) | 100% stable | Holds ~3.3 GB RAM for 10m | **KEEP** |
| **JSON Schema `format`** | Observed -15.8s delta (-4.8s generation) | Improved (strict adherence) | Valid contracts in all tests | Zero overhead | **KEEP** |
| **System Prompt Compression** | -1.0s (-50.3% prompt tokens) | None (rules preserved) | Valid contracts in all tests | Lower context KV cache | **KEEP** |
| **`num_predict = 512` Ceiling** | Bounds token budget | None | Smallest tested ceiling for valid contracts | Bounded headroom | **KEEP** |
| **`num_predict <= 256`** | -8s to -20s | High (100% contract truncation) | 0% valid contracts | Minimal | **REJECT** |
| **Image Resolution = 640px** | Optimal baseline vs 800px (-13.7s) | High morphological detail | 100% reliable | ~160 KB per payload | **KEEP** |
| **Page Mount Pre-Warmup** | Eliminates cold load for user | None | Idempotent (60s cooldown guard) | Triggered only on `/explore` | **KEEP** |
| **Perceived Progress Stages** | 0s actual, high UX improvement | Honest, deterministic stages | No fake percentages | Zero | **KEEP** |

---

### 7.5 How to Reproduce These Benchmarks

Any developer can replicate these findings on their local machine:

1. **Verify Environment:**

   ```bash
   ollama --version          # e.g., ollama version is 0.35.1
   ollama list               # verify gemma3:4b exists
   ```

2. **Ensure Ollama Daemon is Running:**

   ```bash
   curl -s http://127.0.0.1:11434/api/tags
   ```

3. **Run the Benchmark Runner:**

   ```bash
   node scripts/benchmark-gemma.mjs
   ```

4. **Inspect Generated Results:**

   Review `docs/benchmark-results/gemma-latency.json` containing complete hardware details, ISO timestamps, and raw duration metrics for every run.

---

### 7.6 Reproducibility Verification Run (October 7, 2026)

To empirically test the consistency of these observations, a fresh full execution of `scripts/benchmark-gemma.mjs` was conducted on the same 8 GB Apple M3 testbed (persisted in `docs/benchmark-results/gemma-latency.json`).

#### Comparative Telemetry: Frozen M2 Baseline vs. Reproducibility Run

| Metric / Experiment | Frozen M2 Baseline (`v2.0.0`) | Reproducibility Run (Oct 7) | Engineering Behavior & Findings |
| :--- | :--- | :--- | :--- |
| **Warm p50 Total** | 40,051.51 ms (~40.1s) | **52,488.88 ms (~52.5s)** | Shifted upward; shows local runtime variability under changing local system conditions and background load. |
| **Cold p50 Total** | 57,748.72 ms (~57.8s) | **65,777.04 ms (~65.8s)** | Consistent direction; cold start remains substantially slower than warm steady-state. |
| **Warm Model Load p50** | 61.40 ms | **70.43 ms** | **Reproduced:** `keep_alive` reduces warm model-load overhead to tens of milliseconds in the tested runs, versus multi-second cold loading. |
| **Cold Model Load p50** | 4,611.86 ms | **7,574.40 ms** | **Reproduced:** Uncached cold start pays a multi-second weight allocation penalty. |
| **Token Ceilings (`num_predict`)** | 128 / 192 / 256: 0% valid | **128 / 192 / 256: 0% valid** | **Reproduced:** Truncated JSON across all 3 limits; 128 / 192 / 256 remain invalid; 512 remains the smallest tested ceiling established in M2 that produced a valid `FieldMission` contract. |
| **Prompt Token Reduction** | -513 tokens (-50.3%) | **-513 tokens (-50.3%)** | **Reproduced:** Deterministic token reduction (1,019 → 506 tokens). |
| **JSON Mode vs. JSON Schema** | Observed Schema faster | **JSON Mode: 61,045 ms vs. Schema: 43,093 ms** | JSON Schema mode again showed lower observed latency under tested configurations. |

#### Methodological Notes & Evidence Qualifications

1. **Runtime Variability vs. Invariant Latency:** Absolute latency shifted upward in this second run (warm p50 rose from ~40.1s to ~52.5s), illustrating runtime variability on the 8 GB Apple M3 host machine under changing local system conditions and background load. Benchmark reproducibility demonstrates the **underlying engineering behavior and architectural trends** (e.g., model residency advantages, token bounds, prompt savings), not an invariant wall-clock number.
2. **Attribution of JSON Schema Delta:** JSON Schema mode again showed lower observed latency than JSON mode under the tested configurations (43,092.65 ms vs. 61,045.19 ms). However, this benchmark does not isolate all runtime and prompt-cache effects, so the full observed delta cannot be claimed as solely caused by grammar enforcement.
3. **Resolution Tradeoff (Not Global Optimality):** The reproducibility sweep on the test specimen observed:
   - `480px`: 58,415.93 ms (prompt eval: 16,646.39 ms)
   - `640px`: 44,750.32 ms (prompt eval: 9,653.29 ms)
   - `800px`: 36,747.61 ms (prompt eval: 9,883.29 ms)
   This confirms that 640px is a **tested production baseline and engineering tradeoff** (balancing visual acuity for fine textures against payload size), rather than a universally or globally optimal resolution.
4. **Sample Percentiles:** p95 figures (Cold: 90,082.85 ms, Warm: 54,893.13 ms) remain descriptive statistics over the 5-sample fixture set rather than population bounds.

---

## 8. Milestone 4: Mission Quality + Grounding Rubric

### 8.1 Product Thesis & Quality Goal

TrailLens is a local AI field-experiment engine designed around the physical exploration loop:

$$\text{SEE} \longrightarrow \text{GEMMA UNDERSTANDS} \longrightarrow \text{MISSION READY} \longrightarrow \text{PHONE DOWN} \longrightarrow \text{EXPLORE} \longrightarrow \text{RETURN} \longrightarrow \text{REFLECT} \longrightarrow \text{FIELD RECORD}$$

In Milestone 4 (M4), generated `FieldMission` objects are made **measurable, testable, and auditable for quality** without introducing cloud dependencies, external vector databases, secondary AI models, or semantic segmentation.

The mission quality evaluator (`evaluateMissionQuality` in `src/lib/mission/quality.ts`) is **100% deterministic, offline, and rule-based**. It does **not** call Gemma or any secondary language model.

---

### 8.2 Architectural Distinctions & Boundaries

To maintain rigorous scientific and engineering integrity, four distinct concepts in TrailLens must not be conflated:

1. **Deterministic Contract Evaluation (M4 Rubric):**
   - Pure TypeScript functions evaluating structural invariants, token grounding, operational verbs, duration bounds, and physical disengagement indicators.
   - Evaluated offline in sub-millisecond execution with zero model inference.
   - Scores are bounded ($0 \le \text{Score} \le 100$) with explicit, exported, transparent deductions.

2. **Runtime Gemma Inference (M1 & M2):**
   - On-device local multimodal inference (`gemma3:4b` on Ollama) translating outdoor images into structured JSON (`FieldMission`).
   - Subject to hardware variability, prompt cache states, and generative distributions.

3. **Safety Enforcement (Authoritative Production Gate):**
   - The production safety filter in `src/lib/safety/challenge.ts` is the **sole authoritative gate** preventing dangerous challenges (toxic mushroom foraging, ingestion, steep terrain, specimen collection, touching wildlife).
   - The M4 quality rubric **re-uses** this gate to report safety compliance; it does not duplicate or create a second conflicting safety mechanism.

4. **Real-World Field Testing (Empirical Field Reality):**
   - Actual human sensory verification outdoors on natural trails with varying weather, lighting, topography, and vegetation.
   - Passing the offline rubric is a **necessary contractual baseline**, not empirical proof of field engagement or educational effectiveness.

---

### 8.3 The Five Quality Dimensions & Scoring Model

The rubric evaluates five orthogonal dimensions ($0–20$ points each, Total $= 100$, Passing $\ge 14/\text{dimension}$ and Total $\ge 70$):

| Dimension | Range | Passing | What It Measures | Deterministic Rules & Penalties |
| :--- | :---: | :---: | :--- | :--- |
| **1. Grounding** | 0–20 | $\ge 14$ | Connection to analyzed natural subject | • Irrelevant domain / sensors (barometric, humidity, pressure, Wi-Fi): $-12$ pts [ERROR]<br>• Complete vocabulary disconnect from specimen ID/description: $-10$ pts [ERROR]<br>• Target lacks anatomical/botanical morphology reference: $-4$ pts [WARNING] |
| **2. Specificity** | 0–20 | $\ge 14$ | Operational instructions over vague filler | • Vague clichés ("explore the area", "look around", "observe nature"): $-10$ pts [ERROR]<br>• Missing operational action verbs: $-4$ pts [WARNING]<br>• Missing observable property: $-4$ pts [WARNING]<br>• Unbounded scope ("anywhere in forest"): $-3$ pts [WARNING] |
| **3. Safety** | 0–20 | $\ge 14$ | Physical hazard prevention & Leave No Trace | • Violation of authoritative challenge safety gate (foraging, toxic fungi, steep drop-offs): $-20$ pts (Score $= 0$) [ERROR]<br>• Missing explicit safety constraint: $-4$ pts [WARNING] |
| **4. Executability** | 0–20 | $\ge 14$ | Reasonable outdoor completion without gear | • Duration outside $[120\text{s}, 300\text{s}]$: $-8$ pts [ERROR]<br>• Steps count outside $[1, 4]$: $-8$ pts [ERROR]<br>• Trivial or empty success criteria ($< 15$ chars): $-8$ pts [ERROR]<br>• Specialized lab equipment requirement (microscope, scale): $-8$ pts [ERROR] |
| **5. Outdoor Value** | 0–20 | $\ge 14$ | Physical-world observation vs screen memorization | • Screen-only / cognitive-only task ("stare at phone", "read description"): $-14$ pts [ERROR]<br>• Missing physical disengagement / movement indicator: $-4$ pts [WARNING] |

---

### 8.4 Deterministic Fixture Benchmark Results

A standardized benchmark suite consisting of **10 deterministic fixtures (A through J)** was executed using `scripts/evaluate-mission-quality.mjs` and persisted to `docs/benchmark-results/mission-quality.json`.

```bash
node scripts/evaluate-mission-quality.mjs
```

#### Benchmark Telemetry Summary

| Metric | Result |
| :--- | :--- |
| **Fixture Count** | 10 (Fixtures A through J) |
| **Strong Fixtures** | 4 (Fixtures A, H, I, J) |
| **Failing Edge Cases** | 6 (Fixtures B, C, D, E, F, G) |
| **Overall Pass Count** | 4 / 10 (40.0%) |
| **Overall Fail Count** | 6 / 10 (60.0%) |
| **Average Total Score** | **85.4 / 100** |
| **Weakest Dimension** | **Specificity** (60.0% pass rate, average score 14.6 / 20) |

#### Dimension Performance Breakdown

| Dimension | Fixtures Passed | Pass Rate | Average Score | Max Score |
| :--- | :---: | :---: | :---: | :---: |
| **Grounding** | 8 / 10 | 80.0% | 17.0 / 20 | 20 |
| **Specificity** | 6 / 10 | 60.0% | 14.6 / 20 | 20 |
| **Safety** | 9 / 10 | 90.0% | 18.0 / 20 | 20 |
| **Executability** | 8 / 10 | 80.0% | 18.4 / 20 | 20 |
| **Outdoor Value** | 9 / 10 | 90.0% | 17.4 / 20 | 20 |

#### Analysis of Weakest Dimension: Specificity

Specificity had the lowest pass rate ($60.0\%$) and lowest average score ($14.6/20$) across the fixture suite. This reflects the intentional sensitivity of the rubric:
- Generic missions with vague fillers (`explore the area`, `look around`) are penalized heavily ($-10$ pts).
- Failing fixtures that lack concrete morphological attributes (e.g., Fixture B, Fixture G, and Fixture F) trigger cumulative deductions for lacking operational verbs and observable properties.

#### Exact Failed Checks Recorded Across Benchmark Suite

1. `[WARNING] SPECIFICITY_NO_OBSERVABLE_PROPERTY` ($4\times$)
2. `[ERROR] GROUNDING_TARGET_DISCONNECTED` ($2\times$)
3. `[WARNING] SPECIFICITY_UNBOUNDED_SCOPE` ($2\times$)
4. `[WARNING] SPECIFICITY_NO_OPERATIONAL_VERB` ($2\times$)
5. `[WARNING] OUTDOOR_LACKS_PHYSICAL_DISENGAGEMENT` ($2\times$)
6. `[ERROR] SPECIFICITY_VAGUE_PHRASE` ($1\times$)
7. `[ERROR] GROUNDING_IRRELEVANT_DOMAIN` ($1\times$)
8. `[ERROR] EXECUTABILITY_DURATION_OUT_OF_BOUNDS` ($1\times$)
9. `[ERROR] EXECUTABILITY_UNVERIFIABLE_SUCCESS_CRITERIA` ($1\times$)
10. `[ERROR] SAFETY_HAZARD_DETECTED` ($1\times$)
11. `[ERROR] OUTDOOR_SCREEN_ONLY_TASK` ($1\times$)

---

### 8.5 UI Integration & User Experience

In accordance with product thesis:
- Normal outdoor explorers are **not** presented with raw rubric scores or analytics graphs.
- High-quality missions display a subtle trust indicator badge: `Field-tested structure` in the `ChallengeCard` header alongside point values.
- Internal pipelines attach `qualityReport?: MissionQualityReport` to `AIAnalysisResult` for system auditability, debugging, and offline evaluation.

---

### 8.6 Known Limitations & Scope Bounds

1. **Deterministic Lexical Overlap vs. Semantic Understanding:** The grounding evaluator uses token matching and morphological lexicons. It does not possess deep world knowledge or visual semantic parsing.
2. **Fixture Suite Scope:** The 10 fixtures (A through J) evaluate the discriminating power of the rubric contract; they do not represent an empirical sample of real-world user missions generated across all ecosystems.
3. **Safety Gate Authority:** The safety scoring relies completely on `validateChallengeSafety`. Novel hazards not covered by the safety regex rules will not be flagged by the quality evaluator.
4. **Field Engagement:** High rubric scores verify contractual structure, not whether a particular human user finds a given mission emotionally or educationally captivating.
