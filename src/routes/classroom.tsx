import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useEffect } from "react";
import { ClassroomScene } from "@/components/meta/classroom-scene";
import { ClassHud } from "@/components/meta/class-hud";
import { controls } from "@/lib/class-store";

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
  const dragging = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
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
    <div className="fixed inset-0 bg-background">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current) controls.cameraYaw -= e.movementX * 0.005;
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 13], fov: 58 }}>
          <ClassroomScene />
        </Canvas>
      </div>
      <ClassHud />
    </div>
  );
}
