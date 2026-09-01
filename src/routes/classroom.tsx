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
import { AnalogJoystick, LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { InputManager, type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
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
  const [inputState, setInputState] = useState<GameInputState>(() => inputManager.getSnapshot());
  const [mode, setMode] = useState<PlayerMode>("idle");
  const [cameraYaw, setCameraYaw] = useState(controls.cameraYaw);
  const [cameraPitch, setCameraPitch] = useState(controls.cameraPitch);
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
    const interval = window.setInterval(() => {
      inputManager.joystickX = controls.joystick.x;
      inputManager.joystickY = controls.joystick.y;
      const snap = inputManager.getSnapshot();
      setInputState(snap);
      setCameraYaw((previous) => previous === controls.cameraYaw ? previous : controls.cameraYaw);
      setCameraPitch((previous) => previous === controls.cameraPitch ? previous : controls.cameraPitch);
      if (mode !== "course") {
        setMode(activeSeatId ? "seated" : snap.moveX !== 0 || snap.moveY !== 0 ? (snap.run ? "running" : "walking") : "idle");
      }
    }, 32);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(interval);
      controls.joystick.x = 0;
      controls.joystick.y = 0;
      inputManager.dispose();
    };
  }, [inputManager, mode, activeSeatId]);

  const startCourse = () => {
    const missionId = readSelectedMission();
    setSelectedMissionId(missionId);
    controls.joystick.x = 0;
    controls.joystick.y = 0;
    inputManager.reset();
    setMode("course");
  };

  if (mode === "course") {
    return <FullViewportCourseExperience missionId={selectedMissionId} onExit={() => setMode("idle")} onComplete={() => undefined} />;
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
          controls.cameraYaw -= event.movementX * 0.005;
          controls.cameraPitch = Math.min(0.85, Math.max(-0.15, controls.cameraPitch + event.movementY * 0.003));
          setCameraYaw(controls.cameraYaw);
          setCameraPitch(controls.cameraPitch);
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
              controls.joystick.x = 0;
              controls.joystick.y = 0;
            }}
            className={"rounded-xl px-3 py-1.5 text-xs font-black transition " + (currentRoom === room.id ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white")}
          >
            {room.label}
          </button>
        ))}
      </div>

      <ClassHud room={currentRoom} activeInteraction={activeInteraction} activeSeatId={activeSeatId} />
      <div className="mobile-game-controls pointer-events-none fixed inset-0 z-40">
        <div className="game-left pointer-events-auto"><AnalogJoystick target={controls.joystick} /></div>
        <div className="game-right pointer-events-auto"><LookPad target={controls} /></div>
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
