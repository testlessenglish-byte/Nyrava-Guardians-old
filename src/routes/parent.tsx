import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Mic,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

type ChildOverview = {
  id: string;
  name: string;
  guardian: string;
  level: number;
  xp: number;
  currentMission: string;
  currentCourse: string;
  completedMissionsCount: number;
  certificatesEarned: number;
  lastActive: string;
  scores: Record<string, number>;
  controls: ParentalControlsData;
};

const INITIAL_CHILDREN: ChildOverview[] = [
  {
    id: "child-alex",
    name: "Alex",
    guardian: "Sarah",
    level: 6,
    xp: 2450,
    currentMission: "Phishing Defense",
    currentCourse: "Digital Safety Foundations",
    completedMissionsCount: 2,
    certificatesEarned: 0,
    lastActive: "Today at 4:15 PM",
    scores: {
      "phishing-defense": 88,
      "password-safety": 94,
    },
    controls: { ...DEFAULT_PARENTAL_CONTROLS },
  },
  {
    id: "child-sofia",
    name: "Sofia",
    guardian: "Jacob",
    level: 4,
    xp: 1350,
    currentMission: "Password Safety",
    currentCourse: "Digital Safety Foundations",
    completedMissionsCount: 1,
    certificatesEarned: 0,
    lastActive: "Yesterday at 6:30 PM",
    scores: {
      "phishing-defense": 92,
    },
    controls: { ...DEFAULT_PARENTAL_CONTROLS, allowAiBuilder: false, dailyLimitMinutes: 60 },
  },
];

const INITIAL_ACTIVITY = [
  {
    id: "act-1",
    childName: "Alex",
    title: "Completed Phishing Defense Assessment",
    result: "Scored 88% — Passing threshold met",
    time: "Today at 4:12 PM",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
  {
    id: "act-2",
    childName: "Alex",
    title: "Completed Password Safety Assessment",
    result: "Scored 94% — High mastery",
    time: "Today at 3:45 PM",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
  {
    id: "act-3",
    childName: "Sofia",
    title: "Started Password Safety Course",
    result: "In progress",
    time: "Yesterday at 6:28 PM",
    icon: BookOpen,
    color: "text-cyan-400",
  },
];

function ParentPortalPage() {
  const { user, loading } = useAuth();
  const [childrenList, setChildrenList] = useState<ChildOverview[]>(INITIAL_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string>("child-alex");
  const [subscriptionTier] = useState<SubscriptionTier>("family");

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) ?? childrenList[0]!;

  function updateChildControls(childId: string, updates: Partial<ParentalControlsData>) {
    setChildrenList((current) =>
      current.map((child) =>
        child.id === childId ? { ...child, controls: { ...child.controls, ...updates } } : child,
      ),
    );
    toast.success(`Safety settings updated for ${selectedChild.name}`);
  }

  if (loading) return <div className="panel p-8 text-center">Loading Parent Command Center…</div>;

  if (!user) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-black">Parent Portal Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your parent account to view educational progress and manage child permissions.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground"
        >
          Sign In as Parent
        </Link>
      </div>
    );
  }

  const resolvedPolicy = resolveChildPolicy({
    tier: subscriptionTier,
    parentalControls: selectedChild.controls,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header Banner */}
      <header className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/20 via-background to-cyan-500/10 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <Shield className="h-4 w-4" /> Family Command Center
            </div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Parent & Guardian Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor learning progress, set clear boundaries, and manage family subscription controls.
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

      {/* Children Overview Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">Children Profiles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {childrenList.map((child) => {
            const isSelected = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`panel flex items-start justify-between p-5 text-left transition ${
                  isSelected ? "border-primary bg-primary/5 shadow-lg" : "hover:border-border/80"
                }`}
              >
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold">{child.name}</h3>
                    <p className="text-xs text-muted-foreground">Guardian: {child.guardian}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs font-bold">
                      <span className="rounded-md bg-primary/20 px-2 py-0.5 text-primary">
                        Level {child.level}
                      </span>
                      <span>{child.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-bold">{child.lastActive}</p>
                  <p className="mt-1 text-[11px] text-cyan-400 font-extrabold">{child.currentMission}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Detailed Child Dashboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Educational Progress */}
        <div className="space-y-6 lg:col-span-2">
          {/* Learning Progress Card */}
          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">{selectedChild.name}’s Learning Dashboard</h3>
                <p className="text-xs text-muted-foreground">{selectedChild.currentCourse}</p>
              </div>
              <Award className="h-7 w-7 text-amber-400" />
            </div>

            {/* Certificate Progress Bar */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-200">Digital Safety Foundations Certificate</span>
                <span className="text-amber-300">2 / 3 Requirements Complete</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-amber-950/60">
                <div className="h-full w-[66%] rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Passing score requirement: 75% or higher on each course assessment.
              </p>
            </div>

            {/* Course Breakdown */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Course Assessment Results
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
                        <div>
                          <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300">
                            Passed · {score}%
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="panel p-6 space-y-4">
            <h3 className="text-lg font-black">Recent Activity Feed</h3>
            <div className="space-y-3">
              {INITIAL_ACTIVITY.filter((item) => item.childName === selectedChild.name).map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3 text-xs"
                  >
                    <IconComponent className={`mt-0.5 h-4 w-4 ${item.color}`} />
                    <div className="flex-1">
                      <p className="font-extrabold text-foreground">{item.title}</p>
                      <p className="text-muted-foreground">{item.result}</p>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Safety & Permissions Panel */}
        <div className="space-y-6">
          <div className="panel p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-black">Safety & Controls</h3>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="text-xs text-muted-foreground">
              Configure individual boundaries for <strong className="text-foreground">{selectedChild.name}</strong>.
            </p>

            {/* AI Builder Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> AI Builder Access
                </span>
                <p className="text-[11px] text-muted-foreground">Allow child to design 3D worlds with AI guidance</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateChildControls(selectedChild.id, {
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
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> Voice Interaction
                </span>
                <p className="text-[11px] text-muted-foreground">Enable spoken voice explanations in lessons</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateChildControls(selectedChild.id, {
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

            {/* Microphone Access Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-violet-400" /> Microphone Input
                </span>
                <p className="text-[11px] text-muted-foreground">Allow voice chat input</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateChildControls(selectedChild.id, {
                    allowMicrophone: !selectedChild.controls.allowMicrophone,
                  })
                }
                className={`h-6 w-11 rounded-full p-0.5 transition ${
                  selectedChild.controls.allowMicrophone ? "bg-emerald-500" : "bg-muted"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white transition ${
                    selectedChild.controls.allowMicrophone ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Play Time Limit */}
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
                  updateChildControls(selectedChild.id, {
                    dailyLimitMinutes: Number(e.target.value),
                  })
                }
                className="w-full accent-primary"
              />
            </div>

            {/* Active Resolved Policy Summary */}
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
    </div>
  );
}
