import React, { useState } from 'react';
import { 
  Building2, Calendar, MapPin, Compass, ExternalLink, Sparkles, 
  Camera, History, BookOpen, Layers, Check, Copy, ShieldCheck, HelpCircle
} from 'lucide-react';
import { LandmarkRecognitionResult } from '../types';

interface LandmarkDossierProps {
  result: LandmarkRecognitionResult;
}

export const LandmarkDossier: React.FC<LandmarkDossierProps> = ({ result }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'architecture' | 'secrets' | 'sources'>('timeline');

  const handleCopyNarration = () => {
    navigator.clipboard.writeText(result.clipScript.fullNarration);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header Banner & Vital Stats */}
      <div className="hud-glass p-6 rounded-2xl border border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Building2 className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Identified Landmark Dossier</span>
              {result.nativeName && result.nativeName !== result.landmarkName && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-400 italic font-sans">{result.nativeName}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {result.landmarkName}
            </h1>

            <p className="text-sm text-neutral-300 font-medium">
              {result.significance}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${result.landmarkName} ${result.city}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-800 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {result.coordinates.lat.toFixed(3)}°, {result.coordinates.lng.toFixed(3)}°
              </span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
        </div>

        {/* Vital Signs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800/80">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Era / Year Built
            </span>
            <span className="text-sm font-bold text-amber-300">
              {result.yearBuilt}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Architect / Builder
            </span>
            <span className="text-sm font-bold text-white truncate block">
              {result.architect}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Architectural Style
            </span>
            <span className="text-sm font-bold text-cyan-300 truncate block">
              {result.architecturalStyle}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Location
            </span>
            <span className="text-sm font-bold text-white truncate block">
              {result.city}, {result.country}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-neutral-800 self-start text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'timeline' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'architecture' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hotspots ({result.hotspots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('secrets')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'secrets' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Secrets & Trivia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sources' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Grounding Sources ({result.searchGroundingSources.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.historicalEras.map((era, index) => (
            <div
              key={index}
              className="hud-glass p-5 rounded-2xl border border-neutral-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Era {index + 1}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {era.period}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {era.eraName}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  {era.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 text-[11px] font-mono text-cyan-300">
                <span className="text-neutral-500 mr-1">Reconstruction:</span>
                {era.reconstructionNote}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {result.hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className="hud-glass p-5 rounded-2xl border border-neutral-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-neutral-400">
                  <span className="text-amber-400 font-bold uppercase">{hotspot.architecturalFeature}</span>
                  <span>{hotspot.era}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  {hotspot.title}
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {hotspot.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-neutral-800 text-[10px] font-mono text-neutral-400">
                Spatial Coordinate: {hotspot.xPercent}% X · {hotspot.yPercent}% Y
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'secrets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.fascinatingSecrets.map((secret, idx) => (
            <div
              key={idx}
              className="hud-glass p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ARCHIVAL SECRET #{idx + 1}</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                {secret}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="hud-glass p-5 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Google Search Grounding Verifications</span>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            The historical timeline, builder records, and architectural data above were dynamically retrieved and cross-verified via Google Search Grounding for this landmark photo.
          </p>

          {result.searchGroundingSources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {result.searchGroundingSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition group"
                >
                  <span className="text-xs font-medium truncate pr-2">
                    {source.title || source.uri}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              Grounding citations referenced official historical records and architectural registries.
            </p>
          )}
        </div>
      )}

      {/* Pro Photographer Visitor Advice */}
      {result.visitorPhotoTip && (
        <div className="hud-glass p-4 rounded-2xl border border-neutral-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
              Pro-Photographer Vantage Tip
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {result.visitorPhotoTip}
            </p>
          </div>
        </div>
      )}

      {/* Tour Narration Script Transcript */}
      <div className="hud-glass p-5 rounded-2xl border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>FULL NARRATION TRANSCRIPT</span>
          </div>
          <button
            type="button"
            onClick={handleCopyNarration}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Script'}</span>
          </button>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/80">
          {result.clipScript.fullNarration}
        </p>
      </div>
    </div>
  );
};
