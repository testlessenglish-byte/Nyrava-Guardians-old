/**
 * Nyrava Guardians — service boundary (mock implementation).
 *
 * Components call these services only. Antigravity will swap the mock
 * implementations for real providers behind the same interfaces, without
 * touching the visual layer. No provider API keys or provider-specific
 * code may appear here or in components.
 */
import {
  ACADEMY_LABS,
  ACHIEVEMENTS,
  CHILD_WORLD,
  GUARDIANS,
  MASTERIES,
  MISSIONS,
  NEXT_OBJECTIVE,
  WORLD_AREAS,
} from "@/data/world";
import { GUARDIANS as GUARDIAN_LIST } from "@/data/guardians";
import type { BuilderRequest, Mission } from "@/types";

void GUARDIANS;

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const GuardianService = {
  async list() {
    await delay();
    return GUARDIAN_LIST;
  },
  async get(id: string) {
    await delay();
    return GUARDIAN_LIST.find((g) => g.id === id) ?? null;
  },
};

export const WorldService = {
  async getWorld() {
    await delay();
    return CHILD_WORLD;
  },
  async listAreas() {
    await delay();
    return WORLD_AREAS;
  },
};

export const MissionService = {
  async list(): Promise<Mission[]> {
    await delay();
    return MISSIONS;
  },
  async get(id: string) {
    await delay();
    return MISSIONS.find((m) => m.id === id) ?? null;
  },
};

export const AcademyService = {
  async listLabs() {
    await delay();
    return ACADEMY_LABS;
  },
};

export const MasteryService = {
  async listMasteries() {
    await delay();
    return MASTERIES;
  },
  async listAchievements() {
    await delay();
    return ACHIEVEMENTS;
  },
  async nextObjective() {
    await delay();
    return NEXT_OBJECTIVE;
  },
};

export interface BuilderPlanResult {
  planPreview: string[];
  requestedTheme: string;
}

/**
 * Single conceptual AI entry point. The real provider router
 * (e.g. Groq/Gemini) is implemented by Antigravity behind this boundary.
 */
export const GuardianAI = {
  async request(input: { prompt: string }): Promise<BuilderPlanResult> {
    void input;
    await delay(600);
    return {
      requestedTheme: "custom",
      planPreview: [
        "Central hub with a glowing Nyrava beacon",
        "Three explorable zones connected by light bridges",
        "Hidden learning crystals that unlock mini-challenges",
        "A Guardian rest area with your chosen decor style",
      ],
    };
  },
};

export const BuilderService = {
  async createRequest(prompt: string): Promise<BuilderRequest> {
    await delay();
    return {
      prompt,
      requestedTheme: "custom",
      status: "understanding",
      planPreview: [],
      safetyStatus: "pending",
      generatedWorldId: null,
    };
  },
};
