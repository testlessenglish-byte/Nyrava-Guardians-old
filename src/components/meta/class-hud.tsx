import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Joystick } from "./joystick";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { pushMessage, setClassState, travelTo, useClassState } from "@/lib/class-store";
import { ZONES, getZone } from "@/lib/worlds";
import { guardianChat, guardianSpeak } from "@/lib/classroom.functions";
import { useGuardian } from "@/lib/guardian-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  recognitionConstructor,
  confirmVoicePurpose,
  isNative,
  type Recognition,
} from "@/services/platform/device";
import { audioEngine } from "@/services/audio/audio-engine";

export function ClassHud() {
  const { messages, nearby, thinking, voiceEnabled, listening, zone } = useClassState();
  const current = getZone(zone);
  const chat = useServerFn(guardianChat);
  const speak = useServerFn(guardianSpeak);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const session = useRef(0);
  useEffect(() => {
    const stop = () => {
      session.current++;
      recognition.current?.stop();
      audioEngine.stopSpeech();
      setClassState({ listening: false, speaking: null, thinking: false });
    };
    window.addEventListener("nyrava-input-reset", stop);
    return () => {
      window.removeEventListener("nyrava-input-reset", stop);
      stop();
    };
  }, []);

  const { guardianName } = useGuardian();
  const learnerName = guardianName || "Guardian";

  const host =
    CLASS_GUARDIANS.find((g) => g.id === current.npcs[0]) ??
    CLASS_GUARDIANS[CLASS_GUARDIANS.length - 1];
  const active = (CLASS_GUARDIANS.find((g) => g.id === nearby) ??
    host) as (typeof CLASS_GUARDIANS)[number];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  const send = async (text: string) => {
    if (isNative() || import.meta.env.MODE === "mobile") {
      toast.info(
        "Native Guardian chat needs the secure backend connection. Island exploration and challenges remain available.",
      );
      return;
    }
    const requestSession = session.current;
    const clean = text.trim();
    if (!clean || thinking) return;
    setDraft("");
    pushMessage({ from: "you", name: learnerName, text: clean });
    setClassState({ thinking: true });

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.from === "you" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));
      const { reply } = await chat({
        data: {
          guardian: active.name,
          role: active.role,
          learnerName,
          message: clean,
          history,
        },
      });
      if (requestSession !== session.current) return;
      pushMessage({ from: active.id, name: active.name, text: reply });
      setClassState({ thinking: false, speaking: active.id });

      if (voiceEnabled) {
        const { audio: base64 } = await speak({
          data: { text: reply.slice(0, 600), voice: active.voice },
        });
        if (requestSession !== session.current) return;
        await audioEngine.playSpeech(base64, () => setClassState({ speaking: null }));
      } else {
        setTimeout(() => setClassState({ speaking: null }), 3500);
      }
    } catch (error) {
      setClassState({ thinking: false, speaking: null });
      toast.error(error instanceof Error ? error.message : "The guardian could not answer.");
    }
  };

  const toggleMic = () => {
    const Ctor = recognitionConstructor();

    if (!Ctor) {
      toast.info(
        "Microphone recognition is not available on this device. Use text; native voice needs a reviewed speech provider.",
      );
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    if (!confirmVoicePurpose()) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    rec.onend = () => setClassState({ listening: false });
    rec.onerror = () => setClassState({ listening: false });
    recognition.current = rec;
    setClassState({ listening: true });
    try {
      rec.start();
    } catch {
      setClassState({ listening: false });
      toast.info("Microphone could not start. You can still type.");
    }
  };

  return (
    <div className="class-hud pointer-events-none fixed inset-0 z-20">
      {/* Presence banner */}
      <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
        {nearby ? `Talking with ${active.name}` : `${current.name} · walk into a portal to travel`}
      </div>

      {/* World switcher */}
      <div className="pointer-events-auto absolute left-6 top-32 w-52 rounded-3xl border border-border/60 bg-background/75 p-3 backdrop-blur-xl">
        <p className="px-1 pb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Worlds
        </p>
        <div className="flex flex-col gap-1">
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => travelTo(z.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                z.id === zone
                  ? "bg-primary/15 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
              style={z.id === zone ? { color: z.accent } : undefined}
            >
              {z.name}
            </button>
          ))}
        </div>
        <p className="px-1 pt-2 text-[11px] leading-snug text-muted-foreground">{current.blurb}</p>
      </div>

      {/* Movement */}
      <div className="absolute bottom-8 left-8">
        <Joystick />
      </div>
      <p className="absolute bottom-4 left-8 hidden text-[11px] text-muted-foreground md:block">
        WASD to walk · drag to look around
      </p>

      {/* Class chat */}
      <div className="pointer-events-auto absolute bottom-6 right-6 flex w-[min(92vw,26rem)] flex-col gap-3 rounded-3xl border border-border/60 bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: active.color }}>
            {active.name} · {active.role}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label={voiceEnabled ? "Mute guardian voice" : "Unmute guardian voice"}
            onClick={() => setClassState({ voiceEnabled: !voiceEnabled })}
          >
            {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
        </div>

        <div ref={scroller} className="max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
          {messages.length === 0 && <p className="text-muted-foreground">{active.greeting}</p>}
          {messages.map((m) => (
            <p
              key={m.id}
              className={m.from === "you" ? "text-right text-foreground" : "text-muted-foreground"}
            >
              <span className="font-semibold">{m.name}: </span>
              {m.text}
            </p>
          ))}
          {thinking && <p className="text-muted-foreground">{active.name} is thinking…</p>}
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "secondary"}
            aria-label={listening ? "Stop talking" : "Talk to your guardian"}
            onClick={toggleMic}
          >
            {listening ? <Mic className="size-4 animate-pulse" /> : <MicOff className="size-4" />}
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={listening ? "Listening…" : `Talk or type to ${active.name}`}
            aria-label="Message your guardian"
          />
          <Button type="submit" size="icon" disabled={thinking} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
