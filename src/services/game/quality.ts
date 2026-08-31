import { useSyncExternalStore } from "react";
import { readLocal, writeLocal } from "@/services/platform/storage";

export const QUALITY = {
  LOW: { dpr: 1, shadows: false, shadowSize: 512, terrainSegments: 100, scatter: 0.35 },
  MEDIUM: { dpr: 1.25, shadows: true, shadowSize: 1024, terrainSegments: 180, scatter: 0.65 },
  HIGH: { dpr: 1.6, shadows: true, shadowSize: 2048, terrainSegments: 300, scatter: 1 },
} as const;
export type Quality = keyof typeof QUALITY;
let quality: Quality = "MEDIUM";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export function initialQuality(memory: number, cores: number, touch: boolean): Quality {
  if (memory <= 4 || cores <= 4) return "LOW";
  return touch ? "MEDIUM" : "HIGH";
}
export function initializeQuality() {
  const saved = readLocal("nyrava-quality");
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  quality =
    saved && saved in QUALITY
      ? (saved as Quality)
      : initialQuality(memory, navigator.hardwareConcurrency || 4, navigator.maxTouchPoints > 0);
  listeners.forEach((fn) => fn());
}
export function setQuality(next: Quality) {
  quality = next;
  writeLocal("nyrava-quality", next);
  listeners.forEach((fn) => fn());
}
export function useQuality() {
  return useSyncExternalStore(
    subscribe,
    () => quality,
    () => "MEDIUM" as Quality,
  );
}
