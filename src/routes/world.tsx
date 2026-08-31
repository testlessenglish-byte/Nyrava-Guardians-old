import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, Landmark, Mountain, Play, Rocket, TreePine, Waves } from "lucide-react";
import worldMapImg from "@/assets/guardians/world_map.jpg";
import { useGuardian } from "@/lib/guardian-context";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "Guardian World Map — Nyrava Guardians" },
      { name: "description", content: "Explore Isla Central and the future Nyrava archipelago." },
    ],
  }),
  component: WorldPage,
});

const ZONES = [
  {
    id: "city",
    en: "Central City",
    es: "Ciudad Central",
    noteEn: "Explore · Learn · Create",
    noteEs: "Explora · Aprende · Crea",
    icon: Landmark,
    color: "#22d3ee",
    link: "/isla",
    status: "playable",
    x: "50%",
    y: "36%",
  },
  {
    id: "forest",
    en: "Wisdom Forest",
    es: "Bosque de Sabiduría",
    noteEn: "Nature · Science · Life",
    noteEs: "Naturaleza · Ciencia · Vida",
    icon: TreePine,
    color: "#34d399",
    link: "/isla",
    status: "explore",
    x: "25%",
    y: "29%",
  },
  {
    id: "history",
    en: "History Valley",
    es: "Valle de la Historia",
    noteEn: "Culture · Art · Past",
    noteEs: "Cultura · Arte · Pasado",
    icon: Landmark,
    color: "#fbbf24",
    link: "/isla",
    status: "explore",
    x: "33%",
    y: "62%",
  },
  {
    id: "mountains",
    en: "Knowledge Mountains",
    es: "Montañas del Conocimiento",
    noteEn: "Challenges · Strategy",
    noteEs: "Desafíos · Estrategia",
    icon: Mountain,
    color: "#60a5fa",
    link: "/isla",
    status: "explore",
    x: "72%",
    y: "28%",
  },
  {
    id: "ocean",
    en: "Infinite Ocean",
    es: "Océano Infinito",
    noteEn: "Adventure · Discovery",
    noteEs: "Aventura · Exploración",
    icon: Waves,
    color: "#38bdf8",
    link: "/isla",
    status: "explore",
    x: "53%",
    y: "73%",
  },
  {
    id: "space",
    en: "Space Zone",
    es: "Zona Espacial",
    noteEn: "Future world · Locked",
    noteEs: "Mundo futuro · Bloqueado",
    icon: Rocket,
    color: "#c084fc",
    link: "/world",
    status: "locked",
    x: "81%",
    y: "53%",
  },
] as const;

function WorldPage() {
  const { guardianName, xp, locale } = useGuardian();
  const es = locale.startsWith("es");
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  return (
    <div className="mx-auto w-full max-w-[1500px] pb-4 text-white">
      <section className="relative min-h-[calc(100svh-14rem)] overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#04101f] shadow-[0_24px_80px_rgba(8,145,178,0.2)] sm:min-h-[calc(100svh-7rem)] sm:rounded-3xl">
        <img
          src={worldMapImg}
          alt={es ? "Mapa ilustrado de Isla Central" : "Illustrated map of Isla Central"}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-transparent to-[#03101e]/90" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

        <header className="absolute left-3 right-3 top-3 z-20 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3 shadow-xl backdrop-blur-md sm:left-5 sm:right-5 sm:top-5 sm:w-auto sm:max-w-xl sm:p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-950/80">
            <Globe2 className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black sm:text-2xl">
              {es ? "Mundo 1 · Isla Central" : "World 1 · Isla Central"}
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 sm:text-xs">
              {es ? "Explora · Aprende · Crea" : "Explore · Learn · Create"}
            </p>
          </div>
          <div className="ml-auto hidden shrink-0 text-right text-[10px] text-slate-300 min-[430px]:block sm:text-xs">
            <b className="block text-white">{guardianName}</b>
            {es ? "Nivel" : "Level"} {level} · {xp} XP
          </div>
        </header>

        {ZONES.map((zone) => {
          const Icon = zone.icon;
          const locked = zone.status === "locked";
          return (
            <Link
              key={zone.id}
              to={zone.link}
              aria-disabled={locked}
              aria-label={`${es ? zone.es : zone.en}: ${es ? zone.noteEs : zone.noteEn}`}
              style={{ left: zone.x, top: zone.y, borderColor: zone.color }}
              className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-slate-950/85 p-2 shadow-[0_0_24px_rgba(34,211,238,0.35)] backdrop-blur transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 sm:p-3 ${locked ? "pointer-events-none opacity-55" : ""}`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: zone.color }} />
              <span className="sr-only">{es ? zone.es : zone.en}</span>
            </Link>
          );
        })}

        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-3 rounded-2xl border border-cyan-300/35 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-lg sm:p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
              {es ? "Aventura actual" : "Current adventure"}
            </p>
            <p className="truncate text-sm font-black sm:text-lg">
              {es ? "Ciudad Central está abierta" : "Central City is open"}
            </p>
          </div>
          <Link
            to="/isla"
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-white"
          >
            <Play className="h-4 w-4 fill-current" />
            {es ? "ENTRAR" : "ENTER"}
          </Link>
        </div>
      </section>
    </div>
  );
}
