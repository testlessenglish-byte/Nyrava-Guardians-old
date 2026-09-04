import { createFileRoute } from "@tanstack/react-router";
import { PauseMenu } from "@/components/game/pause-menu";
import { StoryTrackerHud } from "@/components/mission/story-tracker-hud";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";

import { IslaScene } from "@/components/isla/isla-scene";
import { IslaBrandOverlays } from "@/components/isla/isla-brand-overlays";
import { IslaHud } from "@/components/isla/isla-hud";
import { IslaControls } from "@/components/isla/isla-controls";
import { hydrateIsla, islaControls, toggleIslaView } from "@/lib/isla-store";
import { useGuardian } from "@/lib/guardian-context";
import { CLASS_GUARDIANS } from "@/lib/class-guardians";
import { GameErrorBoundary, GameSettings, WorldLoading } from "@/components/game/game-feedback";
import { QUALITY, useQuality } from "@/services/game/quality";
import { useAppActive } from "@/services/platform/lifecycle";
import { GuardianJourney } from "@/components/progression/guardian-journey";
import { isGameInputPaused, isTypingTarget } from "@/components/game/core/input-manager";
import { advancePhishingStory } from "@/lib/phishing-story-state";

export const Route = createFileRoute("/isla")({ ssr: false, component: IslaCentral });

const movementKey = (key: string) => {
  if (key === "arrowup") return "w";
  if (key === "arrowdown") return "s";
  if (key === "arrowleft") return "a";
  if (key === "arrowright") return "d";
  return key;
};

function clearLegacyInput() {
  islaControls.keys.clear();
  islaControls.joystick.x = 0;
  islaControls.joystick.y = 0;
  islaControls.sprint = false;
  islaControls.jump = false;
  islaControls.interact = false;
  islaControls.moveTarget = null;
}

function IslaCentral() {
  const quality = QUALITY[useQuality()];
  const active = useAppActive();
  const { guardianId, guardianName } = useGuardian();
  const guardian = CLASS_GUARDIANS.find((g) => g.id === guardianId) ?? CLASS_GUARDIANS[0]!;
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrateIsla();
    advancePhishingStory("SPAWN_ISLA", "GOTO_MISSION_HUB");
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (isGameInputPaused() || isTypingTarget(event.target)) return;
      const raw = event.key.toLowerCase();
      const key = movementKey(raw);
      if (["w", "a", "s", "d"].includes(key)) {
        if (raw.startsWith("arrow")) event.preventDefault();
        islaControls.keys.add(key);
      }
      if (raw === "shift") islaControls.sprint = true;
      if (raw === "e" && !event.repeat) islaControls.interact = true;
      if (event.code === "Space") {
        event.preventDefault();
        islaControls.jump = true;
      }
      if (raw === "v" && !event.repeat) toggleIslaView();
    };
    const up = (event: KeyboardEvent) => {
      const raw = event.key.toLowerCase();
      const key = movementKey(raw);
      islaControls.keys.delete(key);
      if (raw === "shift") islaControls.sprint = false;
    };
    const reset = () => clearLegacyInput();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    window.addEventListener("nyrava-input-reset", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      window.removeEventListener("nyrava-input-reset", reset);
      clearLegacyInput();
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="game-viewport fixed inset-0 z-50 touch-none bg-background"
      onPointerDown={(event) => {
        if (isGameInputPaused()) return;
        const target = event.target as HTMLElement | null;
        if (
          target?.closest(
            "button, a, select, input, summary, details, label, [role='button'], .game-panel, .game-panel-content, .isla-talk-prompt, .isla-conversation",
          )
        )
          return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragging.current = true;
        islaControls.dragged = false;
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
        clearLegacyInput();
      }}
      onLostPointerCapture={() => {
        dragging.current = false;
      }}
      onPointerMove={(event) => {
        if (!dragging.current || isGameInputPaused()) return;
        if (Math.abs(event.movementX) + Math.abs(event.movementY) > 2) islaControls.dragged = true;
        islaControls.cameraYaw -= event.movementX * 0.005;
        islaControls.cameraPitch = Math.min(
          0.85,
          Math.max(-0.15, islaControls.cameraPitch + event.movementY * 0.003),
        );
      }}
    >
      {mounted && (
        <GameErrorBoundary>
          <Canvas
            frameloop={active ? "always" : "never"}
            shadows={quality.shadows}
            dpr={quality.dpr}
            camera={{ position: [0, 8, 24], fov: 58 }}
          >
            <Suspense fallback={null}>
              <IslaScene
                playerColor={guardian.color}
                playerName={guardianName || "Alex"}
                playerGuardian={guardian.id}
              />
              <IslaBrandOverlays />
            </Suspense>
          </Canvas>
          <IslaHud guardianName={guardianName || "Alex"} />
          <IslaControls guardianName={guardianName || "Alex"} />
          <StoryTrackerHud />
          <GuardianJourney />
          <WorldLoading />
          <GameSettings />
          <PauseMenu />
        </GameErrorBoundary>
      )}
    </div>
  );
}
