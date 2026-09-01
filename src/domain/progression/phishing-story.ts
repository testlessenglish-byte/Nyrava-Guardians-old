export type PhishingStoryStep =
  | "SPAWN_ISLA"
  | "GOTO_MISSION_HUB"
  | "TALK_SARAH"
  | "TRAVEL_DIGITAL_CITY"
  | "INSPECT_TERMINAL"
  | "COMPLETE_ACADEMY_LESSON"
  | "SOLVE_INCIDENT"
  | "RETURN_SARAH"
  | "MISSION_COMPLETED";

export type PhishingStoryState = {
  step: PhishingStoryStep;
  xpEarned: number;
  certificateEarned: boolean;
};

export const STORY_STEP_LABELS: Record<PhishingStoryStep, { title: string; objective: string; route: string }> = {
  SPAWN_ISLA: {
    title: "Step 1: Welcome to Isla Central",
    objective: "Explore Isla Central Plaza and find the Wayfinder Signpost.",
    route: "/isla",
  },
  GOTO_MISSION_HUB: {
    title: "Step 2: Head to Mission Hub",
    objective: "Travel to Mission Hub to check incident reports.",
    route: "/missions",
  },
  TALK_SARAH: {
    title: "Step 3: Briefing with Officer Sarah",
    objective: "Talk to Sarah at Mission Hub and accept 'The Phishing Attack'.",
    route: "/missions",
  },
  TRAVEL_DIGITAL_CITY: {
    title: "Step 4: Deploy to Digital City",
    objective: "Travel to Digital City to investigate the reported phishing terminal.",
    route: "/city",
  },
  INSPECT_TERMINAL: {
    title: "Step 5: Inspect Suspicious Terminal",
    objective: "Approach the red terminal at [0, 0, -8] and inspect the fake login message.",
    route: "/city",
  },
  COMPLETE_ACADEMY_LESSON: {
    title: "Step 6: Phishing Defense Training",
    objective: "Review Phishing Defense in the Academy Command Center.",
    route: "/classroom",
  },
  SOLVE_INCIDENT: {
    title: "Step 7: Solve Phishing Incident",
    objective: "Select 'Report & Delete Message' on the suspicious terminal.",
    route: "/city",
  },
  RETURN_SARAH: {
    title: "Step 8: Debriefing with Sarah",
    objective: "Return to Mission Hub to report your successful defense.",
    route: "/missions",
  },
  MISSION_COMPLETED: {
    title: "Mission Complete: The Phishing Attack",
    objective: "Congratulations! +400 XP earned and Digital Safety Certificate unlocked.",
    route: "/missions",
  },
};
