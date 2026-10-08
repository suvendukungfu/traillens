'use client';

import React, { useState } from 'react';
import { X, Sparkles, Split, Loader2 } from 'lucide-react';
import type { FieldComparison } from '@/types/trail';

interface FieldTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimenAName: string;
  specimenAImage: string;
  onComparisonComplete: (comparison: FieldComparison) => void;
}

export function FieldTwinModal({
  isOpen,
  onClose,
  specimenAName,
  specimenAImage,
  onComparisonComplete,
}: FieldTwinModalProps) {
  const [specimenBImage, setSpecimenBImage] = useState<string | null>(null);
  const [specimenBName, setSpecimenBName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSpecimenBImage(reader.result);
        if (!specimenBName) {
          setSpecimenBName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunComparison = async () => {
    if (!specimenBImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageA: specimenAImage,
          imageB: specimenBImage,
          subjectA: specimenAName,
          subjectB: specimenBName || 'Second Specimen',
        }),
      });

      if (!res.ok) {
        throw new Error('Comparison failed');
      }

      const data = await res.json();
      if (data.comparison) {
        onComparisonComplete(data.comparison);
        onClose();
      }
    } catch {
      setError('Could not complete local comparison. Ensure Ollama is active.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19211B]/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-xl bg-[#FBF9F5] border border-[#E8E3D8] rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D8]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#B88B2A]/10 text-[#B88B2A]">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#19211B]">
                Field Twin: Comparative Study
              </h3>
              <p className="text-xs text-[#736B5E]">
                Local Gemma multimodal morphology comparison
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E8E3D8] text-[#736B5E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specimen A vs Specimen B grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Specimen A */}
          <div className="p-3 bg-[#F4F0E6] rounded-xl border border-[#E8E3D8] space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#736B5E] block">
              Specimen A (Captured)
            </span>
            <div className="aspect-square rounded-lg overflow-hidden bg-black/10 flex items-center justify-center border border-[#E8E3D8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={specimenAImage}
                alt={specimenAName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="font-serif italic font-semibold text-xs text-[#19211B] truncate">
              {specimenAName}
            </div>
          </div>

          {/* Specimen B */}
          <div className="p-3 bg-[#F4F0E6] rounded-xl border border-[#E8E3D8] space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#736B5E] block">
              Specimen B (Compare)
            </span>
            <div className="aspect-square rounded-lg overflow-hidden bg-white/40 flex flex-col items-center justify-center border border-dashed border-[#B88B2A]/50 relative">
              {specimenBImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={specimenBImage}
                  alt="Specimen B"
                  className="w-full h-full object-cover"
                />
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center">
                  <Sparkles className="w-6 h-6 text-[#B88B2A] mb-1" />
                  <span className="text-[11px] font-medium text-[#19211B]">Upload Photo</span>
                  <span className="text-[9px] text-[#736B5E]">Leaf, stone, or bark</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              placeholder="Specimen B Name (optional)"
              value={specimenBName}
              onChange={(e) => setSpecimenBName(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white rounded border border-[#E8E3D8] text-[#19211B] placeholder-[#A0988A]"
            />
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#E8E3D8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#736B5E] hover:text-[#19211B] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!specimenBImage || isLoading}
            onClick={handleRunComparison}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#1C3D2B] text-[#FBF9F5] text-xs font-semibold shadow-md hover:bg-[#153022] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#B88B2A]" />
                <span>Comparing with Gemma...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#B88B2A]" />
                <span>Generate Field Twin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
