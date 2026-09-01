import { Html } from "@react-three/drei";
import { InteractiveSeat, type SeatData } from "@/components/game/interactive-seat";
import { InteractiveDoor, type DoorData } from "@/components/game/interactive-door";

export const TRUTH_SEATS: SeatData[] = [
  { id: "t-seat-1", position: [-6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [-6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-5.0, 0, 3.9] },
  { id: "t-seat-2", position: [-5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [-5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-3.8, 0, 3.9] },
  { id: "t-seat-3", position: [5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [3.8, 0, 3.9] },
  { id: "t-seat-4", position: [6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [5.0, 0, 3.9] },
];

export const TRUTH_DOORS: DoorData[] = [
  { id: "t-door-main", position: [0, 0, 9.4], rotation: 0, label: { en: "Main Entrance", es: "Entrada Principal" }, width: 2.2, height: 3.2 },
];

export function TruthLabSet({ activeSeatId, openDoorIds }: { activeSeatId?: string | null; openDoorIds?: Set<string> }) {
  return (
    <group>
      <mesh position={[0, 2.4, -9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#0c1a2b" roughness={0.5} /></mesh>
      <mesh position={[0, 2.4, 9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#0c1a2b" roughness={0.5} /></mesh>
      <mesh position={[-12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#0c1a2b" roughness={0.5} /></mesh>
      <mesh position={[12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#0c1a2b" roughness={0.5} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#162b42" roughness={0.3} metalness={0.2} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 4.8, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#060e17" roughness={0.9} /></mesh>

      <mesh position={[0, 0.15, -8.8]}><boxGeometry args={[14, 0.3, 2.4]} /><meshStandardMaterial color="#0284c7" roughness={0.4} /></mesh>
      <group position={[0, 2.8, -9.4]}>
        <mesh><boxGeometry args={[11.5, 3.1, 0.15]} /><meshStandardMaterial color="#0f4c75" roughness={0.4} /></mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={18} occlude={false}>
          <div className="w-[850px] select-none text-center text-white">
            <h1 className="text-3xl font-black tracking-widest text-cyan-400">NOVA & LEX'S TRUTH LAB</h1>
            <p className="mt-1 text-sm font-extrabold text-cyan-200">Critical Thinking · Evidence Analysis · Research</p>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-cyan-500/40 bg-cyan-950/70 p-3 w-28">
                <span className="text-3xl">🔍</span>
                <span className="text-[10px] font-black text-cyan-300">Source Check</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-purple-500/40 bg-purple-950/70 p-3 w-28">
                <span className="text-3xl">🧩</span>
                <span className="text-[10px] font-black text-purple-300">Logic Puzzles</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-indigo-500/40 bg-indigo-950/70 p-3 w-28">
                <span className="text-3xl">📊</span>
                <span className="text-[10px] font-black text-indigo-300">Data Proof</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {TRUTH_DOORS.map((door) => (
        <InteractiveDoor key={door.id} door={door} isOpen={Boolean(openDoorIds?.has(door.id))} />
      ))}
      {TRUTH_SEATS.map((seat) => (
        <InteractiveSeat key={seat.id} seat={seat} occupied={activeSeatId === seat.id} />
      ))}

      <ambientLight intensity={0.7} color="#e0f2fe" />
      <pointLight position={[0, 4.2, 0]} color="#38bdf8" intensity={12} distance={15} />
    </group>
  );
}
