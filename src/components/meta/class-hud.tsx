import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Joystick } from "./joystick";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { controls, pushMessage, setClassState, useClassState } from "@/lib/class-store";
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
import { createProgress } from "@/domain/progression/engine";
import { missions } from "@/domain/progression/catalog";

export function ClassHud({
  activeInteraction,
  activeSeatId,
}: {
  activeInteraction?: { type: string; label: { en: string; es: string }; action: () => void } | null;
  activeSeatId?: string | null;
}) {
  const { messages, thinking, voiceEnabled, listening } = useClassState();
  const chat = useServerFn(guardianChat);
  const speak = useServerFn(guardianSpeak);
  const [draft, setDraft] = useState("");
  const [hasMoved, setHasMoved] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const session = useRef(0);

  const { guardianName, guardianId } = useGuardian();
  const learnerName = guardianName || "Alex";
  const currentGuardian = CLASS_GUARDIANS.find((g) => g.id === guardianId) ?? CLASS_GUARDIANS[0]!;
  const sarah = CLASS_GUARDIANS.find((g) => g.id === "sarah") ?? CLASS_GUARDIANS[0]!;

  const progress = createProgress();
  const activeLesson = missions[0]!;
  const missionData = progress.missions[activeLesson.id];
  const isLessonDone = !!missionData && (missionData.status === "completed" || missionData.status === "mastered");
  const isQuizDone = !!missionData && (missionData.status === "mastered" || (missionData.bestScore ?? 0) >= 75);
  const isPassed = isQuizDone;
  const isCertEarned = progress.certificates.length > 0;

  const completedStepsCount = (isLessonDone ? 1 : 0) + (isQuizDone ? 1 : 0) + (isPassed ? 1 : 0) + (isCertEarned ? 1 : 0);

  useEffect(() => {
    const checkMovement = () => {
      if (controls.keys.size > 0 || Math.hypot(controls.joystick.x, controls.joystick.y) > 0.1) {
        setHasMoved(true);
      }
    };
    const interval = setInterval(checkMovement, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && activeInteraction) {
        activeInteraction.action();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeInteraction]);

  const send = async (text: string) => {
    if (isNative() || import.meta.env.MODE === "mobile") {
      toast.info("Native Guardian chat needs the secure backend connection.");
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
          guardian: sarah.name,
          role: sarah.role,
          learnerName,
          message: clean,
          history,
        },
      });
      if (requestSession !== session.current) return;
      pushMessage({ from: sarah.id, name: sarah.name, text: reply });
      setClassState({ thinking: false, speaking: sarah.id });
    } catch (error) {
      setClassState({ thinking: false, speaking: null });
      toast.error(error instanceof Error ? error.message : "The guardian could not answer.");
    }
  };

  return (
    <div className="class-hud pointer-events-none fixed inset-0 z-20 font-sans">
      {/* TOP LEFT LESSON CARD */}
      <div className="pointer-events-auto absolute left-5 top-5 w-80 space-y-3">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <h1 className="text-base font-black uppercase tracking-wider text-white">ACADEMY CLASSROOM</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">NYRAVA GUARDIANS ACADEMY</p>
        </div>

        <div className="rounded-3xl border border-slate-700/70 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">TODAY'S LESSON</p>
          <h3 className="mt-0.5 text-lg font-black tracking-tight text-white">{activeLesson.title.en}</h3>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-300">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan-400" />Watch the lesson</span>
              {isLessonDone ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan-400" />Complete the quiz</span>
              {isQuizDone ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan-400" />Earn 75% or higher</span>
              {isPassed ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan-400" />Earn your certificate</span>
              {isCertEarned ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}
            </li>
          </ul>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-amber-400">★ Your Progress</span>
              <span className="text-cyan-300">{completedStepsCount} / 4</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-500" style={{ width: (completedStepsCount ? Math.max(10, (completedStepsCount / 4) * 100) : 0) + "%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* TOP RIGHT AVATAR CARD */}
      <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/90 p-2 pr-4 shadow-2xl backdrop-blur-md">
        <div className="grid size-11 place-items-center rounded-xl font-black text-slate-950 shadow-md text-base" style={{ background: currentGuardian.color }}>
          {learnerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-black text-white">{learnerName}</span>
          <p className="text-[11px] font-bold text-cyan-300">Level 2 Guardian</p>
          <p className="text-[10px] font-black text-amber-400">★ 125</p>
        </div>
      </div>

      {/* CENTER SINGLE PROXIMITY PROMPT */}
      {activeInteraction && (
        <div className="pointer-events-auto absolute left-1/2 bottom-28 z-30 -translate-x-1/2">
          <button
            type="button"
            onClick={activeInteraction.action}
            className="animate-bounce rounded-full border border-cyan-400/60 bg-slate-950/95 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-200 shadow-2xl backdrop-blur-xl hover:bg-cyan-950"
          >
            {activeInteraction.label.en} · {activeInteraction.label.es}
          </button>
        </div>
      )}

      {/* BOTTOM LEFT CONTROL HINT (Hidden when seated) */}
      {!hasMoved && !activeSeatId && (
        <div className="pointer-events-auto absolute bottom-6 left-6 rounded-2xl border border-slate-700/60 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md transition-opacity duration-700">
          <div className="flex items-center gap-5 text-center">
            <div>
              <div className="grid grid-cols-3 gap-1 font-mono text-xs font-bold text-white">
                <div /><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">W</span><div />
                <span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">A</span><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">S</span><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">D</span>
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Move</p>
            </div>
            <div className="h-12 w-px bg-slate-800" />
            <div>
              <div className="grid h-12 w-9 place-items-center rounded-md border border-slate-700 bg-slate-800 text-sm text-white">🖱️</div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Look</p>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM RIGHT SARAH CHAT CARD */}
      <div className="pointer-events-auto absolute bottom-6 right-6 flex w-[min(92vw,24rem)] flex-col gap-3 rounded-3xl border border-slate-700/60 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl text-sm font-black text-slate-950 shadow-md" style={{ background: sarah.color }}>
              {sarah.name.charAt(0)}
            </div>
            <div>
              <span className="block text-xs font-extrabold text-white">{sarah.name}</span>
              <span className="block text-[10px] font-bold text-cyan-300">Guardian AI Teacher</span>
            </div>
          </div>
        </div>
        <div ref={scroller} className="max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
          {messages.length === 0 && (
            <p className="rounded-2xl bg-slate-900/90 p-3 text-slate-200 leading-relaxed border border-slate-800">
              Welcome, Guardian! Let's learn how to spot phishing and protect yourself online.
            </p>
          )}
          {messages.map((m) => (
            <p key={m.id} className={m.from === "you" ? "text-right text-cyan-300 font-semibold" : "text-slate-300"}>
              <span className="font-bold text-white">{m.name}: </span>{m.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
