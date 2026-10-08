'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react';

interface GalleryCard {
  id: string;
  category: string;
  title: string;
  observation: string;
  image: string;
  duration: string;
}

const OBSERVATIONS: GalleryCard[] = [
  {
    id: 'oak-leaf',
    category: 'MORPHOLOGY',
    title: 'Lobes in an Oak Leaf',
    observation: 'Deep sinus indentations optimize solar absorption across shaded forest understories.',
    image: '/samples/oak_leaf_optimized.jpg',
    duration: '120s',
  },
  {
    id: 'tree-bark',
    category: 'SYMBIOSIS',
    title: 'Lichen on Pine Bark',
    observation: 'Slow-growing composite colonies acting as bio-indicators of pristine, unpolluted air.',
    image: '/samples/tree_bark_optimized.jpg',
    duration: '90s',
  },
  {
    id: 'river-stones',
    category: 'MINERALOGY',
    title: 'Quartz in River Stone',
    observation: 'Veins of crystalline quartz polished smooth by centuries of high-velocity alpine currents.',
    image: '/samples/river_stones_optimized.jpg',
    duration: '180s',
  },
  {
    id: 'wildflower',
    category: 'BOTANY',
    title: 'Veins Under Light',
    observation: 'Delicate vascular network channeling capillary fluids through fragile mountain petals.',
    image: '/samples/wildflower_optimized.jpg',
    duration: '120s',
  },
  {
    id: 'pine-cone',
    category: 'MATHEMATICS',
    title: 'Spiral Phyllotaxis',
    observation: 'Opposing golden-ratio spirals protecting conifer seeds until seasonal temperature shifts.',
    image: '/samples/pine_cone_optimized.jpg',
    duration: '60s',
  },
  {
    id: 'canopy-shadow',
    category: 'ILLUMINATION',
    title: 'Shadow Through Canopy',
    observation: 'Transient sunflecks penetrating the canopy layer to trigger bursts of understory growth.',
    image: '/samples/tree_bark_optimized.jpg',
    duration: '150s',
  },
];

export default function FieldDetailGallery() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section id="gallery" aria-label="Field detail gallery" className="py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px w-6 bg-stone-400" />
          <span className="text-[11px] uppercase tracking-widest text-stone-600 font-semibold font-sans">
            Inside the Trail
          </span>
        </div>

        {/* Section Headline & Editorial Prose */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground leading-[1.1]">
              A hundred small <span className="italic font-normal">details.</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:max-w-md">
            <p className="text-sm text-stone-600 leading-relaxed font-sans">
              Lichen rings in fallen pine, leaf lobes under morning sun, and the quiet clarity that always settles better when the screen goes dark.
            </p>

            {/* Scroll Buttons */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label="Scroll gallery left"
                className="w-10 h-10 rounded-full border border-stone-300 hover:border-stone-500 hover:bg-stone-100/60 text-stone-700 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label="Scroll gallery right"
                className="w-10 h-10 rounded-full border border-stone-300 hover:border-stone-500 hover:bg-stone-100/60 text-stone-700 flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Gallery Deck */}
      <div className="w-full pl-4 sm:pl-6 lg:pl-8">
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Naturalist observation cards"
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pr-6 pb-6 focus-visible:ring-1 focus-visible:ring-moss"
        >
          {OBSERVATIONS.map((item, idx) => (
            <Link
              key={item.id}
              href="/explore"
              className="group relative shrink-0 w-72 sm:w-80 aspect-3/4 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 snap-start border border-stone-200/60 shadow-sm transition-all duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
            >
              {/* Background Photography with slow zoom on hover */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 288px, 320px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Scrim overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10" />

              {/* Top metadata tag */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-white/90 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 font-sans">
                  {item.category}
                </span>
                <span className="text-[11px] font-mono text-white/70">
                  0{idx + 1}
                </span>
              </div>

              {/* Bottom Editorial Content */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
                <h3 className="text-xl font-serif text-white font-medium mb-1.5 leading-snug group-hover:text-emerald-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-sans mb-3 font-normal">
                  {item.observation}
                </p>
                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-400" />
                    <span>Investigate</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">{item.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
