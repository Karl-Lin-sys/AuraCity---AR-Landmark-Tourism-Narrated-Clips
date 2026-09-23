export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface LandmarkHotspot {
  id: string;
  title: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  description: string;
  era: string;
  architecturalFeature: string;
}

export interface NarrativeClipAct {
  actNumber: number;
  actTitle: string;
  theme: string;
  narration: string;
  subtitles: string[];
  cameraFocus: {
    xPercent: number;
    yPercent: number;
    zoom: number; // e.g. 1.25
  };
  durationSec: number;
  activeHotspotId?: string;
}

export interface HistoricalEra {
  eraName: string;
  period: string;
  description: string;
  visualFilter: 'sepia' | 'blueprint' | 'hologram' | 'matrix';
  reconstructionNote: string;
}

export interface LandmarkRecognitionResult {
  landmarkName: string;
  nativeName?: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  yearBuilt: string;
  architect: string;
  architecturalStyle: string;
  significance: string;
  quickSummary: string;
  hotspots: LandmarkHotspot[];
  clipScript: {
    acts: NarrativeClipAct[];
    totalEstimatedDurationSec: number;
    fullNarration: string;
  };
  historicalEras: HistoricalEra[];
  fascinatingSecrets: string[];
  visitorPhotoTip: string;
  searchGroundingSources: GroundingSource[];
}

export interface SavedScanItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  result: LandmarkRecognitionResult;
  userNote?: string;
}
