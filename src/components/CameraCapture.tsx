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

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isAnalyzing) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isAnalyzing]);

  const getAnalysisStageInfo = (seconds: number) => {
    if (seconds < 5) {
      return {
        title: 'Encoding visual specimen...',
        detail: 'Formatting vision tiles for local neural network inference.',
        percent: Math.min(25, 8 + seconds * 4),
      };
    } else if (seconds < 16) {
      return {
        title: 'Gemma 3 analyzing visual traits...',
        detail: 'Examining leaf margins, botanical structures, or stone textures.',
        percent: Math.min(55, 25 + (seconds - 5) * 2.7),
      };
    } else if (seconds < 32) {
      return {
        title: 'Synthesizing Field Mission Contract...',
        detail: 'Compiling non-destructive outdoor steps and concrete success criteria.',
        percent: Math.min(85, 55 + (seconds - 16) * 1.8),
      };
    } else {
      return {
        title: 'Evaluating safety gates & quality rubric...',
        detail: 'Validating wilderness hazard boundaries and computing 5-dimension score.',
        percent: Math.min(96, 85 + (seconds - 32) * 0.5),
      };
    }
  };

  // Stop media stream tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  // Helper to attach stream to the video element
  const attachStreamToVideo = useCallback((stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((err) => {
          console.warn('Video playback interrupted on metadata load:', err);
        });
      };
      videoRef.current.play().catch((err) => {
        console.warn('Video initial play interrupted:', err);
      });
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
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic video constraint (critical for desktops, FaceTime HD cameras, or external webcams)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        attachStreamToVideo(stream);

        setHasCameraPermission(true);
        setCameraError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        const errorMsg = err instanceof Error ? err.name : 'Unknown';
        if (errorMsg === 'NotAllowedError' || errorMsg === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. You can still upload outdoor photos or use sample specimens.');
        } else if (errorMsg === 'NotFoundError' || errorMsg === 'DevicesNotFoundError') {
          setCameraError('No camera detected on this device. You can upload an outdoor photo or test with sample specimens.');
        } else {
          setCameraError('Could not initialize camera preview. Please use file upload fallback or sample specimens.');
        }
        setHasCameraPermission(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [cameraSession, stopStream, attachStreamToVideo]);

  // Synchronize stream with videoRef if video re-renders or mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current && !capturedImage) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [hasCameraPermission, cameraSession, capturedImage]);

  const SAMPLE_OBSERVATIONS = [
    { id: 'oak_leaf', label: 'Oak Leaf', path: '/samples/oak_leaf_optimized.jpg', emoji: '🍃' },
    { id: 'tree_bark', label: 'Tree Bark', path: '/samples/tree_bark_optimized.jpg', emoji: '🌲' },
    { id: 'river_stones', label: 'River Stones', path: '/samples/river_stones_optimized.jpg', emoji: '🪨' },
    { id: 'wildflower', label: 'Wildflower', path: '/samples/wildflower_optimized.jpg', emoji: '🌼' },
  ];

  /**
   * Compresses image using HTML5 Canvas to 512px max dimension at 0.80 JPEG quality.
   * Drastically reduces local memory usage and accelerates SigLIP vision encoding while preserving field details.
   */
  const compressImage = (source: HTMLVideoElement | HTMLImageElement): string => {
    const width = 'videoWidth' in source ? source.videoWidth : source.naturalWidth;
    const height = 'videoHeight' in source ? source.videoHeight : source.naturalHeight;

    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error('Image source has invalid dimensions.');
    }

    const canvas = document.createElement('canvas');
    const maxDim = 512;
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

  // Capture current frame from live video feed
  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) {
      setCameraError('Camera preview element is not ready.');
      return;
    }

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;

    if (!vWidth || !vHeight || vWidth <= 0 || vHeight <= 0) {
      setCameraError('Camera stream is still starting up. Please wait a moment and tap capture again.');
      return;
    }

    try {
      const compressedData = compressImage(video);
      setCapturedImage(compressedData);
      setCameraError(null);
      stopStream();
    } catch (err: unknown) {
      console.error('Frame capture failure:', err);
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
    <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* Viewfinder / Captured preview area */}
      <div className="relative aspect-4/3 w-full bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center border border-black/10">
        {/* Live Video Element - Always rendered so videoRef is immediately available */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            capturedImage ? 'hidden' : hasCameraPermission ? 'block' : 'hidden'
          }`}
        />

        {/* Captured Image Preview */}
        {capturedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Outdoor observation preview"
            className="w-full h-full object-cover animate-in fade-in duration-200"
          />
        )}

        {/* Loading / Starting Camera State */}
        {!capturedImage && hasCameraPermission === null && (
          <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center animate-pulse">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Starting Viewfinder...</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Requesting local camera access for live field framing.
            </p>
          </div>
        )}

        {/* Camera Inactive / Denied State */}
        {!capturedImage && hasCameraPermission === false && (
          <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Camera Inactive</h4>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              {cameraError || 'Allow camera access in your browser or upload an outdoor photo from your device.'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-white text-stone-900 hover:bg-stone-100 flex items-center gap-2 shadow-sm cursor-pointer"
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

      {/* Inline Camera Notice/Error */}
      {cameraError && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCameraError(null)}
            className="text-[11px] font-bold text-amber-800 hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-4 flex flex-col gap-3">
        {capturedImage ? (
          isAnalyzing ? (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#131B15] border border-emerald-800/60 text-white space-y-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-sans">
                    Local Gemma 3 4B Active
                  </span>
                </div>
                <span className="font-mono text-xs text-stone-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  ⏱ {elapsedSeconds}s / ~35s
                </span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white mb-0.5">
                  {getAnalysisStageInfo(elapsedSeconds).title}
                </h4>
                <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                  {getAnalysisStageInfo(elapsedSeconds).detail}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getAnalysisStageInfo(elapsedSeconds).percent}%` }}
                />
              </div>

              <div className="pt-0.5 flex items-center gap-1.5 text-[10px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Running 100% on this machine via Ollama. No cloud upload.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs border border-border-strong text-foreground hover:bg-surface-muted flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={() => onCapture(capturedImage)}
                className="flex-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-[#1A3324] hover:bg-[#234230] text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze with Local AI</span>
              </button>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3.5 px-4 rounded-xl font-semibold text-xs border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Upload existing outdoor photo"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Image</span>
            </button>

            <button
              type="button"
              onClick={handleSnap}
              disabled={!hasCameraPermission}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-[#1A3324] hover:bg-[#234230] text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-40 cursor-pointer"
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
