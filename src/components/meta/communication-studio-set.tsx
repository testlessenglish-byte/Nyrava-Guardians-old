import { Html } from "@react-three/drei";
import { InteractiveSeat, type SeatData } from "@/components/game/interactive-seat";
import { InteractiveDoor, type DoorData } from "@/components/game/interactive-door";

export const COMMUNICATION_SEATS: SeatData[] = [
  { id: "c-seat-1", position: [-6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [-6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-5.0, 0, 3.9] },
  { id: "c-seat-2", position: [-5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [-5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [-3.8, 0, 3.9] },
  { id: "c-seat-3", position: [5.3, 0.05, 3.9], rotation: Math.PI, seatPosition: [5.3, 0.45, 3.7], seatRotation: Math.PI, standPosition: [3.8, 0, 3.9] },
  { id: "c-seat-4", position: [6.5, 0.05, 3.9], rotation: Math.PI, seatPosition: [6.5, 0.45, 3.7], seatRotation: Math.PI, standPosition: [5.0, 0, 3.9] },
];

export const COMMUNICATION_DOORS: DoorData[] = [
  { id: "c-door-main", position: [0, 0, 9.4], rotation: 0, label: { en: "Main Entrance", es: "Entrada Principal" }, width: 2.2, height: 3.2 },
];

export function CommunicationStudioSet({ activeSeatId, openDoorIds }: { activeSeatId?: string | null; openDoorIds?: Set<string> }) {
  return (
    <group>
      <mesh position={[0, 2.4, -9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#180e29" roughness={0.5} /></mesh>
      <mesh position={[0, 2.4, 9.8]}><boxGeometry args={[26, 4.8, 0.2]} /><meshStandardMaterial color="#180e29" roughness={0.5} /></mesh>
      <mesh position={[-12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#180e29" roughness={0.5} /></mesh>
      <mesh position={[12.8, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 20]} /><meshStandardMaterial color="#180e29" roughness={0.5} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#2d1b3f" roughness={0.3} metalness={0.1} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 4.8, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#0e0719" roughness={0.9} /></mesh>

      <mesh position={[0, 0.15, -8.8]}><boxGeometry args={[14, 0.3, 2.4]} /><meshStandardMaterial color="#be185d" roughness={0.4} /></mesh>
      <group position={[0, 2.8, -9.4]}>
        <mesh><boxGeometry args={[11.5, 3.1, 0.15]} /><meshStandardMaterial color="#831843" roughness={0.4} /></mesh>
        <Html position={[0, 0, 0.12]} transform distanceFactor={18} occlude={false}>
          <div className="w-[850px] select-none text-center text-white">
            <h1 className="text-3xl font-black tracking-widest text-pink-400">DAYANA'S COMMUNICATION STUDIO</h1>
            <p className="mt-1 text-sm font-extrabold text-pink-200">Online Kindness · Digital Citizenship · Networks</p>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-pink-500/40 bg-pink-950/70 p-3 w-28">
                <span className="text-3xl">💬</span>
                <span className="text-[10px] font-black text-pink-300">Safe Responses</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-purple-500/40 bg-purple-950/70 p-3 w-28">
                <span className="text-3xl">🌐</span>
                <span className="text-[10px] font-black text-purple-300">Network Map</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-rose-500/40 bg-rose-950/70 p-3 w-28">
                <span className="text-3xl">🤝</span>
                <span className="text-[10px] font-black text-rose-300">Kindness Hub</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {COMMUNICATION_DOORS.map((door) => (
        <InteractiveDoor key={door.id} door={door} isOpen={Boolean(openDoorIds?.has(door.id))} />
      ))}
      {COMMUNICATION_SEATS.map((seat) => (
        <InteractiveSeat key={seat.id} seat={seat} occupied={activeSeatId === seat.id} />
      ))}

      <ambientLight intensity={0.7} color="#fdf2f8" />
      <pointLight position={[0, 4.2, 0]} color="#ec4899" intensity={12} distance={15} />
    </group>
  );
}
