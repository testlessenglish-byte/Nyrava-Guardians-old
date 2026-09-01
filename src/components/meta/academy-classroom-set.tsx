import { Html, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { missions } from "@/domain/progression/catalog";
import { InteractiveSeat, type SeatData } from "@/components/game/interactive-seat";
import { InteractiveDoor, type DoorData } from "@/components/game/interactive-door";

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
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.8, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
      </mesh>
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

export const STUDENT_SEATS: SeatData[] = [
  {
    id: "seat-left-1",
    position: [-6.5, 0.05, 3.9],
    rotation: Math.PI,
    seatPosition: [-6.5, 0.45, 3.7],
    seatRotation: Math.PI,
    standPosition: [-5.0, 0, 3.9],
  },
  {
    id: "seat-left-2",
    position: [-5.3, 0.05, 3.9],
    rotation: Math.PI,
    seatPosition: [-5.3, 0.45, 3.7],
    seatRotation: Math.PI,
    standPosition: [-3.8, 0, 3.9],
  },
  {
    id: "seat-left-3",
    position: [-6.5, 0.05, 7.4],
    rotation: Math.PI,
    seatPosition: [-6.5, 0.45, 7.2],
    seatRotation: Math.PI,
    standPosition: [-5.0, 0, 7.4],
  },
  {
    id: "seat-left-4",
    position: [-5.3, 0.05, 7.4],
    rotation: Math.PI,
    seatPosition: [-5.3, 0.45, 7.2],
    seatRotation: Math.PI,
    standPosition: [-3.8, 0, 7.4],
  },
  {
    id: "seat-right-1",
    position: [5.3, 0.05, 3.9],
    rotation: Math.PI,
    seatPosition: [5.3, 0.45, 3.7],
    seatRotation: Math.PI,
    standPosition: [3.8, 0, 3.9],
  },
  {
    id: "seat-right-2",
    position: [6.5, 0.05, 3.9],
    rotation: Math.PI,
    seatPosition: [6.5, 0.45, 3.7],
    seatRotation: Math.PI,
    standPosition: [5.0, 0, 3.9],
  },
];

export const CLASSROOM_DOORS: DoorData[] = [
  {
    id: "main-door",
    label: { en: "Main Entrance", es: "Entrada Principal" },
    position: [0, 0, 9.4],
    rotation: 0,
    width: 2.2,
    height: 3.2,
  },
  {
    id: "hallway-door",
    label: { en: "Hallway Access", es: "Acceso al Pasillo" },
    position: [-12.3, 0, -4.5],
    rotation: Math.PI / 2,
    width: 2.0,
    height: 3.0,
  },
];

export function AcademyClassroomSet({
  activeSeatId,
  openDoorIds,
}: {
  activeSeatId?: string | null;
  openDoorIds?: Set<string>;
}) {
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
      {/* 1. ROOM ENCLOSURE & CEILING */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#422517" roughness={0.28} metalness={0.12} />
      </mesh>

      <mesh position={[0, 4.8, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, 2.4, -9.5]}>
        <planeGeometry args={[26, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.6, -9.4]}>
        <boxGeometry args={[26, 1.2, 0.1]} />
        <meshStandardMaterial color="#2d170b" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.2, -9.35]}>
        <boxGeometry args={[26, 0.08, 0.08]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Rear Wall */}
      <mesh position={[0, 2.4, 9.5]} rotation-y={Math.PI}>
        <planeGeometry args={[26, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-12.5, 2.4, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[20, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[12.5, 2.4, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[20, 4.8]} />
        <meshStandardMaterial color="#0f1e36" roughness={0.45} />
      </mesh>

      {/* 2. CENTER RUG */}
      <group position={[0, 0.01, 0]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[4.4, 64]} />
          <meshStandardMaterial color="#0c1e38" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
          <ringGeometry args={[4.1, 4.35, 64]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
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

      {/* 3. FRONT TEACHING STAGE & BOARD */}
      <group position={[0, 0, -9.0]}>
        <mesh position={[0, 0.2, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[14, 0.4, 2.2]} />
          <meshStandardMaterial color="#361c0e" roughness={0.3} metalness={0.4} />
        </mesh>

        <mesh position={[0, 4.0, 0.1]}>
          <boxGeometry args={[1.8, 1.8, 0.2]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} metalness={0.85} roughness={0.2} />
        </mesh>
        <Html position={[0, 4.0, 0.25]} transform distanceFactor={6} occlude={false}>
          <div className="select-none font-black text-3xl text-slate-950">N</div>
        </Html>

        <mesh position={[0, 2.4, 0.1]}>
          <boxGeometry args={[9.8, 3.4, 0.15]} />
          <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={1.8} metalness={0.9} />
        </mesh>
        <mesh position={[0, 2.4, 0.2]}>
          <planeGeometry args={[9.4, 3.0]} />
          <meshStandardMaterial color="#051329" emissive="#0369a1" emissiveIntensity={0.35} />
        </mesh>

        <Html position={[0, 2.4, 0.25]} transform distanceFactor={7.2} occlude={false}>
          <div className="w-[680px] select-none rounded-3xl border border-cyan-400/50 bg-slate-950/95 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">Digital Safety Foundation</p>
            <h2 className="mt-1 text-4xl font-black tracking-tight text-white">
              {activeLesson.title.en}
            </h2>
            <p className="mt-1 text-sm font-semibold text-cyan-200/90">
              Be smart. Stay safe. Don't get hooked!
            </p>
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

      {/* 4. INTERACTIVE DOORS */}
      {CLASSROOM_DOORS.map((door) => (
        <InteractiveDoor
          key={door.id}
          door={door}
          isOpen={openDoorIds?.has(door.id)}
        />
      ))}

      {/* 5. USABLE STUDENT SEATS */}
      {STUDENT_SEATS.map((seat) => (
        <InteractiveSeat
          key={seat.id}
          seat={seat}
          occupied={activeSeatId === seat.id}
        />
      ))}

      {/* 6. DESKS */}
      {deskRowsLeft.map(([x, z]) => (
        <Furniture key={`desk-l-${x}-${z}`} url="/models/desk.glb" position={[x, 0.05, z]} rotation={Math.PI} scale={1.2} />
      ))}
      {deskRowsRight.map(([x, z]) => (
        <Furniture key={`desk-r-${x}-${z}`} url="/models/desk.glb" position={[x, 0.05, z]} rotation={Math.PI} scale={1.2} />
      ))}

      {/* 7. RIGHT WALL: ACHIEVEMENTS & MISSION HUB */}
      <group position={[12.3, 3.2, -4.0]} rotation-y={-Math.PI / 2}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.2, 2.2, 0.1]} />
          <meshStandardMaterial color="#0f1e36" roughness={0.3} />
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

      <group position={[11.5, 0, 2.0]}>
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[0.4, 4.4, 3.2]} />
          <meshStandardMaterial color="#2d170b" roughness={0.4} />
        </mesh>
        <Html position={[-0.25, 4.3, 0]} rotation={[0, -Math.PI / 2, 0]} transform distanceFactor={6.5} occlude={false}>
          <div className="whitespace-nowrap font-black text-lg tracking-[0.25em] text-amber-300 drop-shadow-lg">
            MISSION HUB
          </div>
        </Html>
        <mesh ref={portalRingRef} position={[-0.1, 2.2, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[1.35, 0.14, 20, 64]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={3.0} />
        </mesh>
        <mesh ref={portalVortexRef} position={[-0.05, 2.2, 0]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[1.3, 40]} />
          <meshStandardMaterial color="#1e1b4b" emissive="#6366f1" emissiveIntensity={2.2} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* 8. LIGHTING */}
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
