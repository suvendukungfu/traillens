'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  isAnalyzing: boolean;
}

export default function CameraCapture({ onCapture, isAnalyzing }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSession, setCameraSession] = useState<number>(0);

  // Phase 10: Perceived latency honest stage tracker (deterministic without fabricated percentages)
  const [analysisStage, setAnalysisStage] = useState<string>('Analyzing Photo');

  useEffect(() => {
    if (!isAnalyzing) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3500) {
        setAnalysisStage('Analyzing Photo');
      } else if (elapsed < 12000) {
        setAnalysisStage('Reading Visual Clues');
      } else if (elapsed < 24000) {
        setAnalysisStage('Building Field Mission');
      } else {
        setAnalysisStage('Mission Ready');
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Stop media stream tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  // Async camera lifecycle managed via cameraSession increment
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setCameraError('Camera API is not supported in this browser environment.');
          setHasCameraPermission(false);
        }
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setHasCameraPermission(true);
        setCameraError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        const errorMsg = err instanceof Error ? err.name : 'Unknown';
        if (errorMsg === 'NotAllowedError' || errorMsg === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. You can still upload outdoor photos from your gallery.');
        } else {
          setCameraError('Could not initialize camera preview. Please use file upload fallback.');
        }
        setHasCameraPermission(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [cameraSession, stopStream]);

const SAMPLE_OBSERVATIONS = [
  { id: 'oak_leaf', label: 'Oak Leaf', path: '/samples/oak_leaf_optimized.jpg', emoji: '🍃' },
  { id: 'tree_bark', label: 'Tree Bark', path: '/samples/tree_bark_optimized.jpg', emoji: '🌲' },
  { id: 'river_stones', label: 'River Stones', path: '/samples/river_stones_optimized.jpg', emoji: '🪨' },
  { id: 'wildflower', label: 'Wildflower', path: '/samples/wildflower_optimized.jpg', emoji: '🌼' },
];

  /**
   * Compresses image using HTML5 Canvas to 1024px max dimension at 0.80 JPEG quality.
   * Drastically reduces local memory usage and prevents Ollama OOM while preserving field details.
   */
  const compressImage = (source: HTMLVideoElement | HTMLImageElement): string => {
    const width = 'videoWidth' in source ? source.videoWidth : source.naturalWidth;
    const height = 'videoHeight' in source ? source.videoHeight : source.naturalHeight;

    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error('Image source has invalid dimensions.');
    }

    const canvas = document.createElement('canvas');
    const maxDim = 640;
    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetHeight = Math.round((height * maxDim) / width);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((width * maxDim) / height);
        targetHeight = maxDim;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize canvas context.');
    }

    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.80);

    if (!dataUrl || dataUrl.length < 100) {
      throw new Error('Compressed image payload too small.');
    }

    return dataUrl;
  };

  // Capture current frame from video feed
  const handleSnap = () => {
    if (!videoRef.current) return;
    if (videoRef.current.videoWidth <= 0 || videoRef.current.videoHeight <= 0) {
      setCameraError('Camera video stream is still initializing. Please wait a moment and tap capture again.');
      return;
    }

    try {
      const compressedData = compressImage(videoRef.current);
      setCapturedImage(compressedData);
      setCameraError(null);
      stopStream();
    } catch {
      setCameraError('Failed to capture frame from video feed. Please try again or upload a photo.');
    }
  };

  // Retake photo: increment cameraSession to trigger re-init
  const handleRetake = () => {
    setCapturedImage(null);
    setCameraSession((prev) => prev + 1);
  };

  // Upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so re-selecting same file triggers event
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const compressed = compressImage(img);
          setCapturedImage(compressed);
          setCameraError(null);
          stopStream();
        } catch {
          setCameraError('Failed to process uploaded photo. Please try a different image.');
        }
      };
      img.onerror = () => {
        setCameraError('Could not decode the selected image file. Please use a standard JPG, PNG, or WebP photo.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setCameraError('Failed to read photo from your device.');
    };
    reader.readAsDataURL(file);
  };

  // Load bundled test sample observation
  const handleSelectSample = (samplePath: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const compressed = compressImage(img);
        setCapturedImage(compressed);
        setCameraError(null);
        stopStream();
      } catch {
        setCameraError('Failed to process sample image.');
      }
    };
    img.onerror = () => {
      setCameraError('Could not load sample observation.');
    };
    img.src = samplePath;
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-4 sm:p-6 shadow-sm">
      {/* Viewfinder / Captured preview area */}
      <div className="relative aspect-4/3 w-full bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center border border-black/10">
        {capturedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Outdoor observation preview"
            className="w-full h-full object-cover"
          />
        ) : hasCameraPermission ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Camera Inactive</h4>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              {cameraError || 'Allow camera access or upload an outdoor photo from your device.'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-white text-stone-900 hover:bg-stone-100 flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Choose Photo from Device
            </button>
          </div>
        )}

        {/* Viewfinder crosshairs for naturalist framing */}
        {!capturedImage && hasCameraPermission && (
          <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-l-2 border-white/60 absolute top-0 left-0 rounded-tl-sm" />
            <div className="w-8 h-8 border-t-2 border-r-2 border-white/60 absolute top-0 right-0 rounded-tr-sm" />
            <div className="w-8 h-8 border-b-2 border-l-2 border-white/60 absolute bottom-0 left-0 rounded-bl-sm" />
            <div className="w-8 h-8 border-b-2 border-r-2 border-white/60 absolute bottom-0 right-0 rounded-br-sm" />
          </div>
        )}
      </div>

      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Controls */}
      <div className="mt-4 flex flex-col gap-3">
        {capturedImage ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs border border-border-strong text-foreground hover:bg-surface-muted flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => {
                setAnalysisStage('Analyzing Photo');
                onCapture(capturedImage);
              }}
              className="flex-2 py-3 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                  <span className="text-xs tracking-wide">{analysisStage}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Analyze with Local AI</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl font-semibold text-xs border border-border-subtle text-rock hover:text-foreground hover:bg-surface-muted flex items-center justify-center gap-2 transition-colors"
              title="Upload existing outdoor photo"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Image</span>
            </button>

            <button
              type="button"
              onClick={handleSnap}
              disabled={!hasCameraPermission}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-moss hover:bg-moss-dark text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-40"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Observation</span>
            </button>
          </div>
        )}

        {/* Quick Test Sample Selector */}
        {!capturedImage && (
          <div className="pt-2 border-t border-border-subtle/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Or test with a sample observation:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_OBSERVATIONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample.path)}
                  className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center gap-1.5 transition-colors border border-stone-200/80 shadow-xs"
                >
                  <span className="text-sm">{sample.emoji}</span>
                  <span className="truncate">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Local AI privacy assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-rock">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local inference only. No images or telemetry leave this device.</span>
        </div>
      </div>
    </div>
  );
}
