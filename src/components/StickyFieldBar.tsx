'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Compass, X } from 'lucide-react';

export default function StickyFieldBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal once scrolled 420px past the hero
      if (window.scrollY > 420) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isDismissed) return null;

  return (
    <aside
      aria-label="Quick field session action"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="bg-[#18211b]/95 text-white backdrop-blur-md border border-white/10 rounded-full px-4 sm:px-6 py-3 shadow-2xl flex items-center justify-between gap-3">
        {/* Left: Indicator & Prompt */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 items-center justify-center shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                FIELD SESSION
              </span>
              <span className="w-1 h-1 rounded-full bg-emerald-400/60 hidden sm:inline-block" />
              <span className="text-xs text-stone-300 truncate hidden md:inline">
                See something interesting on the trail?
              </span>
            </div>
            <span className="text-xs text-stone-200 truncate sm:hidden font-medium">
              Analyze outdoor subject
            </span>
          </div>
        </div>

        {/* Right: Primary Action + Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-stone-900 hover:bg-stone-100 transition-all active:scale-95 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-moss-dark" />
            <span>Analyze Subject</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss field bar"
            className="w-7 h-7 rounded-full text-stone-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
