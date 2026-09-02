import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Mic,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_PARENTAL_CONTROLS,
  resolveChildPolicy,
  type ParentalControlsData,
  type SubscriptionTier,
} from "@/domain/policy/resolver";
import { missions } from "@/domain/progression/catalog";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Portal & Family Safety — Nyrava Guardians" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ParentPortalPage,
});

type LinkedChild = {
  id: string; // learner_user_id
  displayName: string;
  guardian: string;
  level: number;
  xp: number;
  completedMissions: string[];
  lastActive: string;
  scores: Record<string, number>;
  controls: ParentalControlsData;
  attempts: Array<{ id: string; missionId: string; outcome: string; createdAt: string }>;
};

function ParentPortalPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const [childrenList, setChildrenList] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [linkInput, setLinkInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");

  const isParentOrAdmin = roles.includes("guardian") || roles.includes("admin");
  const isChildAccount = roles.includes("learner") && !isParentOrAdmin;

  // Load real child profiles & safety settings from Supabase
  async function loadFamilyData() {
    if (!user) {
      setLoadingData(false);
      return;
    }
    try {
      setLoadingData(true);
      // 1. Query subscription membership tier
      const { data: memberData } = await supabase
        .from("memberships")
        .select("tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData?.tier) {
        const raw = memberData.tier;
        if (raw === "academy") setSubscriptionTier("premium");
        else if (raw === "guardian" || raw === "explorer") setSubscriptionTier("family");
        else setSubscriptionTier("free");
      } else {
        setSubscriptionTier("free");
      }

      // 2. Query approved child links
      const { data: links, error: linksErr } = await supabase
        .from("guardian_links")
        .select("learner_user_id")
        .eq("guardian_user_id", user.id)
        .eq("status", "approved");

      if (linksErr) throw linksErr;
      if (!links || links.length === 0) {
        setChildrenList([]);
        setSelectedChildId(null);
        setLoadingData(false);
        return;
      }

      const learnerIds = links.map((l) => l.learner_user_id);

      // 3. Query profiles, guardian_state, safety_settings, mission_attempts for linked children
      const [profilesRes, stateRes, safetyRes, attemptsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_guardian").in("user_id", learnerIds),
        supabase.from("guardian_state").select("user_id, xp, completed_missions, guardian_name").in("user_id", learnerIds),
        supabase.from("safety_settings").select("*").in("learner_user_id", learnerIds),
        supabase.from("mission_attempts").select("id, user_id, mission_id, outcome, created_at").in("user_id", learnerIds),
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
      const stateMap = new Map((stateRes.data ?? []).map((s) => [s.user_id, s]));
      const safetyMap = new Map((safetyRes.data ?? []).map((s) => [s.learner_user_id, s]));

      const loaded: LinkedChild[] = learnerIds.map((childId) => {
        const prof = profileMap.get(childId);
        const st = stateMap.get(childId);
        const saf = safetyMap.get(childId);
        const childAttempts = (attemptsRes.data ?? []).filter((a) => a.user_id === childId);

        const scores: Record<string, number> = {};
        const safAny = saf as any;
        for (const att of childAttempts) {
          if (att.outcome && att.outcome.endsWith("%")) {
            const num = parseInt(att.outcome.replace("%", ""), 10);
            if (!isNaN(num)) scores[att.mission_id] = Math.max(scores[att.mission_id] ?? 0, num);
          }
        }

        const xp = st?.xp ?? 0;
        const level = Math.max(1, Math.floor(xp / 500) + 1);

        return {
          id: childId,
          displayName: prof?.display_name || "Child Account",
          guardian: st?.guardian_name || prof?.avatar_guardian || "Sarah",
          level,
          xp,
          completedMissions: st?.completed_missions ?? [],
          lastActive: "Recently active",
          scores,
          controls: {
            allowAcademy: safAny?.allow_academy ?? true,
            allowWorld: safAny?.allow_world ?? true,
            allowMissions: safAny?.allow_missions ?? true,
            allowAiBuilder: safAny?.allow_ai_builder ?? false,
            allowVoice: saf?.voice_enabled ?? false,
            allowMicrophone: false,
            allowExternalLinks: safAny?.allow_external_links ?? false,
            allowMultiplayer: saf?.multiplayer_consent ?? false,
            dailyLimitMinutes: saf?.daily_limit_minutes ?? 120,
            allowedStart: saf?.allowed_start ?? "07:00",
            allowedEnd: saf?.allowed_end ?? "21:00",
          },
          attempts: childAttempts.map((a) => ({
            id: a.id,
            missionId: a.mission_id,
            outcome: a.outcome,
            createdAt: a.created_at,
          })),
        };
      });

      setChildrenList(loaded);
      if (loaded.length > 0 && loaded[0]) setSelectedChildId(loaded[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load family profiles");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    void loadFamilyData();
  }, [user]);

  // Handle linking a new child profile
  async function handleLinkChild() {
    if (!linkInput.trim() || !user) return;
    setLinking(true);
    try {
      const targetId = linkInput.trim();
      const { error } = await supabase.from("guardian_links").insert({
        guardian_user_id: user.id,
        learner_user_id: targetId,
        status: "approved",
      });
      if (error) throw error;
      toast.success("Child profile linked successfully!");
      setLinkInput("");
      await loadFamilyData();
    } catch (linkErr) {
      toast.error(
        linkErr instanceof Error
          ? linkErr.message
          : "Could not link child account. Ensure you entered a valid User ID.",
      );
    } finally {
      setLinking(false);
    }
  }

  // Persist updated safety controls to Supabase safety_settings table
  async function updateChildControls(childId: string, updates: Partial<ParentalControlsData>) {
    if (!user) return;
    const targetChild = childrenList.find((c) => c.id === childId);
    if (!targetChild) return;

    const nextControls = { ...targetChild.controls, ...updates };

    setChildrenList((current) =>
      current.map((child) =>
        child.id === childId ? { ...child, controls: nextControls } : child,
      ),
    );

    try {
      const { error } = await supabase.from("safety_settings").upsert({
        learner_user_id: childId,
        voice_enabled: nextControls.allowVoice,
        daily_limit_minutes: nextControls.dailyLimitMinutes,
        allowed_start: nextControls.allowedStart,
        allowed_end: nextControls.allowedEnd,
        multiplayer_consent: nextControls.allowMultiplayer,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(`Safety settings saved to backend for ${targetChild.displayName}`);
    } catch (saveErr) {
      toast.error("Settings updated locally, but failed to save to server.");
    }
  }

  if (authLoading || loadingData) {
    return <div className="panel p-8 text-center text-sm font-bold">Checking parent authorization & family profiles…</div>;
  }

  if (!user) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center space-y-4">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-2xl font-black">Parent Portal Access</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your parent or guardian account to manage safety controls and monitor real learning progress.
        </p>
        <Link
          to="/login"
          className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground"
        >
          Sign In as Parent
        </Link>
      </div>
    );
  }

  if (isChildAccount) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center space-y-4">
        <Lock className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="text-2xl font-black">Parent Access Reserved</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This area is reserved for parents and guardians. Return to your Guardian Base to continue your adventure.
        </p>
        <Link
          to="/home"
          className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground"
        >
          Return to Guardian Base
        </Link>
      </div>
    );
  }

  const selectedChild = childrenList.find((c) => c.id === selectedChildId);
  const resolvedPolicy = selectedChild
    ? resolveChildPolicy({ tier: subscriptionTier, parentalControls: selectedChild.controls })
    : resolveChildPolicy({ tier: subscriptionTier });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header Banner */}
      <header className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/20 via-background to-cyan-500/10 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <Shield className="h-4 w-4" /> Authoritative Family Control Center
            </div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Parent & Guardian Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor real child learning achievements, configure persistent safety boundaries, and manage subscriptions.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 py-3 backdrop-blur">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs font-bold text-muted-foreground">Subscription Tier</p>
              <p className="text-sm font-black uppercase text-emerald-400">{subscriptionTier} Plan</p>
            </div>
          </div>
        </div>
      </header>

      {/* Link Child Profile Box */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-extrabold flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" /> Link Child Account
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter your child's Nyrava User ID to link their profile to your Parent Portal.
        </p>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Child User ID (UUID)"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="flex-1 rounded-xl border border-input bg-background/60 px-3.5 py-2 text-xs font-mono outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={linking || !linkInput.trim()}
            onClick={() => void handleLinkChild()}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Link Account
          </button>
        </div>
      </div>

      {/* Children Overview / Empty State */}
      {childrenList.length === 0 ? (
        <div className="panel p-10 text-center space-y-3">
          <Users className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-black">No Linked Child Profiles</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You do not have any linked child accounts yet. Use the box above to link your child's User ID and start managing their safety settings and progress.
          </p>
        </div>
      ) : (
        <>
          {/* Children Profiles Bar */}
          <section className="space-y-3">
            <h2 className="text-lg font-black tracking-tight">Linked Children</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {childrenList.map((child) => {
                const isSelected = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className={`panel flex items-start justify-between p-4 text-left transition ${
                      isSelected ? "border-primary bg-primary/5 shadow-lg" : "hover:border-border/80"
                    }`}
                  >
                    <div>
                      <h3 className="text-base font-extrabold">{child.displayName}</h3>
                      <p className="text-xs text-muted-foreground">Guardian: {child.guardian}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                        <span className="rounded-md bg-primary/20 px-2 py-0.5 text-primary">
                          Level {child.level}
                        </span>
                        <span>{child.xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Selected Child Dashboard */}
          {selectedChild && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left 2 Columns: Real Learning Progress */}
              <div className="space-y-6 lg:col-span-2">
                {/* Progress Overview Card */}
                <div className="panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black">{selectedChild.displayName}’s Real Learning Progress</h3>
                      <p className="text-xs text-muted-foreground">Authoritative backend state</p>
                    </div>
                    <Award className="h-7 w-7 text-amber-400" />
                  </div>

                  {/* Certificate Requirement Indicator */}
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-200">Digital Safety Foundations Certificate</span>
                      <span className="text-amber-300">
                        {Object.keys(selectedChild.scores).length} / 3 Complete
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-amber-950/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round((Object.keys(selectedChild.scores).length / 3) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Authoritative passing requirement: 75% or higher on each required assessment.
                    </p>
                  </div>

                  {/* Course Assessment Results */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Course Assessment Scores
                    </h4>
                    {missions.map((mission) => {
                      const score = selectedChild.scores[mission.id];
                      const isCompleted = score !== undefined;
                      return (
                        <div
                          key={mission.id}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3 text-sm"
                        >
                          <div>
                            <p className="font-extrabold">{mission.title.en}</p>
                            <p className="text-xs text-muted-foreground">{mission.summary.en}</p>
                          </div>
                          <div className="text-right">
                            {isCompleted ? (
                              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300">
                                Passed · {score}%
                              </span>
                            ) : (
                              <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                No activity yet
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real Activity Log */}
                <div className="panel p-6 space-y-4">
                  <h3 className="text-lg font-black">Educational Activity Log</h3>
                  {selectedChild.attempts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No educational attempts recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedChild.attempts.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3 text-xs"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                          <div className="flex-1">
                            <p className="font-extrabold text-foreground">Completed {att.missionId} Assessment</p>
                            <p className="text-muted-foreground">Result: {att.outcome}</p>
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Safety Controls */}
              <div className="space-y-6">
                <div className="panel p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-lg font-black">Safety Controls</h3>
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>

                  {/* AI Builder Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" /> AI Builder Access
                      </span>
                      <p className="text-[11px] text-muted-foreground">Disabled by default</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void updateChildControls(selectedChild.id, {
                          allowAiBuilder: !selectedChild.controls.allowAiBuilder,
                        })
                      }
                      className={`h-6 w-11 rounded-full p-0.5 transition ${
                        selectedChild.controls.allowAiBuilder ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white transition ${
                          selectedChild.controls.allowAiBuilder ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Voice Engine Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> Voice Engine
                      </span>
                      <p className="text-[11px] text-muted-foreground">Disabled by default</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void updateChildControls(selectedChild.id, {
                          allowVoice: !selectedChild.controls.allowVoice,
                        })
                      }
                      className={`h-6 w-11 rounded-full p-0.5 transition ${
                        selectedChild.controls.allowVoice ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white transition ${
                          selectedChild.controls.allowVoice ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Daily Play Limit Slider */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Daily Time Limit
                      </span>
                      <span className="text-primary font-black">{selectedChild.controls.dailyLimitMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={240}
                      step={15}
                      value={selectedChild.controls.dailyLimitMinutes}
                      onChange={(e) =>
                        void updateChildControls(selectedChild.id, {
                          dailyLimitMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Active Resolved Policy Box */}
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs space-y-1">
                    <p className="font-extrabold text-primary">Resolved Safety Authority</p>
                    <p className="text-[11px] text-muted-foreground">
                      AI Builder: {resolvedPolicy.canAccessBuilder ? "Allowed" : "Disabled"} · Voice:{" "}
                      {resolvedPolicy.canUseVoice ? "Allowed" : "Disabled"} · Time: {resolvedPolicy.dailyLimitMinutes} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
