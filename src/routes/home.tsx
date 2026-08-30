import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  Code,
  GraduationCap,
  Heart,
  Map,
  Search,
  Shield,
  Swords,
  Target,
} from "lucide-react";
import { Suspense } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { GUARDIAN_IMAGES, resolveGuardian, resolveGuardianId } from "@/data/guardians";
import { GUARDIAN_STYLES } from "@/lib/guardian-colors";
import { useGuardian } from "@/lib/guardian-context";
import { cn } from "@/lib/utils";
import { MasteryService } from "@/services/mock";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Guardian HQ — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Your Guardian headquarters: track level and XP, see your next objective, and jump into missions, labs and the AI Builder.",
      },
      { property: "og:title", content: "Guardian HQ — Nyrava Guardians" },
      {
        property: "og:description",
        content:
          "Track your level and XP, see your next objective, and jump into missions and labs.",
      },
    ],
  }),
  component: HomePage,
});

const ACH_ICONS: Record<string, typeof Shield> = {
  shield: Shield,
  search: Search,
  heart: Heart,
  code: Code,
};

const QUICK_LINKS = [
  { to: "/world", label: "World Map", icon: Map, blurb: "Explore Nyrava zones" },
  { to: "/academy", label: "Academy", icon: GraduationCap, blurb: "Train in the labs" },
  { to: "/missions", label: "Missions", icon: Swords, blurb: "Real scenarios await" },
  { to: "/builder", label: "AI Builder", icon: Bot, blurb: "Create your own world" },
] as const;

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

function HomePage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { guardianId, guardianName, xp, completedMissions } = useGuardian();

  const { data: objective } = useSuspenseQuery({
    queryKey: ["next-objective"],
    queryFn: () => MasteryService.nextObjective(),
  });
  const { data: achievements } = useSuspenseQuery({
    queryKey: ["achievements"],
    queryFn: () => MasteryService.listAchievements(),
  });

  const activeId = resolveGuardianId(guardianId);
  const guardian = resolveGuardian(activeId);
  const styles = GUARDIAN_STYLES[activeId];
  const level = levelFromXp(xp);
  const intoLevel = xp % 250;
  const objGuardianId = resolveGuardianId(objective.guardianId);
  const objGuardian = resolveGuardian(objGuardianId);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero card */}
      <section className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "h-24 w-24 shrink-0 overflow-hidden rounded-2xl border",
            styles.bg,
            styles.border,
          )}
        >
          <img
            src={GUARDIAN_IMAGES[activeId]}
            alt={guardian.name}
            className="h-full w-full object-cover object-top"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Guardian
          </p>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            {guardianName}{" "}
            <span className={cn("text-base font-bold", styles.text)}>
              · {guardian.name} {guardian.role}
            </span>
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
              Level {level}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {xp.toLocaleString()} XP · {completedMissions.length} missions cleared
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={(intoLevel / 250) * 100} />
            <p className="mt-1.5 text-[11px] font-bold text-muted-foreground">
              {250 - intoLevel} XP to Level {level + 1}
            </p>
          </div>
        </div>
      </section>

      {/* Next objective */}
      <section className="panel flex items-center gap-4 p-5">
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Next objective
          </p>
          <h2 className="mt-0.5 text-base font-extrabold">{objective.title}</h2>
          <p className="text-xs text-muted-foreground">{objective.description}</p>
        </div>
        <img
          src={GUARDIAN_IMAGES[objGuardianId]}
          alt={`${objGuardian.name} is guiding this objective`}
          className="hidden h-14 w-14 rounded-xl object-cover object-top sm:block"
        />
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, icon: Icon, blurb }) => (
          <Link
            key={to}
            to={to}
            className="panel group p-4 transition hover:-translate-y-1 hover:border-primary/60"
          >
            <Icon className="h-6 w-6 text-primary transition group-hover:scale-110" />
            <p className="mt-3 text-sm font-extrabold">{label}</p>
            <p className="text-[11px] text-muted-foreground">{blurb}</p>
          </Link>
        ))}
      </section>

      {/* Achievements */}
      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
          Recent achievements
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((a) => {
            const Icon = ACH_ICONS[a.icon] ?? Shield;
            return (
              <div key={a.id} className="panel flex items-start gap-3 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold">{a.title}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {a.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
