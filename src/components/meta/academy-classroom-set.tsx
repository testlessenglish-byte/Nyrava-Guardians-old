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

function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Plant Pot */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.8, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <dodecahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function AcademyClassroomSet() {
  const portalRingRef = useRef<THREE.Mesh>(null);
  const portalVortexRef = useRef<THREE.Mesh>(null);
  const activeLesson = missions[0]!;

  useFrame((_, delta) => {
    if (portalRingRef.current) {
      portalRingRef.current.rotation.z += delta * 1.2;
    }
    if (portalVortexRef.current) {
      portalVortexRef.current.rotation.z -= delta * 0.8;
    }
  });

  const deskRowsLeft = [
    [-6.5, 2.5],
    [-6.5, 6.0],
  ] as const;

  const deskRowsRight = [
    [6.5, 2.5],
    [6.5, 6.0],
  ] as const;

  return (
    <group>
      {/* ========================================== */}
      {/* 1. ARCHITECTURE & ROOM ENCLOSURE (24m x 18m x 4.8m) */}
      {/* ========================================== */}

      {/* Glossy Warm Wooden Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#422517" roughness={0.28} metalness={0.12} />
      </mesh>

      {/* Warm Coffered Ceiling */}
      <mesh position={[0, 4.8, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Main Front Wall (Deep Blue with Wood Wainscoting) */}
      <mesh position={[0, 2.4, -9.5]}>
        <planeGeometry args={[26, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>
      {/* Front Wall Wood Wainscoting Bottom Panel */}
      <mesh position={[0, 0.6, -9.4]}>
        <boxGeometry args={[26, 1.2, 0.1]} />
        <meshStandardMaterial color="#2d170b" roughness={0.35} />
      </mesh>
      {/* Front Wall Gold Trim Rail */}
      <mesh position={[0, 1.2, -9.35]}>
        <boxGeometry args={[26, 0.08, 0.08]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-12.5, 2.4, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[20, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>
      <mesh position={[-12.4, 0.6, 0]} rotation-y={Math.PI / 2}>
        <boxGeometry args={[20, 1.2, 0.1]} />
        <meshStandardMaterial color="#2d170b" roughness={0.35} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[12.5, 2.4, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[20, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>
      <mesh position={[12.4, 0.6, 0]} rotation-y={-Math.PI / 2}>
        <boxGeometry args={[20, 1.2, 0.1]} />
        <meshStandardMaterial color="#2d170b" roughness={0.35} />
      </mesh>

      {/* ========================================== */}
      {/* 2. CENTER EMBLEM RUG (Matching Concept Image) */}
      {/* ========================================== */}
      <group position={[0, 0.01, 0]}>
        {/* Navy Rug Outer Base */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[4.4, 64]} />
          <meshStandardMaterial color="#0c1e38" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Double Gold Ring Outer Trim */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
          <ringGeometry args={[4.1, 4.35, 64]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]}>
          <ringGeometry args={[3.8, 3.88, 64]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.4} metalness={0.8} />
        </mesh>
        {/* HTML Rendered High-Res Emblem Text & Shield Crest */}
        <Html position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} transform distanceFactor={6.8} occlude={false}>
          <div className="select-none text-center font-display text-amber-400">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border-2 border-amber-400 bg-slate-950/80 font-black text-4xl shadow-2xl text-amber-300">
              N
            </div>
            <div className="mt-2 text-2xl font-black tracking-[0.25em] text-amber-300">N Y R A V A</div>
            <div className="text-xs font-extrabold tracking-[0.4em] text-amber-400/90">GUARDIANS ACADEMY</div>
          </div>
        </Html>
      </group>

      {/* ========================================== */}
      {/* 3. FRONT TEACHING SCREEN & GOLD CREST STAGE */}
      {/* ========================================== */}
      <group position={[0, 0, -9.0]}>
        {/* Raised Wood Stage Step */}
        <mesh position={[0, 0.2, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[14, 0.4, 2.2]} />
          <meshStandardMaterial color="#361c0e" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.41, 0.6]}>
          <boxGeometry args={[14.1, 0.04, 0.08]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Top Golden Shield Crest ("N") */}
        <mesh position={[0, 4.0, 0.1]}>
          <boxGeometry args={[1.8, 1.8, 0.2]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} metalness={0.85} roughness={0.2} />
        </mesh>
        <Html position={[0, 4.0, 0.25]} transform distanceFactor={6} occlude={false}>
          <div className="select-none font-black text-3xl text-slate-950">N</div>
        </Html>

        {/* Outer Glow Neon Frame */}
        <mesh position={[0, 2.4, 0.1]}>
          <boxGeometry args={[9.8, 3.4, 0.15]} />
          <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={1.8} metalness={0.9} />
        </mesh>
        {/* Dark Screen Surface */}
        <mesh position={[0, 2.4, 0.2]}>
          <planeGeometry args={[9.4, 3.0]} />
          <meshStandardMaterial color="#051329" emissive="#0369a1" emissiveIntensity={0.35} />
        </mesh>

        {/* Teaching Board Screen UI */}
        <Html position={[0, 2.4, 0.25]} transform distanceFactor={7.2} occlude={false}>
          <div className="w-[680px] select-none rounded-3xl border border-cyan-400/50 bg-slate-950/95 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">Digital Safety Foundation</p>
            <h2 className="mt-1 text-4xl font-black tracking-tight text-white">
              {activeLesson.title.en}
            </h2>
            <p className="mt-1 text-sm font-semibold text-cyan-200/90">
              Be smart. Stay safe. Don't get hooked!
            </p>
            {/* Visual Icons Row */}
            <div className="mt-4 flex justify-center gap-8">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-cyan-500/30 bg-cyan-950/60 p-3 w-28">
                <span className="text-3xl">🎣</span>
                <span className="text-[10px] font-bold text-cyan-300">Detect Phishing</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-500/40 bg-amber-950/60 p-3 w-28">
                <span className="text-3xl">🛡️</span>
                <span className="text-[10px] font-bold text-amber-300">Guardian Shield</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3 w-28">
                <span className="text-3xl">🔒</span>
                <span className="text-[10px] font-bold text-emerald-300">Verify Links</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* ========================================== */}
      {/* 4. LEFT WALL: BOOKCASE & ARCHED SUNLIGHT WINDOW */}
      {/* ========================================== */}
      <Furniture url="/models/bookcaseOpen.glb" position={[-11.5, 0, -4.5]} rotation={Math.PI / 2} scale={1.45} />

      {/* Arched Window with Daylight & Sunlight Glow */}
      <group position={[-12.3, 2.6, 0]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[3.2, 2.8]} />
          <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
        {/* Window Frame Bar */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.1, 2.8, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[3.2, 0.1, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
      <PottedPlant position={[-11.2, 0, 2.8]} />

      {/* ========================================== */}
      {/* 5. RIGHT WALL: ACHIEVEMENTS, CERTIFICATES & MISSION HUB */}
      {/* ========================================== */}

      {/* Achievements Wall Board */}
      <group position={[12.3, 3.2, -4.0]} rotation-y={-Math.PI / 2}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.2, 2.2, 0.1]} />
          <meshStandardMaterial color="#0f1e36" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[4.3, 2.3, 0.04]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={7} occlude={false}>
          <div className="w-[360px] select-none text-center text-white">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">ACHIEVEMENTS</p>
            <div className="mt-3 flex justify-center gap-3">
              {['🛡️', '⚔️', '🎓', '👑', '⭐'].map((icon, idx) => (
                <div key={idx} className="flex size-11 items-center justify-center rounded-xl border border-amber-400/50 bg-slate-950/80 text-xl shadow-lg">
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* Certificates Gallery Wall */}
      <group position={[12.3, 1.4, -4.0]} rotation-y={-Math.PI / 2}>
        <Html position={[0, 0, 0.12]} transform distanceFactor={7} occlude={false}>
          <div className="w-[360px] select-none text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">CERTIFICATES</p>
            <div className="mt-2 flex justify-center gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="h-14 w-11 rounded border border-amber-300/60 bg-amber-50/90 p-1 text-[8px] font-black text-slate-900 shadow-md">
                  📜 CERT
                </div>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* Grand Mission Hub Portal Doorway */}
      <group position={[11.5, 0, 2.0]}>
        {/* Wooden Arched Portal Frame */}
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[0.4, 4.4, 3.2]} />
          <meshStandardMaterial color="#2d170b" roughness={0.4} />
        </mesh>
        <mesh position={[-0.05, 4.3, 0]}>
          <boxGeometry args={[0.5, 0.5, 3.4]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
        <Html position={[-0.25, 4.3, 0]} rotation={[0, -Math.PI / 2, 0]} transform distanceFactor={6.5} occlude={false}>
          <div className="whitespace-nowrap font-black text-lg tracking-[0.25em] text-amber-300 drop-shadow-lg">
            MISSION HUB
          </div>
        </Html>

        {/* Animated Swirling Vortex Rings */}
        <mesh ref={portalRingRef} position={[-0.1, 2.2, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[1.35, 0.14, 20, 64]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={3.0} />
        </mesh>
        <mesh ref={portalVortexRef} position={[-0.05, 2.2, 0]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[1.3, 40]} />
          <meshStandardMaterial color="#1e1b4b" emissive="#6366f1" emissiveIntensity={2.2} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[-0.6, 2.2, 0]} color="#60a5fa" intensity={16} distance={10} />
      </group>
      <PottedPlant position={[10.5, 0, 0.2]} />
      <PottedPlant position={[10.5, 0, 3.8]} />

      {/* ========================================== */}
      {/* 6. STUDENT DESK ROWS (Left & Right Aisles) */}
      {/* ========================================== */}

      {/* Left Desks Row */}
      {deskRowsLeft.map(([x, z], index) => (
        <group key={`left-${x}-${z}`}>
          <Furniture url="/models/desk.glb" position={[x, 0.05, z]} rotation={Math.PI} scale={1.2} />
          <Furniture url="/models/chairDesk.glb" position={[x, 0.05, z + 1.4]} rotation={Math.PI} scale={1.05} />
          <Furniture url="/models/chairDesk.glb" position={[x + 1.2, 0.05, z + 1.4]} rotation={Math.PI} scale={1.05} />
        </group>
      ))}

      {/* Right Desks Row */}
      {deskRowsRight.map(([x, z], index) => (
        <group key={`right-${x}-${z}`}>
          <Furniture url="/models/desk.glb" position={[x, 0.05, z]} rotation={Math.PI} scale={1.2} />
          <Furniture url="/models/chairDesk.glb" position={[x, 0.05, z + 1.4]} rotation={Math.PI} scale={1.05} />
          <Furniture url="/models/chairDesk.glb" position={[x - 1.2, 0.05, z + 1.4]} rotation={Math.PI} scale={1.05} />
        </group>
      ))}

      {/* ========================================== */}
      {/* 7. CINEMATIC WARM CLASSROOM LIGHTING */}
      {/* ========================================== */}
      <ambientLight intensity={0.8} color="#ffedd5" />
      <hemisphereLight args={["#bae6fd", "#2d170b", 0.7]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2.2}
        color="#fef08a"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 4.2, 0]} color="#fbbf24" intensity={10} distance={14} />
      <pointLight position={[0, 4.0, -7.5]} color="#38bdf8" intensity={16} distance={15} />
    </group>
  );
}

useGLTF.preload("/models/desk.glb");
useGLTF.preload("/models/chairDesk.glb");
useGLTF.preload("/models/bookcaseOpen.glb");
