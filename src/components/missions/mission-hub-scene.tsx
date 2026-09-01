import { Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "@/components/meta/character";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { PlayerController } from "@/components/game/core/player-controller";
import { updateThirdPersonCamera } from "@/components/game/core/camera-follower";
import { type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";

const playerController = new PlayerController();

export function MissionHubScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
  inputState,
  playerMode = "idle",
  cameraYaw = 0,
  cameraPitch = 0.15,
  onOpenBoard,
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
  inputState: GameInputState;
  playerMode?: PlayerMode;
  cameraYaw?: number;
  cameraPitch?: number;
  onOpenBoard?: () => void;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);
  const [nearSarah, setNearSarah] = useState(false);
  const sarah = CLASS_GUARDIANS.find((guardian) => guardian.id === "sarah") ?? CLASS_GUARDIANS[0]!;

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = playerRef.current;
    if (!player) return;

    playerController.update(
      player.position,
      camera,
      inputState,
      playerMode,
      delta,
      { minX: -10.5, maxX: 10.5, minZ: -7.5, maxZ: 7.5 },
    );
    player.rotation.y = playerController.rotationY;
    if (playerController.isMoving !== moving) setMoving(playerController.isMoving);

    if (camera instanceof THREE.PerspectiveCamera) {
      updateThirdPersonCamera(camera, player.position, cameraYaw, cameraPitch, delta, 4.8, 1.55, [], {
        minX: -11.2,
        maxX: 11.2,
        minY: 0.8,
        maxY: 4.8,
        minZ: -8.2,
        maxZ: 8.2,
      });
    }

    const distance = Math.hypot(player.position.x, player.position.z + 5.6);
    const close = distance < 2.8;
    if (close !== nearSarah) setNearSarah(close);
    if (close && inputState.interactPressed) onOpenBoard?.();
  });

  return (
    <>
      <color attach="background" args={["#040916"]} />
      <fog attach="fog" args={["#040916", 18, 40]} />
      <ambientLight intensity={0.75} color="#c7d2fe" />
      <directionalLight position={[8, 15, 5]} intensity={1.8} color="#67e8f9" />
      <pointLight position={[0, 4, -5]} color="#22d3ee" intensity={11} distance={16} />
      <pointLight position={[-8, 3, 4]} color="#8b5cf6" intensity={7} distance={10} />
      <pointLight position={[8, 3, 4]} color="#f59e0b" intensity={7} distance={10} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#111827" roughness={0.32} metalness={0.55} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 5, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.5, -8.8]}><boxGeometry args={[24, 5, 0.25]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 2.5, 8.8]}><boxGeometry args={[24, 5, 0.25]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[-11.8, 2.5, 0]}><boxGeometry args={[0.25, 5, 18]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[11.8, 2.5, 0]}><boxGeometry args={[0.25, 5, 18]} /><meshStandardMaterial color="#0f172a" /></mesh>

      <group position={[0, 2.8, -8.55]}>
        <mesh><boxGeometry args={[13, 3.2, 0.18]} /><meshStandardMaterial color="#082f49" emissive="#0891b2" emissiveIntensity={0.35} /></mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={17} occlude={false}>
          <div className="w-[820px] select-none text-center text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cyan-300">NYRAVA GUARDIANS</p>
            <h1 className="mt-1 text-4xl font-black tracking-widest">MISSION COMMAND CENTER</h1>
            <p className="mt-2 text-sm font-bold text-slate-300">Story missions · Safety incidents · Guardian operations</p>
          </div>
        </Html>
      </group>

      <group position={[-7.5, 1.5, 1.5]}>
        <mesh><boxGeometry args={[4.5, 3, 0.3]} /><meshStandardMaterial color="#312e81" emissive="#4f46e5" emissiveIntensity={0.25} /></mesh>
        <Html position={[0, 0, 0.18]} transform distanceFactor={11} occlude={false}>
          <div className="w-[280px] text-center text-white"><p className="text-xs font-black text-indigo-300">ACTIVE INCIDENTS</p><p className="mt-2 text-lg font-black">Digital City</p><p className="text-xs text-slate-300">Phishing investigation underway</p></div>
        </Html>
      </group>

      <group position={[7.5, 1.5, 1.5]}>
        <mesh><boxGeometry args={[4.5, 3, 0.3]} /><meshStandardMaterial color="#78350f" emissive="#d97706" emissiveIntensity={0.22} /></mesh>
        <Html position={[0, 0, 0.18]} transform distanceFactor={11} occlude={false}>
          <div className="w-[280px] text-center text-white"><p className="text-xs font-black text-amber-300">ACADEMY STATUS</p><p className="mt-2 text-lg font-black">Foundation Training</p><p className="text-xs text-slate-300">Complete real assessments to advance</p></div>
        </Html>
      </group>

      <group position={[0, 0.15, -5.6]}>
        <mesh><cylinderGeometry args={[1.3, 1.5, 0.3, 36]} /><meshStandardMaterial color="#164e63" emissive="#06b6d4" emissiveIntensity={0.6} /></mesh>
      </group>

      <Suspense fallback={null}>
        <group position={[0, 0.2, -5.6]} rotation-y={Math.PI}>
          <Character color={sarah.color} clip="idle" guardianId={sarah.id} />
          <Html position={[0, 2.45, 0]} center distanceFactor={12} occlude={false}>
            <div className="pointer-events-none select-none text-center">
              <span className="rounded-full border border-cyan-400/40 bg-slate-950/90 px-3 py-1 text-xs font-black text-cyan-300">Sarah · Security Specialist</span>
              {nearSarah && <p className="mt-2 rounded-full border border-amber-400/40 bg-slate-950/95 px-4 py-1.5 text-[11px] font-black text-amber-300">Press E to open Mission Board</p>}
            </div>
          </Html>
        </group>

        <group ref={playerRef} position={[0, 0.2, 3.5]}>
          <Character color={playerColor} clip={moving ? "walk" : "idle"} guardianId={guardianId} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}><ringGeometry args={[0.55, 0.72, 40]} /><meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={1.5} transparent opacity={0.85} /></mesh>
          <Html position={[0, 2.35, 0]} center distanceFactor={12} occlude={false}><span className="pointer-events-none select-none rounded-full border border-cyan-400/30 bg-slate-950/85 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-300">{playerLabel}</span></Html>
        </group>
      </Suspense>
    </>
  );
}
