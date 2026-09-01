import { createFileRoute, Link } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { Award, ArrowLeft, Trophy, Package } from "lucide-react";
import { HomeHqScene } from "@/components/hq/home-hq-scene";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/home-hq")({
  ssr: false,
  component: HomeHqPage,
});

function HomeHqPage() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const dragging = useRef(false);
  const { guardianId, guardianName, xp } = useGuardian();
  const chosen = CLASS_GUARDIANS.find((g) => g.id === guardianId);
  const playerColor = chosen?.color ?? "#f4f7ff";
  const playerLabel = `${guardianName || "You"}${chosen ? ` · ${chosen.name}` : ""}`;

  const inputManager = useMemo(() => new InputManager(), []);
  const [inputState, setInputState] = useState<GameInputState>(() => inputManager.getSnapshot());

  const [mode, setMode] = useState<PlayerMode>("idle");
  const [cameraYaw, setCameraYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0.15);

  useEffect(() => {
    const down = (e: KeyboardEvent) => inputManager.onKeyDown(e);
    const up = (e: KeyboardEvent) => inputManager.onKeyUp(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const interval = setInterval(() => {
      const snap = inputManager.getSnapshot();
      setInputState(snap);
    }, 16);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      clearInterval(interval);
      inputManager.reset();
    };
  }, [inputManager]);

  return (
    <div className="game-viewport hq-viewport fixed inset-0 bg-background font-sans text-slate-100">
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
            camera={{ position: [0, 2.5, 4.5], fov: 58 }}
          >
            <HomeHqScene
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputState={inputState}
              playerMode={mode}
              cameraYaw={cameraYaw}
              cameraPitch={cameraPitch}
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

      <div className="absolute bottom-6 left-6 z-40 w-96 rounded-3xl border border-amber-500/40 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-950 border border-amber-500/50 text-amber-400 font-black text-lg">
              L12
            </div>
            <div>
              <h3 className="text-base font-black text-white">{guardianName || "Guardian"}</h3>
              <p className="text-xs font-bold text-amber-400">Master Protector</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-950 border border-amber-500/40 px-3 py-1 text-xs font-black text-amber-300">
            {xp || 400} XP
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-extrabold text-slate-300">
            <span>Rank Level Progress</span>
            <span>400 / 1000 XP</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="h-full bg-amber-400 w-[40%] rounded-full shadow-lg" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="flex flex-col items-center rounded-xl bg-slate-900/80 p-2 border border-slate-800 text-center">
            <Trophy className="size-5 text-amber-400 mb-1" />
            <span className="text-[10px] font-black text-slate-200">1 Trophy</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-900/80 p-2 border border-slate-800 text-center">
            <Award className="size-5 text-cyan-400 mb-1" />
            <span className="text-[10px] font-black text-slate-200">1 Certificate</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-900/80 p-2 border border-slate-800 text-center">
            <Package className="size-5 text-emerald-400 mb-1" />
            <span className="text-[10px] font-black text-slate-200">3 Items</span>
          </div>
        </div>
      </div>

      <WorldLoading />
      <GameSettings />
    </div>
  );
}
