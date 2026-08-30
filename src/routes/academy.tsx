import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";
import { Suspense } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { GUARDIANS, GUARDIAN_IMAGES } from "@/data/guardians";
import { GUARDIAN_STYLES } from "@/lib/guardian-colors";
import { cn } from "@/lib/utils";
import { AcademyService } from "@/services/mock";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Academy Labs — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Train in the AI Lab, Safety Lab and Build Lab. Short guided lessons that build real AI literacy and online safety skills.",
      },
      { property: "og:title", content: "Academy Labs — Nyrava Guardians" },
      {
        property: "og:description",
        content:
          "Train in the AI Lab, Safety Lab and Build Lab with short guided lessons.",
      },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <AcademyContent />
    </Suspense>
  );
}

function AcademyContent() {
  const { data: labs } = useSuspenseQuery({
    queryKey: ["academy-labs"],
    queryFn: () => AcademyService.listLabs(),
  });

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">The Academy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three labs, one mission: turn you into a Guardian who thinks clearly and
          stays safe.
        </p>
      </header>

      <div className="space-y-5">
        {labs.map((lab) => {
          const guardian = GUARDIANS.find((g) => g.id === lab.guardianId)!;
          const styles = GUARDIAN_STYLES[lab.guardianId];
          const overall = Math.round(
            lab.lessons.reduce((sum, l) => sum + l.progress, 0) / lab.lessons.length,
          );

          return (
            <section key={lab.id} className="panel overflow-hidden">
              <div className="flex items-center gap-4 border-b border-border/60 p-5">
                <div
                  className={cn(
                    "h-14 w-14 shrink-0 overflow-hidden rounded-xl border",
                    styles.bg,
                    styles.border,
                  )}
                >
                  <img
                    src={GUARDIAN_IMAGES[lab.guardianId]}
                    alt={`${guardian.name} leads the ${lab.name}`}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-extrabold">{lab.name}</h2>
                  <p className="text-xs text-muted-foreground">{lab.description}</p>
                  <p className={cn("mt-1 text-[11px] font-extrabold", styles.text)}>
                    Led by {guardian.name} · {guardian.role}
                  </p>
                </div>
                <div className="hidden w-32 shrink-0 sm:block">
                  <ProgressBar value={overall} />
                  <p className="mt-1.5 text-right text-[11px] font-bold text-muted-foreground">
                    {overall}%
                  </p>
                </div>
              </div>

              <ul className="divide-y divide-border/50">
                {lab.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3",
                      lesson.locked && "opacity-55",
                    )}
                  >
                    {lesson.locked ? (
                      <Lock className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                    ) : lesson.progress === 100 ? (
                      <CheckCircle2 className={cn("h-4.5 w-4.5 shrink-0", styles.text)} />
                    ) : (
                      <PlayCircle className="h-4.5 w-4.5 shrink-0 text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{lesson.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={lesson.progress} className="h-1.5 max-w-40" />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {lesson.progress}%
                        </span>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
