import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useEffect } from "react";
import { ClassroomScene } from "@/components/meta/classroom-scene";
import { ClassHud } from "@/components/meta/class-hud";
import { controls } from "@/lib/class-store";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { isTypingTarget } from "@/services/game/input";

export const Route = createFileRoute("/classroom")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live 3D Class | Nyrava Guardians Metaverse Academy" },
      {
        name: "description",
        content:
          "Step into the Nyrava Guardians 3D classroom: walk around, meet your guardians and talk with them by voice or text about staying safe online.",
      },
      { property: "og:title", content: "Live 3D Class | Nyrava Guardians" },
      {
        property: "og:description",
        content: "Walk, talk and learn inside the Nyrava Guardians 3D academy classroom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClassroomPage,
});

function ClassroomPage() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const dragging = useRef(false);
  const { guardianId, guardianName } = useGuardian();
  const chosen = CLASS_GUARDIANS.find((g) => g.id === guardianId);
  const playerColor = chosen?.color ?? "#f4f7ff";
  const playerLabel = `${guardianName || "You"}${chosen ? ` · ${chosen.name}` : ""}`;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key.startsWith("Arrow")) e.preventDefault();
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) controls.keys.add(key);
      if (key === "arrowup") controls.keys.add("w");
      if (key === "arrowdown") controls.keys.add("s");
      if (key === "arrowleft") controls.keys.add("a");
      if (key === "arrowright") controls.keys.add("d");
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      controls.keys.delete(key);
      if (key === "arrowup") controls.keys.delete("w");
      if (key === "arrowdown") controls.keys.delete("s");
      if (key === "arrowleft") controls.keys.delete("a");
      if (key === "arrowright") controls.keys.delete("d");
    };
    const blur = () => controls.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      controls.keys.clear();
    };
  }, []);

  return (
    <div className="game-viewport classroom-viewport fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current) controls.cameraYaw -= e.movementX * 0.005;
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onLostPointerCapture={() => (dragging.current = false)}
      >
        <GameErrorBoundary>
          <Canvas
            frameloop={active ? "always" : "never"}
            shadows={quality.shadows}
            dpr={quality.dpr}
            camera={{ position: [0, 5, 13], fov: 58 }}
          >
            <ClassroomScene
              playerColor={playerColor}
              playerLabel={playerLabel}
              guardianId={chosen?.id ?? "lex"}
            />
          </Canvas>
        </GameErrorBoundary>
      </div>
      <ClassHud />
      <div className="mobile-game-controls game-right z-40">
        <LookPad target={controls} />
      </div>
      <WorldLoading />
      <GameSettings />
    </div>
  );
}
