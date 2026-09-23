import React from 'react';
import { Bookmark, MapPin, Calendar, Trash2, ArrowUpRight, X, Compass, Award } from 'lucide-react';
import { SavedScanItem } from '../types';

interface TravelPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedScans: SavedScanItem[];
  onSelectScan: (item: SavedScanItem) => void;
  onDeleteScan: (id: string) => void;
}

export const TravelPassportModal: React.FC<TravelPassportModalProps> = ({
  isOpen,
  onClose,
  savedScans,
  onSelectScan,
  onDeleteScan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                City Explorer Passport
              </h2>
              <p className="text-xs text-neutral-400">
                {savedScans.length} Landmark{savedScans.length === 1 ? '' : 's'} Stamped & Explored
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedScans.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-300 mb-1">
                Your passport has no stamps yet.
              </p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Scan or photograph any landmark in the city and click "Stamp Passport" to log your architectural journey.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedScans.map((item) => (
                <div
                  key={item.id}
                  className="group relative hud-glass rounded-2xl overflow-hidden border border-neutral-800 hover:border-amber-400/50 transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
                    <img
                      src={item.imageUrl}
                      alt={item.result.landmarkName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScan(item.id);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-950/70 hover:bg-red-500 text-neutral-400 hover:text-white transition cursor-pointer"
                        title="Remove from passport"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 hud-glass px-2 py-0.5 rounded text-[10px] font-mono text-amber-300">
                      STAMP #{item.id.slice(-4).toUpperCase()}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 mb-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{item.result.city}, {item.result.country}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {item.result.landmarkName}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                        {item.result.quickSummary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectScan(item);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-amber-400 font-medium hover:underline cursor-pointer"
                      >
                        <span>Replay AR Clip</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
