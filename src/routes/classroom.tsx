import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { ClassroomScene } from "@/components/meta/classroom-scene";
import { AcademyClassroomSet } from "@/components/meta/academy-classroom-set";
import { ClassHud } from "@/components/meta/class-hud";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { FullViewportCourseExperience } from "@/components/progression/full-course-experience";

export const Route = createFileRoute("/classroom")({
  ssr: false,
  component: ClassroomPage,
});

function ClassroomPage() {
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
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);
  const [openDoorIds, setOpenDoorIds] = useState<Set<string>>(new Set());
  const [activeInteraction, setActiveInteraction] = useState<{
    id: string;
    type: string;
    label: { en: string; es: string };
    action: () => void;
  } | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => inputManager.onKeyDown(e);
    const up = (e: KeyboardEvent) => inputManager.onKeyUp(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const interval = setInterval(() => {
      const snap = inputManager.getSnapshot();
      setInputState(snap);
      if (mode !== "course") {
        setMode(activeSeatId ? "seated" : snap.moveX !== 0 || snap.moveY !== 0 ? (snap.run ? "running" : "walking") : "idle");
      }
    }, 16);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      clearInterval(interval);
      inputManager.reset();
    };
  }, [inputManager, mode, activeSeatId]);

  if (mode === "course") {
    return (
      <FullViewportCourseExperience
        onExit={() => setMode("idle")}
        onComplete={() => setMode("idle")}
      />
    );
  }

  return (
    <div className="game-viewport classroom-viewport fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current && mode !== "course") {
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
            camera={{ position: [0, 5, 13], fov: 58 }}
          >
            <ClassroomScene
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputState={inputState}
              playerMode={mode}
              cameraYaw={cameraYaw}
              cameraPitch={cameraPitch}
              onStartCourse={() => setMode("course")}
              activeSeatId={activeSeatId}
              setActiveSeatId={setActiveSeatId}
              openDoorIds={openDoorIds}
              setOpenDoorIds={setOpenDoorIds}
              setActiveInteraction={setActiveInteraction}
            />
            <AcademyClassroomSet
              activeSeatId={activeSeatId}
              openDoorIds={openDoorIds}
            />
          </Canvas>
        </GameErrorBoundary>
      </div>

      <ClassHud
        activeInteraction={activeInteraction}
        activeSeatId={activeSeatId}
      />

      <div className="mobile-game-controls game-right z-40">
        <LookPad target={{ cameraYaw, cameraPitch, joystick: { x: 0, y: 0 } }} />
      </div>
      <WorldLoading />
      <GameSettings />
    </div>
  );
}
