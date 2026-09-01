import { Suspense, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "./character";
import { CLASS_GUARDIANS, type ClassGuardian } from "@/lib/class-guardians";
import { travelTo } from "@/lib/class-store";
import { PlayerController } from "@/components/game/core/player-controller";
import { updateThirdPersonCamera } from "@/components/game/core/camera-follower";
import { type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { InteractionManager, type InteractiveTarget } from "@/components/game/core/interaction-manager";
import { CLASSROOM_BOUNDS, isPositionColliding } from "@/components/game/player/classroom-collision";
import { STUDENT_SEATS, CLASSROOM_DOORS } from "./academy-classroom-set";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="rounded-full border border-cyan-400/40 bg-slate-950/90 px-4 py-2 font-mono text-sm text-cyan-300 backdrop-blur">
        Loading Classroom… {Math.round(progress)}%
      </div>
    </Html>
  );
}

function TeacherNpc({
  guardian,
  position,
  rotation = 0.3,
}: {
  guardian: ClassGuardian;
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation-y={rotation}>
      <Character color={guardian.color} clip="idle" guardianId={guardian.id} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.9, 1.15, 48]} />
        <meshStandardMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      <Html position={[0, 2.5, 0]} center distanceFactor={14} occlude={false}>
        <div className="pointer-events-none select-none text-center">
          <span
            className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest shadow-lg"
            style={{ color: guardian.color, background: "rgba(2,6,23,0.85)", border: `1px solid ${guardian.color}40` }}
          >
            {guardian.name} · {guardian.role}
          </span>
        </div>
      </Html>
    </group>
  );
}

const playerController = new PlayerController();
const interactionManager = new InteractionManager();

export function ClassroomScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
  inputState,
  playerMode = "idle",
  cameraYaw = 0,
  cameraPitch = 0.15,
  onStartCourse,
  activeSeatId,
  setActiveSeatId,
  openDoorIds,
  setOpenDoorIds,
  setActiveInteraction,
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
  inputState: GameInputState;
  playerMode?: PlayerMode;
  cameraYaw?: number;
  cameraPitch?: number;
  onStartCourse?: () => void;
  activeSeatId?: string | null;
  setActiveSeatId?: (id: string | null) => void;
  openDoorIds?: Set<string>;
  setOpenDoorIds?: (updater: (prev: Set<string>) => Set<string>) => void;
  setActiveInteraction?: (interaction: { id: string; type: string; label: { en: string; es: string }; action: () => void } | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (group.current) {
      group.current.position.set(0, 0, 0);
    }
  }, []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    playerController.update(
      player.position,
      camera,
      inputState,
      playerMode,
      delta,
      CLASSROOM_BOUNDS,
      (nextPos) => isPositionColliding(nextPos, 0.45)
    );

    if (!activeSeatId) {
      player.rotation.y = playerController.rotationY;
    }

    if (playerController.isMoving !== moving) {
      setMoving(playerController.isMoving);
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      updateThirdPersonCamera(
        camera,
        player.position,
        cameraYaw,
        cameraPitch,
        delta,
        4.5,
        1.5,
        [],
        { minX: -11.0, maxX: 11.0, minY: 0.8, maxY: 4.4, minZ: -8.0, maxZ: 8.0 }
      );
    }

    // INTERACTION PRIORITY VIA GAME CORE INTERACTION MANAGER
    const pPos: [number, number, number] = [player.position.x, player.position.y, player.position.z];

    const targets: InteractiveTarget[] = [];

    // Seated action (priority 100)
    if (activeSeatId) {
      targets.push({
        id: "stand-action",
        type: "seat",
        position: pPos,
        range: 1.0,
        priority: 100,
        label: { en: "Press E to Stand", es: "Presiona E para levantarte" },
        action: () => {
          const seat = STUDENT_SEATS.find((s) => s.id === activeSeatId);
          if (seat && group.current) {
            group.current.position.set(...seat.standPosition);
          }
          setActiveSeatId?.(null);
        },
      });
    }

    // Front Board (priority 80)
    targets.push({
      id: "board-action",
      type: "lesson",
      position: [0, 0, -6.5],
      range: 3.2,
      priority: 80,
      label: { en: "Press E to View Class", es: "Presiona E para ver la clase" },
      action: () => onStartCourse?.(),
    });

    // Doors (priority 60)
    for (const d of CLASSROOM_DOORS) {
      const isOpen = Boolean(openDoorIds?.has(d.id));
      targets.push({
        id: `door-${d.id}`,
        type: "door",
        position: d.position,
        range: 2.5,
        priority: 60,
        label: isOpen
          ? { en: "Press E to Close Door", es: "Presiona E para cerrar la puerta" }
          : { en: "Press E to Open Door", es: "Presiona E para abrir la puerta" },
        action: () => {
          setOpenDoorIds?.((prev) => {
            const next = new Set(prev);
            if (next.has(d.id)) next.delete(d.id);
            else next.add(d.id);
            return next;
          });
        },
      });
    }

    // Chairs (priority 40)
    for (const s of STUDENT_SEATS) {
      targets.push({
        id: `seat-${s.id}`,
        type: "seat",
        position: s.position,
        range: 2.0,
        priority: 40,
        label: { en: "Press E to Sit", es: "Presiona E para sentarte" },
        action: () => {
          if (group.current) {
            group.current.position.set(...s.seatPosition);
            group.current.rotation.y = s.seatRotation;
          }
          setActiveSeatId?.(s.id);
        },
        enabled: !activeSeatId,
      });
    }

    // Portal (priority 20)
    targets.push({
      id: "portal-action",
      type: "portal",
      position: [11.2, 0, 2.0],
      range: 2.5,
      priority: 20,
      label: { en: "Press E to Enter Mission Hub", es: "Presiona E para entrar al Mission Hub" },
      action: () => travelTo("isla"),
    });

    const best = interactionManager.getBestInteraction(pPos, targets);
    if (best) {
      setActiveInteraction?.({
        id: best.id,
        type: best.type,
        label: best.label,
        action: best.action,
      });
      if (inputState.interactPressed) {
        best.action();
      }
    } else {
      setActiveInteraction?.(null);
    }
  });

  const teacher = CLASS_GUARDIANS.find((g) => g.id === "sarah") ?? CLASS_GUARDIANS[0]!;

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 20, 50]} />

      <Suspense fallback={<Loader />}>
        <TeacherNpc guardian={teacher} position={[-4.5, 0.4, -8.2]} rotation={0.3} />

        <group ref={group} position={[0, 0, 0]}>
          <Character color={playerColor} clip={moving ? "walk" : "idle"} guardianId={guardianId} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.55, 0.72, 40]} />
            <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 1.7, 0]} color={playerColor} intensity={4} distance={5} />
          <Html position={[0, 2.35, 0]} center distanceFactor={14}>
            <span className="pointer-events-none select-none rounded-full border border-cyan-400/30 bg-slate-950/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-300 backdrop-blur">
              {playerLabel}
            </span>
          </Html>
        </group>
      </Suspense>
    </>
  );
}
