/**
 * Nyrava Guardians Conversational Voice Engine
 * Handles real-time spoken conversations between child and Guardians with clear state management:
 * IDLE -> LISTENING -> THINKING -> SPEAKING -> PAUSED -> ENDED
 */

import { audioEngine } from "@/services/audio/audio-engine";
import { GUARDIAN_DIALOGUES, type LocaleId } from "@/data/bilingual-dictionary";

export type ConversationState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "PAUSED" | "ENDED";

export interface VoiceEngineListener {
  onStateChange: (state: ConversationState) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onGuardianResponse: (text: string) => void;
}

class ConversationalVoiceEngine {
  private state: ConversationState = "IDLE";
  private listeners: Set<VoiceEngineListener> = new Set();
  private activeGuardian: string = "lex";
  private locale: LocaleId = "en-US";
  private isMuted = false;
  private recognition: SpeechRecognition | null = null;
  private synth: SpeechSynthesis | null = typeof window !== "undefined" ? window.speechSynthesis : null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.locale;

      this.recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result[0]) {
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          // Natural language interruption: stop TTS if speaking
          if (this.state === "SPEAKING") {
            this.stopSpeaking();
          }

          this.notifyTranscript(text, Boolean(finalTranscript));

          if (finalTranscript) {
            this.handleChildUtterance(finalTranscript);
          }
        }
      };

      this.recognition.onerror = () => {
        if (this.state === "LISTENING") {
          this.setState("IDLE");
        }
      };
    }
  }

  public subscribe(listener: VoiceEngineListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(next: ConversationState) {
    this.state = next;
    this.listeners.forEach((l) => l.onStateChange(next));

    if (next === "SPEAKING") {
      audioEngine.startDucking();
    } else if (next === "IDLE" || next === "ENDED" || next === "PAUSED") {
      audioEngine.stopDucking();
    }
  }

  private notifyTranscript(text: string, isFinal: boolean) {
    this.listeners.forEach((l) => l.onTranscript(text, isFinal));
  }

  private notifyGuardianResponse(text: string) {
    this.listeners.forEach((l) => l.onGuardianResponse(text));
  }

  public setLocale(newLocale: LocaleId) {
    this.locale = newLocale;
    if (this.recognition) {
      this.recognition.lang = newLocale;
    }
  }

  public setGuardian(guardianId: string) {
    this.activeGuardian = guardianId;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopListening();
      this.stopSpeaking();
      this.setState("PAUSED");
    } else {
      this.startListening();
    }
    return this.isMuted;
  }

  public startListening() {
    if (this.isMuted) return;
    if (this.recognition) {
      try {
        this.recognition.start();
        this.setState("LISTENING");
      } catch {
        // Recognition already active
        this.setState("LISTENING");
      }
    } else {
      this.setState("LISTENING");
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Recognition already stopped
      }
    }
  }

  /** Guardian speaks text response with TTS & dynamic audio ducking */
  public speakGuardianResponse(text: string) {
    this.notifyGuardianResponse(text);
    if (!this.synth) {
      this.setState("IDLE");
      return;
    }

    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.locale;
    utterance.rate = 0.95; // Friendly child-appropriate cadence

    utterance.onstart = () => {
      this.setState("SPEAKING");
    };

    utterance.onend = () => {
      this.setState("IDLE");
      this.startListening();
    };

    utterance.onerror = () => {
      this.setState("IDLE");
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /** Trigger automatic proximity greeting from nearby Guardian */
  public triggerProximityGreeting(guardianId: string) {
    this.activeGuardian = guardianId;
    const dialogue = GUARDIAN_DIALOGUES[guardianId]?.[this.locale] ?? GUARDIAN_DIALOGUES["lex"]![this.locale];
    const greetingText = `${dialogue.greeting} ${dialogue.intro} ${dialogue.askPermission}`;
    audioEngine.playSfx("greet");
    this.speakGuardianResponse(greetingText);
  }

  /** Process child natural language input */
  private handleChildUtterance(text: string) {
    this.setState("THINKING");
    const lower = text.toLowerCase();
    const dialogue = GUARDIAN_DIALOGUES[this.activeGuardian]?.[this.locale] ?? GUARDIAN_DIALOGUES["lex"]![this.locale];

    setTimeout(() => {
      if (lower.includes("spanish") || lower.includes("español")) {
        this.setLocale("es-MX");
        this.speakGuardianResponse(dialogue.spanishSwitch);
      } else if (lower.includes("english") || lower.includes("inglés")) {
        this.setLocale("en-US");
        this.speakGuardianResponse(dialogue.englishSwitch);
      } else if (lower.includes("yes") || lower.includes("sí") || lower.includes("try") || lower.includes("start")) {
        this.speakGuardianResponse(dialogue.accept);
      } else if (lower.includes("no") || lower.includes("not now") || lower.includes("later")) {
        this.speakGuardianResponse(dialogue.decline);
      } else if (lower.includes("learn") || lower.includes("what") || lower.includes("qué")) {
        this.speakGuardianResponse(dialogue.explainMore);
      } else {
        // Natural conversational echo & reassurance
        this.speakGuardianResponse(`${dialogue.explainMore} ${dialogue.askPermission}`);
      }
    }, 600);
  }

  /** Walk-away behavior: graceful exit when player moves away */
  public handleWalkAway() {
    const dialogue = GUARDIAN_DIALOGUES[this.activeGuardian]?.[this.locale] ?? GUARDIAN_DIALOGUES["lex"]![this.locale];
    audioEngine.playSfx("walk-away");
    this.stopSpeaking();
    this.stopListening();
    this.notifyGuardianResponse(dialogue.walkAway);
    this.setState("ENDED");
    setTimeout(() => this.setState("IDLE"), 2000);
  }

  public getState(): ConversationState {
    return this.state;
  }
}

export const conversationalVoiceEngine = new ConversationalVoiceEngine();
