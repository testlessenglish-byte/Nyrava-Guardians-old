import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { controls, useClassState } from "@/lib/class-store";
import { useGuardian } from "@/lib/guardian-context";
import { FOUNDATION_CERTIFICATE, missions } from "@/domain/progression/catalog";
import { levelFor } from "@/domain/progression/engine";
import type { PlayerProgress } from "@/domain/progression/types";
import { getProgression } from "@/lib/progression.functions";
import type { ClassroomRoom } from "./classroom-scene";

function selectedMissionId() {
  if (typeof window === "undefined") return missions[0]!.id;
  return window.sessionStorage.getItem("nyrava-selected-mission") ?? missions[0]!.id;
}

const ROOM_TEACHERS: Record<ClassroomRoom, string> = {
  security: "sarah",
  builder: "jacob",
  communication: "dayana",
  truth: "nova",
};

export function ClassHud({
  room = "security",
  activeInteraction,
  activeSeatId,
}: {
  room?: ClassroomRoom;
  activeInteraction?: { type: string; label: { en: string; es: string }; action: () => void } | null;
  activeSeatId?: string | null;
}) {
  const { messages } = useClassState();
  const [hasMoved, setHasMoved] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const { guardianName, guardianId, locale } = useGuardian();
  const es = locale.startsWith("es");
  const learnerName = guardianName || "Guardian";
  const currentGuardian = CLASS_GUARDIANS.find((g) => g.id === guardianId) ?? CLASS_GUARDIANS[0]!;
  const teacher = CLASS_GUARDIANS.find((g) => g.id === ROOM_TEACHERS[room]) ?? CLASS_GUARDIANS[0]!;
  const activeLesson = missions.find((mission) => mission.id === selectedMissionId()) ?? missions[0]!;
  const missionData = progress?.missions[activeLesson.id];
  const isLessonDone = Boolean(missionData?.completedAt);
  const isQuizDone = (missionData?.bestScore ?? 0) >= 75;
  const isPassed = isQuizDone;
  const isCertEarned = Boolean(progress?.certificates.some((certificate) => certificate.course === FOUNDATION_CERTIFICATE.id));
  const completedStepsCount = (isLessonDone ? 1 : 0) + (isQuizDone ? 1 : 0) + (isPassed ? 1 : 0) + (isCertEarned ? 1 : 0);

  useEffect(() => {
    getProgression().then(setProgress).catch(() => undefined);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (controls.keys.size > 0 || Math.hypot(controls.joystick.x, controls.joystick.y) > 0.1) setHasMoved(true);
    }, 200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="class-hud pointer-events-none fixed inset-0 z-20 font-sans">
      <div className="pointer-events-auto absolute left-5 top-5 w-80 space-y-3">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <h1 className="text-base font-black uppercase tracking-wider text-white">{es ? "AULA DE LA ACADEMIA" : "ACADEMY CLASSROOM"}</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">{teacher.name} · {teacher.role}</p>
        </div>

        <div className="rounded-3xl border border-slate-700/70 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{es ? "CLASE ACTUAL" : "CURRENT CLASS"}</p>
          <h3 className="mt-0.5 text-lg font-black tracking-tight text-white">{es ? activeLesson.title.es : activeLesson.title.en}</h3>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-300">
            <li className="flex items-center justify-between"><span>{es ? "Completar la clase" : "Complete the class"}</span>{isLessonDone ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}</li>
            <li className="flex items-center justify-between"><span>{es ? "Aprobar la evaluación" : "Pass the assessment"}</span>{isQuizDone ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}</li>
            <li className="flex items-center justify-between"><span>75%+</span>{isPassed ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}</li>
            <li className="flex items-center justify-between"><span>{es ? "Certificado de Fundamentos (3 clases)" : "Foundations certificate (3 classes)"}</span>{isCertEarned ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-slate-500" />}</li>
          </ul>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs font-black"><span className="text-amber-400">★ {es ? "Progreso" : "Progress"}</span><span className="text-cyan-300">{completedStepsCount} / 4</span></div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800 p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400" style={{ width: `${(completedStepsCount / 4) * 100}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/90 p-2 pr-4 shadow-2xl backdrop-blur-md">
        <div className="grid size-11 place-items-center rounded-xl font-black text-slate-950 shadow-md text-base" style={{ background: currentGuardian.color }}>{learnerName.charAt(0).toUpperCase()}</div>
        <div><span className="text-sm font-black text-white">{learnerName}</span><p className="text-[11px] font-bold text-cyan-300">{es ? "Guardián" : "Guardian"} · {progress ? `Level ${levelFor(progress.xp)}` : "…"}</p><p className="text-[10px] font-black text-amber-400">★ {progress?.xp ?? 0} XP</p></div>
      </div>

      {activeInteraction && (
        <div className="pointer-events-auto absolute left-1/2 bottom-28 z-30 -translate-x-1/2">
          <button type="button" onClick={activeInteraction.action} className="rounded-full border border-cyan-400/60 bg-slate-950/95 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-200 shadow-2xl backdrop-blur-xl hover:bg-cyan-950">{es ? activeInteraction.label.es : activeInteraction.label.en}</button>
        </div>
      )}

      {!hasMoved && !activeSeatId && (
        <div className="pointer-events-auto absolute bottom-6 left-6 rounded-2xl border border-slate-700/60 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-5 text-center">
            <div><div className="grid grid-cols-3 gap-1 font-mono text-xs font-bold text-white"><div /><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">W</span><div /><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">A</span><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">S</span><span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">D</span></div><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{es ? "Mover" : "Move"}</p></div>
            <div className="h-12 w-px bg-slate-800" />
            <div><div className="grid h-12 w-9 place-items-center rounded-md border border-slate-700 bg-slate-800 text-sm text-white">🖱️</div><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{es ? "Mirar" : "Look"}</p></div>
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-6 right-6 flex w-[min(92vw,24rem)] flex-col gap-3 rounded-3xl border border-slate-700/60 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl text-sm font-black text-slate-950" style={{ background: teacher.color }}>{teacher.name.charAt(0)}</div><div><span className="block text-xs font-extrabold text-white">{teacher.name}</span><span className="block text-[10px] font-bold text-cyan-300">{es ? "Guía Guardián" : "Guardian Guide"}</span></div></div>
        <div className="max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
          {messages.length === 0 && <p className="rounded-2xl bg-slate-900/90 p-3 text-slate-200 leading-relaxed border border-slate-800">{es ? "Acércate a la pantalla de clase y presiona E cuando estés listo." : "Walk to the class screen and press E when you are ready."}</p>}
          {messages.map((message) => <p key={message.id} className={message.from === "you" ? "text-right text-cyan-300 font-semibold" : "text-slate-300"}><span className="font-bold text-white">{message.name}: </span>{message.text}</p>)}
        </div>
      </div>
    </div>
  );
}
