import { createFileRoute } from "@tanstack/react-router";
import { PauseMenu } from "@/components/game/pause-menu";
import { StoryTrackerHud } from "@/components/mission/story-tracker-hud";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";

import { IslaScene } from "@/components/isla/isla-scene";
import { IslaHud } from "@/components/isla/isla-hud";
import { IslaControls } from "@/components/isla/isla-controls";
import { hydrateIsla } from "@/lib/isla-store";
import { useGuardian } from "@/lib/guardian-context";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { GuardianJourney } from "@/components/progression/guardian-journey";
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { advancePhishingStory } from "@/lib/phishing-story-state";

export const Route = createFileRoute("/isla")({ ssr: false, component: IslaCentral });

function IslaCentral() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const { guardianId, guardianName } = useGuardian();
  const guardian = CLASS_GUARDIANS.find((g) => g.id === guardianId) ?? CLASS_GUARDIANS[0]!;
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragDist = useRef(0);
  const [mounted, setMounted] = useState(false);
  const inputManager = useMemo(() => new InputManager(), []);
  const [inputState, setInputState] = useState<GameInputState>(() => inputManager.getSnapshot());
  const [cameraYaw, setCameraYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0.2);
  const [playerMode, setPlayerMode] = useState<PlayerMode>("idle");

  useEffect(() => {
    setMounted(true);
    hydrateIsla();
    advancePhishingStory("SPAWN_ISLA", "GOTO_MISSION_HUB");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => inputManager.onKeyDown(e);
    const up = (e: KeyboardEvent) => inputManager.onKeyUp(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const interval = window.setInterval(() => {
      const snap = inputManager.getSnapshot();
      setInputState(snap);
      setPlayerMode(snap.moveX !== 0 || snap.moveY !== 0 ? (snap.run ? "running" : "walking") : "idle");
    }, 32);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(interval);
      inputManager.dispose();
    };
  }, [inputManager]);

  return (
    <div
      ref={wrap}
      className="game-viewport fixed inset-0 z-50 touch-none bg-background"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || !(e.target instanceof HTMLCanvasElement)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        dragDist.current = 0;
      }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerLeave={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; inputManager.reset(); }}
      onLostPointerCapture={() => { dragging.current = false; }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
        setCameraYaw((prev) => prev - e.movementX * 0.005);
        setCameraPitch((prev) => Math.min(0.85, Math.max(-0.15, prev + e.movementY * 0.003)));
      }}
    >
      {mounted && (
        <GameErrorBoundary>
          <Canvas frameloop={active ? "always" : "never"} shadows={quality.shadows} dpr={quality.dpr} camera={{ position: [0, 8, 24], fov: 58 }}>
            <IslaScene playerColor={guardian.color} playerName={guardianName || "Alex"} playerGuardian={guardian.id} inputState={inputState} playerMode={playerMode} cameraYaw={cameraYaw} cameraPitch={cameraPitch} />
          </Canvas>
          <IslaHud guardianName={guardianName || "Alex"} />
          <IslaControls guardianName={guardianName || "Alex"} />
          <StoryTrackerHud />
          <GuardianJourney />
          <WorldLoading />
          <GameSettings />
          <PauseMenu />
        </GameErrorBoundary>
      )}
    </div>
  );
}
