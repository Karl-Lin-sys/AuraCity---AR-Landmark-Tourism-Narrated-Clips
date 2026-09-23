import React from 'react';
import { Camera, Compass, Award, Sparkles, MapPin } from 'lucide-react';

interface HeaderNavProps {
  onOpenPassport: () => void;
  stampsCount: number;
  onNewScan: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenPassport,
  stampsCount,
  onNewScan,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={onNewScan}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                AuraCity
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                AR
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">
              AI Landmark Optics & Audio Clips
            </p>
          </div>
        </button>

        {/* Right Action: Passport Stamps */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPassport}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-medium transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Passport</span>
            {stampsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-neutral-950 font-bold">
                {stampsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
