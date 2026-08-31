import type { LocalizedContent, MasterySkill, ShieldTier } from "./types";

export type PublicMission = {
  id: string;
  title: LocalizedContent;
  summary: LocalizedContent;
  lesson: LocalizedContent[];
  questions: Array<{ id: string; prompt: LocalizedContent; options: LocalizedContent[] }>;
  prerequisiteIds: string[];
  playable: boolean;
  guardian: "sarah";
  xp: number;
  credits: number;
  badgeId: string;
};

export const FOUNDATION_MISSIONS = [
  "phishing-defense",
  "password-safety",
  "personal-information",
] as const;

export const missions: PublicMission[] = [
  {
    id: "phishing-defense",
    title: { en: "Phishing Defense", es: "Defensa contra phishing" },
    summary: {
      en: "Learn to pause, inspect messages, and verify before clicking.",
      es: "Aprende a pausar, revisar mensajes y verificar antes de hacer clic.",
    },
    lesson: [
      {
        en: "Urgency, prizes, threats, and requests for secrets are warning signs.",
        es: "La urgencia, los premios, las amenazas y las solicitudes de secretos son señales de alerta.",
      },
      {
        en: "Check the real sender and destination. Ask a trusted adult when unsure.",
        es: "Revisa el remitente y el destino reales. Pregunta a un adulto de confianza si tienes dudas.",
      },
      {
        en: "Never share passwords or one-time codes through a message.",
        es: "Nunca compartas contraseñas ni códigos de un solo uso por mensaje.",
      },
    ],
    questions: [
      {
        id: "q1",
        prompt: {
          en: "A message says: ‘Your game account closes in 5 minutes—send your password now.’ What should you do?",
          es: "Un mensaje dice: ‘Tu cuenta del juego cerrará en 5 minutos—envía tu contraseña ahora’. ¿Qué haces?",
        },
        options: [
          { en: "Send it quickly", es: "Enviarla rápido" },
          {
            en: "Do not reply; verify through the official app with a trusted adult",
            es: "No responder; verificar en la app oficial con un adulto de confianza",
          },
          { en: "Forward it to friends", es: "Reenviarlo a amigos" },
        ],
      },
      {
        id: "q2",
        prompt: {
          en: "Which link is safest to use for your school account?",
          es: "¿Qué enlace es más seguro para tu cuenta escolar?",
        },
        options: [
          { en: "A shortened link from a stranger", es: "Un enlace corto de un desconocido" },
          { en: "A link with ‘FREE-PRIZE’ in the address", es: "Un enlace con ‘PREMIO-GRATIS’" },
          { en: "The saved official school website", es: "El sitio escolar oficial guardado" },
        ],
      },
      {
        id: "q3",
        prompt: {
          en: "Someone asks for your one-time login code. What is the safe response?",
          es: "Alguien pide tu código de acceso de un solo uso. ¿Cuál es la respuesta segura?",
        },
        options: [
          {
            en: "Keep it private and tell a trusted adult",
            es: "Mantenerlo privado y avisar a un adulto de confianza",
          },
          { en: "Share only half", es: "Compartir solo la mitad" },
          { en: "Trade it for game credits", es: "Cambiarlo por créditos del juego" },
        ],
      },
      {
        id: "q4",
        prompt: {
          en: "A surprising message appears to be from a friend. What should you inspect first?",
          es: "Un mensaje inesperado parece ser de un amigo. ¿Qué debes revisar primero?",
        },
        options: [
          { en: "Its colors", es: "Sus colores" },
          {
            en: "The real sender and what the link opens",
            es: "El remitente real y lo que abre el enlace",
          },
          { en: "How many emojis it has", es: "Cuántos emojis tiene" },
        ],
      },
    ],
    prerequisiteIds: [],
    playable: true,
    guardian: "sarah",
    xp: 500,
    credits: 150,
    badgeId: "phishing-hunter",
  },
  {
    id: "password-safety",
    title: { en: "Password Safety", es: "Seguridad de contraseñas" },
    summary: {
      en: "Build strong, unique passphrases.",
      es: "Crea frases de contraseña fuertes y únicas.",
    },
    lesson: [],
    questions: [],
    prerequisiteIds: ["phishing-defense"],
    playable: false,
    guardian: "sarah",
    xp: 500,
    credits: 150,
    badgeId: "password-protector",
  },
  {
    id: "personal-information",
    title: { en: "Personal Information Safety", es: "Seguridad de información personal" },
    summary: {
      en: "Know what information must stay private.",
      es: "Identifica qué información debe permanecer privada.",
    },
    lesson: [],
    questions: [],
    prerequisiteIds: ["password-safety"],
    playable: false,
    guardian: "sarah",
    xp: 500,
    credits: 150,
    badgeId: "privacy-keeper",
  },
];

export const paths = [
  ["digital-safety", "Digital Safety", "Seguridad digital"],
  ["ai-literacy", "AI Literacy", "Alfabetización en IA"],
  ["coding-hardware", "Coding & Hardware", "Código y hardware"],
  ["networks-kindness", "Networks & Kindness", "Redes y amabilidad"],
  ["data-logic", "Data & Logic", "Datos y lógica"],
  ["research-truth", "Research & Truth", "Investigación y verdad"],
  ["responsible-creation", "Responsible Creation", "Creación responsable"],
].map(([id, en, es]) => ({ id, name: { en, es } as LocalizedContent }));

export type ShieldCatalogItem = {
  id: string;
  tier: ShieldTier;
  name: LocalizedContent;
  requirement: LocalizedContent;
  gate:
    | "joined"
    | "foundations"
    | "ten-mastery"
    | "level10-challenge"
    | "two-certificates"
    | "level20-creator"
    | "capstone";
};
export const shields: ShieldCatalogItem[] = [
  [
    "basic-shield",
    1,
    "Basic Shield",
    "Escudo Básico",
    "Join the Guardians",
    "Únete a los Guardianes",
    "joined",
  ],
  [
    "protector-shield",
    2,
    "Protector Shield",
    "Escudo Protector",
    "Complete Password Safety, Phishing Defense, and Personal Information Safety",
    "Completa Seguridad de contraseñas, Defensa contra phishing y Seguridad de información personal",
    "foundations",
  ],
  [
    "guardian-shield",
    3,
    "Guardian Shield",
    "Escudo Guardián",
    "Complete 10 missions and their mastery checks",
    "Completa 10 misiones y sus comprobaciones de dominio",
    "ten-mastery",
  ],
  [
    "defender-shield",
    4,
    "Defender Shield",
    "Escudo Defensor",
    "Reach Level 10 and pass the applied protection challenge",
    "Alcanza el nivel 10 y supera el reto de protección aplicada",
    "level10-challenge",
  ],
  [
    "champion-shield",
    5,
    "Champion Shield",
    "Escudo Campeón",
    "Earn 2 substantial certificates from distinct learning paths",
    "Obtén 2 certificados sustanciales de rutas distintas",
    "two-certificates",
  ],
  [
    "elite-shield",
    6,
    "Elite Shield",
    "Escudo de Élite",
    "Reach Level 20 with advanced mastery and creator safety",
    "Alcanza el nivel 20 con dominio avanzado y seguridad creadora",
    "level20-creator",
  ],
  [
    "legendary-shield",
    7,
    "Legendary Shield",
    "Escudo Legendario",
    "Complete the multi-skill Guardian Capstone",
    "Completa el reto final Guardián multidisciplinario",
    "capstone",
  ],
].map(([id, tier, en, es, ren, res, gate]) => ({
  id: id as string,
  tier: tier as ShieldTier,
  name: { en: en as string, es: es as string },
  requirement: { en: ren as string, es: res as string },
  gate: gate as ShieldCatalogItem["gate"],
}));

export const answerKey: Record<string, number[]> = { "phishing-defense": [1, 2, 0, 1] };
export const masterySkills: MasterySkill[] = [
  "phishing",
  "passwords",
  "privacy",
  "verification",
  "building",
  "creator-safety",
];
