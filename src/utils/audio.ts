// Audio utilities: Web Audio synthesizer effects + Gemini 24kHz PCM player + Web Speech fallback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Mechanical Camera Shutter click
  playShutterSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Click 1 (Mirror flip)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Click 2 (Curtain close)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1400, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.13);
    } catch (e) {
      // Audio might be blocked before first user gesture
    }
  }

  // Futuristic AR Reticle Lock chime
  playLockChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.07); // A5
      osc.frequency.setValueAtTime(1318.51, now + 0.14); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Audio context resume error ignored
    }
  }

  // Play Gemini TTS 24kHz raw PCM little-endian audio
  playPcmAudio(base64Data: string, sampleRate = 24000, onEnded?: () => void): AudioBufferSourceNode | null {
    try {
      this.stopAudio();
      const ctx = this.getContext();

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM little endian -> Float32 [-1.0, 1.0]
      const int16Count = Math.floor(len / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const float32 = new Float32Array(int16Count);

      for (let i = 0; i < int16Count; i++) {
        const int16 = dataView.getInt16(i * 2, true); // true for little endian
        float32[i] = int16 / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        this.currentSource = null;
        if (onEnded) onEnded();
      };

      source.start();
      this.currentSource = source;
      return source;
    } catch (err) {
      console.warn('PCM playback error:', err);
      if (onEnded) onEnded();
      return null;
    }
  }

  stopAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // already stopped
      }
      this.currentSource = null;
    }
    // Also stop any ongoing speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Browser speech synthesis fallback
  speakBrowser(text: string, voiceName?: string, onBoundary?: (charIndex: number) => void, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear tour guide pace
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Pick high quality natural voice if available
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    if (onBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          onBoundary(e.charIndex);
        }
      };
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const soundEngine = new SoundEngine();
