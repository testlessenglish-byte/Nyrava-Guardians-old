import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  Globe2,
  GraduationCap,
  Heart,
  Landmark,
  Mountain,
  Rocket,
  Shield,
  Sparkles,
  TreePine,
  Waves,
  Zap,
} from "lucide-react";
import { Suspense } from "react";
import worldMapImg from "@/assets/guardians/world_map.jpg";
import lexImg from "@/assets/guardians/lex.png";
import sarahImg from "@/assets/guardians/sarah.png";
import { useGuardian } from "@/lib/guardian-context";
import { WorldService } from "@/services/mock";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "Guardian World Map — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Explore World 1: Isla Central and the surrounding archipelago — Ciudad Central, Bosque de Sabiduría, Valle de la Historia, Montañas del Conocimiento, Océano Infinito, and Zona Espacial.",
      },
    ],
  }),
  component: WorldPage,
});

const WORLD_ZONES = [
  {
    id: "ciudad-central",
    name: "CIUDAD CENTRAL",
    subtitle: "Explora · Aprende · Crea",
    icon: Landmark,
    position: { top: "14%", left: "48%" },
    link: "/isla",
    badge: "100%",
    color: "#00f0ff",
  },
  {
    id: "bosque-sabiduria",
    name: "BOSQUE DE SABIDURÍA",
    subtitle: "Naturaleza · Ciencia · Vida",
    icon: TreePine,
    position: { top: "20%", left: "20%" },
    link: "/academy",
    badge: "90%",
    color: "#22e07a",
  },
  {
    id: "valle-historia",
    name: "VALLE DE LA HISTORIA",
    subtitle: "Cultura · Arte · Pasado",
    icon: Landmark,
    position: { top: "48%", left: "32%" },
    link: "/missions",
    badge: "85%",
    color: "#f59e0b",
  },
  {
    id: "montanas-conocimiento",
    name: "MONTAÑAS DEL CONOCIMIENTO",
    subtitle: "Desafíos · Estrategia · Innovación",
    icon: Mountain,
    position: { top: "16%", left: "76%" },
    link: "/academy",
    badge: "75%",
    color: "#38bdf8",
  },
  {
    id: "oceano-infinito",
    name: "OCÉANO INFINITO",
    subtitle: "Aventura · Exploración · Futuro",
    icon: Waves,
    position: { top: "62%", left: "54%" },
    link: "/builder",
    badge: "80%",
    color: "#0ea5e9",
  },
  {
    id: "zona-espacial",
    name: "ZONA ESPACIAL",
    subtitle: "Descubre · Construye · Sueña",
    icon: Rocket,
    position: { top: "46%", left: "82%" },
    link: "/builder",
    badge: "60%",
    color: "#a855f7",
  },
];

function WorldPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <WorldMapContent />
    </Suspense>
  );
}

function WorldMapContent() {
  const { guardianName, xp } = useGuardian();
  const level = Math.max(1, Math.floor(xp / 250) + 1);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-950 text-white shadow-2xl">
      {/* Background High-Definition Interactive World Map */}
      <div className="absolute inset-0 z-0">
        <img
          src={worldMapImg}
          alt="World 1: Isla Central Map"
          className="h-full w-full object-cover object-center filter brightness-95 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
      </div>

      {/* Header Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-950/80 shadow-lg shadow-cyan-500/20 backdrop-blur-md">
            <Globe2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-cyan-100 drop-shadow-md md:text-2xl">
              World 1: Isla Central
            </h1>
            <p className="text-xs font-semibold text-cyan-300/80">
              Explora · Aprende · Crea
            </p>
          </div>
        </div>

        {/* User Status Bar */}
        <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/40 bg-slate-900/80 p-2 px-4 backdrop-blur-md">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-cyan-400 bg-slate-800">
            <img src={lexImg} alt={guardianName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-cyan-200">Hola, {guardianName}!</p>
            <p className="text-[11px] text-cyan-400/80">Tu Guardian siempre está contigo.</p>
          </div>
          <div className="ml-2 flex items-center gap-2 rounded-xl bg-cyan-950/90 px-3 py-1 border border-cyan-400/40">
            <span className="text-xs font-extrabold text-cyan-300">Nivel {level}</span>
            <span className="text-xs font-bold text-cyan-400/70">{xp} / 3,500 XP</span>
          </div>
        </div>
      </div>

      {/* Interactive World Hotspot Pins */}
      <div className="absolute inset-0 z-10">
        {WORLD_ZONES.map((zone) => {
          const Icon = zone.icon;
          return (
            <Link
              key={zone.id}
              to={zone.link}
              style={{ top: zone.position.top, left: zone.position.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 hover:scale-110"
            >
              <div className="flex flex-col items-center">
                {/* Pin Badge */}
                <div
                  style={{ borderColor: zone.color }}
                  className="flex items-center gap-2 rounded-2xl border-2 bg-slate-900/90 px-3.5 py-1.5 shadow-lg backdrop-blur-md transition-all group-hover:bg-slate-900 group-hover:shadow-cyan-500/50"
                >
                  <div
                    style={{ backgroundColor: zone.color }}
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-950 font-bold"
                  >
                    <Icon className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-white tracking-wide">
                      {zone.name}
                    </p>
                    <p className="text-[10px] font-medium text-cyan-300/80">
                      {zone.subtitle}
                    </p>
                  </div>
                </div>

                {/* Pulsing Beacon Ring */}
                <div
                  style={{ backgroundColor: zone.color }}
                  className="mt-1 h-3 w-3 rounded-full animate-ping opacity-75"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Hero Overlook & Mission Banner */}
      <div className="relative z-20 mt-auto flex flex-col items-end justify-between gap-4 p-4 md:flex-row md:items-end md:p-6">
        {/* Left Side: Lex & Sarah Hero Avatars */}
        <div className="pointer-events-none flex items-end gap-3">
          <img
            src={lexImg}
            alt="Lex Avatar"
            className="h-36 md:h-48 drop-shadow-[0_10px_25px_rgba(0,240,255,0.4)] transition-transform duration-300 hover:scale-105"
          />
          <img
            src={sarahImg}
            alt="Sarah AI Companion"
            className="h-24 md:h-32 drop-shadow-[0_10px_25px_rgba(56,189,248,0.5)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Center/Right Side: Mission Banner & Launch Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-slate-950/90 p-4 backdrop-blur-md shadow-xl max-w-md">
            <Sparkles className="h-6 w-6 shrink-0 text-cyan-400 animate-pulse" />
            <div>
              <p className="text-xs font-extrabold text-cyan-200">Tu mundo, tus reglas.</p>
              <p className="text-[11px] text-cyan-300/80">
                Explora cada isla, completa misiones y construye un futuro mejor.
              </p>
            </div>
          </div>

          <Link
            to="/isla"
            className="flex items-center justify-between gap-4 rounded-2xl border-2 border-cyan-400 bg-cyan-950/90 px-6 py-4 font-extrabold text-cyan-100 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-900 hover:scale-105 backdrop-blur-md w-full sm:w-auto"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase text-cyan-300">Isla Actual</p>
              <p className="text-sm font-black text-white">Ciudad Central</p>
            </div>
            <Zap className="h-5 w-5 text-cyan-400 animate-bounce" />
          </Link>
        </div>
      </div>
    </div>
  );
}
