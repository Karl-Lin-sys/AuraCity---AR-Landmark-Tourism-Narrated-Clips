import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, Compass, MapPin, Crosshair, ArrowRight, ShieldCheck } from 'lucide-react';
import { SAMPLE_LANDMARKS, SampleLandmarkPhoto, urlToBase64 } from '../utils/sampleLandmarks';
import { soundEngine } from '../utils/audio';

interface CameraViewfinderProps {
  onCapture: (base64Image: string, userLocation?: { lat: number; lng: number }) => void;
  isAnalyzing: boolean;
  analysisStage: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCapture,
  isAnalyzing,
  analysisStage,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bearing, setBearing] = useState<number>(315);
  const [selectedSample, setSelectedSample] = useState<SampleLandmarkPhoto | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Initialize Geolocation & Orientation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
          });
        },
        () => {
          // Default to Paris Champ de Mars if permission denied
          setUserLocation({ lat: 48.8584, lng: 2.2945 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setUserLocation({ lat: 48.8584, lng: 2.2945 });
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setBearing(Math.round(e.alpha));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Camera stream starter
  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not available on this device/browser. You can still upload any city photo or select from curated world landmarks below.');
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture photo from live camera
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    soundEngine.playShutterSound();
    setPreviewImage(dataUrl);
    onCapture(dataUrl, userLocation || undefined);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playLockChime();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
      onCapture(dataUrl, userLocation || undefined);
    };
    reader.readAsDataURL(file);
  };

  // Handle sample selection
  const handleSelectSample = async (sample: SampleLandmarkPhoto) => {
    setSelectedSample(sample);
    setPreviewImage(sample.imageUrl);
    soundEngine.playLockChime();
    try {
      const base64 = await urlToBase64(sample.imageUrl);
      onCapture(base64, { lat: sample.lat, lng: sample.lng });
    } catch (e) {
      // If CORS on direct fetch, send the remote URL or fallback
      onCapture(sample.imageUrl, { lat: sample.lat, lng: sample.lng });
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewfinder Box */}
      <div className="relative aspect-[4/3] md:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl flex items-center justify-center">
        {/* Video stream or preview */}
        {previewImage ? (
          <img
            src={previewImage}
            alt="Captured city landmark"
            className="w-full h-full object-cover transition-transform duration-700"
          />
        ) : streamActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-4 text-amber-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">City Viewfinder Ready</h3>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Aim at any famous building, monument, or bridge. You can use your camera, upload a photo, or test with world landmark presets below.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition border border-neutral-700"
              >
                Enable Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition border border-amber-500/30"
              >
                Upload Photo
              </button>
            </div>
          </div>
        )}

        {/* AR Viewfinder Overlays & Reticles */}
        <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between">
          {/* Top Bar Telemetry */}
          <div className="flex items-center justify-between">
            <div className="hud-glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-mono text-neutral-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AR OPTICS ACTIVE</span>
              <span className="text-neutral-500">|</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Compass className="w-3 h-3" /> {bearing}° NW
              </span>
            </div>

            <div className="hud-glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-mono text-neutral-300">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>
                {userLocation ? `${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E` : 'GPS ACQUIRING'}
              </span>
              <span className="text-neutral-500">|</span>
              <span className="text-neutral-400">SEARCH GROUNDED</span>
            </div>
          </div>

          {/* Central Target Reticle */}
          <div className="relative self-center flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400/70" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400/70" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400/70" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400/70" />

            {/* Center crosshair */}
            <div className="w-8 h-8 rounded-full border border-dashed border-cyan-400/50 flex items-center justify-center animate-pulse-ring">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            </div>

            {/* Horizon grid ticks */}
            <div className="absolute left-[-16px] w-3 h-[1px] bg-neutral-500/50" />
            <div className="absolute right-[-16px] w-3 h-[1px] bg-neutral-500/50" />
          </div>

          {/* Bottom Bar Info */}
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span className="hud-glass px-2.5 py-1 rounded">50mm F/1.8 · ISO 100</span>
            <span className="hud-glass px-2.5 py-1 rounded text-cyan-300">AI ARCHITECTURAL RECOGNITION</span>
          </div>
        </div>

        {/* Scanline Animation while analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
              <div className="w-24 h-24 rounded-full border border-amber-400/40 border-t-amber-400 animate-spin" />
              <div className="absolute w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
                <Crosshair className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <p className="text-xs uppercase font-mono tracking-widest text-amber-400 font-medium">
                {analysisStage || 'Recognizing Landmark...'}
              </p>
              <h4 className="text-lg font-bold text-white tracking-tight">
                Querying Google Search Grounding
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Verifying historical records, architectural style, spatial hotspots, and compiling an AR-narrated clip.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Capture Controls */}
      <div className="flex items-center justify-center gap-6">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          title="Upload image from device"
        >
          <Upload className="w-4 h-4 text-neutral-400" />
          <span>Upload Photo</span>
        </button>

        {/* Big Shutter Trigger Button */}
        <button
          type="button"
          onClick={handleTakeSnapshot}
          disabled={isAnalyzing || (!streamActive && !previewImage)}
          className="relative group p-1.5 rounded-full border-2 border-amber-400/50 hover:border-amber-400 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 active:scale-95 transition-all">
            <Camera className="w-7 h-7 text-neutral-950" />
          </div>
        </button>

        {/* Flip Camera */}
        <button
          type="button"
          onClick={toggleCameraFacing}
          disabled={isAnalyzing || !streamActive}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          title="Switch front/back camera"
        >
          <RefreshCw className="w-4 h-4 text-neutral-400" />
          <span>Flip Cam</span>
        </button>
      </div>

      {/* Preset Landmark City Photos (Instant Test Carousel) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Test Landmarks</span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-normal text-neutral-500">Tap to identify & tour</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {SAMPLE_LANDMARKS.map((landmark) => {
            const isCur = selectedSample?.id === landmark.id;
            return (
              <button
                key={landmark.id}
                type="button"
                onClick={() => handleSelectSample(landmark)}
                disabled={isAnalyzing}
                className={`group relative aspect-[4/3] rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                  isCur
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/20'
                    : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <img
                  src={landmark.thumbnail}
                  alt={landmark.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent p-2 flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {landmark.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 line-clamp-1">
                    {landmark.city}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
