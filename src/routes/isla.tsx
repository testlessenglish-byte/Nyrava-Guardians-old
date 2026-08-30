import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { IslaScene } from "@/components/isla/isla-scene";
import { IslaHud } from "@/components/isla/isla-hud";
import { hydrateIsla, islaControls } from "@/lib/isla-store";
import { useGuardian } from "@/lib/guardian-context";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";

export const Route = createFileRoute("/isla")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "World 1: Isla Central | Nyrava Guardians" },
      {
        name: "description",
        content:
          "Walk into Isla Central, the first playable Nyrava Guardians world. Explore forests, mountains, ruins, deserts and beaches, follow your Guardian's clues and find the 5 Knowledge Crystals.",
      },
      { property: "og:title", content: "World 1: Isla Central | Nyrava Guardians" },
      {
        property: "og:description",
        content: "Explore a real walkable island, solve challenges and complete Class 1 with your Guardian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IslaCentral,
});

function IslaCentral() {
  const { guardianId, guardianName } = useGuardian();
  const guardian =
    CLASS_GUARDIANS.find((g) => g.id === guardianId) ?? (CLASS_GUARDIANS[0] as (typeof CLASS_GUARDIANS)[number]);
  const dragging = useRef(false);

  useEffect(() => {
    hydrateIsla();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) islaControls.keys.add(key);
      if (key === "e") islaControls.interact = true;
    };
    const up = (e: KeyboardEvent) => islaControls.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-background"
      onPointerDown={() => {
        dragging.current = true;
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
      onPointerMove={(e) => {
        if (dragging.current) islaControls.cameraYaw -= e.movementX * 0.005;
      }}
    >
      <Canvas shadows camera={{ position: [0, 12, 24], fov: 58 }} dpr={[1, 1.6]}>
        <Suspense fallback={null}>
          <IslaScene
            playerColor={guardian.color}
            playerName={guardianName || "Guardian"}
            guardianColor={guardian.color}
          />
        </Suspense>
      </Canvas>
      <IslaHud guardianName={guardian.name} />
    </div>
  );
}
