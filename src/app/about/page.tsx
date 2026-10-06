import React from 'react';
import {
  ShieldCheck,
  Cpu,
  WifiOff,
  CheckCircle2,
  Clock,
  Sparkles,
  Trees,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-moss-light text-moss-dark mb-3">
          <Trees className="w-3.5 h-3.5 text-moss" />
          <span>Hacktoberfest 2026: Open-Source AI Challenge</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          About TrailLens
        </h1>
        <p className="text-base text-rock mt-2 leading-relaxed">
          Look beyond the screen. An outdoor-first AI companion built around Google Gemma 3 and local Ollama inference.
        </p>
      </div>

      {/* 1. Core Motivation & Philosophy */}
      <section className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-xl font-bold text-foreground">
          The &quot;Touch Grass&quot; Philosophy
        </h2>
        <p className="text-sm text-rock leading-relaxed">
          Most modern mobile and AI applications are engineered to maximize session duration,
          endless scrolling, and screen retention. TrailLens is deliberately engineered for the opposite:
          <strong> the screen is a short intermediary, never the destination</strong>.
        </p>
        <p className="text-sm text-rock leading-relaxed">
          When you observe a leaf, tree bark, stone, or insect, you take one photo. Local AI extracts
          visual clues, provides an observation, and immediately issues a 2-to-5 minute real-world challenge.
          The primary directive is always: <em>put the phone away and look at nature with your eyes</em>.
        </p>
      </section>

      {/* 2. Why Gemma, Ollama, & Local AI */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Why Open-Weight Models & Local Inference
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 text-moss font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Google Gemma 3 4B Multimodal</span>
            </div>
            <p className="text-xs text-rock leading-relaxed">
              Gemma 3 provides open-weight multimodal visual reasoning in a compact 4B parameter footprint.
              It understands complex biological textures and morphological traits while running efficiently on modest consumer hardware.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 text-moss font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>Ollama Local Runtime</span>
            </div>
            <p className="text-xs text-rock leading-relaxed">
              Ollama manages model weights and hardware-accelerated local inference via Apple Metal or CUDA.
              No cloud credentials, rate limits, or closed proprietary API keys are ever required.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy & Ephemeral Data</span>
            </div>
            <p className="text-xs text-rock leading-relaxed">
              Images captured in the field never touch a third-party server. Coordinates from your outdoor walk
              remain strictly in browser memory. There is zero telemetry, tracking, or cloud surveillance.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <WifiOff className="w-4 h-4" />
              <span>True Wilderness Autonomy</span>
            </div>
            <p className="text-xs text-rock leading-relaxed">
              Deep nature reserves and backcountry trails frequently lack cellular data.
              Because Gemma runs locally, observation and challenge generation remain fully operational offline.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Honest Engineering Status: Implemented vs Planned */}
      <section className="bg-surface-muted border border-border-subtle rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-xl font-bold text-foreground">
            Engineering Status & Verification Matrix
          </h2>
          <p className="text-xs text-rock mt-1">
            Distinguishing empirically verified functionality from planned future extensions.
          </p>
        </div>

        {/* Currently Implemented */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Currently Implemented & Verified
          </h3>
          <ul className="space-y-2 text-xs text-foreground">
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-600 font-bold">•</span>
              <span>
                <strong>Next.js App Router Architecture:</strong> Pure TypeScript, strict Zod payload validation, and clean server-client boundaries.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-600 font-bold">•</span>
              <span>
                <strong>Local Multimodal Inference:</strong> Server-side route <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded">POST /api/analyze</code> communicating directly with local Ollama Gemma 3 4B.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-600 font-bold">•</span>
              <span>
                <strong>Field Camera & Client Downscaling:</strong> HTML5 canvas-based image downscaling (640px, 0.80 JPEG quality) preventing client/server OOM.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-600 font-bold">•</span>
              <span>
                <strong>Outdoor Session & Haversine Distance:</strong> Native Geolocation tracking with GPS jitter thresholding, full watcher cleanup, and transparent scoring.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-600 font-bold">•</span>
              <span>
                <strong>Automated Test Coverage:</strong> 18 unit tests passing across distance math, Zod schemas, and watcher lifecycle guarantees.
              </span>
            </li>
          </ul>
        </div>

        {/* Planned / Future Work */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            Planned Future Extensions
          </h3>
          <ul className="space-y-2 text-xs text-rock">
            <li className="flex items-start gap-2 bg-white/40 p-2.5 rounded-xl">
              <span className="text-amber-600 font-bold">•</span>
              <span>
                <strong>Progressive Web App (PWA) Offline Asset Caching:</strong> Service worker caching for app shell so the frontend loads without Wi-Fi if the browser cache clears.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/40 p-2.5 rounded-xl">
              <span className="text-amber-600 font-bold">•</span>
              <span>
                <strong>IndexedDB Field Journal:</strong> Exportable local JSON history of past trail logs across browser sessions.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/40 p-2.5 rounded-xl">
              <span className="text-amber-600 font-bold">•</span>
              <span>
                <strong>Model Fine-Tuning:</strong> Specialized regional flora/fauna LoRA adapters evaluated on biodiversity benchmarks.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Limitations & Safety Guidelines */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 text-xs text-amber-950 space-y-2">
        <h3 className="font-bold text-sm text-amber-900">Important Safety Notice</h3>
        <p className="leading-relaxed">
          TrailLens is a digital field exploration assistant and educational companion.
          <strong> Never use this or any AI model to verify the safety or edibility of wild plants, mushrooms, or berries.</strong>{' '}
          Always follow Leave No Trace principles, maintain distance from wild animals, and respect protected habitats.
        </p>
      </section>
    </div>
  );
}
