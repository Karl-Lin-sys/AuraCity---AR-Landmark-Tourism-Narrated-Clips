import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow payloads with high-res tourist photos
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Shared Gemini client with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
    zoom: number; // e.g. 1.2
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

// 1. Recognize Landmark & Retrieve Search-Grounded History
app.post('/api/recognize-landmark', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userLocation } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const locationContext = userLocation
      ? `User approximate GPS coordinates: lat ${userLocation.lat}, lng ${userLocation.lng}. Use this to disambiguate nearby landmarks.`
      : '';

    const systemPrompt = `You are AuraCity, an expert urban architectural historian and interactive Augmented Reality (AR) tour guide.
Analyze the provided city/street photo, identify the exact landmark, building, monument, bridge, or historical urban site.
Use Google Search grounding to verify the landmark's exact name, construction dates, architect, historical context, and authentic trivia.

You MUST respond ONLY with a valid JSON object (no markdown surrounding the JSON or wrap in \`\`\`json ... \`\`\`) adhering strictly to this schema:
{
  "landmarkName": "Official Landmark Name",
  "nativeName": "Local or original native language name (or same if none)",
  "city": "City name",
  "country": "Country name",
  "coordinates": { "lat": 48.8584, "lng": 2.2945 },
  "yearBuilt": "e.g. 1887-1889",
  "architect": "Name of architect or master builder",
  "architecturalStyle": "e.g. Victorian Gothic Revival, Romanesque, Neo-Futuristic, Baroque",
  "significance": "One concise punchy sentence on why this landmark is world-renowned or culturally iconic",
  "quickSummary": "2-3 vivid sentences summarizing its essence and atmosphere",
  "hotspots": [
    {
      "id": "hotspot-1",
      "title": "Specific architectural part in this view (e.g. Spire, West Facade Rose Window, Foundation Keystone, Observation Deck, Flying Buttress)",
      "xPercent": 48,
      "yPercent": 25,
      "description": "Fascinating historical engineering or design fact about this specific portion",
      "era": "e.g. 14th Century",
      "architecturalFeature": "e.g. Lancet Arch"
    },
    {
      "id": "hotspot-2",
      "title": "Second visible architectural detail",
      "xPercent": 35,
      "yPercent": 60,
      "description": "Historical detail",
      "era": "e.g. 19th Century Addition",
      "architecturalFeature": "e.g. Gargoyle Water Spout"
    },
    {
      "id": "hotspot-3",
      "title": "Third visible architectural detail",
      "xPercent": 65,
      "yPercent": 50,
      "description": "Historical detail",
      "era": "e.g. Ancient Vaulting",
      "architecturalFeature": "e.g. Flying Buttress"
    }
  ],
  "clipScript": {
    "totalEstimatedDurationSec": 24,
    "fullNarration": "Complete spoken tour guide narration that sounds like an inspiring BBC/National Geographic documentary clip. Length ~70-90 words, engaging and evocative.",
    "acts": [
      {
        "actNumber": 1,
        "actTitle": "Genesis & Vision",
        "theme": "Origin & Construction",
        "narration": "First act narration (approx 25 words). Vividly setting the scene of when construction began.",
        "subtitles": ["Subtitle phrase 1", "Subtitle phrase 2"],
        "cameraFocus": { "xPercent": 50, "yPercent": 65, "zoom": 1.15 },
        "durationSec": 8,
        "activeHotspotId": "hotspot-1"
      },
      {
        "actNumber": 2,
        "actTitle": "Engineering & Trials",
        "theme": "Architectural Feats",
        "narration": "Second act narration (approx 25 words) focusing on the incredible engineering breakthrough or historical crisis survived.",
        "subtitles": ["Subtitle phrase 1", "Subtitle phrase 2"],
        "cameraFocus": { "xPercent": 40, "yPercent": 35, "zoom": 1.3 },
        "durationSec": 8,
        "activeHotspotId": "hotspot-2"
      },
      {
        "actNumber": 3,
        "actTitle": "Immortal Legacy",
        "theme": "Modern Wonder & Secrets",
        "narration": "Third act narration (approx 25 words) revealing a hidden secret and its enduring legacy today.",
        "subtitles": ["Subtitle phrase 1", "Subtitle phrase 2"],
        "cameraFocus": { "xPercent": 55, "yPercent": 25, "zoom": 1.2 },
        "durationSec": 8,
        "activeHotspotId": "hotspot-3"
      }
    ]
  },
  "historicalEras": [
    {
      "eraName": "Origin Era",
      "period": "e.g. 1200 - 1350",
      "description": "What this city quarter looked like back during original construction.",
      "visualFilter": "sepia",
      "reconstructionNote": "Original wooden scaffolding and medieval masonry masons"
    },
    {
      "eraName": "Transformation",
      "period": "e.g. 1780 - 1890",
      "description": "How the landmark survived wars, industrial growth or revolutions.",
      "visualFilter": "blueprint",
      "reconstructionNote": "Architectural blueprints and structural iron reinforcements"
    },
    {
      "eraName": "Modern Age",
      "period": "20th - 21st Century",
      "description": "Preservation, UNESCO status, and modern illumination.",
      "visualFilter": "hologram",
      "reconstructionNote": "Laser scanning, digital twin preservation, and laser telemetry"
    }
  ],
  "fascinatingSecrets": [
    "Secret 1: Unexpected trivia or hidden chamber",
    "Secret 2: Optical illusion or astronomical alignment",
    "Secret 3: Dramatic historical event that happened on this site"
  ],
  "visitorPhotoTip": "Pro-photographer insider tip for the best vantage point, light angle, or best time of day to shoot this landmark"
}

Provide accurate coordinates and realistic xPercent (10-90) & yPercent (10-90) targeting key focal areas on the landmark. ${locationContext}`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: systemPrompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';

    // Extract search grounding citations
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const searchGroundingSources: GroundingSource[] = [];
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk?.web?.uri) {
          searchGroundingSources.push({
            title: chunk.web.title || 'Historical Source',
            uri: chunk.web.uri,
          });
        }
      }
    }

    // Safely parse JSON
    let parsed: any = null;
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        console.warn('Failed initial JSON parse, attempting cleanup:', err);
      }
    }

    if (!parsed) {
      // Fallback structured object if the model output was loose
      parsed = {
        landmarkName: "Recognized City Landmark",
        nativeName: "Historic Monument",
        city: "Metropolis",
        country: "World Heritage",
        coordinates: { lat: 48.8584, lng: 2.2945 },
        yearBuilt: "Historic Era",
        architect: "Master Guild",
        architecturalStyle: "Classical Urban Architecture",
        significance: "An architectural marvel standing at the crossroads of history.",
        quickSummary: rawText.slice(0, 300) || "Iconic city landmark recognized with distinctive architectural character.",
        hotspots: [
          {
            id: "hotspot-1",
            title: "Crown & Superstructure",
            xPercent: 50,
            yPercent: 20,
            description: "Distinctive structural pinnacle visible across the city skyline.",
            era: "Original Construction",
            architecturalFeature: "Pinnacle"
          },
          {
            id: "hotspot-2",
            title: "Central Portal & Facade",
            xPercent: 50,
            yPercent: 60,
            description: "Main architectural frontage displaying authentic ornamental stonework.",
            era: "Golden Era",
            architecturalFeature: "Grand Archway"
          }
        ],
        clipScript: {
          totalEstimatedDurationSec: 24,
          fullNarration: "Welcome to this magnificent urban landmark. Rising through centuries of history, its walls hold the echoes of master builders, historic triumphs, and timeless elegance.",
          acts: [
            {
              actNumber: 1,
              actTitle: "The Genesis",
              theme: "Origin",
              narration: "Centuries ago, visionaries laid the foundation stones of this monumental city icon.",
              subtitles: ["Visionaries laid the foundation", "Rising against the skyline"],
              cameraFocus: { xPercent: 50, yPercent: 65, zoom: 1.15 },
              durationSec: 8,
              activeHotspotId: "hotspot-2"
            },
            {
              actNumber: 2,
              actTitle: "The Architecture",
              theme: "Engineering",
              narration: "Engineered to withstand the tests of time, each arch and column speaks to masterful craftsmanship.",
              subtitles: ["Engineered for eternity", "Masterful craft and precision"],
              cameraFocus: { xPercent: 50, yPercent: 25, zoom: 1.3 },
              durationSec: 8,
              activeHotspotId: "hotspot-1"
            },
            {
              actNumber: 3,
              actTitle: "Living Legend",
              theme: "Legacy",
              narration: "Today it endures as an immortal testament to human creativity and urban heritage.",
              subtitles: ["An immortal testament", "Standing proud today"],
              cameraFocus: { xPercent: 50, yPercent: 45, zoom: 1.2 },
              durationSec: 8
            }
          ]
        },
        historicalEras: [
          { eraName: "Foundation", period: "Historic Era", description: "Early construction era", visualFilter: "sepia", reconstructionNote: "Original timber and stone craftsmanship" },
          { eraName: "Golden Age", period: "19th Century", description: "Thriving cultural center", visualFilter: "blueprint", reconstructionNote: "Architectural expansion" },
          { eraName: "Modern Day", period: "Contemporary", description: "World heritage preservation", visualFilter: "hologram", reconstructionNote: "Modern digital preservation" }
        ],
        fascinatingSecrets: [
          "Built using innovative masonry techniques ahead of its time.",
          "Survives as a beloved touchstone of urban identity.",
          "Attracts millions of travelers seeking inspiration."
        ],
        visitorPhotoTip: "Capture low-angle perspective during blue hour when the landmark's illumination contrasts with the twilight sky."
      };
    }

    // Attach search grounding sources
    parsed.searchGroundingSources = searchGroundingSources;

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/recognize-landmark:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze landmark with Gemini Search Grounding.',
    });
  }
});

// 2. Generate Audio Narration with Gemini TTS
app.post('/api/generate-narration-audio', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required for narration.' });
    }

    // Limit text to avoid timeout or excessive duration
    const trimmedText = text.slice(0, 1000);

    // gemini-3.1-flash-tts-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Narrate in an engaging, cinematic, documentary tour guide tone: ${trimmedText}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({
        success: true,
        audioBase64: base64Audio,
        sampleRate: 24000,
        voice: voice,
      });
    } else {
      return res.json({
        success: false,
        useBrowserSpeech: true,
        message: 'No inline audio returned from TTS, fallback to Web Speech Synthesis.',
      });
    }
  } catch (error: any) {
    console.warn('TTS error (falling back to client speech synthesis):', error?.message);
    return res.json({
      success: false,
      useBrowserSpeech: true,
      error: error?.message || 'TTS unavailable',
    });
  }
});

// Serve frontend with Vite in dev, static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AuraCity] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
