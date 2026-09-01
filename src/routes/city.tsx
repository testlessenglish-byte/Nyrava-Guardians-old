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
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/city")({
  ssr: false,
  component: DigitalCityPage,
});

function DigitalCityPage() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const dragging = useRef(false);
  const { guardianId, guardianName } = useGuardian();
  const chosen = CLASS_GUARDIANS.find((g) => g.id === guardianId);
  const playerColor = chosen?.color ?? "#f4f7ff";
  const playerLabel = `${guardianName || "You"}${chosen ? ` · ${chosen.name}` : ""}`;

  const inputManager = useMemo(() => new InputManager(), []);
  const [inputState, setInputState] = useState<GameInputState>(() => inputManager.getSnapshot());

  const [mode, setMode] = useState<PlayerMode>("idle");
  const [cameraYaw, setCameraYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0.15);
  const [inspecting, setInspecting] = useState(false);
  const [decision, setDecision] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => inputManager.onKeyDown(e);
    const up = (e: KeyboardEvent) => inputManager.onKeyUp(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const interval = setInterval(() => {
      const snap = inputManager.getSnapshot();
      setInputState(snap);
      setMode(snap.moveX !== 0 || snap.moveY !== 0 ? (snap.run ? "running" : "walking") : "idle");
    }, 16);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      clearInterval(interval);
      inputManager.reset();
    };
  }, [inputManager]);

  return (
    <div className="game-viewport city-viewport fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current) {
            setCameraYaw((prev) => prev - e.movementX * 0.005);
            setCameraPitch((prev) => Math.min(0.85, Math.max(-0.15, prev + e.movementY * 0.003)));
          }
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onLostPointerCapture={() => (dragging.current = false)}
      >
        <GameErrorBoundary>
          <Canvas
            frameloop={active ? "always" : "never"}
            shadows={quality.shadows}
            dpr={quality.dpr}
            camera={{ position: [0, 3, 5], fov: 58 }}
          >
            <DigitalCityScene
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputState={inputState}
              playerMode={mode}
              cameraYaw={cameraYaw}
              cameraPitch={cameraPitch}
              onInspectMessage={() => setInspecting(true)}
            />
          </Canvas>
        </GameErrorBoundary>
      </div>

      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <Link to="/isla">
          <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950/80 text-white hover:bg-slate-800 font-bold">
            <ArrowLeft className="size-4 mr-1" /> Isla Central
          </Button>
        </Link>
      </div>

      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="size-6" />
              <h2 className="text-xl font-black text-white">Suspicious Message Simulation</h2>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs font-mono space-y-2 text-slate-200">
              <p><span className="text-slate-500">From:</span> security-alert@nyrava-login-verify.com</p>
              <p><span className="text-slate-500">Subject:</span> URGENT: Account Suspension Notice</p>
              <p className="text-slate-300 pt-2 font-sans text-sm font-bold">"Your Guardian account will be suspended in 24 hours. Click below to verify your password immediately."</p>
            </div>

            {decision === null ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-400">What action should you take?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setDecision("incorrect")}
                    variant="outline"
                    className="border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900 font-bold text-xs"
                  >
                    Click Link & Sign In
                  </Button>
                  <Button
                    onClick={() => setDecision("correct")}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                  >
                    Report & Delete Message
                  </Button>
                </div>
              </div>
            ) : decision === "correct" ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-center space-y-3">
                <p className="text-sm font-black text-emerald-400">🎉 Correct Choice!</p>
                <p className="text-xs text-slate-300">You correctly identified the fake domain <code className="text-cyan-300">nyrava-login-verify.com</code> and reported the phishing scam!</p>
                <Button onClick={() => { setInspecting(false); setDecision(null); }} className="bg-cyan-500 text-slate-950 font-black text-xs">
                  Continue Exploring City
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/60 p-4 text-center space-y-3">
                <p className="text-sm font-black text-rose-400">⚠️ Phishing Warning!</p>
                <p className="text-xs text-slate-300">Never enter credentials on untrusted domains! Review Phishing Defense training at the Academy.</p>
                <Button onClick={() => setDecision(null)} variant="outline" className="border-slate-700 text-white font-bold text-xs">
                  Retry Action
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <WorldLoading />
      <GameSettings />
    </div>
  );
}
