'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Compass, Sparkles, Navigation, Info } from 'lucide-react';
import type { HealthCheckResponse } from '@/types/trail';

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

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
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/explore', label: 'Explore', icon: Sparkles },
    { href: '/session', label: 'Session', icon: Navigation },
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-moss text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
            🌲
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-foreground leading-none">
              TrailLens
            </span>
            <span className="text-[11px] text-rock font-medium mt-0.5">
              Look beyond the screen
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-moss-light text-moss-dark font-semibold'
                    : 'text-rock hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Local AI status pill */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border-subtle">
          {checking ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-muted text-rock">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Probing Ollama...
            </span>
          ) : health?.status === 'ok' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title={`Ollama running locally with ${health.configuredModel}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              LOCAL AI ACTIVE ({health.configuredModel})
            </span>
          ) : health?.ollamaConnected ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
              title={`Ollama connected, but model ${health?.configuredModel} is still downloading`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              MODEL LOADING ({health?.configuredModel})
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200"
              title="Ollama is not reachable on localhost:11434"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              OLLAMA OFFLINE
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
