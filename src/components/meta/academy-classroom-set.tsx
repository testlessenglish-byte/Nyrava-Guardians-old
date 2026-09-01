import { Html, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { missions } from "@/domain/progression/catalog";

function Furniture({
  url,
  position,
  rotation = 0,
  scale = 1,
}: {
  url: string;
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const model = useGLTF(url);
  return (
    <primitive
      object={model.scene.clone()}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

export function AcademyClassroomSet() {
  const portalRingRef = useRef<THREE.Mesh>(null);
  const activeLesson = missions[0]!;

  useFrame((_, delta) => {
    if (portalRingRef.current) {
      portalRingRef.current.rotation.z += delta * 0.9;
    }
  });

  const deskRows = [
    [-5.0, 3.2],
    [0.0, 3.2],
    [5.0, 3.2],
    [-5.0, 6.8],
    [0.0, 6.8],
    [5.0, 6.8],
  ] as const;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#2d2118" roughness={0.35} metalness={0.15} />
      </mesh>

      <mesh position={[0, 4.5, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      <mesh position={[0, 2.25, -9.0]}>
        <planeGeometry args={[24, 4.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[-12.0, 2.25, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[18, 4.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[12.0, 2.25, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[18, 4.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.25, 9.0]} rotation-y={Math.PI}>
        <planeGeometry args={[24, 4.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[4.2, 64]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.9, 4.15, 64]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
      </mesh>
      <Html position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} transform distanceFactor={7} occlude={false}>
        <div className="select-none text-center font-display text-cyan-400 opacity-90">
          <div className="text-3xl font-black tracking-widest">N Y R A V A</div>
          <div className="text-sm font-bold tracking-[0.3em] text-slate-300">GUARDIANS ACADEMY</div>
        </div>
      </Html>

      <mesh position={[0, 0.25, -7.5]} castShadow receiveShadow>
        <boxGeometry args={[13, 0.5, 2.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.5, -8.85]}>
        <boxGeometry args={[9.5, 3.2, 0.15]} />
        <meshStandardMaterial color="#020617" emissive="#0284c7" emissiveIntensity={0.6} metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.5, -8.76]}>
        <planeGeometry args={[9.1, 2.9]} />
        <meshStandardMaterial color="#090d16" emissive="#0369a1" emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 2.5, -8.7]} transform distanceFactor={7.5} occlude={false}>
        <div className="w-[620px] select-none rounded-2xl border border-cyan-400/40 bg-slate-950/90 p-5 text-center text-white shadow-2xl backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Current Lesson</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
            {activeLesson.title.en}
          </h2>
          <p className="mt-1 text-sm font-medium text-cyan-200/90">
            Be smart. Stay safe. Don't get hooked!
          </p>
          <div className="mt-3 flex justify-center gap-4 text-xs font-bold text-slate-300">
            <span className="rounded-lg bg-cyan-950/80 px-3 py-1 border border-cyan-500/30">🔒 Identify Fake Links</span>
            <span className="rounded-lg bg-cyan-950/80 px-3 py-1 border border-cyan-500/30">🛡️ Verify Sender</span>
            <span className="rounded-lg bg-cyan-950/80 px-3 py-1 border border-cyan-500/30">🔑 Password Protection</span>
          </div>
        </div>
      </Html>

      <Furniture url="/models/bookcaseOpen.glb" position={[-11.2, 0, -4.5]} rotation={Math.PI / 2} scale={1.4} />
      <Furniture url="/models/bookcaseOpen.glb" position={[-11.2, 0, 1.5]} rotation={Math.PI / 2} scale={1.4} />
      <mesh position={[-11.9, 2.6, -1.5]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[3.5, 2.6]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      <mesh position={[11.85, 2.5, -4.0]} rotation-y={-Math.PI / 2}>
        <boxGeometry args={[4.5, 3.0, 0.1]} />
        <meshStandardMaterial color="#0f172a" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
      <Html position={[11.75, 2.5, -4.0]} rotation={[0, -Math.PI / 2, 0]} transform distanceFactor={7.5} occlude={false}>
        <div className="w-[340px] select-none rounded-2xl border border-amber-400/40 bg-slate-950/90 p-4 text-center text-white backdrop-blur">
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">Academy Wall</p>
          <h3 className="text-xl font-black">Achievements & Certificates</h3>
          <p className="mt-1 text-xs text-slate-300">Earn Guardian badges upon passing 75% on class assessments.</p>
        </div>
      </Html>

      <group position={[11.2, 0, 0]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.3, 4.0, 2.6]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh ref={portalRingRef} position={[-0.1, 2.2, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[1.3, 0.12, 16, 48]} />
          <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[-0.05, 2.2, 0]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[1.2, 32]} />
          <meshStandardMaterial color="#4338ca" emissive="#4f46e5" emissiveIntensity={1.8} transparent opacity={0.85} />
        </mesh>
        <pointLight position={[-0.5, 2.2, 0]} color="#818cf8" intensity={12} distance={8} />
        <Html position={[-0.5, 3.8, 0]} center distanceFactor={8} occlude={false}>
          <div className="pointer-events-none select-none rounded-full border border-indigo-400/60 bg-indigo-950/90 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-200 shadow-lg backdrop-blur">
            Mission Hub
          </div>
        </Html>
      </group>

      {deskRows.map(([x, z], index) => (
        <group key={`${x}-${z}`}>
          <Furniture url="/models/desk.glb" position={[x, 0.05, z]} rotation={Math.PI} scale={1.1} />
          <Furniture url="/models/chairDesk.glb" position={[x, 0.05, z + 1.35]} rotation={Math.PI} scale={1.0} />
          <mesh position={[x, 1.15, z - 0.1]} rotation-x={-0.2}>
            <boxGeometry args={[1.4, 0.06, 0.85]} />
            <meshStandardMaterial
              color="#020617"
              emissive={index % 3 === 0 ? "#38bdf8" : index % 3 === 1 ? "#a855f7" : "#34d399"}
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      <ambientLight intensity={0.7} color="#fef3c7" />
      <hemisphereLight args={["#bae6fd", "#1e293b", 0.6]} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 3.8, -6]} color="#38bdf8" intensity={14} distance={15} />
      <pointLight position={[-8, 3.5, 0]} color="#fef08a" intensity={8} distance={12} />
      <pointLight position={[8, 3.5, 0]} color="#818cf8" intensity={8} distance={12} />
    </group>
  );
}

useGLTF.preload("/models/desk.glb");
useGLTF.preload("/models/chairDesk.glb");
useGLTF.preload("/models/bookcaseOpen.glb");
