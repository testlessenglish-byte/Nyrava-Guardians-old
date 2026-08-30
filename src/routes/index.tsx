import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { GUARDIANS, GUARDIAN_IMAGES } from "@/data/guardians";
import { GUARDIAN_STYLES } from "@/lib/guardian-colors";
import { useGuardian } from "@/lib/guardian-context";
import { cn } from "@/lib/utils";
import robotImg from "@/assets/guardians/robot.png";
import logo from "@/assets/guardians/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyrava Guardians — Choose Your Guardian" },
      {
        name: "description",
        content:
          "Enter Nyrava: choose one of five Guardian heroes and start your interactive journey through digital safety, AI literacy and creativity.",
      },
      { property: "og:title", content: "Nyrava Guardians — Choose Your Guardian" },
      {
        property: "og:description",
        content:
          "Enter Nyrava: choose one of five Guardian heroes and start your interactive journey through digital safety, AI literacy and creativity.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { selectGuardian } = useGuardian();
  const navigate = useNavigate();

  return (
    <div className="starfield space-y-10 pb-8">
      {/* Hero */}
      <section className="panel relative overflow-hidden px-6 py-10 text-center md:px-12">
        <div className="pointer-events-none absolute -right-8 top-4 hidden md:block">
          <img
            src={robotImg}
            alt="Nyrava AI helper robot"
            className="animate-float-slow h-36 w-36 object-contain drop-shadow-[0_0_24px_oklch(0.82_0.15_200/45%)]"
          />
        </div>
        <img src={logo} alt="Nyrava Guardians shield logo" className="mx-auto h-16 w-16" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-wide md:text-5xl">
          Welcome to <span className="text-primary text-glow">NYRAVA</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          A living digital world where you train with five Guardians, take on real
          missions, and learn to be smart, safe and kind online.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Step 1: Choose your Guardian
        </div>
      </section>

      {/* Guardian selection */}
      <section aria-label="Choose your Guardian">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {GUARDIANS.map((g) => {
            const styles = GUARDIAN_STYLES[g.id];
            return (
              <button
                key={g.id}
                onClick={() => {
                  selectGuardian(g.id);
                  void navigate({ to: "/personalize" });
                }}
                className={cn(
                  "panel group flex flex-col items-center p-4 text-center transition-all duration-300 hover:-translate-y-1.5",
                  styles.ring,
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-24 w-24 items-end justify-center overflow-hidden rounded-2xl border",
                    styles.bg,
                    styles.border,
                  )}
                >
                  <img
                    src={GUARDIAN_IMAGES[g.id]}
                    alt={`${g.name}, ${g.role}`}
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h2 className={cn("text-lg font-extrabold", styles.text)}>{g.name}</h2>
                <p className="text-xs font-bold text-foreground/80">{g.role}</p>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {g.tagline}
                </p>
                <span
                  className={cn(
                    "mt-3 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                    styles.badge,
                  )}
                >
                  Choose {g.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
