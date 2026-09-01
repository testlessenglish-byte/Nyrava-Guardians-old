import { Suspense, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "./character";
import { CLASS_GUARDIANS, type ClassGuardian } from "@/lib/class-guardians";
import { controls, travelTo } from "@/lib/class-store";
import { PlayerController } from "@/components/game/player/third-person-controller";
import { updateFollowCamera } from "@/components/game/player/camera-follower";
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

export function ClassroomScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
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
  onStartCourse?: () => void;
  activeSeatId?: string | null;
  setActiveSeatId?: (id: string | null) => void;
  openDoorIds?: Set<string>;
  setOpenDoorIds?: (updater: (prev: Set<string>) => Set<string>) => void;
  setActiveInteraction?: (interaction: { type: string; label: { en: string; es: string }; action: () => void } | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (group.current) {
      group.current.position.set(0, 0, 0);
    }
    controls.player.x = 0;
    controls.player.z = 0;
  }, []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    playerController.playerState = activeSeatId ? "seated" : "walking";

    const keys = controls.keys;
    const input = {
      forward: keys.has("w"),
      backward: keys.has("s"),
      left: keys.has("a"),
      right: keys.has("d"),
      running: keys.has("shift"),
      joystickX: controls.joystick.x,
      joystickY: controls.joystick.y,
    };

    playerController.update(
      player.position,
      camera,
      input,
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

    controls.player.x = player.position.x;
    controls.player.z = player.position.z;

    if (camera instanceof THREE.PerspectiveCamera) {
      updateFollowCamera(
        camera,
        player.position,
        controls.cameraYaw,
        controls.cameraPitch,
        delta
      );
    }

    // UNIFIED INTERACTION PRIORITY EVALUATOR
    const pX = player.position.x;
    const pZ = player.position.z;

    // 1. Seated Action
    if (activeSeatId) {
      setActiveInteraction?.({
        type: "stand",
        label: { en: "Press E to Stand", es: "Presiona E para levantarte" },
        action: () => {
          const seat = STUDENT_SEATS.find((s) => s.id === activeSeatId);
          if (seat && group.current) {
            group.current.position.set(...seat.standPosition);
          }
          setActiveSeatId?.(null);
        },
      });
      return;
    }

    // 2. Front Teaching Screen / Course Board (Distance < 3.2m)
    const boardDist = Math.hypot(pX, pZ - (-6.5));
    if (boardDist < 3.2) {
      setActiveInteraction?.({
        type: "course",
        label: { en: "Press E to View Class", es: "Presiona E para ver la clase" },
        action: () => onStartCourse?.(),
      });
      return;
    }

    // 3. Doors (Distance < 2.5m)
    let nearestDoor = null;
    let minDoorDist = 2.5;
    for (const d of CLASSROOM_DOORS) {
      const dist = Math.hypot(pX - d.position[0], pZ - d.position[2]);
      if (dist < minDoorDist) {
        minDoorDist = dist;
        nearestDoor = d;
      }
    }
    if (nearestDoor) {
      const doorId = nearestDoor.id;
      const isOpen = openDoorIds?.has(doorId);
      setActiveInteraction?.({
        type: "door",
        label: isOpen
          ? { en: "Press E to Close Door", es: "Presiona E para cerrar la puerta" }
          : { en: "Press E to Open Door", es: "Presiona E para abrir la puerta" },
        action: () => {
          setOpenDoorIds?.((prev) => {
            const next = new Set(prev);
            if (next.has(doorId)) next.delete(doorId);
            else next.add(doorId);
            return next;
          });
        },
      });
      return;
    }

    // 4. Chairs (Distance < 2.0m)
    let nearestSeat = null;
    let minSeatDist = 2.0;
    for (const s of STUDENT_SEATS) {
      const dist = Math.hypot(pX - s.position[0], pZ - s.position[2]);
      if (dist < minSeatDist) {
        minSeatDist = dist;
        nearestSeat = s;
      }
    }
    if (nearestSeat) {
      const s = nearestSeat;
      setActiveInteraction?.({
        type: "sit",
        label: { en: "Press E to Sit", es: "Presiona E para sentarte" },
        action: () => {
          if (group.current) {
            group.current.position.set(...s.seatPosition);
            group.current.rotation.y = s.seatRotation;
          }
          setActiveSeatId?.(s.id);
        },
      });
      return;
    }

    // 5. Mission Hub Portal (Distance < 2.5m)
    const portalDist = Math.hypot(pX - 11.2, pZ - 2.0);
    if (portalDist < 2.5) {
      setActiveInteraction?.({
        type: "portal",
        label: { en: "Press E to Enter Mission Hub", es: "Presiona E para entrar al Mission Hub" },
        action: () => travelTo("isla"),
      });
      return;
    }

    setActiveInteraction?.(null);
  });

  const teacher = CLASS_GUARDIANS.find((g) => g.id === "sarah") ?? CLASS_GUARDIANS[0]!;

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 20, 50]} />

      <Suspense fallback={<Loader />}>
        {/* Teacher NPC Standing on Stage to Left of Screen */}
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
