import { useEffect, useMemo, useRef, useState } from "react";
import { CRYSTALS, REGIONS, SECRETS, type Challenge } from "@/data/isla";
import { islaService } from "@/services/mock/isla";
import {
  activeCrystal,
  clearToast,
  collectCrystal,
  completeClass,
  islaControls,
  isRegionLocked,
  patchIsla,
  useHint,
  useIsla,
} from "@/lib/isla-store";
import { ISLAND_RADIUS } from "@/lib/isla-terrain";
import { toggleIslaView } from "@/lib/isla-store";

const MAP = 200;

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function update(e: React.PointerEvent) {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const max = rect.width / 2;
    const len = Math.min(1, Math.hypot(dx, dy) / max);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * len;
    const y = Math.sin(angle) * len;
    islaControls.joystick = { x, y };
    setKnob({ x: x * max * 0.7, y: y * max * 0.7 });
  }

  function reset() {
    islaControls.joystick = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
  }

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && update(e)}
      onPointerUp={reset}
      onPointerCancel={reset}
      className="pointer-events-auto h-32 w-32 touch-none rounded-full border border-white/20 bg-background/40 backdrop-blur"
    >
      <div
        className="relative left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/80"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

function ChallengePanel({
  challenge,
  sourceId,
  onSolved,
  onClose,
}: {
  challenge: Challenge;
  sourceId: string;
  onSolved: () => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [studying, setStudying] = useState(Boolean(challenge.study));

  useEffect(() => {
    if (!challenge.study) return;
    const t = setTimeout(() => setStudying(false), 4200);
    return () => clearTimeout(t);
  }, [challenge.study]);

  async function submit(next: number[]) {
    if (next.length < challenge.answer.length) return;
    const result = await islaService.submitChallenge(sourceId, challenge, next);
    setFeedback(result.message);
    if (result.correct) setTimeout(onSolved, 1100);
    else setTimeout(() => setPicked([]), 900);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-background/80 p-6 backdrop-blur">
      <div className="panel w-full max-w-lg space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">{challenge.kind} challenge</p>
        {studying ? (
          <>
            <p className="text-lg font-semibold">Watch carefully…</p>
            <p className="text-3xl font-bold text-primary">{challenge.study}</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">{challenge.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {challenge.options.map((option, i) => (
                <button
                  key={option}
                  onClick={() => {
                    const next = [...picked, i];
                    setPicked(next);
                    void submit(next);
                  }}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:border-primary hover:bg-primary/15"
                >
                  {option}
                </button>
              ))}
            </div>
            {challenge.answer.length > 1 && (
              <p className="text-sm text-muted-foreground">
                Your order: {picked.map((i) => challenge.options[i]).join(" · ") || "—"}
              </p>
            )}
          </>
        )}
        {feedback && <p className="text-sm text-primary">{feedback}</p>}
        <button onClick={onClose} className="text-xs text-muted-foreground underline">
          Step away for now
        </button>
      </div>
    </div>
  );
}

function MiniMap() {
  const state = useIsla();
  const [pos, setPos] = useState({ x: 0, z: 0 });
  useEffect(() => {
    const id = setInterval(() => setPos({ x: islaControls.player.x, z: islaControls.player.z }), 200);
    return () => clearInterval(id);
  }, []);
  const toMap = (v: number) => (v / ISLAND_RADIUS) * (MAP / 2 - 8) + MAP / 2;

  return (
    <svg width={MAP} height={MAP} className="rounded-2xl border border-white/15 bg-background/70 backdrop-blur">
      <circle cx={MAP / 2} cy={MAP / 2} r={MAP / 2 - 6} fill="#0e7490" opacity={0.35} />
      {REGIONS.map((r) => {
        const discovered = state.visited.includes(r.id);
        const locked = isRegionLocked(r.id);
        return (
          <g key={r.id}>
            <circle
              cx={toMap(r.center[0])}
              cy={toMap(r.center[1])}
              r={(r.radius / ISLAND_RADIUS) * (MAP / 2 - 8)}
              fill={discovered ? r.accent : "#1e293b"}
              opacity={discovered ? 0.4 : 0.55}
              stroke={locked ? "#f87171" : r.accent}
              strokeWidth={1}
            />
            <text
              x={toMap(r.center[0])}
              y={toMap(r.center[1])}
              textAnchor="middle"
              fontSize="7"
              fill={discovered ? "#e2e8f0" : "#64748b"}
            >
              {locked ? "🔒" : discovered ? r.name.split(" ")[0] : "?"}
            </text>
          </g>
        );
      })}
      <circle cx={toMap(pos.x)} cy={toMap(pos.z)} r={4} fill="#f8fafc" stroke="#38bdf8" strokeWidth={2} />
    </svg>
  );
}

export function IslaHud({ guardianName }: { guardianName: string }) {
  const state = useIsla();
  const target = activeCrystal();
  const hintLevel = target ? (state.hints[target.id] ?? 0) : 0;
  const [mapOpen, setMapOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  const mission = useMemo(
    () => ({
      crystals: state.crystals.length,
      challenges: CRYSTALS.filter((c) => c.challenge && state.solved.includes(c.id)).length,
    }),
    [state.crystals, state.solved],
  );

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(clearToast, 5200);
    return () => clearTimeout(t);
  }, [state.toast]);

  const challengeCrystal = CRYSTALS.find((c) => c.id === state.challengeFor);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* mission panel */}
      <div className="pointer-events-auto absolute left-4 top-24 w-[19rem] space-y-3 rounded-2xl border border-white/12 bg-background/75 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Class 1 · Discover Isla Central</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-foreground">Crystals {mission.crystals}/5</span>
          <span className="text-muted-foreground">Challenges {mission.challenges}/3</span>
        </div>
        {target ? (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">{guardianName}:</span> “{target.clue}”
            </p>
            {hintLevel > 0 && (
              <ul className="space-y-1 text-xs text-primary">
                {target.hints.slice(0, hintLevel).map((h, i) => (
                  <li key={h}>Hint {i + 1}: {h}</li>
                ))}
              </ul>
            )}
            <button
              disabled={hintLevel >= 3}
              onClick={() => useHint(target.id)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:border-primary disabled:opacity-40"
            >
              {hintLevel >= 3 ? "No more hints — you've got this" : `Ask ${guardianName} for a hint (${hintLevel}/3)`}
            </button>
          </>
        ) : (
          <p className="text-sm text-primary">
            All 5 crystals found. Walk back to the Nyrava Academy doors and report to {guardianName}.
          </p>
        )}
        <div className="flex gap-2 text-xs">
          <button onClick={() => setMapOpen((v) => !v)} className="rounded-lg border border-white/15 px-2 py-1">
            Map
          </button>
          <button onClick={() => setLogOpen((v) => !v)} className="rounded-lg border border-white/15 px-2 py-1">
            Discoveries ({state.crystals.length + state.secrets.length})
          </button>
          <span className="ml-auto self-center text-primary">{state.xp} XP</span>
        </div>
      </div>

      {/* map */}
      {mapOpen && <div className="pointer-events-auto absolute right-4 top-24">{<MiniMap />}</div>}

      {/* discovery log */}
      {logOpen && (
        <div className="pointer-events-auto absolute right-4 top-[15.5rem] w-[19rem] space-y-2 rounded-2xl border border-white/12 bg-background/80 p-4 text-xs backdrop-blur">
          <p className="uppercase tracking-[0.28em] text-primary">Collection</p>
          {[...CRYSTALS, ...SECRETS].map((item) => {
            const owned = state.crystals.includes(item.id) || state.secrets.includes(item.id);
            return (
              <p key={item.id} className={owned ? "text-foreground" : "text-muted-foreground/60"}>
                {owned ? "✓" : "▢"} {owned ? item.name : "Undiscovered"}
              </p>
            );
          })}
          <p className="pt-2 uppercase tracking-[0.28em] text-primary">Mastery evidence</p>
          {state.mastery.length === 0 && <p className="text-muted-foreground/60">Nothing demonstrated yet.</p>}
          {state.mastery.map((m) => (
            <p key={`${m.skill}-${m.at}`} className="text-foreground">
              ✓ {m.skill} demonstrated
            </p>
          ))}
        </div>
      )}

      {/* region banner */}
      <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-white/12 bg-background/70 px-4 py-1 text-xs uppercase tracking-[0.28em] text-muted-foreground backdrop-blur">
        {REGIONS.find((r) => r.id === state.region)?.name}
      </div>

      {/* interact prompt */}
      {state.near && !state.challengeFor && !state.reporting && (
        <button
          onClick={() => {
            islaControls.interact = true;
          }}
          className="pointer-events-auto absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Press E · Interact with {state.near.label}
        </button>
      )}

      {/* toast */}
      {state.toast && (
        <div className="pointer-events-auto absolute bottom-8 left-1/2 w-[22rem] -translate-x-1/2 rounded-2xl border border-primary/40 bg-background/90 p-4 text-center backdrop-blur animate-scale-in">
          <p className="font-semibold text-primary">{state.toast.title}</p>
          <p className="text-sm text-muted-foreground">{state.toast.body}</p>
        </div>
      )}

      {/* joystick + controls */}
      <div className="pointer-events-none absolute bottom-6 left-6 space-y-2">
        <Joystick />
        <p className="text-[11px] text-muted-foreground">WASD or click the ground to walk · Shift to sprint · Space to jump · drag to look · scroll to zoom · V for first person · E to interact</p>
      </div>

      {/* crystal challenge */}
      {challengeCrystal?.challenge && (
        <ChallengePanel
          challenge={challengeCrystal.challenge}
          sourceId={challengeCrystal.id}
          onSolved={() => collectCrystal(challengeCrystal.id)}
          onClose={() => patchIsla({ challengeFor: null })}
        />
      )}

      {/* academy report */}
      {state.reporting && <ReportPanel guardianName={guardianName} />}
    </div>
  );
}

function ReportPanel({ guardianName }: { guardianName: string }) {
  const state = useIsla();
  const [observation, setObservation] = useState(false);
  const ready = state.crystals.length === 5;

  if (state.classComplete) {
    return (
      <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-background/85 p-6 backdrop-blur">
        <div className="panel max-w-lg space-y-3 p-6 text-center">
          <p className="text-2xl font-bold text-primary">🎉 CLASS COMPLETE!</p>
          <p className="text-sm text-muted-foreground">
            You explored Isla Central, followed clues instead of directions, and demonstrated memory, logic,
            observation and digital safety. {guardianName} grew with you.
          </p>
          <p className="text-sm text-primary">+400 XP · Space Port unlocked · Deep Ocean diving unlocked</p>
          <button
            onClick={() => patchIsla({ reporting: false })}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to the island
          </button>
        </div>
      </div>
    );
  }

  if (observation) {
    return (
      <ChallengePanel
        challenge={islaService.getReportChallenge()}
        sourceId="class-1-report"
        onSolved={completeClass}
        onClose={() => setObservation(false)}
      />
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-background/80 p-6 backdrop-blur">
      <div className="panel w-full max-w-lg space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Nyrava Academy · Mission report</p>
        <p className="text-sm text-muted-foreground">
          {ready
            ? `${guardianName}: “You made it back. Before I log this class, one last question.”`
            : `${guardianName}: “You still have crystals out there. Come back when you've found all five.”`}
        </p>
        <p className="text-sm">Crystals {state.crystals.length}/5 · Secrets {state.secrets.length}/5</p>
        <div className="flex gap-3">
          <button
            disabled={!ready}
            onClick={() => setObservation(true)}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Report my discoveries
          </button>
          <button
            onClick={() => patchIsla({ reporting: false })}
            className="rounded-xl border border-white/15 px-5 py-2 text-sm"
          >
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  );
}
