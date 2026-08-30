/**
 * Nyrava Guardians Web Audio Engine & Dynamic Audio Ducking System
 * Provides atmospheric background soundscapes per world zone and dynamic ducking when Guardians speak.
 */

export type WorldZoneId =
  | "hq"
  | "digital-city"
  | "academy"
  | "cyber-defense"
  | "mystery-network"
  | "data-arena"
  | "builder-district"
  | "communication-realm"
  | "future-lab"
  | "boss";

export interface AudioSettings {
  masterVolume: number; // 0.0 - 1.0
  musicVolume: number; // 0.0 - 1.0
  voiceVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  subtitles: boolean;
  voiceConversations: boolean;
  automaticConversations: boolean;
  backgroundMusic: boolean;
  soundEffects: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  voiceVolume: 0.9,
  sfxVolume: 0.7,
  subtitles: true,
  voiceConversations: true,
  automaticConversations: true,
  backgroundMusic: true,
  soundEffects: true,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private currentZone: WorldZoneId = "hq";
  private isDucked = false;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem("nyrava_audio_settings");
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem("nyrava_audio_settings", JSON.stringify(this.settings));
    } catch {
      // localStorage fallback
    }
    this.updateGains();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private initCtx() {
    if (typeof window === "undefined") return;
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateGains();
    } catch {
      // Web Audio API unsupported
    }
  }

  private updateGains() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, now);
    
    const targetMusicVolume = this.settings.backgroundMusic
      ? (this.isDucked ? this.settings.musicVolume * 0.25 : this.settings.musicVolume)
      : 0;

    this.musicGain.gain.setTargetAtTime(targetMusicVolume, now, 0.3);
    this.sfxGain.gain.setValueAtTime(this.settings.soundEffects ? this.settings.sfxVolume : 0, now);
  }

  /** Starts atmospheric ambient audio loop for the specified world zone */
  public setWorldZone(zone: WorldZoneId) {
    if (typeof window === "undefined") return;
    this.currentZone = zone;
    this.initCtx();
    if (!this.ctx || !this.musicGain || !this.settings.backgroundMusic) return;

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    this.stopAmbientLoop();

    const now = this.ctx.currentTime;
    const freqs = this.getZoneFrequencies(zone);

    freqs.forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = zone === "cyber-defense" || zone === "builder-district" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(zone === "digital-city" ? 800 : 400, now);

      oscGain.gain.setValueAtTime(0.04, now);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.musicGain);

      osc.start(now);
      this.activeOscillators.push(osc);
    });
  }

  private getZoneFrequencies(zone: WorldZoneId): number[] {
    switch (zone) {
      case "hq":
        return [220, 277.18, 329.63, 440];
      case "digital-city":
        return [196, 246.94, 293.66, 392];
      case "academy":
        return [261.63, 329.63, 392, 523.25];
      case "cyber-defense":
        return [146.83, 174.61, 220, 293.66];
      case "mystery-network":
        return [130.81, 164.81, 196, 261.63];
      case "builder-district":
        return [220, 277.18, 349.23, 440];
      case "communication-realm":
        return [293.66, 369.99, 440, 587.33];
      case "future-lab":
        return [174.61, 220, 261.63, 349.23];
      case "boss":
        return [110, 130.81, 164.81, 220];
      default:
        return [220, 277.18, 329.63];
    }
  }

  private stopAmbientLoop() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeOscillators = [];
  }

  public startDucking() {
    this.isDucked = true;
    this.updateGains();
  }

  public stopDucking() {
    this.isDucked = false;
    this.updateGains();
  }

  public playSfx(type: "greet" | "click" | "success" | "walk-away") {
    if (typeof window === "undefined") return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain || !this.settings.soundEffects) return;

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === "greet") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const audioEngine = new AudioEngine();
