import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { GuardianId } from "@/types";
import { loadGuardianCloud, saveGuardianCloud } from "@/lib/cloud-save";
import { type LocaleId } from "@/data/bilingual-dictionary";
import { conversationalVoiceEngine } from "@/services/ai/conversational-voice-engine";
import { readLocal, writeLocal, hydrateNativeProgress } from "@/services/platform/storage";

interface GuardianState {
  guardianId: GuardianId | null;
  guardianName: string;
  locale: LocaleId;
  cosmetics: Record<string, string>;
  homeDecor: Record<string, string>;
  xp: number;
  completedMissions: string[];
  hydrated: boolean;
  selectGuardian: (id: GuardianId) => void;
  setGuardianName: (name: string) => void;
  setLocale: (locale: LocaleId) => void;
  toggleLocale: () => void;
  setCosmetic: (slot: string, option: string) => void;
  setHomeDecor: (slot: string, option: string) => void;
  addXp: (amount: number) => void;
  completeMission: (id: string) => void;
  reset: () => void;
}

const GuardianContext = createContext<GuardianState | null>(null);

const STORAGE_KEY = "nyrava-guardian-state-v1";

interface Persisted {
  guardianId: GuardianId | null;
  guardianName: string;
  locale: LocaleId;
  cosmetics: Record<string, string>;
  homeDecor: Record<string, string>;
  xp: number;
  completedMissions: string[];
}

const DEFAULTS: Persisted = {
  guardianId: null,
  guardianName: "Alex",
  locale: "en-US",
  cosmetics: {},
  homeDecor: {},
  xp: 2450,
  completedMissions: [],
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = readLocal(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Persisted) };
  } catch {
    return DEFAULTS;
  }
}

export function GuardianProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hydrateNativeProgress().then(() => {
      if (cancelled) return;
      const local = loadPersisted();
      setState(local);
      conversationalVoiceEngine.setLocale(local.locale);
      setHydrated(true);

      void loadGuardianCloud()
        .then((cloud) => {
          if (cancelled || !cloud) return;
          if ((cloud.xp ?? 0) < local.xp) return;

          // The avatar chosen on this device is authoritative for the active play session.
          // Cloud progress may fill gaps, but it must not replace a local avatar/name with
          // stale defaults while a route is mounting.
          setState((current) => ({
            ...current,
            ...cloud,
            guardianId: local.guardianId ?? (cloud.guardianId as GuardianId | null) ?? current.guardianId,
            guardianName:
              local.guardianName !== DEFAULTS.guardianName
                ? local.guardianName
                : (cloud.guardianName ?? current.guardianName),
            cosmetics: Object.keys(local.cosmetics).length > 0 ? local.cosmetics : (cloud.cosmetics ?? current.cosmetics),
          }));
        })
        .catch(() => console.warn("Cloud progress unavailable; keeping local progress."));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeLocal(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage fallback
    }
    saveGuardianCloud(state);
  }, [state, hydrated]);

  const value = useMemo<GuardianState>(
    () => ({
      ...state,
      hydrated,
      selectGuardian: (id) => setState((s) => ({ ...s, guardianId: id })),
      setGuardianName: (name) => setState((s) => ({ ...s, guardianName: name })),
      setLocale: (newLocale) => {
        conversationalVoiceEngine.setLocale(newLocale);
        setState((s) => ({ ...s, locale: newLocale }));
      },
      toggleLocale: () => {
        const nextLocale = state.locale === "en-US" ? "es-MX" : "en-US";
        conversationalVoiceEngine.setLocale(nextLocale);
        setState((s) => ({ ...s, locale: nextLocale }));
      },
      setCosmetic: (slot, option) =>
        setState((s) => ({ ...s, cosmetics: { ...s.cosmetics, [slot]: option } })),
      setHomeDecor: (slot, option) =>
        setState((s) => ({ ...s, homeDecor: { ...s.homeDecor, [slot]: option } })),
      addXp: (amount) => setState((s) => ({ ...s, xp: s.xp + amount })),
      completeMission: (id) =>
        setState((s) =>
          s.completedMissions.includes(id)
            ? s
            : { ...s, completedMissions: [...s.completedMissions, id] },
        ),
      reset: () => setState(DEFAULTS),
    }),
    [state, hydrated],
  );

  return <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>;
}

export function useGuardian(): GuardianState {
  const context = useContext(GuardianContext);
  if (!context) {
    throw new Error("useGuardian must be used within GuardianProvider");
  }
  return context;
}
