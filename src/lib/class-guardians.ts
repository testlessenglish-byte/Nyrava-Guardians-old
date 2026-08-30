export type ClassGuardian = {
  id: string;
  name: string;
  role: string;
  color: string;
  voice: string;
  position: [number, number, number];
  rotation: number;
  greeting: string;
};

/** Teaching stations arranged around the Nyrava live classroom. */
export const CLASS_GUARDIANS: ClassGuardian[] = [
  {
    id: "lex",
    name: "Lex",
    role: "The Analyst",
    color: "#22e07a",
    voice: "ash",
    position: [-6, 0, -4],
    rotation: Math.PI * 0.25,
    greeting: "Walk up and I'll show you how to spot a pattern in any feed.",
  },
  {
    id: "nova",
    name: "Nova",
    role: "The Investigator",
    color: "#a468ff",
    voice: "nova",
    position: [6, 0, -4],
    rotation: -Math.PI * 0.25,
    greeting: "Bring me something you saw online and we'll check if it's true.",
  },
  {
    id: "tess",
    name: "Tess",
    role: "The Protector",
    color: "#3aa0ff",
    voice: "shimmer",
    position: [-6, 0, 4],
    rotation: Math.PI * 0.75,
    greeting: "Shields up. Ask me anything about staying safe out there.",
  },
  {
    id: "byte",
    name: "Byte",
    role: "The Builder",
    color: "#ffb020",
    voice: "echo",
    position: [6, 0, 4],
    rotation: -Math.PI * 0.75,
    greeting: "Got an idea? Let's build it together, step by step.",
  },
  {
    id: "echo",
    name: "Echo",
    role: "The Communicator",
    color: "#22d3ee",
    voice: "alloy",
    position: [0, 0, -9],
    rotation: 0,
    greeting: "Welcome to class! Say hi with your voice or type to me.",
  },
];
