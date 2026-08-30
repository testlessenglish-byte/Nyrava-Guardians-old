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

  constructor() {
    if (typeof window !== "undefined") {
      this.initRecognition();
    }
  }

  private initRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
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
      } catch {
        // SpeechRecognition not supported in environment
      }
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
    if (typeof window === "undefined" || this.isMuted) return;
    if (this.recognition) {
      try {
        this.recognition.start();
        this.setState("LISTENING");
      } catch {
        this.setState("LISTENING");
      }
    } else {
      this.setState("LISTENING");
    }
  }

  public stopListening() {
    if (typeof window === "undefined") return;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
    }
  }

  /** Guardian speaks text response with SpeechSynthesis & dynamic audio ducking */
  public speakGuardianResponse(text: string) {
    this.notifyGuardianResponse(text);
    if (typeof window === "undefined" || typeof SpeechSynthesisUtterance === "undefined" || !window.speechSynthesis) {
      this.setState("IDLE");
      return;
    }

    try {
      this.stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.locale;
      utterance.rate = 0.95;

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

      window.speechSynthesis.speak(utterance);
    } catch {
      this.setState("IDLE");
    }
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Speech synthesis cancel fallback
      }
    }
  }

  public triggerProximityGreeting(guardianId: string) {
    this.activeGuardian = guardianId;
    const dialogue = GUARDIAN_DIALOGUES[guardianId]?.[this.locale] ?? GUARDIAN_DIALOGUES["lex"]![this.locale];
    const greetingText = `${dialogue.greeting} ${dialogue.intro} ${dialogue.askPermission}`;
    audioEngine.playSfx("greet");
    this.speakGuardianResponse(greetingText);
  }

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
        this.speakGuardianResponse(`${dialogue.explainMore} ${dialogue.askPermission}`);
      }
    }, 600);
  }

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
