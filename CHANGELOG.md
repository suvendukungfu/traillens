# Changelog

All notable changes to the **TrailLens** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-10-08

### Added
- **Senior SDLC Documentation Pass:** Created `docs/SDLC.md` covering 14 lifecycle stages from problem definition to release engineering.
- **Narrative Engineering Journey:** Added `docs/ENGINEERING-JOURNEY.md` documenting the authentic three-day milestone retrospective.
- **Project Overview & Onboarding:** Created `docs/PROJECT-OVERVIEW.md` and `CONTRIBUTING.md` with explicit guidelines for judges and open-source contributors.
- **C4 Architecture & Sequence Diagrams:** Added Mermaid system architecture, sequence flows, state machines, and data lifecycle diagrams in `docs/architecture.md`.
- **7-Tier Evaluation Taxonomy:** Clarified evaluation boundaries in `docs/evaluation.md` separating unit tests, contract parsing, safety gates, fixture rubrics, and empirical latency.
- **Test Sample Observations:** Added specimen fixtures in `public/samples/` for offline demonstration.

### Changed
- **Editorial Field Experience Redesign:** Transformed `/explore` into a dual-column quiet luxury layout with a 1240px desktop container, active viewfinder reticle, and specimen dossier.
- **Camera Capture Pipeline Hardening:** Permanently mounted `<video>` in DOM with `autoPlay`, `playsInline`, and `muted` attributes; added canvas fallback capture with resolution guards.
- **Inference Latency Optimizations:** Implemented client canvas downscaling to 512px, pinned Ollama context window to `num_ctx: 2048`, and pinned model memory residency with `keep_alive: '10m'`.

---

## [2.0.0] - 2026-10-07

### Added
- **Structured FieldMission Pipeline:** Defined canonical `FieldMission` data contract (`missionType`, `target`, `durationSeconds`, `steps`, `successCriteria`, `safetyConstraints`) in `src/types/trail.ts`.
- **Milestone 4 Quality Rubric:** Introduced deterministic, offline 5-dimension Mission Quality Rubric in `src/lib/mission/quality.ts` with 10 synthetic test fixtures (Fixtures A–J).
- **Pocket Mode Immersion:** Added `PocketModeModal.tsx` enforcing the "phone down" exploration transition.
- **Sensory Reflection HUD:** Added post-trail reflection flow in `/session` capturing sights, sounds, and textures before generating immutable Field Records.
- **Milestone 2 Latency Benchmarking:** Added automated benchmark harness `scripts/benchmark-gemma.mjs` recording warm vs. cold load latencies and token generation metrics in `docs/benchmark-results/gemma-latency.json`.
- **Experimental Spatial Vision Module:** Added colour-heuristic spatial summary prototype under `src/lib/vision/segmentation/`.

### Changed
- Upgraded Ollama integration to use JSON Schema grammar constraints via Zod 4 compilation.
- Refined production safety gate in `src/lib/safety/challenge.ts` with Leave No Trace rules and toxic fungi interception.

---

## [1.0.0] - 2026-10-06

### Added
- **Core Product Thesis:** Defined TrailLens as a local AI field-experiment engine for Hacktoberfest 2026 (*Touch Grass*).
- **Local Gemma 3 4B Pipeline:** Integrated local Ollama daemon over loopback HTTP (`http://127.0.0.1:11434`) running `gemma3:4b`.
- **Geolocation & Haversine Engine:** Built `src/lib/distance.ts` and `src/lib/geolocation.ts` with GPS jitter filtering and watcher lifecycle teardown.
- **Validation Suite:** Implemented Zod schemas for payload boundaries and base64 image sanitization.
- **Session HUD:** Built in-memory React Context managing session stats, elapsed duration, and distance walked.
- **Automated Tests:** Established baseline Vitest suites covering distance formulas, schema parsing, and watcher lifecycles.
