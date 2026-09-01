import { Text } from "@react-three/drei";
import { WorldLogoMark } from "@/components/brand/world-logo-mark";
import { missions } from "@/domain/progression/catalog";

export function SecurityClassroomCorrection() {
  const lesson = missions[0]!;

  return (
    <>
      {/* Hide the oversized legacy teaching screen and return the front wall to normal scale. */}
      <mesh position={[0, 2.72, -9.42]} receiveShadow>
        <boxGeometry args={[8.2, 3.15, 0.06]} />
        <meshStandardMaterial color="#d9e7ef" roughness={0.78} />
      </mesh>

      {/* Compact wall-mounted lesson display. It is physically fixed to the front wall. */}
      <group position={[0, 2.75, -9.33]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.4, 1.8, 0.09]} />
          <meshStandardMaterial color="#071426" roughness={0.42} metalness={0.35} />
        </mesh>
        <Text position={[0, 0.5, 0.06]} fontSize={0.13} color="#22d3ee" anchorX="center" anchorY="middle" letterSpacing={0.08}>
          DIGITAL SAFETY FOUNDATIONS
        </Text>
        <Text position={[0, 0.08, 0.06]} fontSize={0.3} maxWidth={4.7} color="#f8fafc" anchorX="center" anchorY="middle">
          {lesson.title.en}
        </Text>
        <Text position={[0, -0.33, 0.06]} fontSize={0.12} maxWidth={4.6} color="#bae6fd" anchorX="center" anchorY="middle">
          Learn the warning signs, practice safely, then take the assessment.
        </Text>
      </group>

      {/* The center-floor brand uses the real Nyrava logo, never a generic letter N. */}
      <WorldLogoMark position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]} size={2.5} />
    </>
  );
}
