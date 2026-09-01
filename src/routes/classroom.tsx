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
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { AnalogJoystick, LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager } from "@/components/game/core/input-manager";
import { FullViewportCourseExperience } from "@/components/progression/full-course-experience";
import { PauseMenu } from "@/components/game/pause-menu";
import { missions } from "@/domain/progression/catalog";

export const Route = createFileRoute("/classroom")({ ssr: false, component: ClassroomPage });

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
  const [courseOpen, setCourseOpen] = useState(false);
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

  const startCourse = () => {
    const missionId = readSelectedMission();
    setSelectedMissionId(missionId);
    inputManager.setEnabled(false);
    setCourseOpen(true);
  };

  const exitCourse = () => {
    inputManager.setEnabled(true);
    inputManager.reset();
    setCourseOpen(false);
  };

  if (courseOpen) {
    return <FullViewportCourseExperience missionId={selectedMissionId} onExit={exitCourse} onComplete={() => undefined} />;
  }

  return (
    <div className="game-viewport classroom-viewport fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || !(event.target instanceof HTMLCanvasElement)) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          inputManager.setCameraLook(event.movementX, event.movementY);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => {
          dragging.current = false;
          inputManager.reset();
        }}
        onLostPointerCapture={() => (dragging.current = false)}
      >
        <GameErrorBoundary>
          <Canvas frameloop={active ? "always" : "never"} shadows={quality.shadows} dpr={quality.dpr} camera={{ position: [0, 2.5, 4.5], fov: 58 }}>
            <ClassroomScene
              room={currentRoom}
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
              inputManager={inputManager}
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
              inputManager.reset();
            }}
            className={"rounded-xl px-3 py-1.5 text-xs font-black transition " + (currentRoom === room.id ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white")}
          >
            {room.label}
          </button>
        ))}
      </div>

      <ClassHud room={currentRoom} activeInteraction={activeInteraction} activeSeatId={activeSeatId} />
      <div className="mobile-game-controls pointer-events-none fixed inset-0 z-40">
        <div className="game-left pointer-events-auto"><AnalogJoystick target={inputManager.joystick} /></div>
        <div className="game-right pointer-events-auto"><LookPad target={inputManager} /></div>
        <div className="game-actions pointer-events-auto">
          <button type="button" className="game-action" aria-label="Interact" onClick={() => inputManager.triggerInteract()}>Use</button>
        </div>
      </div>
      <WorldLoading />
      <GameSettings />
      <PauseMenu />
    </div>
  );
}
