import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { ClassroomScene } from "@/components/meta/classroom-scene";
import { AcademyClassroomSet } from "@/components/meta/academy-classroom-set";
import { ClassHud } from "@/components/meta/class-hud";
import { controls } from "@/lib/class-store";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { isTypingTarget } from "@/services/game/input";
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

  const [mode, setMode] = useState<"classroom" | "course">("classroom");
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);
  const [openDoorIds, setOpenDoorIds] = useState<Set<string>>(new Set());
  const [activeInteraction, setActiveInteraction] = useState<{
    type: string;
    label: { en: string; es: string };
    action: () => void;
  } | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (mode === "course") return; // Disable movement in course mode
      if (e.key.startsWith("Arrow")) e.preventDefault();
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) controls.keys.add(key);
      if (key === "arrowup") controls.keys.add("w");
      if (key === "arrowdown") controls.keys.add("s");
      if (key === "arrowleft") controls.keys.add("a");
      if (key === "arrowright") controls.keys.add("d");
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      controls.keys.delete(key);
      if (key === "arrowup") controls.keys.delete("w");
      if (key === "arrowdown") controls.keys.delete("s");
      if (key === "arrowleft") controls.keys.delete("a");
      if (key === "arrowright") controls.keys.delete("d");
    };
    const blur = () => controls.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      controls.keys.clear();
    };
  }, [mode]);

  // DEDICATED FULL-SCREEN OPAQUE COURSE MODE
  if (mode === "course") {
    return (
      <FullViewportCourseExperience
        onExit={() => setMode("classroom")}
        onComplete={() => setMode("classroom")}
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
          if (dragging.current && mode === "classroom") {
            controls.cameraYaw -= e.movementX * 0.005;
            controls.cameraPitch += e.movementY * 0.003;
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
        <LookPad target={controls} />
      </div>
      <WorldLoading />
      <GameSettings />
    </div>
  );
}
