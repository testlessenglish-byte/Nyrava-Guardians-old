import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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

function NeonPanel({
  position,
  size,
  color,
  intensity = 0.8,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  intensity?: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#0b1425"
        emissive={color}
        emissiveIntensity={intensity}
        metalness={0.55}
        roughness={0.25}
      />
    </mesh>
  );
}

export function AcademyClassroomSet() {
  const deskRows = [
    [-5.2, 2.8],
    [0, 2.8],
    [5.2, 2.8],
    [-5.2, 6.5],
    [0, 6.5],
    [5.2, 6.5],
  ] as const;

  return (
    <group>
      {/* Premium academy floor inset */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 1.4]} receiveShadow>
        <planeGeometry args={[23, 20]} />
        <meshStandardMaterial color="#0a1628" metalness={0.5} roughness={0.32} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.035, 1.4]}>
        <ringGeometry args={[5.4, 5.7, 64]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.8}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Front teaching stage */}
      <mesh position={[0, 0.32, -8.6]} castShadow receiveShadow>
        <boxGeometry args={[15.5, 0.62, 3.4]} />
        <meshStandardMaterial color="#14213a" metalness={0.6} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.7, -10.05]}>
        <boxGeometry args={[17, 5.5, 0.28]} />
        <meshStandardMaterial
          color="#07111f"
          emissive="#0891b2"
          emissiveIntensity={0.55}
          metalness={0.65}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.7, -9.86]}>
        <planeGeometry args={[15.8, 4.5]} />
        <meshStandardMaterial
          color="#061a2b"
          emissive="#38bdf8"
          emissiveIntensity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html position={[0, 1.85, -9.66]} transform distanceFactor={8.8} occlude={false}>
        <div className="w-[760px] select-none text-center text-white">
          <p className="text-sm font-black uppercase tracking-[0.48em] text-cyan-300">Nyrava Academy</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight">DIGITAL SAFETY LAB</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg font-semibold text-slate-300">
            Learn it. Test it. Prove it. Earn your shield.
          </p>
          <div className="mx-auto mt-5 flex w-fit gap-3">
            {['Phishing', 'Passwords', 'Privacy'].map((item, index) => (
              <span
                key={item}
                className="rounded-full border px-4 py-1.5 text-sm font-black"
                style={{
                  borderColor: index === 0 ? '#22d3ee' : index === 1 ? '#a78bfa' : '#34d399',
                  color: index === 0 ? '#67e8f9' : index === 1 ? '#c4b5fd' : '#6ee7b7',
                  background: 'rgba(2, 8, 23, .72)',
                }}
              >
                {index + 1} · {item}
              </span>
            ))}
          </div>
        </div>
      </Html>

      {/* Side holographic walls */}
      <NeonPanel position={[-12.2, 2.4, -2]} size={[0.32, 4.4, 13]} color="#22d3ee" />
      <NeonPanel position={[12.2, 2.4, -2]} size={[0.32, 4.4, 13]} color="#a855f7" />
      {[-8.5, -3, 2.5, 8].map((z, i) => (
        <mesh key={`window-l-${z}`} position={[-12.0, 2.5, z]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[4.4, 3.1]} />
          <meshStandardMaterial
            color={i % 2 ? "#0c2340" : "#071b32"}
            emissive={i % 2 ? "#7c3aed" : "#0891b2"}
            emissiveIntensity={0.35}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
      {[-8.5, -3, 2.5, 8].map((z, i) => (
        <mesh key={`window-r-${z}`} position={[12.0, 2.5, z]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[4.4, 3.1]} />
          <meshStandardMaterial
            color={i % 2 ? "#1b1236" : "#111a35"}
            emissive={i % 2 ? "#9333ea" : "#2563eb"}
            emissiveIntensity={0.36}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}

      {/* Real furniture assets already in the project */}
      {deskRows.map(([x, z], index) => (
        <group key={`${x}-${z}`}>
          <Furniture url="/models/desk.glb" position={[x, 0.1, z]} rotation={Math.PI} scale={1.18} />
          <Furniture
            url="/models/chairDesk.glb"
            position={[x, 0.08, z + 1.45]}
            rotation={Math.PI}
            scale={1.05}
          />
          <mesh position={[x, 1.35, z - 0.1]} rotation-x={-0.18}>
            <boxGeometry args={[1.6, 0.08, 0.95]} />
            <meshStandardMaterial
              color="#07111f"
              emissive={index % 3 === 0 ? "#22d3ee" : index % 3 === 1 ? "#8b5cf6" : "#10b981"}
              emissiveIntensity={0.7}
              metalness={0.7}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}
      <Furniture url="/models/bookcaseOpen.glb" position={[-10.6, 0, 9.6]} rotation={Math.PI / 2} scale={1.35} />
      <Furniture url="/models/bookcaseOpen.glb" position={[10.6, 0, 9.6]} rotation={-Math.PI / 2} scale={1.35} />

      {/* Ceiling light architecture */}
      {[-7.5, -2.5, 2.5, 7.5].map((x, i) => (
        <mesh key={x} position={[x, 5.65, 0]}>
          <boxGeometry args={[2.4, 0.18, 18]} />
          <meshStandardMaterial
            color="#e2f7ff"
            emissive={i % 2 ? "#8b5cf6" : "#22d3ee"}
            emissiveIntensity={2.2}
          />
        </mesh>
      ))}

      {/* Certificate display wall */}
      <mesh position={[0, 2.25, 11.9]} rotation-y={Math.PI}>
        <boxGeometry args={[12, 4, 0.28]} />
        <meshStandardMaterial color="#111827" emissive="#f59e0b" emissiveIntensity={0.28} />
      </mesh>
      <Html position={[0, 2.3, 11.68]} rotation={[0, Math.PI, 0]} transform distanceFactor={9.5} occlude={false}>
        <div className="w-[520px] rounded-3xl border border-amber-300/40 bg-slate-950/80 p-6 text-center text-white shadow-2xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300">Achievement Wall</p>
          <h3 className="mt-2 text-3xl font-black">Earn Your Certificate</h3>
          <p className="mt-2 text-sm text-slate-300">Pass all three foundation assessments at 75% or higher.</p>
        </div>
      </Html>

      <pointLight position={[0, 4, -7]} color="#22d3ee" intensity={16} distance={18} />
      <pointLight position={[-8, 3, 4]} color="#8b5cf6" intensity={10} distance={16} />
      <pointLight position={[8, 3, 4]} color="#10b981" intensity={10} distance={16} />
    </group>
  );
}

useGLTF.preload("/models/desk.glb");
useGLTF.preload("/models/chairDesk.glb");
useGLTF.preload("/models/bookcaseOpen.glb");
