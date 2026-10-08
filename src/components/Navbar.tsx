'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import type { HealthCheckResponse } from '@/types/trail';

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (!isMounted) return;
        if (res.ok) {
          const data = (await res.json()) as HealthCheckResponse;
          setHealth(data);
        } else {
          setHealth({
            status: 'error',
            ollamaConnected: false,
            modelAvailable: false,
            configuredModel: 'gemma3:4b',
            ollamaBaseUrl: 'http://127.0.0.1:11434',
            availableModels: [],
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        if (!isMounted) return;
        setHealth({
          status: 'error',
          ollamaConnected: false,
          modelAvailable: false,
          configuredModel: 'gemma3:4b',
          ollamaBaseUrl: 'http://127.0.0.1:11434',
          availableModels: [],
          timestamp: new Date().toISOString(),
        });
      } finally {
        if (isMounted) setChecking(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/explore', label: 'EXPLORE' },
    { href: '/#missions', label: 'MISSIONS' },
    { href: '/session', label: 'FIELD JOURNAL' },
    { href: '/about', label: 'ABOUT' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 py-3 shadow-2xs'
            : 'bg-[#FAF8F5]/70 backdrop-blur-xs border-b border-transparent py-5'
        }`}
      >
        <div className="max-w-310 mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Left: Minimal Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-80"
          >
            <span className="text-emerald-800 text-xs tracking-tighter">✦</span>
            <span className="font-semibold text-xs sm:text-sm tracking-[0.24em] text-foreground uppercase">
              TRAILLENS
            </span>
          </Link>

          {/* Center: Editorial Navigation Links (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-8 lg:gap-10"
            aria-label="Editorial primary navigation"
          >
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[11px] tracking-[0.18em] font-medium transition-colors ${
                    isActive
                      ? 'text-moss-dark font-semibold'
                      : 'text-stone-600 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Status & Primary CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Subtle Local AI Status Dot */}
            <div className="hidden lg:flex items-center gap-2 pr-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  checking
                    ? 'bg-amber-400 animate-pulse'
                    : health?.status === 'ok'
                      ? 'bg-emerald-600'
                      : 'bg-stone-400'
                }`}
                title={
                  health?.status === 'ok'
                    ? `Local Gemma 3 4B active on host (${health.configuredModel})`
                    : 'Local Ollama probing'
                }
              />
              <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                {checking
                  ? 'LOCAL AI'
                  : health?.status === 'ok'
                    ? 'GEMMA 3 4B'
                    : 'OFFLINE MODE'}
              </span>
            </div>

            {/* Primary Action Button (Aurelia hospitality pill reinterpreted) */}
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold tracking-wide bg-moss-dark text-white hover:bg-moss transition-all active:scale-95 shadow-xs"
            >
              <span>START EXPLORING</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-9 h-9 rounded-full border border-stone-300 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Editorial Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          className="fixed inset-0 top-16.25 z-30 bg-[#FAF8F5]/98 backdrop-blur-xl md:hidden px-6 py-8 flex flex-col justify-between border-t border-stone-200 animate-in fade-in slide-in-from-top-2"
        >
          <div className="space-y-6">
            <span className="text-[10px] tracking-widest text-stone-400 font-semibold uppercase block">
              Navigation
            </span>
            <nav className="flex flex-col space-y-4">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-serif text-foreground hover:text-moss-dark transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-stone-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === 'ok' ? 'bg-emerald-600' : 'bg-stone-400'
                }`}
              />
              <span className="text-xs text-stone-600 font-mono">
                {health?.status === 'ok'
                  ? 'Gemma 3:4B Local Inference Ready'
                  : 'Ollama Offline / Standby'}
              </span>
            </div>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-moss-dark text-white text-center flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Start Exploring</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
