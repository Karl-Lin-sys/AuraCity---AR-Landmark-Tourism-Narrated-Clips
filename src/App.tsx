import React, { useState, useEffect } from 'react';
import { CameraViewfinder } from './components/CameraViewfinder';
import { ARClipViewer } from './components/ARClipViewer';
import { LandmarkDossier } from './components/LandmarkDossier';
import { HeaderNav } from './components/HeaderNav';
import { TravelPassportModal } from './components/TravelPassportModal';
import { LandmarkRecognitionResult, SavedScanItem } from './types';
import { soundEngine } from './utils/audio';
import { AlertCircle, Compass, Camera, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'auracity_saved_passport_scans';

export default function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [result, setResult] = useState<LandmarkRecognitionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Passport scans state
  const [savedScans, setSavedScans] = useState<SavedScanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isPassportOpen, setIsPassportOpen] = useState<boolean>(false);

  // Persist scans
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedScans));
    } catch (e) {
      console.warn('Failed to persist passport to localStorage:', e);
    }
  }, [savedScans]);

  const handleCapture = async (
    base64Image: string,
    userLocation?: { lat: number; lng: number }
  ) => {
    setCurrentImage(base64Image);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Staged progress feedback
    setAnalysisStage('Analyzing architectural geometry & contours...');
    const t1 = setTimeout(() => {
      setAnalysisStage('Querying Google Search Grounding for verified history...');
    }, 1400);
    const t2 = setTimeout(() => {
      setAnalysisStage('Synthesizing 3-Act AR clip & spatial hotspots...');
    }, 3200);

    try {
      const response = await fetch('/api/recognize-landmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          userLocation,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: LandmarkRecognitionResult = await response.json();
      setResult(data);
      soundEngine.playLockChime();

      // Auto-stamp in passport if not already present
      const alreadySaved = savedScans.some(
        (s) => s.result.landmarkName === data.landmarkName
      );
      if (!alreadySaved) {
        const newScanItem: SavedScanItem = {
          id: `scan-${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: base64Image,
          result: data,
        };
        setSavedScans((prev) => [newScanItem, ...prev]);
      }
    } catch (err: any) {
      console.error('Landmark recognition error:', err);
      setError(
        err.message ||
          'Failed to recognize landmark. Please ensure the landmark is clearly framed and try again.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  const handleSaveToPassport = () => {
    if (!result || !currentImage) return;
    const exists = savedScans.some(
      (s) => s.result.landmarkName === result.landmarkName
    );
    if (!exists) {
      const newScan: SavedScanItem = {
        id: `scan-${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: currentImage,
        result: result,
      };
      setSavedScans((prev) => [newScan, ...prev]);
    }
  };

  const handleDeleteScan = (id: string) => {
    setSavedScans((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSelectScan = (item: SavedScanItem) => {
    setCurrentImage(item.imageUrl);
    setResult(item.result);
    setError(null);
  };

  const handleNewScan = () => {
    setResult(null);
    setCurrentImage(null);
    setError(null);
  };

  const isCurrentSaved =
    result &&
    savedScans.some((s) => s.result.landmarkName === result.landmarkName);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Header */}
      <HeaderNav
        onOpenPassport={() => setIsPassportOpen(true)}
        stampsCount={savedScans.length}
        onNewScan={handleNewScan}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-8">
        {/* Error notification */}
        {error && (
          <div className="hud-glass p-4 rounded-2xl border border-red-500/30 bg-red-950/20 flex items-start justify-between gap-3 text-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">Recognition Notice</h4>
                <p className="text-xs text-red-300 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-mono px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Mode: Camera Viewfinder OR AR Narrated Clip View */}
        {!result ? (
          <div className="flex flex-col gap-6">
            {/* Viewfinder Introduction */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Urban Vision & Grounded History</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Scan City Landmarks. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">
                  Relive Their Stories in AR.
                </span>
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Aim your lens at historic monuments, cathedrals, or skyscrapers. AuraCity identifies the structure, retrieves verified archives via Google Search, and generates a choreographed AR tour clip with voice narration.
              </p>
            </div>

            {/* Live Camera Viewfinder & Sample Presets */}
            <CameraViewfinder
              onCapture={handleCapture}
              isAnalyzing={isAnalyzing}
              analysisStage={analysisStage}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* AR-Style Narrated Clip Player */}
            <ARClipViewer
              result={result}
              imageUrl={currentImage || ''}
              onNewScan={handleNewScan}
              onSaveToPassport={handleSaveToPassport}
              isSaved={!!isCurrentSaved}
            />

            {/* Landmark Dossier (Architecture, Historical Timeline, Grounding Sources) */}
            <LandmarkDossier result={result} />
          </div>
        )}
      </main>

      {/* Explorer Passport Modal */}
      <TravelPassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        savedScans={savedScans}
        onSelectScan={handleSelectScan}
        onDeleteScan={handleDeleteScan}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/60 py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AuraCity · Next-Gen Photo Tourism & Architectural AI</span>
          <span className="text-neutral-400">Powered by Gemini & Google Search Grounding</span>
        </div>
      </footer>
    </div>
  );
}
