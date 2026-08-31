import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, Landmark, Mountain, Rocket, TreePine, Waves, Zap } from "lucide-react";
import worldMapImg from "@/assets/guardians/world_map.jpg";
import lexImg from "@/assets/guardians/lex.png";
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
    <div className="mx-auto w-full max-w-7xl pb-6 text-white">
      <section className="overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#04101f] shadow-2xl sm:rounded-3xl">
        <header className="flex items-center gap-3 border-b border-cyan-400/20 bg-slate-950/95 p-3 sm:p-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/50 bg-cyan-950">
            <Globe2 className="text-cyan-300" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black sm:text-2xl">
              {es ? "Mundo 1: Isla Central" : "World 1: Isla Central"}
            </h1>
            <p className="text-xs text-cyan-300">
              {es ? "Explora · Aprende · Crea" : "Explore · Learn · Create"}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-950/50 p-2 sm:flex">
            <img src={lexImg} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="text-xs">
              <b>{guardianName}</b>
              <p className="text-cyan-300">
                {es ? "Nivel" : "Level"} {level} · {xp} XP
              </p>
            </div>
          </div>
        </header>
        <div className="relative aspect-[4/3] min-h-[19rem] w-full overflow-hidden sm:aspect-[16/9] sm:min-h-[30rem]">
          <img
            src={worldMapImg}
            alt={es ? "Mapa ilustrado de Isla Central" : "Illustrated map of Isla Central"}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04101f] via-transparent to-slate-950/25" />
          {ZONES.map((zone) => {
            const Icon = zone.icon;
            return (
              <Link
                key={zone.id}
                to={zone.link}
                aria-label={`${es ? zone.es : zone.en}: ${es ? zone.noteEs : zone.noteEn}`}
                style={{ left: zone.x, top: zone.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-slate-950/90 p-2 shadow-xl transition hover:scale-110 sm:p-3 ${zone.status === "locked" ? "opacity-60" : ""}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: zone.color }} />
                <span className="sr-only">{es ? zone.es : zone.en}</span>
              </Link>
            );
          })}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-slate-950/90 p-3 backdrop-blur-md sm:left-5 sm:right-auto sm:max-w-md sm:p-4">
            <img
              src={lexImg}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-cyan-300">
                {es ? `Hola, ${guardianName}` : `Hello, ${guardianName}`}
              </p>
              <p className="line-clamp-2 text-xs text-slate-200 sm:text-sm">
                {es
                  ? "Tu primera aventura ya está abierta en Ciudad Central."
                  : "Your first adventure is open now in Central City."}
              </p>
            </div>
            <Link
              to="/isla"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950"
              aria-label={es ? "Entrar a Isla" : "Enter Isla"}
            >
              <Zap />
            </Link>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                {es ? "Elige tu destino" : "Choose your destination"}
              </p>
              <h2 className="text-lg font-black">
                {es ? "Regiones de Isla Central" : "Isla Central regions"}
              </h2>
            </div>
            <p className="text-xs text-slate-400">{es ? "1 mundo jugable" : "1 playable world"}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ZONES.map((zone) => {
              const Icon = zone.icon;
              return (
                <Link
                  key={zone.id}
                  to={zone.link}
                  className={`flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-400/50 ${zone.status === "locked" ? "pointer-events-none opacity-55" : ""}`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950">
                    <Icon style={{ color: zone.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{es ? zone.es : zone.en}</p>
                    <p className="truncate text-xs text-slate-400">
                      {es ? zone.noteEs : zone.noteEn}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full border border-white/10 px-2 py-1 text-[10px] text-cyan-200">
                    {zone.status === "playable"
                      ? es
                        ? "JUGAR"
                        : "PLAY"
                      : zone.status === "locked"
                        ? es
                          ? "PRÓXIMO"
                          : "SOON"
                        : es
                          ? "EXPLORAR"
                          : "EXPLORE"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
