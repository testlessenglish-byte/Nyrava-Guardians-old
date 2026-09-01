import { createFileRoute, Link } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { DigitalCityScene } from "@/components/city/digital-city-scene";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager } from "@/components/game/core/input-manager";
import { AnalogJoystick, LookPad } from "@/components/game/touch-controls";
import { Button } from "@/components/ui/button";
import { PauseMenu } from "@/components/game/pause-menu";
import { getProgression } from "@/lib/progression.functions";
import type { PlayerProgress } from "@/domain/progression/types";
import { advancePhishingStory, getPhishingStoryStep } from "@/lib/phishing-story-state";

export const Route = createFileRoute("/city")({ ssr: false, component: DigitalCityPage });

function DigitalCityPage() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const dragging = useRef(false);
  const { guardianId, guardianName, locale } = useGuardian();
  const es = locale.startsWith("es");
  const chosen = CLASS_GUARDIANS.find((g) => g.id === guardianId);
  const playerColor = chosen?.color ?? "#f4f7ff";
  const playerLabel = `${guardianName || "You"}${chosen ? ` · ${chosen.name}` : ""}`;
  const inputManager = useMemo(() => new InputManager(), []);
  const [inspecting, setInspecting] = useState(false);
  const [decision, setDecision] = useState<"correct" | "incorrect" | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  const refreshProgress = () => getProgression().then(setProgress).catch(() => undefined);
  const phishingPassed = Boolean(progress?.missions["phishing-defense"]?.completedAt && (progress?.missions["phishing-defense"]?.bestScore ?? 0) >= 75);

  useEffect(() => {
    refreshProgress();
    advancePhishingStory("TRAVEL_DIGITAL_CITY", "INSPECT_TERMINAL");
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => inputManager.onKeyDown(event);
    const up = (event: KeyboardEvent) => inputManager.onKeyUp(event);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      inputManager.dispose();
    };
  }, [inputManager]);

  const setInspectingState = (open: boolean) => {
    inputManager.setEnabled(!open);
    if (!open) inputManager.reset();
    setInspecting(open);
  };

  const inspectTerminal = () => {
    setInspectingState(true);
    if (typeof window !== "undefined") window.sessionStorage.setItem("nyrava-selected-mission", "phishing-defense");
    if (getPhishingStoryStep() === "INSPECT_TERMINAL") advancePhishingStory("INSPECT_TERMINAL", "COMPLETE_ACADEMY_LESSON");
    refreshProgress();
  };

  const solveIncident = () => {
    setDecision("correct");
    advancePhishingStory("SOLVE_INCIDENT", "RETURN_SARAH");
  };

  return (
    <div className="game-viewport city-viewport fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || inspecting || !(event.target instanceof HTMLCanvasElement)) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragging.current && !inspecting) inputManager.setCameraLook(event.movementX, event.movementY);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => {
          dragging.current = false;
          inputManager.reset();
        }}
        onLostPointerCapture={() => (dragging.current = false)}
      >
        <GameErrorBoundary>
          <Canvas frameloop={active ? "always" : "never"} shadows={quality.shadows} dpr={quality.dpr} camera={{ position: [0, 3, 5], fov: 58 }}>
            <DigitalCityScene
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputManager={inputManager}
              blocked={inspecting}
              onInspectMessage={inspectTerminal}
            />
          </Canvas>
        </GameErrorBoundary>
      </div>

      <div className="absolute top-4 left-4 z-40"><Link to="/isla"><Button variant="outline" size="sm" className="border-slate-800 bg-slate-950/80 text-white hover:bg-slate-800 font-bold"><ArrowLeft className="size-4 mr-1" /> Isla Central</Button></Link></div>

      {!inspecting && (
        <div className="mobile-game-controls pointer-events-none fixed inset-0 z-40">
          <div className="game-left pointer-events-auto"><AnalogJoystick target={inputManager.joystick} /></div>
          <div className="game-right pointer-events-auto"><LookPad target={inputManager} /></div>
          <div className="game-actions pointer-events-auto">
            <button type="button" className="game-action" aria-label="Interact" onClick={() => inputManager.triggerInteract()}>Use</button>
          </div>
        </div>
      )}

      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400"><AlertTriangle className="size-6" /><h2 className="text-xl font-black text-white">{es ? "Simulación de mensaje sospechoso" : "Suspicious Message Simulation"}</h2></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs font-mono space-y-2 text-slate-200">
              <p><span className="text-slate-500">From:</span> security-alert@nyrava-login-verify.com</p>
              <p><span className="text-slate-500">Subject:</span> URGENT: Account Suspension Notice</p>
              <p className="text-slate-300 pt-2 font-sans text-sm font-bold">“Your Guardian account will be suspended in 24 hours. Click below to verify your password immediately.”</p>
            </div>

            {!phishingPassed ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/50 p-4 space-y-3">
                <p className="text-sm font-black text-amber-300">{es ? "Entrenamiento requerido" : "Training Required"}</p>
                <p className="text-xs text-slate-300">{es ? "Antes de resolver el incidente, completa y aprueba Defensa contra phishing en la Academia." : "Before resolving the incident, complete and pass Phishing Defense in the Academy."}</p>
                <Link to="/classroom" onClick={() => window.sessionStorage.setItem("nyrava-selected-mission", "phishing-defense")}><Button className="w-full bg-amber-400 text-slate-950 font-black">{es ? "Ir a la Academia" : "Go to Academy"}</Button></Link>
              </div>
            ) : decision === null ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-400">{es ? "¿Qué acción debes tomar?" : "What action should you take?"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setDecision("incorrect")} variant="outline" className="border-rose-500/40 bg-rose-950/40 text-rose-300 font-bold text-xs">{es ? "Abrir enlace e iniciar sesión" : "Click Link & Sign In"}</Button>
                  <Button onClick={solveIncident} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs">{es ? "Reportar y eliminar" : "Report & Delete Message"}</Button>
                </div>
              </div>
            ) : decision === "correct" ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-center space-y-3">
                <p className="text-sm font-black text-emerald-400">🎉 {es ? "¡Decisión correcta!" : "Correct Choice!"}</p>
                <p className="text-xs text-slate-300">{es ? "Identificaste el dominio falso y reportaste el intento de phishing." : "You identified the fake domain and reported the phishing attempt."}</p>
                <Link to="/missions"><Button className="bg-cyan-500 text-slate-950 font-black text-xs">{es ? "Volver con Sarah" : "Return to Sarah"}</Button></Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/60 p-4 text-center space-y-3">
                <p className="text-sm font-black text-rose-400">⚠️ {es ? "Eso te llevaría al sitio falso" : "That would take you to the fake site"}</p>
                <Button onClick={() => setDecision(null)} variant="outline" className="border-slate-700 text-white font-bold text-xs">{es ? "Intentar de nuevo" : "Retry Action"}</Button>
              </div>
            )}
            <Button onClick={() => { setInspectingState(false); setDecision(null); }} variant="ghost" className="w-full text-slate-400">{es ? "Cerrar" : "Close"}</Button>
          </div>
        </div>
      )}

      <WorldLoading />
      <GameSettings />
      <PauseMenu />
    </div>
  );
}
