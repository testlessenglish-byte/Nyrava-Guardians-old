import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Compass,
  FlaskConical,
  GraduationCap,
  Home,
  Lock,
  Target,
} from "lucide-react";
import { Suspense, type ComponentType } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { cn } from "@/lib/utils";
import { WorldService } from "@/services/mock";
import type { WorldArea } from "@/types";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "Guardian World Map — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Explore the zones of Nyrava: My Home, the Academy, the Mission Hub, Adventure Zone, Digital City and the Future Lab.",
      },
      { property: "og:title", content: "Guardian World Map — Nyrava Guardians" },
      {
        property: "og:description",
        content:
          "Explore the zones of Nyrava, from the Academy to Digital City and the Future Lab.",
      },
    ],
  }),
  component: WorldPage,
});

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  home: Home,
  "graduation-cap": GraduationCap,
  target: Target,
  compass: Compass,
  building: Building2,
  flask: FlaskConical,
};

const ZONE_LINK: Record<WorldArea["zone"], "/home" | "/academy" | "/missions"> = {
  home: "/home",
  academy: "/academy",
  missions: "/missions",
};

const STATUS_LABEL: Record<WorldArea["status"], string> = {
  locked: "Locked",
  unlocked: "Ready",
  "in-progress": "In progress",
  complete: "Complete",
};

function WorldPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <WorldContent />
    </Suspense>
  );
}

function WorldContent() {
  const { data: areas } = useSuspenseQuery({
    queryKey: ["world-areas"],
    queryFn: () => WorldService.listAreas(),
  });

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">Guardian World</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every zone teaches a different Guardian skill. Unlock them by completing
          missions and labs.
        </p>
      </header>

      <div className="starfield grid gap-4 rounded-3xl p-1 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const Icon = ICONS[area.icon] ?? Compass;
          const locked = area.status === "locked";
          const card = (
            <>
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-2xl border p-3",
                    locked
                      ? "border-border bg-muted/40"
                      : "border-primary/40 bg-primary/10",
                  )}
                >
                  {locked ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Icon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                    locked
                      ? "border-border text-muted-foreground"
                      : "border-primary/40 bg-primary/10 text-primary",
                  )}
                >
                  {STATUS_LABEL[area.status]}
                </span>
              </div>
              <h2 className="mt-4 text-base font-extrabold">{area.name}</h2>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {area.description}
              </p>
              <div className="mt-4">
                <ProgressBar
                  value={area.progress}
                  barClassName={locked ? "bg-muted-foreground/40" : undefined}
                />
                <p className="mt-1.5 text-[11px] font-bold text-muted-foreground">
                  {area.progress}% explored
                </p>
              </div>
            </>
          );

          return locked ? (
            <div
              key={area.id}
              aria-disabled="true"
              className="panel p-5 opacity-60"
            >
              {card}
            </div>
          ) : (
            <Link
              key={area.id}
              to={ZONE_LINK[area.zone]}
              className="panel p-5 transition hover:-translate-y-1 hover:border-primary/60"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
