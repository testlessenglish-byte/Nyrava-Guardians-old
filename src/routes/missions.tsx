import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RotateCcw, Star, Swords } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { GUARDIAN_IMAGES } from "@/data/guardians";
import { useGuardian } from "@/lib/guardian-context";
import { cn } from "@/lib/utils";
import { MissionService } from "@/services/mock";
import type { Mission, MissionChoice } from "@/types";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Mission Hub — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Take on real online-safety scenarios like The Stranger in DMs. Make the right call, earn XP and grow as a Guardian.",
      },
      { property: "og:title", content: "Mission Hub — Nyrava Guardians" },
      {
        property: "og:description",
        content:
          "Take on real online-safety scenarios, make the right call and earn Guardian XP.",
      },
    ],
  }),
  component: MissionsPage,
});

const DIFFICULTY_LABEL = { 1: "Rookie", 2: "Guardian", 3: "Master" } as const;

function MissionsPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <MissionsContent />
    </Suspense>
  );
}

function MissionsContent() {
  const { data: missions } = useSuspenseQuery({
    queryKey: ["missions"],
    queryFn: () => MissionService.list(),
  });
  const { completedMissions } = useGuardian();
  const [activeId, setActiveId] = useState<string | null>(
    missions.find((m) => m.scenario)?.id ?? null,
  );

  const active = missions.find((m) => m.id === activeId) ?? null;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">Mission Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real scenarios. Real choices. Your decisions shape the mission.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Mission list */}
        <ul className="space-y-3">
          {missions.map((m) => {
            const done = completedMissions.includes(m.id);
            const playable = Boolean(m.scenario);
            const selected = activeId === m.id;
            return (
              <li key={m.id}>
                <button
                  onClick={() => playable && setActiveId(m.id)}
                  disabled={!playable}
                  className={cn(
                    "panel w-full p-4 text-left transition",
                    selected && "border-primary/70 glow-primary",
                    !playable && "opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {DIFFICULTY_LABEL[m.difficulty]}
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-guardian-lex" />
                    ) : playable ? (
                      <Swords className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-extrabold">{m.title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {m.briefing}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-guardian-byte">
                    <Star className="h-3 w-3" /> +{m.xpReward} XP · {m.zone}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Active scenario */}
        {active?.scenario ? (
          <ScenarioPanel mission={active} />
        ) : (
          <div className="panel flex flex-col items-center justify-center p-10 text-center">
            <Swords className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-bold">Select a mission to begin</p>
            <p className="text-xs text-muted-foreground">
              Playable missions have a full interactive scenario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioPanel({ mission }: { mission: Mission }) {
  const { addXp, completeMission, completedMissions, guardianId } = useGuardian();
  const [chosen, setChosen] = useState<MissionChoice | null>(null);
  const alreadyDone = completedMissions.includes(mission.id);
  const scenario = mission.scenario!;

  function choose(choice: MissionChoice) {
    if (chosen) return;
    setChosen(choice);
    if (choice.isBest) {
      addXp(mission.xpReward);
      completeMission(mission.id);
      toast.success(`Mission complete! +${mission.xpReward} XP`, {
        description: choice.feedback,
      });
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-border/60 p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
          Live scenario · {mission.zone}
        </p>
        <h2 className="mt-1 text-lg font-extrabold">{mission.title}</h2>
        <p className="text-xs text-muted-foreground">{mission.briefing}</p>
      </div>

      {/* Chat simulation */}
      <div className="space-y-3 bg-background/40 p-5">
        {scenario.chat.map((msg, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-destructive/15 text-xs font-extrabold text-destructive">
              ?
            </div>
            <div className="max-w-[85%]">
              <p className="text-[10px] font-bold text-muted-foreground">
                {msg.from} · {msg.time}
              </p>
              <div className="mt-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2 text-sm">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {guardianId && (
          <div className="flex items-center gap-2 pt-1">
            <img
              src={GUARDIAN_IMAGES[guardianId]}
              alt="Your Guardian watches over the chat"
              className="h-6 w-6 rounded-full object-cover object-top"
            />
            <p className="text-[11px] font-bold italic text-primary animate-pulse-glow">
              Your Guardian is watching — choose wisely.
            </p>
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="border-t border-border/60 p-5">
        <p className="text-sm font-extrabold">{scenario.question}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {scenario.choices.map((choice) => {
            const isPicked = chosen?.id === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => choose(choice)}
                disabled={Boolean(chosen)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-xs font-bold transition",
                  isPicked && choice.isBest
                    ? "border-guardian-lex bg-guardian-lex/15 text-guardian-lex"
                    : isPicked
                      ? "border-destructive bg-destructive/15 text-destructive"
                      : chosen
                        ? "border-border opacity-40"
                        : "border-border hover:border-primary/60 hover:bg-primary/5",
                )}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {chosen && (
          <div
            className={cn(
              "mt-4 rounded-xl border p-4 text-xs leading-relaxed",
              chosen.isBest
                ? "border-guardian-lex/50 bg-guardian-lex/10"
                : "border-destructive/50 bg-destructive/10",
            )}
          >
            <p className="font-bold">{chosen.feedback}</p>
            {alreadyDone && chosen.isBest && (
              <p className="mt-1 font-extrabold text-guardian-lex">
                +{mission.xpReward} XP earned
              </p>
            )}
            <button
              onClick={() => setChosen(null)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-extrabold text-muted-foreground transition hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
