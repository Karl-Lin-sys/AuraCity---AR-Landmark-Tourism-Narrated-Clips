import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Layers, Compass, 
  MapPin, Clock, Info, Sparkles, CheckCircle2, ChevronRight, Bookmark
} from 'lucide-react';
import { LandmarkRecognitionResult, LandmarkHotspot, NarrativeClipAct } from '../types';
import { soundEngine } from '../utils/audio';

interface ARClipViewerProps {
  result: LandmarkRecognitionResult;
  imageUrl: string;
  onNewScan: () => void;
  onSaveToPassport?: () => void;
  isSaved?: boolean;
}

export const ARClipViewer: React.FC<ARClipViewerProps> = ({
  result,
  imageUrl,
  onNewScan,
  onSaveToPassport,
  isSaved = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentActIndex, setCurrentActIndex] = useState<number>(0);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0); // 0 to 100
  const [selectedHotspot, setSelectedHotspot] = useState<LandmarkHotspot | null>(null);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'blueprint' | 'sepia' | 'hologram'>('normal');
  const [hudDensity, setHudDensity] = useState<'full' | 'minimal' | 'cinematic'>('full');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioSource, setAudioSource] = useState<'tts' | 'browser' | 'none'>('tts');
  const [activeVoice, setActiveVoice] = useState<string>('Zephyr');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressTimerRef = useRef<any>(null);
  const currentAct = result.clipScript.acts[currentActIndex] || result.clipScript.acts[0];

  // Fetch or trigger narration when act changes or on start
  const playActNarration = async (act: NarrativeClipAct) => {
    if (isMuted) return;

    soundEngine.stopAudio();
    setIsAudioLoading(true);

    try {
      const resp = await fetch('/api/generate-narration-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: act.narration,
          voice: activeVoice,
        }),
      });

      const data = await resp.json();
      setIsAudioLoading(false);

      if (data.success && data.audioBase64) {
        setAudioSource('tts');
        soundEngine.playPcmAudio(data.audioBase64, data.sampleRate || 24000, () => {
          // Audio finished
        });
      } else {
        // Fallback to browser SpeechSynthesis
        setAudioSource('browser');
        soundEngine.speakBrowser(act.narration, activeVoice);
      }
    } catch (err) {
      console.warn('TTS request error, using browser speech fallback:', err);
      setIsAudioLoading(false);
      setAudioSource('browser');
      soundEngine.speakBrowser(act.narration, activeVoice);
    }
  };

  // Playback timer & Act transitions
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      soundEngine.stopAudio();
      return;
    }

    const duration = (currentAct?.durationSec || 8) * 1000;
    const intervalMs = 100;
    const stepPercent = (intervalMs / duration) * 100;

    // Start narration
    playActNarration(currentAct);

    progressTimerRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        const next = prev + stepPercent;
        if (next >= 100) {
          // Advance to next act
          if (currentActIndex < result.clipScript.acts.length - 1) {
            setCurrentActIndex((idx) => idx + 1);
            return 0;
          } else {
            // End of clip loop or pause
            setIsPlaying(false);
            return 100;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      soundEngine.stopAudio();
    };
  }, [isPlaying, currentActIndex, isMuted, activeVoice]);

  const handleTogglePlay = () => {
    if (playbackProgress >= 100 && currentActIndex === result.clipScript.acts.length - 1) {
      // Replay from beginning
      setCurrentActIndex(0);
      setPlaybackProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setCurrentActIndex(0);
    setPlaybackProgress(0);
    setIsPlaying(true);
    soundEngine.playLockChime();
  };

  const handleSelectAct = (index: number) => {
    setCurrentActIndex(index);
    setPlaybackProgress(0);
    setIsPlaying(true);
    soundEngine.playLockChime();
  };

  // Calculate dynamic camera pan/zoom based on current act
  const camera = currentAct?.cameraFocus || { xPercent: 50, yPercent: 50, zoom: 1.15 };
  const cameraTransform = isPlaying || hudDensity === 'cinematic'
    ? `scale(${camera.zoom}) translate(${(50 - camera.xPercent) * 0.4}%, ${(50 - camera.yPercent) * 0.4}%)`
    : 'scale(1) translate(0%, 0%)';

  // CSS Filter styles for Time-Travel Hologram reconstruction
  const getFilterClass = () => {
    switch (activeFilter) {
      case 'blueprint':
        return 'filter invert contrast-125 hue-rotate-180 brightness-90 saturate-200';
      case 'sepia':
        return 'filter sepia contrast-110 brightness-95 saturate-150';
      case 'hologram':
        return 'filter contrast-125 brightness-110 hue-rotate-90 saturate-150';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-5">
      {/* Top Clip Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs uppercase font-mono tracking-wider font-semibold text-amber-300">
            AR NARRATED CLIP · {result.landmarkName}
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-xs text-neutral-400">
            {result.city}, {result.country}
          </span>
        </div>

        {/* View Options & Passport */}
        <div className="flex items-center gap-2">
          {/* Time-Travel Reconstruction Modes */}
          <div className="hud-glass p-1 rounded-xl flex items-center gap-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveFilter('normal')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'normal' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Reality
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('blueprint')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'blueprint' ? 'bg-cyan-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Architectural Structural Blueprint"
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sepia')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'sepia' ? 'bg-amber-700 text-amber-100 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Historic Archive Reconstruction"
            >
              History 1890
            </button>
          </div>

          {/* Save to Travel Journal Button */}
          {onSaveToPassport && (
            <button
              type="button"
              onClick={onSaveToPassport}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 text-neutral-200 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-400' : ''}`} />
              <span>{isSaved ? 'Stamped' : 'Stamp Passport'}</span>
            </button>
          )}

          {/* New Scan */}
          <button
            type="button"
            onClick={onNewScan}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700 transition cursor-pointer"
          >
            New Scan
          </button>
        </div>
      </div>

      {/* Main AR Stage Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl group select-none"
      >
        {/* Landmark Image with dynamic camera pan/zoom */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
          <img
            src={imageUrl}
            alt={result.landmarkName}
            style={{ transform: cameraTransform }}
            className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${getFilterClass()}`}
          />

          {/* Blueprint Grid Overlay if active */}
          {activeFilter === 'blueprint' && (
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(to_right,#06b6d41a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d41a_1px,transparent_1px)] bg-[size:28px_28px]" />
          )}

          {/* Vintage Vignette & Grain if sepia */}
          {activeFilter === 'sepia' && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] opacity-70" />
          )}
        </div>

        {/* AR Spatial Hotspots Overlay */}
        {hudDensity !== 'cinematic' && (
          <div className="absolute inset-0 pointer-events-auto">
            {result.hotspots.map((hotspot) => {
              const isActiveInAct = currentAct?.activeHotspotId === hotspot.id;
              const isSelected = selectedHotspot?.id === hotspot.id;

              return (
                <div
                  key={hotspot.id}
                  style={{
                    left: `${hotspot.xPercent}%`,
                    top: `${hotspot.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-10"
                >
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playLockChime();
                      setSelectedHotspot(isSelected ? null : hotspot);
                    }}
                    className="relative group/pin p-2 cursor-pointer focus:outline-none"
                  >
                    {/* Pulsing beacon radar */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        isActiveInAct || isSelected
                          ? 'border-2 border-amber-400 bg-amber-400/20 scale-125 animate-pulse'
                          : 'border border-cyan-400/60 bg-cyan-400/10 scale-90 group-hover/pin:scale-110'
                      }`}
                    />

                    {/* Central pin core */}
                    <div
                      className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        isActiveInAct || isSelected
                          ? 'bg-amber-400 text-neutral-950 shadow-lg shadow-amber-400/50'
                          : 'bg-cyan-400 text-neutral-950'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                    </div>

                    {/* HUD Label tag */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap">
                      <div
                        className={`hud-glass px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1.5 shadow-lg border transition-opacity ${
                          isActiveInAct || isSelected
                            ? 'opacity-100 border-amber-400/50 text-amber-200'
                            : 'opacity-70 group-hover/pin:opacity-100 border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <span className="font-bold">{hotspot.title}</span>
                        <span className="text-neutral-500">·</span>
                        <span className="text-[9px] text-cyan-300">{hotspot.era}</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Hotspot Inspection Card (Popover) */}
        {selectedHotspot && (
          <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-sm z-30 hud-glass-amber p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-amber-400/40">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  Architectural Hotspot Telemetry
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {selectedHotspot.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHotspot(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-md text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed mb-3">
              {selectedHotspot.description}
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-300/80 pt-2 border-t border-amber-500/20">
              <span>Era: {selectedHotspot.era}</span>
              <span>Feature: {selectedHotspot.architecturalFeature}</span>
            </div>
          </div>
        )}

        {/* HUD Telemetry Frame (Top Right & Left) */}
        {hudDensity === 'full' && (
          <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex flex-col items-end gap-1.5 text-[10px] font-mono text-neutral-400">
            <div className="hud-glass px-2.5 py-1 rounded flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{result.coordinates.lat.toFixed(4)}°N, {result.coordinates.lng.toFixed(4)}°E</span>
            </div>
            <div className="hud-glass px-2.5 py-1 rounded flex items-center gap-1.5 text-amber-300">
              <Clock className="w-3 h-3" />
              <span>BUILT: {result.yearBuilt}</span>
            </div>
            <div className="hud-glass px-2.5 py-1 rounded text-neutral-300">
              STYLE: {result.architecturalStyle}
            </div>
          </div>
        )}

        {/* Act & Subtitle Captions Overlay (Documentary narration clip banner) */}
        <div className="absolute bottom-16 md:bottom-20 left-4 right-4 md:left-8 md:right-8 z-20 pointer-events-none flex flex-col items-center">
          <div className="hud-glass px-5 py-3 rounded-2xl max-w-2xl w-full border border-neutral-700/60 shadow-2xl backdrop-blur-xl text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>{currentAct.actTitle}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">{currentAct.theme}</span>
            </div>
            <p className="text-sm md:text-base font-medium text-white tracking-tight leading-snug drop-shadow-sm">
              "{currentAct.narration}"
            </p>

            {/* Audio Waveform visualization while speaking */}
            {isPlaying && (
              <div className="flex items-center justify-center gap-1 mt-2.5">
                <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
                <span className="w-1 h-6 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                <span className="text-[10px] font-mono text-neutral-400 ml-2">
                  {isAudioLoading ? 'Synthesizing voice...' : `Guide Voice (${activeVoice})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Playback Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent p-3 md:p-4 flex flex-col gap-2 z-20">
          {/* Progress bar across acts */}
          <div className="w-full flex items-center gap-1.5 h-1.5 bg-neutral-800/80 rounded-full overflow-hidden">
            {result.clipScript.acts.map((act, idx) => {
              const isPast = idx < currentActIndex;
              const isCur = idx === currentActIndex;
              const actWidth = 100 / result.clipScript.acts.length;

              return (
                <div
                  key={act.actNumber}
                  style={{ width: `${actWidth}%` }}
                  className="h-full bg-neutral-800 relative rounded-full overflow-hidden"
                >
                  <div
                    style={{
                      width: isPast ? '100%' : isCur ? `${playbackProgress}%` : '0%',
                    }}
                    className="h-full bg-amber-400 transition-all duration-100 ease-linear"
                  />
                </div>
              );
            })}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Left: Play/Pause/Restart & Act Chapter tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center font-bold shadow-md cursor-pointer transition active:scale-95"
                title={isPlaying ? 'Pause Clip' : 'Play Narrated Clip'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center cursor-pointer transition"
                title="Restart Clip"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Act Buttons */}
              <div className="hidden sm:flex items-center gap-1 ml-2">
                {result.clipScript.acts.map((act, idx) => (
                  <button
                    key={act.actNumber}
                    type="button"
                    onClick={() => handleSelectAct(idx)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                      idx === currentActIndex
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Act {act.actNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Audio Voice & HUD View toggles */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {/* Voice Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isMuted) soundEngine.stopAudio();
                  setIsMuted(!isMuted);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  isMuted
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
                title={isMuted ? 'Unmute Audio Narration' : 'Mute Audio Narration'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                <span className="hidden md:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
              </button>

              {/* Guide Voice selector */}
              <select
                value={activeVoice}
                onChange={(e) => setActiveVoice(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg px-2 py-1 text-[11px] focus:outline-none cursor-pointer"
                title="Change Tour Guide Voice"
              >
                <option value="Zephyr">Voice: Zephyr (Classic)</option>
                <option value="Kore">Voice: Kore (Eloquent)</option>
                <option value="Puck">Voice: Puck (Energetic)</option>
                <option value="Charon">Voice: Charon (Deep Historian)</option>
                <option value="Fenrir">Voice: Fenrir (Dynamic)</option>
              </select>

              {/* HUD Mode Switcher */}
              <button
                type="button"
                onClick={() => {
                  const modes: ('full' | 'minimal' | 'cinematic')[] = ['full', 'minimal', 'cinematic'];
                  const next = modes[(modes.indexOf(hudDensity) + 1) % modes.length];
                  setHudDensity(next);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer flex items-center gap-1"
                title="Toggle HUD Display Density"
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span className="capitalize">{hudDensity}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
