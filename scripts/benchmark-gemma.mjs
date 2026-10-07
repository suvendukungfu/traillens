#!/usr/bin/env node
/**
 * TrailLens Milestone 2 — Local Gemma Latency Benchmark Suite
 * Reproducible scientific performance measurement of local Gemma 3 4B inference on Ollama.
 */

import fs from 'fs';
import { execSync } from 'child_process';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';
const RESULTS_FILE = 'docs/benchmark-results/gemma-latency.json';

const SAMPLES = [
  { id: 'oak_leaf', label: 'Oak Leaf Observation', file: 'public/samples/oak_leaf_optimized.jpg' },
  { id: 'tree_bark', label: 'Pine Bark & Lichen', file: 'public/samples/tree_bark_optimized.jpg' },
  { id: 'wildflower', label: 'Dandelion Wildflower', file: 'public/samples/wildflower_optimized.jpg' },
  { id: 'river_stones', label: 'River Stones & Pebbles', file: 'public/samples/river_stones_optimized.jpg' },
  { id: 'pine_cone', label: 'Fallen Pine Cone', file: 'public/samples/pine_cone_optimized.jpg' },
];

const JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    identification: { type: 'string' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    uncertaintyReason: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
    description: { type: 'string' },
    observation: { type: 'string' },
    mission: {
      type: 'object',
      properties: {
        missionType: {
          type: 'string',
          enum: ['OBSERVE', 'COMPARE', 'COUNT', 'NOTICE', 'TRACE', 'PATTERN'],
        },
        title: { type: 'string' },
        target: { type: 'string' },
        durationSeconds: { type: 'integer', minimum: 120, maximum: 300 },
        steps: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
        successCriteria: { type: 'string' },
        safetyConstraints: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'missionType',
        'title',
        'target',
        'durationSeconds',
        'steps',
        'successCriteria',
        'safetyConstraints',
      ],
      additionalProperties: false,
    },
    safety: { type: 'string' },
  },
  required: [
    'identification',
    'confidence',
    'evidence',
    'description',
    'observation',
    'mission',
    'safety',
  ],
  additionalProperties: false,
};

const BASELINE_SYSTEM_PROMPT = `You are TrailLens, an offline AI field-experiment engine powered by local Gemma 3.
Your purpose is to look beyond the screen: analyze what a user observes outdoors and immediately guide them into a short physical-world experiment.

CRITICAL INSTRUCTIONS:
1. VISUAL GROUNDING: Analyze ONLY what is visually apparent in the provided image. Never hallucinate or guess a specific species if features are ambiguous or blurry.
2. HONEST UNCERTAINTY: Assign confidence: "high" (unmistakable prominent features), "medium" (likely genus/family but ambiguous species), or "low" (generic foliage, partial view, or blurry). If confidence is "medium" or "low", provide an honest "uncertaintyReason" explaining what distinguishing features are missing or ambiguous.
3. NO CHATBOT CONVERSATION: Never greet, converse, or invite chatting. Produce only the requested structured JSON field mission.
4. STRUCTURED FIELD MISSION: Generate a short, tangible physical exploration experiment (120 to 300 seconds) grounded directly in the visual traits observed.
   - Allowed missionTypes: "OBSERVE", "COMPARE", "COUNT", "NOTICE", "TRACE", "PATTERN".
   - steps: 1 to 3 clear observational actions that require looking away from the phone.
   - successCriteria: Concrete condition the user can visually verify in the habitat.
5. LEAVE NO TRACE & FIELD SAFETY:
   - NEVER suggest touching, tasting, eating, foraging, or brewing plants, berries, or fungi.
   - NEVER suggest handling, approaching, or disturbing wildlife, insects, or nests.
   - NEVER suggest climbing cliffs, steep ravines, or wading into moving water.
   - Keep all steps strictly non-destructive and observational.

OUTPUT FORMAT:
You MUST respond with a single, valid JSON object matching this schema:
{
  "identification": "Common name or morphological group (e.g., 'White Oak Leaf (Quercus alba)')",
  "confidence": "low" | "medium" | "high",
  "uncertaintyReason": "Reason for uncertainty if medium/low (or omitted if high)",
  "evidence": [
    "Specific visual clue 1 seen in image",
    "Specific visual clue 2 seen in image"
  ],
  "description": "2-3 concise sentences detailing key botanical, geological, or environmental traits visible.",
  "observation": "One intriguing detail to look for nearby in the surrounding habitat.",
  "mission": {
    "missionType": "COMPARE",
    "title": "Short descriptive mission title",
    "target": "Observable subject or trait in surrounding habitat",
    "durationSeconds": 120,
    "steps": [
      "Put your phone in your pocket",
      "Look for another nearby specimen",
      "Compare the visible leaf margins or bark textures"
    ],
    "successCriteria": "Visually identify two structural differences",
    "safetyConstraints": [
      "Observe only; do not pick, touch, or harvest specimens"
    ]
  },
  "safety": "Sensible field safety and conservation guideline regarding this organism or terrain."
}

Do not wrap in markdown quotes if possible, or use standard \`\`\`json block. Provide ONLY valid JSON.`;

const COMPACT_SYSTEM_PROMPT = `You are TrailLens, an offline AI field-experiment engine powered by local Gemma 3.
Analyze what a user observes outdoors and guide them into a short physical-world experiment.

RULES:
1. VISUAL GROUNDING: Rely strictly on visible traits in the image. Do not guess species if features are ambiguous.
2. HONEST UNCERTAINTY: Assign confidence: "high", "medium", or "low". If medium or low, specify uncertaintyReason.
3. NO CHATBOT CONVERSATION: Emit only the structured JSON field mission. No greetings or conversational filler.
4. FIELD MISSION: Create an experiment (120-300 seconds) with 1-3 physical observational steps looking away from the phone.
5. LEAVE NO TRACE & SAFETY: Never suggest touching, picking, foraging, or consuming wild specimens. Never suggest disturbing wildlife, climbing cliffs, or entering moving water. Keep all steps purely observational.`;

const USER_PROMPT = `Please examine this outdoor observation image and provide your structured field guide assessment and Field Mission Contract in JSON.`;

// Helper: Calculate statistical aggregates
function calculateStats(values) {
  if (!values || values.length === 0) {
    return { min: 0, median: 0, p95: 0, mean: 0, max: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = Math.round((sorted.reduce((sum, v) => sum + v, 0) / sorted.length) * 100) / 100;
  
  const p50Index = Math.floor(sorted.length * 0.5);
  const median = sorted.length % 2 === 0
    ? Math.round(((sorted[p50Index - 1] + sorted[p50Index]) / 2) * 100) / 100
    : sorted[p50Index];

  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95 = sorted[p95Index];

  return { min, median, p95, mean, max };
}

// Helper: Convert nanoseconds to milliseconds
function nsToMs(ns) {
  if (typeof ns !== 'number' || isNaN(ns) || ns < 0) return 0;
  return Math.round((ns / 1_000_000) * 100) / 100;
}

// Unload model from memory for true cold tests
async function unloadModel() {
  try {
    await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, keep_alive: 0 }),
    });
    // Brief sleep to allow OS memory reclamation
    await new Promise((r) => setTimeout(r, 600));
  } catch (err) {
    console.warn(`[WARN] Failed to unload model: ${err.message}`);
  }
}

// Execute single chat request to Ollama
async function executeChat({
  base64Image,
  systemPrompt = BASELINE_SYSTEM_PROMPT,
  format = JSON_SCHEMA,
  options = { temperature: 0.2, top_p: 0.9 },
  keepAlive,
}) {
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: USER_PROMPT, images: [base64Image] },
    ],
    stream: false,
    format,
    options,
  };
  if (keepAlive !== undefined) {
    payload.keep_alive = keepAlive;
  }

  const startTime = Date.now();
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const roundtripMs = Date.now() - startTime;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.message?.content || data.response || '';

  let isValid = false;
  let parsedContent = null;
  let usedRescue = false;

  try {
    parsedContent = JSON.parse(content);
    if (parsedContent.mission && parsedContent.identification) {
      isValid = true;
    }
  } catch {
    // Attempt rescue
    try {
      const first = content.indexOf('{');
      const last = content.lastIndexOf('}');
      if (first !== -1 && last > first) {
        parsedContent = JSON.parse(content.substring(first, last + 1));
        if (parsedContent.mission && parsedContent.identification) {
          isValid = true;
          usedRescue = true;
        }
      }
    } catch {
      isValid = false;
    }
  }

  return {
    roundtripMs,
    totalDurationMs: nsToMs(data.total_duration),
    loadDurationMs: nsToMs(data.load_duration),
    promptEvalDurationMs: nsToMs(data.prompt_eval_duration),
    generationDurationMs: nsToMs(data.eval_duration),
    promptTokens: data.prompt_eval_count || 0,
    outputTokens: data.eval_count || 0,
    isValid,
    usedRescue,
    parsedContent,
  };
}

async function main() {
  console.log('===============================================================');
  console.log(' TrailLens Milestone 2 — Local Gemma Latency Benchmark Suite ');
  console.log('===============================================================\n');

  // Verify Ollama health
  try {
    const tagsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!tagsRes.ok) throw new Error(`HTTP ${tagsRes.status}`);
    const tagsData = await tagsRes.json();
    const hasModel = tagsData.models?.some((m) => m.name.includes('gemma3:4b'));
    if (!hasModel) {
      console.error(`[ERROR] Model "${MODEL}" is not found in local Ollama.`);
      process.exit(1);
    }
    console.log(`✓ Ollama reachable at ${OLLAMA_BASE_URL}`);
    console.log(`✓ Model "${MODEL}" verified present in local library\n`);
  } catch (err) {
    console.error(`[FATAL] Ollama daemon unreachable: ${err.message}`);
    process.exit(1);
  }

  // Collect Environment Info
  const nodeVersion = process.version;
  const osName = execSync('sw_vers -productName', { encoding: 'utf8' }).trim();
  const osVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
  const hardware = execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim();
  const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Apple M3"', { encoding: 'utf8' }).trim();
  const totalMem = parseInt(execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim(), 10);
  const totalMemGb = Math.round(totalMem / (1024 * 1024 * 1024));

  console.log(`Hardware:      ${hardware} (${cpuBrand})`);
  console.log(`Memory:        ${totalMemGb} GB Unified Memory`);
  console.log(`OS:            ${osName} ${osVersion}`);
  console.log(`Node:          ${nodeVersion}`);
  console.log(`Date:          ${new Date().toISOString()}\n`);

  // Prepare sample buffers
  const sampleData = SAMPLES.map((s) => {
    const buf = fs.readFileSync(s.file);
    return {
      ...s,
      base64: buf.toString('base64'),
      sizeBytes: buf.length,
    };
  });

  const benchmarkResults = {
    metadata: {
      date: new Date().toISOString(),
      hardware: `${hardware} (${cpuBrand}, ${totalMemGb}GB RAM)`,
      os: `${osName} ${osVersion}`,
      nodeVersion,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      model: MODEL,
      samplesCount: SAMPLES.length,
    },
    baseline: {
      cold: [],
      warm: [],
    },
    keepAliveExperiment: {
      defaultTtl: [],
      tenMinutesTtl: [],
    },
    numPredictExperiment: {},
    promptAudit: {},
    imageResolutionExperiment: {},
    structuredOutputExperiment: {},
  };

  // ==========================================
  // PHASE 2 & 3: TRUE BASELINE (COLD vs WARM)
  // ==========================================
  console.log('--- PHASE 2: Establishing True Baseline (Cold vs Warm across 5 specimens) ---');

  for (const sample of sampleData) {
    console.log(`\nSpecimen: ${sample.label} (${Math.round(sample.sizeBytes / 1024)} KB)`);

    // 1. Cold Run: Unload model first, then request with keep_alive='10m'
    process.stdout.write('  [Cold Run] Unloading model... ');
    await unloadModel();
    process.stdout.write('Running inference... ');
    const coldResult = await executeChat({ base64Image: sample.base64, keepAlive: '10m' });
    console.log(`Total: ${coldResult.totalDurationMs}ms (Load: ${coldResult.loadDurationMs}ms, Prompt: ${coldResult.promptEvalDurationMs}ms, Gen: ${coldResult.generationDurationMs}ms)`);
    benchmarkResults.baseline.cold.push({
      sampleId: sample.id,
      ...coldResult,
    });

    // 2. Warm Run: Model already loaded
    process.stdout.write('  [Warm Run] Running inference on resident model... ');
    const warmResult = await executeChat({ base64Image: sample.base64, keepAlive: '10m' });
    console.log(`Total: ${warmResult.totalDurationMs}ms (Load: ${warmResult.loadDurationMs}ms, Prompt: ${warmResult.promptEvalDurationMs}ms, Gen: ${warmResult.generationDurationMs}ms)`);
    benchmarkResults.baseline.warm.push({
      sampleId: sample.id,
      ...warmResult,
    });
  }

  // Aggregate Baseline Stats
  const coldTotals = benchmarkResults.baseline.cold.map((r) => r.totalDurationMs);
  const coldLoads = benchmarkResults.baseline.cold.map((r) => r.loadDurationMs);
  const coldPromptEvals = benchmarkResults.baseline.cold.map((r) => r.promptEvalDurationMs);
  const coldGens = benchmarkResults.baseline.cold.map((r) => r.generationDurationMs);

  const warmTotals = benchmarkResults.baseline.warm.map((r) => r.totalDurationMs);
  const warmLoads = benchmarkResults.baseline.warm.map((r) => r.loadDurationMs);
  const warmPromptEvals = benchmarkResults.baseline.warm.map((r) => r.promptEvalDurationMs);
  const warmGens = benchmarkResults.baseline.warm.map((r) => r.generationDurationMs);

  benchmarkResults.baseline.summary = {
    cold: {
      total: calculateStats(coldTotals),
      load: calculateStats(coldLoads),
      promptEval: calculateStats(coldPromptEvals),
      generation: calculateStats(coldGens),
    },
    warm: {
      total: calculateStats(warmTotals),
      load: calculateStats(warmLoads),
      promptEval: calculateStats(warmPromptEvals),
      generation: calculateStats(warmGens),
    },
  };

  console.log('\n=== BASELINE SUMMARY (p50 / Median) ===');
  console.log(`Cold Total:       ${benchmarkResults.baseline.summary.cold.total.median} ms (Load: ${benchmarkResults.baseline.summary.cold.load.median} ms, Prompt: ${benchmarkResults.baseline.summary.cold.promptEval.median} ms, Gen: ${benchmarkResults.baseline.summary.cold.generation.median} ms)`);
  console.log(`Warm Total:       ${benchmarkResults.baseline.summary.warm.total.median} ms (Load: ${benchmarkResults.baseline.summary.warm.load.median} ms, Prompt: ${benchmarkResults.baseline.summary.warm.promptEval.median} ms, Gen: ${benchmarkResults.baseline.summary.warm.generation.median} ms)`);

  // ==========================================
  // PHASE 4: KEEP_ALIVE EXPERIMENT
  // ==========================================
  console.log('\n--- PHASE 4: keep_alive Experiment ---');
  console.log('Testing TTL persistence with warm model across sequential requests...');
  
  // Test sequential warm call with keep_alive='10m'
  const keepAliveTestSample = sampleData[0]; // Oak leaf
  const keepAliveRuns = [];
  for (let i = 1; i <= 2; i++) {
    process.stdout.write(`  Run ${i} with keep_alive='10m'... `);
    const res = await executeChat({ base64Image: keepAliveTestSample.base64, keepAlive: '10m' });
    console.log(`${res.totalDurationMs}ms (load: ${res.loadDurationMs}ms)`);
    keepAliveRuns.push(res);
  }
  benchmarkResults.keepAliveExperiment.runs = keepAliveRuns;
  benchmarkResults.keepAliveExperiment.stats = calculateStats(keepAliveRuns.map((r) => r.totalDurationMs));

  // ==========================================
  // PHASE 5: OUTPUT TOKEN (num_predict) EXPERIMENT
  // ==========================================
  console.log('\n--- PHASE 5: Output Token (num_predict) Experiment ---');
  const tokenLimits = [256, 192, 128];
  
  for (const limit of tokenLimits) {
    console.log(`Testing num_predict = ${limit}...`);
    const limitRuns = [];
    for (const sample of sampleData.slice(0, 2)) { // test on 2 representative specimens (leaf, bark)
      const res = await executeChat({
        base64Image: sample.base64,
        options: { temperature: 0.2, top_p: 0.9, num_predict: limit },
        keepAlive: '10m',
      });
      console.log(`  [${sample.id}] tokens: ${res.outputTokens}, duration: ${res.totalDurationMs}ms, valid: ${res.isValid}, rescue: ${res.usedRescue}`);
      limitRuns.push({
        sampleId: sample.id,
        limit,
        ...res,
      });
    }
    benchmarkResults.numPredictExperiment[`limit_${limit}`] = {
      runs: limitRuns,
      validRate: limitRuns.filter((r) => r.isValid).length / limitRuns.length,
      rescueRate: limitRuns.filter((r) => r.usedRescue).length / limitRuns.length,
      avgTokens: Math.round(limitRuns.reduce((s, r) => s + r.outputTokens, 0) / limitRuns.length),
      stats: calculateStats(limitRuns.map((r) => r.totalDurationMs)),
    };
  }

  // ==========================================
  // PHASE 6: PROMPT TOKEN AUDIT
  // ==========================================
  console.log('\n--- PHASE 6: Prompt Token Audit ---');
  console.log('Comparing Baseline Prompt (with full JSON mock in text) vs Compact Prompt...');

  const promptAuditSample = sampleData[0];
  process.stdout.write('  Running baseline prompt... ');
  const baselinePromptRes = await executeChat({
    base64Image: promptAuditSample.base64,
    systemPrompt: BASELINE_SYSTEM_PROMPT,
    keepAlive: '10m',
  });
  console.log(`promptTokens: ${baselinePromptRes.promptTokens}, evalDuration: ${baselinePromptRes.promptEvalDurationMs}ms`);

  process.stdout.write('  Running compact prompt... ');
  const compactPromptRes = await executeChat({
    base64Image: promptAuditSample.base64,
    systemPrompt: COMPACT_SYSTEM_PROMPT,
    keepAlive: '10m',
  });
  console.log(`promptTokens: ${compactPromptRes.promptTokens}, evalDuration: ${compactPromptRes.promptEvalDurationMs}ms`);

  benchmarkResults.promptAudit = {
    baseline: {
      promptTokens: baselinePromptRes.promptTokens,
      promptEvalDurationMs: baselinePromptRes.promptEvalDurationMs,
      totalDurationMs: baselinePromptRes.totalDurationMs,
      isValid: baselinePromptRes.isValid,
    },
    compact: {
      promptTokens: compactPromptRes.promptTokens,
      promptEvalDurationMs: compactPromptRes.promptEvalDurationMs,
      totalDurationMs: compactPromptRes.totalDurationMs,
      isValid: compactPromptRes.isValid,
    },
    tokenReduction: baselinePromptRes.promptTokens - compactPromptRes.promptTokens,
    percentReduction: Math.round(((baselinePromptRes.promptTokens - compactPromptRes.promptTokens) / baselinePromptRes.promptTokens) * 100),
  };
  console.log(`Prompt token reduction: ${benchmarkResults.promptAudit.tokenReduction} tokens (-${benchmarkResults.promptAudit.percentReduction}%)`);

  // ==========================================
  // PHASE 7: IMAGE RESOLUTION EXPERIMENT
  // ==========================================
  console.log('\n--- PHASE 7: Image Resolution Experiment ---');
  const tempVariantDir = 'docs/benchmark-results/temp-variants';
  if (!fs.existsSync(tempVariantDir)) fs.mkdirSync(tempVariantDir, { recursive: true });

  const testImageSrc = sampleData[0].file; // Oak leaf
  const resCandidates = [
    { label: '480px (lower)', maxDim: 480, path: `${tempVariantDir}/oak_480.jpg` },
    { label: '640px (current baseline)', maxDim: 640, path: `${tempVariantDir}/oak_640.jpg` },
    { label: '800px (higher)', maxDim: 800, path: `${tempVariantDir}/oak_800.jpg` },
  ];

  for (const cand of resCandidates) {
    // Generate variant using macOS sips
    execSync(`sips -Z ${cand.maxDim} "${testImageSrc}" --out "${cand.path}" >/dev/null 2>&1`);
    const varBuf = fs.readFileSync(cand.path);
    const base64 = varBuf.toString('base64');
    
    process.stdout.write(`  Testing ${cand.label} (${Math.round(varBuf.length / 1024)} KB)... `);
    const res = await executeChat({
      base64Image: base64,
      keepAlive: '10m',
    });
    console.log(`${res.totalDurationMs}ms (promptTokens: ${res.promptTokens}, evalDuration: ${res.promptEvalDurationMs}ms)`);
    
    benchmarkResults.imageResolutionExperiment[cand.label] = {
      maxDim: cand.maxDim,
      sizeBytes: varBuf.length,
      promptTokens: res.promptTokens,
      promptEvalDurationMs: res.promptEvalDurationMs,
      totalDurationMs: res.totalDurationMs,
      identification: res.parsedContent?.identification,
      confidence: res.parsedContent?.confidence,
      evidence: res.parsedContent?.evidence,
      isValid: res.isValid,
    };
  }

  // Clean up temp variants
  try {
    fs.rmSync(tempVariantDir, { recursive: true, force: true });
  } catch {}

  // ==========================================
  // PHASE 8: STRUCTURED OUTPUT EXPERIMENT
  // ==========================================
  console.log('\n--- PHASE 8: Structured Output Experiment (JSON Mode vs JSON Schema) ---');
  const structTestSample = sampleData[1]; // Pine Bark & Lichen

  process.stdout.write('  [JSON Mode: format="json"] Running... ');
  const jsonModeRes = await executeChat({
    base64Image: structTestSample.base64,
    format: 'json',
    keepAlive: '10m',
  });
  console.log(`${jsonModeRes.totalDurationMs}ms (gen: ${jsonModeRes.generationDurationMs}ms, valid: ${jsonModeRes.isValid}, rescue: ${jsonModeRes.usedRescue})`);

  process.stdout.write('  [JSON Schema: format=<SchemaObject>] Running... ');
  const schemaModeRes = await executeChat({
    base64Image: structTestSample.base64,
    format: JSON_SCHEMA,
    keepAlive: '10m',
  });
  console.log(`${schemaModeRes.totalDurationMs}ms (gen: ${schemaModeRes.generationDurationMs}ms, valid: ${schemaModeRes.isValid}, rescue: ${schemaModeRes.usedRescue})`);

  benchmarkResults.structuredOutputExperiment = {
    jsonMode: {
      totalDurationMs: jsonModeRes.totalDurationMs,
      generationDurationMs: jsonModeRes.generationDurationMs,
      outputTokens: jsonModeRes.outputTokens,
      isValid: jsonModeRes.isValid,
      usedRescue: jsonModeRes.usedRescue,
    },
    jsonSchemaMode: {
      totalDurationMs: schemaModeRes.totalDurationMs,
      generationDurationMs: schemaModeRes.generationDurationMs,
      outputTokens: schemaModeRes.outputTokens,
      isValid: schemaModeRes.isValid,
      usedRescue: schemaModeRes.usedRescue,
    },
  };

  // Write results JSON
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(benchmarkResults, null, 2), 'utf8');
  console.log(`\n✓ Full benchmark dataset saved to: ${RESULTS_FILE}`);
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('\n[FATAL] Benchmark crashed:', err);
  process.exit(1);
});
