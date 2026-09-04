import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CheckCircle2, Loader2, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { GUARDIANS, GUARDIAN_IMAGES } from "@/data/guardians";
import { GUARDIAN_STYLES } from "@/lib/guardian-colors";
import { useGuardian } from "@/lib/guardian-context";
import { cn } from "@/lib/utils";
import { BuilderService, GuardianAI } from "@/services/mock";
import type { BuilderStatus, GuardianId } from "@/types";
import { resolveChildPolicy } from "@/domain/policy/resolver";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "AI Builder — Nyrava Guardians" },
      {
        name: "description",
        content:
          "Describe a world and watch your Guardian team plan it with AI: understanding, planning, safety checks and generation.",
      },
      { property: "og:title", content: "AI Builder — Nyrava Guardians" },
      {
        property: "og:description",
        content: "Describe a world and watch your Guardian team plan it with AI.",
      },
    ],
  }),
  component: BuilderPage,
});

const PIPELINE: { status: BuilderStatus; label: string; ms: number }[] = [
  { status: "understanding", label: "Understanding your idea…", ms: 900 },
  { status: "planning", label: "Planning zones and objects…", ms: 1100 },
  { status: "safety", label: "Running Guardian safety checks…", ms: 800 },
  { status: "generating", label: "Generating your world…", ms: 1300 },
];

function BuilderPage() {
  const { addXp } = useGuardian();
  const [prompt, setPrompt] = useState("");
  const [helper, setHelper] = useState<GuardianId>("byte");
  const [status, setStatus] = useState<BuilderStatus>("idle");
  const [statusLabel, setStatusLabel] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [safety, setSafety] = useState<"pending" | "passed" | "blocked">("pending");
  const runId = useRef(0);

  const policy = resolveChildPolicy({});
  if (!policy.canAccessBuilder) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center space-y-4">
        <Sparkles className="mx-auto h-12 w-12 text-amber-400 opacity-60" />
        <h1 className="text-xl font-black">AI Builder Not Available</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This feature isn’t available on your account right now. Ask your parent or guardian if
          you’d like to use it.
        </p>
        <Link
          to="/home"
          className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground"
        >
          Return to Guardian Base
        </Link>
      </div>
    );
  }

  const busy = !["idle", "done", "error"].includes(status);

  async function run() {
    if (!prompt.trim() || busy) return;
    const id = ++runId.current;
    setPlan([]);
    setSafety("pending");

    // Mock boundary: create the request, then step through the pipeline.
    await BuilderService.createRequest(prompt.trim());
    for (const step of PIPELINE) {
      if (runId.current !== id) return;
      setStatus(step.status);
      setStatusLabel(step.label);
      if (step.status === "safety") setSafety("passed");
      await new Promise((r) => setTimeout(r, step.ms));
    }
    if (runId.current !== id) return;

    const result = await GuardianAI.request({ prompt: prompt.trim() });
    if (runId.current !== id) return;
    setPlan(result.planPreview);
    setStatus("done");
    addXp(50);
    toast.success("World plan generated! +50 XP", {
      description: "Your Guardian team drafted a full build plan.",
    });
  }

  function reset() {
    runId.current += 1;
    setStatus("idle");
    setPlan([]);
    setSafety("pending");
    setPrompt("");
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">AI Builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe a world. Your Guardian team plans it with AI — with safety checks on every step.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Input + pipeline */}
        <div className="space-y-5">
          <div className="panel p-5">
            <label
              htmlFor="builder-prompt"
              className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
            >
              Your world idea
            </label>
            <textarea
              id="builder-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A floating library where books teach coding, with a secret puzzle garden…"
              className="mt-2 w-full resize-none rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Pick a Guardian helper
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GUARDIANS.map((g) => {
                const styles = GUARDIAN_STYLES[g.id];
                const active = helper === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setHelper(g.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-bold transition",
                      active
                        ? cn(styles.border, styles.bg, styles.text)
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <img
                      src={GUARDIAN_IMAGES[g.id]}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover object-top"
                    />
                    {g.name}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => void run()}
              disabled={busy || !prompt.trim()}
              className="glow-primary mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busy ? "Building…" : "Build with AI"}
            </button>
          </div>

          {/* Pipeline status */}
          {status !== "idle" && (
            <div className="panel p-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Build pipeline
              </p>
              <ul className="mt-3 space-y-2.5">
                {PIPELINE.map((step) => {
                  const stepIndex = PIPELINE.findIndex((s) => s.status === step.status);
                  const currentIndex = PIPELINE.findIndex((s) => s.status === status);
                  const done = status === "done" || stepIndex < currentIndex;
                  const current = step.status === status;
                  return (
                    <li key={step.status} className="flex items-center gap-2.5 text-xs font-bold">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-guardian-lex" />
                      ) : current ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-border" />
                      )}
                      <span
                        className={cn(
                          done
                            ? "text-guardian-lex"
                            : current
                              ? "text-primary"
                              : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {status === "done" && safety === "passed" && (
                <p className="mt-3 flex items-center gap-2 rounded-xl border border-guardian-lex/40 bg-guardian-lex/10 px-3 py-2 text-[11px] font-extrabold text-guardian-lex">
                  <ShieldCheck className="h-4 w-4" />
                  Safety check passed — kid-safe content verified.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="panel h-fit p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-2.5">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold">Build plan</p>
              <p className="text-[11px] text-muted-foreground">
                with {GUARDIANS.find((g) => g.id === helper)?.name}
              </p>
            </div>
          </div>

          {plan.length === 0 ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {busy
                ? statusLabel
                : "Your generated plan will appear here — zones, objects and hidden challenges, all checked for safety."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {plan.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-xs font-bold"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-extrabold text-primary">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
              <li>
                <button
                  onClick={reset}
                  className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-xs font-extrabold text-muted-foreground transition hover:text-foreground"
                >
                  Start a new build
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
