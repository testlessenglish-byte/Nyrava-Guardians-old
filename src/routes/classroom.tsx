import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { ClassroomScene, type ClassroomRoom } from "@/components/meta/classroom-scene";
import { AcademyClassroomSet } from "@/components/meta/academy-classroom-set";
import { BuilderLabSet } from "@/components/meta/builder-lab-set";
import { CommunicationStudioSet } from "@/components/meta/communication-studio-set";
import { TruthLabSet } from "@/components/meta/truth-lab-set";
import { ClassHud } from "@/components/meta/class-hud";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { controls } from "@/lib/class-store";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { FullViewportCourseExperience } from "@/components/progression/full-course-experience";
import { PauseMenu } from "@/components/game/pause-menu";
import { missions } from "@/domain/progression/catalog";

export const Route = createFileRoute("/classroom")({
  ssr: false,
  component: ClassroomPage,
});

function readSelectedMission() {
  if (typeof window === "undefined") return missions[0]!.id;
  const saved = window.sessionStorage.getItem("nyrava-selected-mission");
  return missions.some((mission) => mission.id === saved) ? saved! : missions[0]!.id;
}

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
  const [currentRoom, setCurrentRoom] = useState<ClassroomRoom>("security");
  const [selectedMissionId, setSelectedMissionId] = useState(readSelectedMission);
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

    const interval = window.setInterval(() => {
      const snap = inputManager.getSnapshot();
      setInputState(snap);
      if (mode !== "course") {
        setMode(activeSeatId ? "seated" : snap.moveX !== 0 || snap.moveY !== 0 ? (snap.run ? "running" : "walking") : "idle");
      }
    }, 32);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(interval);
      inputManager.reset();
    };
  }, [inputManager, mode, activeSeatId]);

  const startCourse = () => {
    const missionId = readSelectedMission();
    setSelectedMissionId(missionId);
    setMode("course");
  };

  if (mode === "course") {
    return (
      <FullViewportCourseExperience
        missionId={selectedMissionId}
        onExit={() => setMode("idle")}
        onComplete={() => undefined}
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
          <Canvas frameloop={active ? "always" : "never"} shadows={quality.shadows} dpr={quality.dpr} camera={{ position: [0, 2.5, 4.5], fov: 58 }}>
            <ClassroomScene
              room={currentRoom}
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputState={inputState}
              playerMode={mode}
              cameraYaw={cameraYaw}
              cameraPitch={cameraPitch}
              onStartCourse={startCourse}
              activeSeatId={activeSeatId}
              setActiveSeatId={setActiveSeatId}
              openDoorIds={openDoorIds}
              setOpenDoorIds={setOpenDoorIds}
              setActiveInteraction={setActiveInteraction}
            />
            {currentRoom === "security" && <AcademyClassroomSet activeSeatId={activeSeatId} openDoorIds={openDoorIds} />}
            {currentRoom === "builder" && <BuilderLabSet activeSeatId={activeSeatId} openDoorIds={openDoorIds} />}
            {currentRoom === "communication" && <CommunicationStudioSet activeSeatId={activeSeatId} openDoorIds={openDoorIds} />}
            {currentRoom === "truth" && <TruthLabSet activeSeatId={activeSeatId} openDoorIds={openDoorIds} />}
          </Canvas>
        </GameErrorBoundary>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/85 p-1.5 backdrop-blur-md shadow-xl">
        {[
          { id: "security", label: "🛡️ Command Center" },
          { id: "builder", label: "💻 Builder Lab" },
          { id: "communication", label: "💬 Studio" },
          { id: "truth", label: "🔍 Truth Lab" },
        ].map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => {
              setCurrentRoom(room.id as ClassroomRoom);
              setActiveSeatId(null);
              setOpenDoorIds(new Set());
            }}
            className={"rounded-xl px-3 py-1.5 text-xs font-black transition " +
              (currentRoom === room.id ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white")}
          >
            {room.label}
          </button>
        ))}
      </div>

      <ClassHud activeInteraction={activeInteraction} activeSeatId={activeSeatId} />
      <div className="mobile-game-controls game-right z-40"><LookPad target={controls} /></div>
      <WorldLoading />
      <GameSettings />
      <PauseMenu />
    </div>
  );
}
