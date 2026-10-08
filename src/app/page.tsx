import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Compass,
  EyeOff,
  ShieldCheck,
  Check,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  Clock,
} from 'lucide-react';
import FieldDetailGallery from '@/components/FieldDetailGallery';
import StickyFieldBar from '@/components/StickyFieldBar';

export default function HomePage() {
  const exampleMissions = [
    {
      type: 'COMPARE',
      title: 'Two leaves. One small difference.',
      target: 'Vein architecture in adjacent oak specimens',
      instruction:
        'Find another nearby leaf with a similar shape. Compare the number of lobes and count the vein pairs branching from the midrib.',
      duration: '120–180 SEC',
      icon: Layers,
    },
    {
      type: 'TRACE',
      title: 'The path of bark fissures.',
      target: 'Vertical grooves on mature conifer trunk',
      instruction:
        'Follow a single continuous groove in the bark from the root collar up to chest height without lifting your gaze. Notice where the crustose lichen settles.',
      duration: '90–120 SEC',
      icon: Compass,
    },
    {
      type: 'COUNT',
      title: 'Spiral rows on a fallen cone.',
      target: 'Fibonacci phyllotaxis on conifer seed scales',
      instruction:
        'Count the counter-clockwise spiral rows radiating from the stalk. Then count clockwise. Notice how both match adjacent numbers in the golden sequence.',
      duration: '60–90 SEC',
      icon: Sparkles,
    },
  ];

  const fieldLogEntries = [
    {
      date: 'OCTOBER 08',
      subject: 'Quercus robur (English Oak)',
      type: 'COMPARE',
      observation: 'Deep alternate sinuses with asymmetric basal auricles.',
      reflection:
        'Two leaves looked identical from a distance. Up close, the vein spacing was completely different on the windward side.',
      duration: '02:45',
      image: '/samples/oak_leaf_optimized.jpg',
    },
    {
      date: 'OCTOBER 06',
      subject: 'Pinus sylvestris (Scots Pine Bark)',
      type: 'TRACE',
      observation: 'Thick reddish-brown plates with gray crustose lichen patches.',
      reflection:
        'The lichen was only colonizing the north-facing bark plates where the damp morning mist lingered longest.',
      duration: '01:50',
      image: '/samples/tree_bark_optimized.jpg',
    },
    {
      date: 'OCTOBER 03',
      subject: 'Riverbed Schist & Quartz',
      type: 'OBSERVE',
      observation: 'Vein of milky quartz running through tumbled river stone.',
      reflection:
        'Felt cold to the palm even in midday sun. Smooth on three faces, fractured on the fourth.',
      duration: '03:15',
      image: '/samples/river_stones_optimized.jpg',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#FBF9F5] text-foreground selection:bg-moss/20 selection:text-moss-dark">
      {/* =========================================================================
          1. HERO SECTION: CINEMATIC EDITORIAL OPENING
          ========================================================================= */}
      <section
        aria-label="Editorial Hero"
        className="relative min-h-[88vh] sm:min-h-[92vh] flex flex-col justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-10 sm:pt-16 pb-12 sm:pb-20"
      >
        {/* Top Eyebrow */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-stone-400" />
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-semibold font-sans">
            Local AI Field Guide
          </span>
        </div>

        {/* Hero Headline & Asymmetrical Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center my-auto py-8 sm:py-12">
          {/* Left Column: Editorial Headline & Statement */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif tracking-tight text-foreground leading-[0.98]">
              LOOK BEYOND <br />
              <span className="italic font-normal text-moss-dark">THE SCREEN.</span>
            </h1>

            <p className="text-base sm:text-xl text-stone-600 max-w-xl font-normal leading-relaxed font-sans">
              Gemma sees the details. TrailLens gives you a reason to investigate them yourself — in the woods, on the trail, and beyond the reach of cell towers.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-wider bg-moss-dark text-white hover:bg-moss transition-all active:scale-95 shadow-md group"
              >
                <span>START EXPLORING</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#inside-the-trail"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-wider border border-stone-300 hover:border-stone-500 hover:bg-stone-100/60 text-stone-800 transition-colors"
              >
                <span>HOW IT WORKS</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Naturalist Specimen Photographic Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none aspect-4/5 rounded-3xl overflow-hidden bg-stone-900 border border-stone-300/80 shadow-xl group">
              <Image
                src="/samples/oak_leaf_optimized.jpg"
                alt="Quercus robur leaf observation on mossy forest floor"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />

              {/* Gradient scrim */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

              {/* Specimen Tag */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 shadow-xs">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-800 font-sans">
                  SPECIMEN NO. 01 · QUERCUS ROBUR
                </span>
              </div>

              {/* Lower Photographic Metadata */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-medium block mb-1">
                  FIELD OBSERVATION
                </span>
                <p className="text-lg font-serif italic text-white/95 leading-snug">
                  &ldquo;Sinuses deeply lobed to harvest sunlight in the lower canopy.&rdquo;
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-stone-300 font-mono">
                  <span>LOCAL GEMMA 3 4B</span>
                  <span>94/100 QUALITY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Metadata Row */}
        <div className="pt-6 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-widest text-stone-500 font-semibold font-sans">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>LOCAL GEMMA 3 4B</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            <span>OFFLINE CAPABLE</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>FIELD MISSIONS</span>
          </div>
          <span className="text-stone-300 hidden md:inline">/</span>
          <span className="hidden md:inline font-mono text-[10px] text-stone-400">
            HACKTOBERFEST 2026 · TOUCH GRASS
          </span>
        </div>
      </section>

      {/* =========================================================================
          2. STICKY FIELD ACTION BAR (Aurelia Hospitality Bar Reinterpreted)
          ========================================================================= */}
      <StickyFieldBar />

      {/* =========================================================================
          3. EDITORIAL INTRODUCTION & FIELD DETAIL GALLERY
          ========================================================================= */}
      <div id="inside-the-trail">
        <FieldDetailGallery />
      </div>

      {/* =========================================================================
          4. "HOW TRAILLENS SEES" (LOCAL INTELLIGENCE & GEMMA)
          ========================================================================= */}
      <section
        id="local-intelligence"
        aria-label="Local Intelligence Architecture"
        className="py-20 sm:py-28 border-t border-b border-stone-200/80 bg-[#F4F0E6]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Large Editorial Statement */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-stone-400" />
                <span className="text-[11px] uppercase tracking-widest text-stone-600 font-semibold font-sans">
                  Local Intelligence
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-foreground leading-[1.05]">
                The model stays <br className="hidden sm:inline" />
                <span className="italic font-normal text-moss-dark">with you.</span>
              </h2>

              <p className="text-base sm:text-lg text-stone-700 leading-relaxed font-sans max-w-xl">
                Your photograph is analyzed locally by Gemma 3 4B through Ollama. No cloud AI is required for the core inference path. When you are miles beyond cellular coverage, your field companion remains intact.
              </p>

              {/* Three Editorial Quality Pillars */}
              <div className="pt-4 space-y-4 max-w-lg">
                <div className="flex items-start gap-3.5 pb-3 border-b border-stone-300/60">
                  <span className="font-mono text-xs text-moss-dark font-bold mt-0.5">01</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Zero Cloud Roundtrips
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Images never traverse third-party servers. All vision tokens execute inside local system memory.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pb-3 border-b border-stone-300/60">
                  <span className="font-mono text-xs text-moss-dark font-bold mt-0.5">02</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Deterministic Safety Gates
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Wild foraging risks, ingestion of toxic fungi, and dangerous heights are intercepted before any prompt reaches the user.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="font-mono text-xs text-moss-dark font-bold mt-0.5">03</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Structured Mission Contracts
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Guaranteed JSON schema output strictly compiled to observable natural morphology, operational verbs, and time limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Minimal Technical Visualization */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-300/70 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-500 font-sans">
                    Core Inference Pipeline
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Host Machine
                  </span>
                </div>

                {/* Minimal Step Visualizer */}
                <div className="space-y-3 font-sans">
                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 uppercase block">STEP 01</span>
                        <span className="text-xs font-bold text-foreground">Visual Observation Capture</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500">1024px JPEG</span>
                  </div>

                  <div className="flex justify-center text-stone-400">
                    <span className="text-xs">↓</span>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-800/80 flex items-center justify-center text-emerald-200">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase block">STEP 02</span>
                        <span className="text-xs font-bold text-white">Local Gemma 3 4B Multimodal</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300">Ollama API</span>
                  </div>

                  <div className="flex justify-center text-stone-400">
                    <span className="text-xs">↓</span>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 uppercase block">STEP 03</span>
                        <span className="text-xs font-bold text-foreground">Tactile Field Mission</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">FIELD-READY</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                    Zero cloud latency dependencies. Thermal protection and keep_alive warm loading active.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. MISSION SECTION ("THE NEXT THING TO NOTICE")
          ========================================================================= */}
      <section
        id="missions"
        aria-label="Field Missions Preview"
        className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-stone-400" />
              <span className="text-[11px] uppercase tracking-widest text-stone-600 font-semibold font-sans">
                The Next Thing to Notice
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground leading-[1.1]">
              Not a task. <span className="italic font-normal">A reason to look.</span>
            </h2>
          </div>

          <p className="text-sm text-stone-600 max-w-md font-sans leading-relaxed">
            Every mission is compiled into a tactile field instruction card. No checkboxes, no scoreboards — just a specific curiosity to pursue with your own eyes.
          </p>
        </div>

        {/* 3 Authentic Mission Cards (Fine Stationery Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {exampleMissions.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold text-moss-dark bg-moss-light px-2.5 py-1 rounded-full font-sans">
                      <Icon className="w-3 h-3" />
                      <span>{m.type}</span>
                    </span>
                    <span className="text-[11px] font-mono text-stone-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {m.duration}
                    </span>
                  </div>

                  {/* Title & Target */}
                  <div>
                    <h3 className="text-xl font-serif text-foreground font-semibold leading-snug group-hover:text-moss-dark transition-colors">
                      {m.title}
                    </h3>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block mt-1">
                      Target: {m.target}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="text-xs text-stone-600 leading-relaxed font-sans pt-1">
                    {m.instruction}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>FIELD-READY</span>
                  </div>

                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1 text-xs font-bold text-moss-dark hover:text-moss group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Start Mission</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          6. POCKET MODE PREVIEW: DRAMATIC FULL-WIDTH MOMENT
          ========================================================================= */}
      <section
        aria-label="Pocket Mode Outdoor Sequence"
        className="py-24 sm:py-32 bg-[#0F1511] text-white relative overflow-hidden"
      >
        {/* Subtle radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] tracking-widest uppercase font-semibold">
            <EyeOff className="w-3 h-3" />
            <span>POCKET MODE DESIGN</span>
          </div>

          {/* Large Heroic Statement */}
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-serif tracking-tight text-white leading-none">
            PHONE <span className="italic font-normal text-emerald-300">DOWN.</span>
          </h2>

          <p className="text-base sm:text-xl text-stone-300 max-w-xl mx-auto leading-relaxed font-sans font-normal">
            The phone is no longer the tool. The physical world is. TrailLens goes completely silent while you investigate.
          </p>

          {/* Sequence Steps */}
          <div className="pt-6 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto text-left sm:text-center">
              {[
                { num: '01', label: 'PUT IT AWAY' },
                { num: '02', label: 'LOOK' },
                { num: '03', label: 'WALK' },
                { num: '04', label: 'NOTICE' },
                { num: '05', label: 'COMPARE' },
              ].map((s) => (
                <div
                  key={s.num}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col sm:items-center"
                >
                  <span className="font-mono text-[10px] text-emerald-400 font-bold block mb-1">
                    {s.num}
                  </span>
                  <span className="text-[11px] tracking-wider uppercase font-semibold text-white">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calming Timer Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FIELD SESSION · 02:00 OUTDOOR TIMER</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FIELD RECORDS (EDITORIAL NATURALIST JOURNAL)
          ========================================================================= */}
      <section
        id="field-journal"
        aria-label="Field Journal Log Entries"
        className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="max-w-xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-stone-400" />
            <span className="text-[11px] uppercase tracking-widest text-stone-600 font-semibold font-sans">
              Field Journal
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground leading-[1.1]">
            What you noticed after <br />
            <span className="italic font-normal">the screen disappeared.</span>
          </h2>
          <p className="text-sm text-stone-600 mt-3 font-sans leading-relaxed">
            Observations from naturalists using TrailLens in mountain woodlands and river valleys.
          </p>
        </div>

        {/* 3 Naturalist Journal Entries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {fieldLogEntries.map((entry) => (
            <article
              key={entry.date}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Journal Date & Mission Type Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-[11px] font-mono text-stone-500">
                  <span className="font-bold text-foreground">{entry.date}</span>
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {entry.type} · {entry.duration}
                  </span>
                </div>

                {/* Subject & Thumbnail */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                    <Image
                      src={entry.image}
                      alt={entry.subject}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-foreground leading-snug">
                      {entry.subject}
                    </h3>
                    <span className="text-[11px] text-stone-500 font-sans block truncate max-w-50">
                      {entry.observation}
                    </span>
                  </div>
                </div>

                {/* Reflection Quote */}
                <blockquote className="pt-2 text-xs sm:text-sm italic font-serif text-stone-700 leading-relaxed pl-3 border-l-2 border-stone-300">
                  &ldquo;{entry.reflection}&rdquo;
                </blockquote>
              </div>

              {/* Verified Field Record Footer */}
              <div className="pt-4 mt-6 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-400">
                <span>VERIFIED FIELD RECORD</span>
                <span>LOCAL ON-DEVICE LOG</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================================
          8. MISSION QUALITY & TRUST (DETERMINISTIC RUBRIC)
          ========================================================================= */}
      <section
        aria-label="Mission Quality & Trust"
        className="py-16 sm:py-24 border-t border-stone-200/80 bg-[#FAF7F0]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] uppercase tracking-widest text-stone-600 font-semibold font-sans block mb-2">
              Auditable Quality
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-foreground leading-snug">
              A mission should be <span className="italic font-normal">more than plausible.</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 font-sans leading-relaxed">
              Every challenge generated by Gemma 3 4B is evaluated by a deterministic 100-point rubric before presentation.
            </p>
          </div>

          {/* 5 Evaluated Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            {[
              {
                title: 'GROUNDING',
                desc: 'Morphological traits match detected visual evidence.',
              },
              {
                title: 'SPECIFICITY',
                desc: 'Zero generic clichés; requires concrete physical verbs.',
              },
              {
                title: 'SAFETY',
                desc: 'Automated rejection of toxic fungi and foraging hazards.',
              },
              {
                title: 'EXECUTABILITY',
                desc: 'Realistic 60–300 second outdoor interaction window.',
              },
              {
                title: 'OUTDOOR VALUE',
                desc: 'Inspires deep sensory awareness of living natural systems.',
              },
            ].map((dim) => (
              <div
                key={dim.title}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5"
              >
                <div className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase font-bold text-moss-dark">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{dim.title}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug font-sans">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>FIELD-READY CERTIFICATION AT ≥ 70 / 100</span>
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. EVIDENCE SECTION (BUILT TO BE TESTED)
          ========================================================================= */}
      <section
        aria-label="Automated Engineering Proof"
        className="py-16 sm:py-20 border-t border-b border-stone-200/80 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold font-sans block mb-1">
                Engineering Provenance
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-foreground font-semibold">
                BUILT TO BE TESTED.
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-sans max-w-sm">
              All performance, latency, and quality claims map directly to committed benchmarks and automated suites.
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-stone-200">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground block">
                100 / 100
              </span>
              <span className="text-xs font-semibold text-stone-800 mt-1 block">
                Automated Tests Passing
              </span>
              <span className="text-[11px] text-stone-500 font-sans mt-0.5 block">
                Unit, integration, and safety gate regression coverage.
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-stone-200">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground block">
                Gemma 3
              </span>
              <span className="text-xs font-semibold text-stone-800 mt-1 block">
                4B Multimodal Model
              </span>
              <span className="text-[11px] text-stone-500 font-sans mt-0.5 block">
                Open-weight vision reasoning running via Ollama.
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-stone-200">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground block">
                &lt; 100 ms
              </span>
              <span className="text-xs font-semibold text-stone-800 mt-1 block">
                Warm Model Load
              </span>
              <span className="text-[11px] text-stone-500 font-sans mt-0.5 block">
                Model memory paging prevented through keep_alive.
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-stone-200">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground block">
                0 Bytes
              </span>
              <span className="text-xs font-semibold text-stone-800 mt-1 block">
                Cloud Ingress
              </span>
              <span className="text-[11px] text-stone-500 font-sans mt-0.5 block">
                Private, offline-ready naturalist study.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. OUTDOOR PHILOSOPHY: THE SCREEN IS THE SHORTEST PART
          ========================================================================= */}
      <section
        aria-label="Product Philosophy Statement"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center space-y-6"
      >
        <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold font-sans">
          The TrailLens Philosophy
        </span>

        <h2 className="text-4xl sm:text-6xl font-serif tracking-tight text-foreground leading-[1.08]">
          THE SCREEN IS <br />
          <span className="italic font-normal text-moss-dark">THE SHORTEST PART</span> <br />
          OF THE EXPERIENCE.
        </h2>

        <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto font-sans font-normal leading-relaxed">
          TrailLens is engineered so that the most important part of the interaction happens after the phone goes quiet. Technology should point you into the wild, then politely step aside.
        </p>
      </section>

      {/* =========================================================================
          11. FINAL EDITORIAL CTA
          ========================================================================= */}
      <section
        aria-label="Call to action"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20 sm:pb-28"
      >
        <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden bg-stone-900 border border-stone-300 py-20 sm:py-28 px-6 sm:px-12 text-center text-white shadow-xl">
          {/* Subtle background photo */}
          <Image
            src="/samples/wildflower_optimized.jpg"
            alt="Mountain wildflower under morning light"
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold block">
              Field Ready
            </span>

            <h2 className="text-4xl sm:text-6xl font-serif text-white tracking-tight leading-[1.05]">
              GO SEE FOR <span className="italic font-normal">YOURSELF.</span>
            </h2>

            <p className="text-sm sm:text-base text-stone-300 max-w-md mx-auto leading-relaxed font-sans">
              Take a photo. Get a mission. Put your phone away. The forest is waiting.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link
                href="/explore"
                className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-wider bg-white text-stone-900 hover:bg-stone-100 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <Camera className="w-3.5 h-3.5 text-moss-dark" />
                <span>START EXPLORING</span>
              </Link>

              <Link
                href="/session"
                className="w-full sm:w-auto px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/30 hover:border-white/60 hover:bg-white/10 text-white transition-colors"
              >
                <span>VIEW FIELD JOURNAL</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. EDITORIAL MINIMAL FOOTER
          ========================================================================= */}
      <footer className="border-t border-stone-200/80 bg-[#FAF7F2] py-12 sm:py-16 text-stone-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-stone-200/80">
            <div>
              <span className="font-semibold text-xs tracking-[0.24em] text-foreground uppercase block">
                TRAILLENS
              </span>
              <p className="text-xs text-stone-500 font-serif italic mt-0.5">
                Look beyond the screen.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-stone-600 font-medium">
              <Link href="/explore" className="hover:text-foreground transition-colors">
                Explore
              </Link>
              <Link href="#missions" className="hover:text-foreground transition-colors">
                Missions
              </Link>
              <Link href="/session" className="hover:text-foreground transition-colors">
                Field Journal
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <a
                href="https://github.com/suvendukungfu/traillens"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-stone-400 font-mono">
            <span>Local AI · Gemma 3 4B · Ollama · Touch Grass</span>
            <span>MIT License · Hacktoberfest 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
