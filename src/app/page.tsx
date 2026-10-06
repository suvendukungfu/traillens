import Link from 'next/link';
import {
  Compass,
  Sparkles,
  EyeOff,
  Navigation,
  Shield,
  ArrowRight,
  Leaf,
  Footprints,
  Trees,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const loopSteps = [
    {
      num: '01',
      title: 'Step Outdoors',
      description: 'Step into nature with eyes open. Notice foliage, tree bark, stones, or wildlife.',
      icon: Footprints,
    },
    {
      num: '02',
      title: 'Quick Capture',
      description: 'Snap a single photo. Our local Gemma 3 model analyzes it in seconds on your device.',
      icon: Sparkles,
    },
    {
      num: '03',
      title: 'Put Phone Away',
      description: 'Receive an immediate real-world challenge. Slip your phone into your pocket and explore.',
      icon: EyeOff,
    },
    {
      num: '04',
      title: 'Complete Session',
      description: 'Return when finished. Track your outdoor distance and celebrate real time spent outside.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto w-full text-center">
        {/* Hacktoberfest Theme Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-moss-light text-moss-dark border border-emerald-200/60 mb-6">
          <Trees className="w-3.5 h-3.5 text-moss" />
          <span>Hacktoberfest 2026 — Theme: Touch Grass</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground mb-4 leading-tight">
          Look beyond <br className="hidden sm:inline" />
          <span className="text-moss italic font-serif">the screen.</span>
        </h1>

        <p className="text-base sm:text-xl text-rock max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          TrailLens is an outdoor-first AI companion. Powered by local Gemma 3, it analyzes what you observe in nature and generates tangible exploration challenges designed to put your phone away.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-12">
          <Link
            href="/explore"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 py-4 px-7 rounded-2xl font-bold text-base bg-moss hover:bg-moss-dark text-white shadow-md transition-all active:scale-98"
          >
            <Compass className="w-5 h-5" />
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="#how-it-works"
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-sm border border-border-strong text-foreground hover:bg-surface-muted transition-colors"
          >
            <span>How It Works</span>
          </Link>
        </div>

        {/* Local AI Offline Feature Pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-6 rounded-2xl bg-surface border border-border-subtle text-xs text-rock shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>100% Local Inference</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Google Gemma 3 4B Multimodal</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Leaf className="w-4 h-4 text-moss" />
            <span>Zero Cloud Uploads</span>
          </div>
        </div>
      </section>

      {/* Product Loop / How It Works */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 py-12 bg-surface-muted border-t border-b border-border-subtle"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-moss">
              The Field Cycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              Screen as a bridge, not a destination.
            </h2>
            <p className="text-sm text-rock mt-2 max-w-xl mx-auto">
              Technology should rekindle curiosity about the physical world, not steal your attention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loopSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl bg-moss-light text-moss-dark flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold text-rock">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-rock">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Touch Grass Philosophy Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-4xl mx-auto w-full">
        <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Best Use of Gemma
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1 mb-2">
              Why Open-Weight Models Matter Outdoors
            </h3>
            <p className="text-xs sm:text-sm text-rock leading-relaxed mb-4">
              Remote trails, national parks, and botanical preserves often have zero cellular connectivity.
              TrailLens runs Gemma 3 4B completely inside your machine via Ollama. It respects your privacy,
              requires no cloud subscriptions, and remains functional miles away from cell towers.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/about"
                className="text-xs font-bold text-moss hover:underline flex items-center gap-1"
              >
                <span>Read Technical Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
            <Link
              href="/explore"
              className="py-3.5 px-6 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white text-center shadow-sm"
            >
              Open Field Camera
            </Link>
            <Link
              href="/session"
              className="py-3 px-6 rounded-xl font-semibold text-xs border border-border-strong text-foreground hover:bg-surface-muted text-center flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Outdoor Session</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
