import { createFileRoute } from '@tanstack/react-router'
import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";

class IslaErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D World Scene render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
          <h2 className="text-2xl font-black text-cyan-400">Loading Isla Central...</h2>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            Initializing 3D graphics engine. If rendering takes longer than expected, please refresh your browser.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-cyan-500 px-6 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Reload Island
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { IslaScene } from "@/components/isla/isla-scene";
import { IslaHud } from "@/components/isla/isla-hud";
import { hydrateIsla, islaControls, toggleIslaView } from "@/lib/isla-store";
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
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragDist = useRef(0);

  useEffect(() => {
    hydrateIsla();
    // Handy for debugging camera/movement state from the console.
    (window as unknown as { __isla?: typeof islaControls }).__isla = islaControls;
  }, []);

  useEffect(() => {
    const ARROW_MAP: Record<string, string> = {
      arrowup: "w",
      arrowdown: "s",
      arrowleft: "a",
      arrowright: "d",
    };
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const moveKey = ARROW_MAP[key] ?? (["w", "a", "s", "d"].includes(key) ? key : null);
      if (moveKey) {
        if (ARROW_MAP[key]) e.preventDefault();
        islaControls.keys.add(moveKey);
      }
      if (key === "shift") islaControls.sprint = true;
      if (key === "e") islaControls.interact = true;
      if (key === "v") toggleIslaView();
      if (e.code === "Space") {
        e.preventDefault();
        islaControls.jump = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      islaControls.keys.delete(ARROW_MAP[key] ?? key);
      if (key === "shift") islaControls.sprint = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = islaControls.camDistance * Math.exp(dy * 0.0015);
      islaControls.camDistance = Math.min(34, Math.max(3.5, next));
      if (islaControls.camDistance <= 4 && islaControls.view === "third") toggleIslaView();
      if (islaControls.camDistance > 5 && islaControls.view === "first") toggleIslaView();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={wrap}
      className="fixed inset-0 z-50 touch-none bg-background"
      onPointerDown={() => {
        dragging.current = true;
        dragDist.current = 0;
        islaControls.dragged = false;
      }}
      onPointerUp={() => {
        dragging.current = false;
        window.setTimeout(() => {
          islaControls.dragged = false;
        }, 0);
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
        if (dragDist.current > 6) islaControls.dragged = true;
        islaControls.cameraYaw -= e.movementX * 0.005;
        islaControls.cameraPitch = Math.min(
          0.85,
          Math.max(-0.15, islaControls.cameraPitch + e.movementY * 0.003),
        );
      }}
    >
      <IslaErrorBoundary>
        <Canvas shadows camera={{ position: [0, 26, 52], fov: 58, near: 0.1, far: 5000 }} dpr={[1, 1.6]}>
          <Suspense fallback={null}>
            <IslaScene
              playerColor={guardian.color}
              playerName={guardianName || "Guardian"}
              playerGuardian={guardian.id}
            />
          </Suspense>
        </Canvas>
      </IslaErrorBoundary>
      <IslaHud guardianName={guardian.name} />
    </div>
  );
}
