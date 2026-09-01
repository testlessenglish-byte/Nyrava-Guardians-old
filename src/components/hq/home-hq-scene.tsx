import { Suspense, useRef } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "@/components/meta/character";
import { type GameInputState } from "@/components/game/core/input-manager";
import { type PlayerMode } from "@/components/game/core/player-state-machine";

export function HomeHqScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
  inputState,
  playerMode = "idle",
  cameraYaw = 0,
  cameraPitch = 0.15,
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
  inputState: GameInputState;
  playerMode?: PlayerMode;
  cameraYaw?: number;
  cameraPitch?: number;
}) {
  const group = useRef<THREE.Group>(null);

  return (
    <>
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#030712", 12, 35]} />

      <ambientLight intensity={0.7} color="#e0f2fe" />
      <directionalLight position={[10, 20, 10]} intensity={1.6} color="#fbbf24" />
      <pointLight position={[0, 4, 0]} color="#38bdf8" intensity={12} distance={15} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 4.2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      <mesh position={[0, 2.1, -9.8]}>
        <boxGeometry args={[20, 4.2, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[-9.8, 2.1, 0]}>
        <boxGeometry args={[0.2, 4.2, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[9.8, 2.1, 0]}>
        <boxGeometry args={[0.2, 4.2, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      <group position={[0, 2.2, -9.5]}>
        <mesh>
          <boxGeometry args={[10, 2.8, 0.15]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={9} occlude zIndexRange={[0, 0]}>
          <div className="w-[650px] select-none text-center text-white">
            <h1 className="text-2xl font-black tracking-widest text-amber-400">PERSONAL HOME HQ</h1>
            <p className="mt-1 text-xs font-extrabold text-amber-200">Guardian Rank: Level 12 Master Protector</p>
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-500/40 bg-amber-950/70 p-3 w-28">
                <span className="text-3xl">🏆</span>
                <span className="text-[10px] font-black text-amber-300">Phishing Shield</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-cyan-500/40 bg-cyan-950/70 p-3 w-28">
                <span className="text-3xl">📜</span>
                <span className="text-[10px] font-black text-cyan-300">Safety Cert</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-purple-500/40 bg-purple-950/70 p-3 w-28">
                <span className="text-3xl">⭐</span>
                <span className="text-[10px] font-black text-purple-300">Level 12 Badge</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.2, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} />
      </mesh>

      <Suspense fallback={null}>
        <group ref={group} position={[0, 0.2, 0]}>
          <Character color={playerColor} clip="idle" guardianId={guardianId} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.55, 0.72, 40]} />
            <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
          <Html position={[0, 2.35, 0]} center distanceFactor={9} occlude zIndexRange={[0, 0]}>
            <span className="pointer-events-none select-none rounded-full border border-amber-400/50 bg-slate-950/90 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-300 backdrop-blur shadow-xl">
              {playerLabel}
            </span>
          </Html>
        </group>
      </Suspense>
    </>
  );
}
