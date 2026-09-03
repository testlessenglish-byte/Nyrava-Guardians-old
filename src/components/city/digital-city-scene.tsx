import { Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "@/components/meta/character";
import { PlayerController } from "@/components/game/core/player-controller";
import { updateThirdPersonCamera } from "@/components/game/core/camera-follower";
import { type InputManager } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";

const playerController = new PlayerController();

export function DigitalCityScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
  inputManager,
  blocked = false,
  onInspectMessage,
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
  inputManager: InputManager;
  blocked?: boolean;
  onInspectMessage?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    const input = inputManager.getSnapshot();
    const mode: PlayerMode = blocked
      ? "interacting"
      : input.moveX !== 0 || input.moveY !== 0
        ? input.run
          ? "running"
          : "walking"
        : "idle";

    const getSurfaceHeight = (pos: THREE.Vector3) => {
      // Terminal pedestal at [0, -8]
      if (Math.hypot(pos.x, pos.z + 8) < 1.4) return 1.2;
      return 0;
    };

    playerController.update(
      player.position,
      camera,
      input,
      mode,
      delta,
      {
        minX: -22,
        maxX: 22,
        minZ: -22,
        maxZ: 22,
      },
      undefined,
      getSurfaceHeight,
    );

    player.rotation.y = playerController.rotationY;
    if (playerController.isMoving !== moving) setMoving(playerController.isMoving);

    if (camera instanceof THREE.PerspectiveCamera) {
      updateThirdPersonCamera(
        camera,
        player.position,
        inputManager.cameraYaw,
        inputManager.cameraPitch,
        delta,
        5.0,
        1.5,
      );
    }

    const distToTerminal = Math.hypot(player.position.x, player.position.z + 8);
    if (!blocked && distToTerminal < 2.5 && input.interactPressed) onInspectMessage?.();
  });

  return (
    <>
      <color attach="background" args={["#060b14"]} />
      <fog attach="fog" args={["#060b14", 15, 45]} />

      <ambientLight intensity={0.6} color="#60a5fa" />
      <directionalLight position={[20, 30, 10]} intensity={1.8} color="#38bdf8" />
      <pointLight position={[0, 6, 0]} color="#22d3ee" intensity={10} distance={20} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      <mesh position={[-12, 5, -12]}>
        <boxGeometry args={[8, 10, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>
      <mesh position={[12, 6, -12]}>
        <boxGeometry args={[8, 12, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>

      <group position={[0, 4.5, -12]}>
        <mesh>
          <boxGeometry args={[10, 3.5, 0.2]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
        <Html position={[0, 0, 0.15]} transform distanceFactor={14} occlude={false}>
          <div className="w-[600px] select-none text-center text-white">
            <h1 className="text-2xl font-black tracking-widest text-cyan-300">
              DIGITAL CITY PLAZA
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-200">
              Official Nyrava Communications & Security District
            </p>
          </div>
        </Html>
      </group>

      <group position={[0, 0, -8]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 2.4, 20]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
        <Html position={[0, 2.7, 0]} center distanceFactor={14}>
          <div className="select-none text-center">
            <span className="rounded-full border border-rose-500/50 bg-slate-950/90 px-3 py-1 text-xs font-black text-rose-400 shadow-xl backdrop-blur">
              ⚠️ Suspicious Message Terminal (Press E)
            </span>
          </div>
        </Html>
      </group>

      <Suspense fallback={null}>
        <group ref={group} position={[0, 0, 0]}>
          <Character color={playerColor} clip={moving ? "walk" : "idle"} guardianId={guardianId} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.55, 0.72, 40]} />
            <meshStandardMaterial
              color={playerColor}
              emissive={playerColor}
              emissiveIntensity={1.5}
              transparent
              opacity={0.85}
            />
          </mesh>
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
