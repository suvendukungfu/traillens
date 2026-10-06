# TrailLens: Empirical Outdoor Evaluation & Verification Report

> **Project:** TrailLens — Look beyond the screen.  
> **Evaluation Date:** October 6, 2026  
> **Target Category:** Hacktoberfest 2026 — Best Use of Gemma (Theme: *Touch Grass*)  
> **Evaluator:** Lead Architect & Senior AI Engineer  

---

## 1. Evaluation Methodology & Testbed

In accordance with the project's engineering principles, **no metrics, timings, or AI outputs have been fabricated**. All results below are derived from empirical executions against local Ollama inference using Google Gemma 3 4B.

### Testbed Environment

- **Host Machine:** Apple Silicon (macOS)
- **Local AI Daemon:** Ollama v0.21.0 listening on loopback `http://127.0.0.1:11434`
- **Model:** `gemma3:4b` (`gemma3:4b-it` multimodal, 4.3B parameter footprint, GGUF Q4_K_M)
- **Application Server:** Next.js 16.3.8 (Turbopack App Router) on Node.js v25.9.0
- **Client Preprocessing:** HTML5 Canvas-based downscaling to $\le 640\text{px}$ max dimension at $0.80$ JPEG quality
- **Payload Verification:** Strict Zod schema validation via `analyzeRequestSchema` and `aiAnalysisResultSchema`

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
- **JSON Schema Conformance:** 100% (All parsed cleanly into strict Zod contracts)

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
4. **Conclusion:** TrailLens is 100% operationally autonomous in deep nature reserves and remote environments without internet connection once model weights are stored locally.

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
