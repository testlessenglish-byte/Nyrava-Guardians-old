import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "./character";
import { CLASS_GUARDIANS, type ClassGuardian } from "@/lib/class-guardians";
import { PlayerController } from "@/components/game/core/player-controller";
import { updateThirdPersonCamera } from "@/components/game/core/camera-follower";
import { type InputManager } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";
import { InteractionManager, type InteractiveTarget } from "@/components/game/core/interaction-manager";
import { CLASSROOM_TRAVEL_BOUNDS, isRoomPositionColliding } from "@/components/game/player/classroom-collision";
import { STUDENT_SEATS, CLASSROOM_DOORS } from "./academy-classroom-set";
import { BUILDER_SEATS, BUILDER_DOORS } from "./builder-lab-set";
import { COMMUNICATION_SEATS, COMMUNICATION_DOORS } from "./communication-studio-set";
import { TRUTH_SEATS, TRUTH_DOORS } from "./truth-lab-set";

export type ClassroomRoom = "security" | "builder" | "communication" | "truth";

const PLAYER_SPAWN: [number, number, number] = [0, 0, 5.2];
const CAMERA_BOUNDS = { minX: -12.3, maxX: 12.3, minY: 1.0, maxY: 4.4, minZ: -9.1, maxZ: 14.0 };
const EMPTY_OPEN_DOORS = new Set<string>();

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

/**
 * Authoritative Teacher NPC (Sarah)
 * Anchored to world position [-4.2, 0, -6.8] with 3D text label.
 */
function TeacherNpc({ guardian, position, rotation = 0.2 }: { guardian: ClassGuardian; position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Character color={guardian.color} clip="idle" guardianId={guardian.id} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.7, 0.95, 36]} />
        <meshStandardMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      {/* 3D World Space Label anchored to Sarah's head */}
      <group position={[0, 2.15, 0]}>
        <Text fontSize={0.16} color={guardian.color} anchorX="center" anchorY="middle" letterSpacing={0.06}>
          {`${guardian.name} · ${guardian.role}`}
        </Text>
      </group>
    </group>
  );
}

const playerController = new PlayerController();
const interactionManager = new InteractionManager();

export function ClassroomScene({
  room = "security",
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
  inputManager,
  onStartCourse,
  activeSeatId,
  setActiveSeatId,
  openDoorIds,
  setOpenDoorIds,
  setActiveInteraction,
}: {
  room?: ClassroomRoom;
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
  inputManager: InputManager;
  onStartCourse?: (() => void) | undefined;
  activeSeatId?: string | null;
  setActiveSeatId?: (id: string | null) => void;
  openDoorIds?: Set<string>;
  setOpenDoorIds?: (updater: (prev: Set<string>) => Set<string>) => void;
  setActiveInteraction?: (interaction: { id: string; type: string; label: { en: string; es: string }; action: () => void } | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const lastInteractionKey = useRef<string | null>(null);
  const [moving, setMoving] = useState(false);

  const roomData = useMemo(() => {
    if (room === "builder") return { seats: BUILDER_SEATS, doors: BUILDER_DOORS, teacherId: "jacob" };
    if (room === "communication") return { seats: COMMUNICATION_SEATS, doors: COMMUNICATION_DOORS, teacherId: "dayana" };
    if (room === "truth") return { seats: TRUTH_SEATS, doors: TRUTH_DOORS, teacherId: "nova" };
    return { seats: STUDENT_SEATS, doors: CLASSROOM_DOORS, teacherId: "sarah" };
  }, [room]);

  useEffect(() => {
    if (group.current) {
      group.current.position.set(...PLAYER_SPAWN);
      group.current.rotation.y = Math.PI;
    }
    playerController.velocity.set(0, 0, 0);
    playerController.rotationY = Math.PI;
    inputManager.reset();
    inputManager.cameraYaw = 0;
    inputManager.cameraPitch = 0.12;
    lastInteractionKey.current = null;
    setActiveInteraction?.(null);
  }, [room, inputManager, setActiveInteraction]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    const input = inputManager.getSnapshot();
    const mode: PlayerMode = activeSeatId
      ? "seated"
      : input.moveX !== 0 || input.moveY !== 0
        ? input.run ? "running" : "walking"
        : "idle";
    const currentOpenDoors = openDoorIds ?? EMPTY_OPEN_DOORS;

    playerController.update(
      player.position,
      camera,
      input,
      mode,
      delta,
      CLASSROOM_TRAVEL_BOUNDS,
      (nextPos) => isRoomPositionColliding(room, nextPos, currentOpenDoors, 0.45),
    );

    if (!activeSeatId) player.rotation.y = playerController.rotationY;
    if (playerController.isMoving !== moving) setMoving(playerController.isMoving);

    if (camera instanceof THREE.PerspectiveCamera) {
      updateThirdPersonCamera(
        camera,
        player.position,
        inputManager.cameraYaw,
        inputManager.cameraPitch,
        delta,
        5.7,
        1.35,
        [],
        CAMERA_BOUNDS,
      );
    }

    const pPos: [number, number, number] = [player.position.x, player.position.y, player.position.z];
    const targets: InteractiveTarget[] = [];

    if (activeSeatId) {
      targets.push({
        id: "stand-action",
        type: "seat",
        position: pPos,
        range: 1,
        priority: 100,
        label: { en: "Press E to Stand", es: "Presiona E para levantarte" },
        action: () => {
          const seat = roomData.seats.find((item) => item.id === activeSeatId);
          if (seat && group.current) group.current.position.set(...seat.standPosition);
          setActiveSeatId?.(null);
        },
      });
    }

    targets.push({
      id: `board-${room}`,
      type: "lesson",
      position: [0, 0, -6.8],
      range: 3.0,
      priority: 80,
      label: { en: "Press E to Talk to Sarah / Start Class", es: "Presiona E para hablar con Sarah / Iniciar clase" },
      action: () => onStartCourse?.(),
    });

    for (const door of roomData.doors) {
      const isOpen = currentOpenDoors.has(door.id);
      targets.push({
        id: `door-${door.id}`,
        type: "door",
        position: door.position,
        range: 2.5,
        priority: 60,
        label: isOpen
          ? { en: "Press E to Close Door", es: "Presiona E para cerrar la puerta" }
          : { en: "Press E to Open Door", es: "Presiona E para abrir la puerta" },
        action: () => setOpenDoorIds?.((prev) => {
          const next = new Set(prev);
          if (next.has(door.id)) next.delete(door.id);
          else next.add(door.id);
          return next;
        }),
      });
    }

    for (const seat of roomData.seats) {
      targets.push({
        id: `seat-${seat.id}`,
        type: "seat",
        position: seat.position,
        range: 2,
        priority: 40,
        label: { en: "Press E to Sit", es: "Presiona E para sentarte" },
        action: () => {
          if (group.current) {
            group.current.position.set(...seat.seatPosition);
            group.current.rotation.y = seat.seatRotation;
          }
          setActiveSeatId?.(seat.id);
        },
        enabled: !activeSeatId,
      });
    }

    targets.push({
      id: "portal-action",
      type: "portal",
      position: [11.2, 0, 2.0],
      range: 2.5,
      priority: 20,
      label: { en: "Press E / Tap to Enter Mission Hub", es: "Presiona E / Toca para entrar al Centro de Misiones" },
      action: () => {
        if (typeof window !== "undefined") window.location.assign("/missions");
      },
    });

    const best = interactionManager.getBestInteraction(pPos, targets);
    const nextKey = best ? `${best.id}:${best.label.en}` : null;
    if (nextKey !== lastInteractionKey.current) {
      lastInteractionKey.current = nextKey;
      setActiveInteraction?.(best ? { id: best.id, type: best.type, label: best.label, action: best.action } : null);
    }
    if (best && input.interactPressed) best.action();
  });

  const teacher = CLASS_GUARDIANS.find((guardian) => guardian.id === roomData.teacherId) ?? CLASS_GUARDIANS[0]!;

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 22, 52]} />
      <Suspense fallback={<Loader />}>
        {/* Sarah standing cleanly near front teaching area */}
        <TeacherNpc guardian={teacher} position={[-4.2, 0.25, -6.8]} rotation={0.2} />

        {/* Player Avatar */}
        <group ref={group} position={PLAYER_SPAWN} rotation-y={Math.PI}>
          <Character color={playerColor} clip={moving ? "walk" : "idle"} guardianId={guardianId} height={1.7} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.55, 0.72, 40]} />
            <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 1.7, 0]} color={playerColor} intensity={4} distance={5} />
          {/* 3D World Space Player Label anchored to player head */}
          <group position={[0, 2.15, 0]}>
            <Text fontSize={0.16} color="#38bdf8" anchorX="center" anchorY="middle" letterSpacing={0.05}>
              {playerLabel}
            </Text>
          </group>
        </group>
      </Suspense>
    </>
  );
}
