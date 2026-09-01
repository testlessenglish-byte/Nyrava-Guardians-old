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
  rotation,
}: {
  guardian: ClassGuardian;
  position: [number, number, number];
  rotation: number;
}) {
  return (
    <group position={position} rotation-y={rotation}>
      <Character color={guardian.color} clip="idle" guardianId={guardian.id} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.9, 1.15, 48]} />
        <meshStandardMaterial
          color={guardian.color}
          emissive={guardian.color}
          emissiveIntensity={1.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color={guardian.color} intensity={5} distance={6} />
      <Html position={[0, 2.5, 0]} center distanceFactor={10} occlude={false}>
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

function Player({
  color,
  label,
  guardianId,
}: {
  color: string;
  label: string;
  guardianId: string;
}) {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);
  const [nearPortal, setNearPortal] = useState(false);
  const [nearBoard, setNearBoard] = useState(false);

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

    player.rotation.y = playerController.rotationY;

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

    const portalDist = Math.hypot(player.position.x - 11.2, player.position.z - 0);
    const isPortalNear = portalDist < 2.5;
    if (isPortalNear !== nearPortal) setNearPortal(isPortalNear);

    const boardDist = Math.hypot(player.position.x - 0, player.position.z - (-6.5));
    const isBoardNear = boardDist < 3.2;
    if (isBoardNear !== nearBoard) setNearBoard(isBoardNear);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        const pX = controls.player.x;
        const pZ = controls.player.z;
        if (Math.hypot(pX - 11.2, pZ) < 2.8) {
          travelTo("isla");
        } else if (Math.hypot(pX, pZ - (-6.5)) < 3.5) {
          window.dispatchEvent(new Event("nyrava-open-journey"));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <group ref={group} position={[0, 0, 0]}>
      <Character color={color} clip={moving ? "walk" : "idle"} guardianId={guardianId} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.72, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight position={[0, 1.7, 0]} color={color} intensity={4} distance={5} />

      <Html position={[0, 2.35, 0]} center distanceFactor={10}>
        <span className="pointer-events-none select-none rounded-full border border-cyan-400/30 bg-slate-950/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-300 backdrop-blur">
          {label}
        </span>
      </Html>

      {nearPortal && (
        <Html position={[0, 2.9, 0]} center distanceFactor={8}>
          <button
            type="button"
            onClick={() => travelTo("isla")}
            className="animate-bounce rounded-full border border-indigo-400/60 bg-indigo-950/90 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-200 shadow-xl backdrop-blur"
          >
            Press E · Enter Mission Hub
          </button>
        </Html>
      )}

      {nearBoard && (
        <Html position={[0, 2.9, 0]} center distanceFactor={8}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("nyrava-open-journey"))}
            className="animate-bounce rounded-full border border-cyan-400/60 bg-slate-950/90 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-300 shadow-xl backdrop-blur"
          >
            Press E · Open Lesson
          </button>
        </Html>
      )}
    </group>
  );
}

export function ClassroomScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
}) {
  const teacher = CLASS_GUARDIANS.find((g) => g.id === "sarah") ?? CLASS_GUARDIANS[0]!;

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 20, 50]} />

      <Suspense fallback={<Loader />}>
        <TeacherNpc guardian={teacher} position={[0, 0.55, -6.6]} rotation={0} />
        <Player color={playerColor} label={playerLabel} guardianId={guardianId} />
      </Suspense>
    </>
  );
}
