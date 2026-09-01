import { Html } from "@react-three/drei";
import { InteractiveSeat, type SeatData } from "@/components/game/interactive-seat";
import { InteractiveDoor, type DoorData } from "@/components/game/interactive-door";

export const BUILDER_SEATS: SeatData[] = [
  { id: "b-seat-1", position: [-6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [-6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-5.0, 0, 3.9] },
  { id: "b-seat-2", position: [-5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [-5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-3.8, 0, 3.9] },
  { id: "b-seat-3", position: [5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [3.8, 0, 3.9] },
  { id: "b-seat-4", position: [6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [5.0, 0, 3.9] },
];

export const BUILDER_DOORS: DoorData[] = [
  { id: "b-door-main", position: [0, 0, 9.4], rotation: 0, label: { en: "Main Entrance", es: "Entrada Principal" }, width: 2.2, height: 3.2 },
];

export function BuilderLabSet({ activeSeatId, openDoorIds }: { activeSeatId?: string | null; openDoorIds?: Set<string> }) {
  return (
    <group>
      <mesh position={[0, 2.4, -9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#1e1b18" roughness={0.6} /></mesh>
      <mesh position={[0, 2.4, 9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#1e1b18" roughness={0.6} /></mesh>
      <mesh position={[-12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#1e1b18" roughness={0.6} /></mesh>
      <mesh position={[12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#1e1b18" roughness={0.6} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#2d241e" roughness={0.35} metalness={0.2} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 4.8, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#110d0a" roughness={0.9} /></mesh>

      <mesh position={[0, 0.15, -8.8]}><boxGeometry args={[14, 0.3, 2.4]} /><meshStandardMaterial color="#d97706" roughness={0.4} /></mesh>
      <group position={[0, 2.8, -9.4]}>
        <mesh><boxGeometry args={[11.5, 3.1, 0.15]} /><meshStandardMaterial color="#78350f" roughness={0.4} /></mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={18} occlude={false}>
          <div className="w-[850px] select-none text-center text-white">
            <h1 className="text-3xl font-black tracking-widest text-amber-400">JACOB'S BUILDER LAB</h1>
            <p className="mt-1 text-sm font-extrabold text-amber-200">Coding · Robotics · Hardware · AI Workflows</p>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-500/40 bg-amber-950/70 p-3 w-28">
                <span className="text-3xl">💻</span>
                <span className="text-[10px] font-black text-amber-300">Code Editor</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-orange-500/40 bg-orange-950/70 p-3 w-28">
                <span className="text-3xl">🤖</span>
                <span className="text-[10px] font-black text-orange-300">Robot Rig</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-yellow-500/40 bg-yellow-950/70 p-3 w-28">
                <span className="text-3xl">⚡</span>
                <span className="text-[10px] font-black text-yellow-300">Circuit Lab</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {BUILDER_DOORS.map((door) => (
        <InteractiveDoor key={door.id} door={door} isOpen={Boolean(openDoorIds?.has(door.id))} />
      ))}
      {BUILDER_SEATS.map((seat) => (
        <InteractiveSeat key={seat.id} seat={seat} occupied={activeSeatId === seat.id} />
      ))}

      <ambientLight intensity={0.7} color="#fff7ed" />
      <pointLight position={[0, 4.2, 0]} color="#f59e0b" intensity={12} distance={15} />
    </group>
  );
}
