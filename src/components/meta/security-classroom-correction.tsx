import { WorldLogoMark } from "@/components/brand/world-logo-mark";

export function SecurityClassroomCorrection() {
  return (
    <>
      {/* Center-floor brand uses the official Nyrava logo mark. */}
      <WorldLogoMark position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]} size={2.5} />
    </>
  );
}
