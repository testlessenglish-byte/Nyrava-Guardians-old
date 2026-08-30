import { useMemo } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { GUARDIAN_IMAGES } from "@/data/guardians";

export type CharacterClip = "idle" | "walk" | "run" | "talk" | "wave" | "swim";

/**
 * 3D Guardian Hero Avatar Component
 * Renders the exact high-definition Guardian hero avatar (matching the front of site cards)
 * in the 3D world with 3D ground shadow, glowing chest energy core, and aura lighting.
 */
export function Character({
  color,
  clip,
  guardianId = "lex",
  height = 1.8,
}: {
  color: string;
  clip: CharacterClip;
  guardianId?: string;
  height?: number;
}) {
  const avatarImgUrl = GUARDIAN_IMAGES[guardianId] ?? GUARDIAN_IMAGES["lex"]!;
  
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(avatarImgUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [avatarImgUrl]);

  const swimming = clip === "swim";

  return (
    <group>
      <group rotation-x={swimming ? Math.PI / 2.35 : 0} position-y={swimming ? 0.5 : 0}>
        {/* High-Resolution Guardian Hero Avatar matching the front of site */}
        <Billboard position={[0, height * 0.6, 0]}>
          <mesh>
            <planeGeometry args={[height * 0.85, height * 1.2]} />
            <meshStandardMaterial
              map={texture}
              transparent
              roughness={0.2}
              metalness={0.1}
              emissive={color}
              emissiveIntensity={0.15}
              side={THREE.DoubleSide}
              alphaTest={0.05}
            />
          </mesh>
        </Billboard>

        {/* Guardian Energy Core */}
        <mesh position={[0, height * 0.4, 0.05]}>
          <icosahedronGeometry args={[height * 0.045, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} toneMapped={false} />
        </mesh>

        {/* Dynamic Ground Aura Ring & 3D Shadow */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[height * 0.22, height * 0.32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
          <circleGeometry args={[height * 0.32, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>

        <pointLight position={[0, height * 0.7, 0]} color={color} intensity={1.8} distance={height * 3} />
      </group>
    </group>
  );
}
