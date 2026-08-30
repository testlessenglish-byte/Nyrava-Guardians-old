import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GuardianId } from "@/types";

interface GuardianState {
  guardianId: GuardianId | null;
  guardianName: string;
  cosmetics: Record<string, string>;
  homeDecor: Record<string, string>;
  xp: number;
  completedMissions: string[];
  selectGuardian: (id: GuardianId) => void;
  setGuardianName: (name: string) => void;
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
  cosmetics: Record<string, string>;
  homeDecor: Record<string, string>;
  xp: number;
  completedMissions: string[];
}

const DEFAULTS: Persisted = {
  guardianId: null,
  guardianName: "Alex",
  cosmetics: {},
  homeDecor: {},
  xp: 2450,
  completedMissions: [],
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
    setState(loadPersisted());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — demo state simply won't persist
    }
  }, [state, hydrated]);

  const value = useMemo<GuardianState>(
    () => ({
      ...state,
      selectGuardian: (id) => setState((s) => ({ ...s, guardianId: id })),
      setGuardianName: (name) => setState((s) => ({ ...s, guardianName: name })),
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
    [state],
  );

  return <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>;
}

export function useGuardian() {
  const ctx = useContext(GuardianContext);
  if (!ctx) throw new Error("useGuardian must be used inside GuardianProvider");
  return ctx;
}
