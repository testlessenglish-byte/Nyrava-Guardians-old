import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useEffect } from "react";
import { ClassroomScene } from "@/components/meta/classroom-scene";
import { AcademyClassroomSet } from "@/components/meta/academy-classroom-set";
import { ClassHud } from "@/components/meta/class-hud";
import { controls } from "@/lib/class-store";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { useGuardian } from "@/lib/guardian-context";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { LookPad } from "@/components/game/touch-controls";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { isTypingTarget } from "@/services/game/input";
import { GuardianJourney } from "@/components/progression/guardian-journey";

export const Route = createFileRoute("/classroom")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live 3D Class | Nyrava Guardians Metaverse Academy" },
      {
        name: "description",
        content:
          "Enter the Nyrava Guardians 3D academy, complete guided digital-safety classes, pass assessments, and earn Guardian certificates.",
      },
      { property: "og:title", content: "Live 3D Class | Nyrava Guardians" },
      {
        property: "og:description",
        content: "Learn, test your skills, and earn Guardian achievements inside the Nyrava Academy classroom.",
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("nyrava-open-journey-on-load") !== "1") return;
    window.sessionStorage.removeItem("nyrava-open-journey-on-load");
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event("nyrava-open-journey"));
    }, 450);
    return () => window.clearTimeout(timer);
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
          if (dragging.current) {
            controls.cameraYaw -= e.movementX * 0.005;
            controls.cameraPitch += e.movementY * 0.003;
          }
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
            <AcademyClassroomSet />
          </Canvas>
        </GameErrorBoundary>
      </div>
      <ClassHud />
      <div className="pointer-events-auto absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-2xl border border-cyan-300/35 bg-slate-950/85 px-3 py-2 shadow-2xl backdrop-blur-md sm:px-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("nyrava-open-journey"))}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black text-slate-950">N</span>
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Digital Safety Class</span>
            <span className="block text-xs font-black text-white sm:text-sm">Lessons · Tests · Certificates</span>
          </span>
          <span className="rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">Open Class</span>
        </button>
      </div>
      <div className="mobile-game-controls game-right z-40">
        <LookPad target={controls} />
      </div>
      <GuardianJourney />
      <WorldLoading />
      <GameSettings />
    </div>
  );
}
