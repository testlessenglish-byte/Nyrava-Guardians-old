import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Target, Calendar, Award, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useState } from "react";
import { useGuardian } from "@/lib/guardian-context";
import { Button } from "@/components/ui/button";
import { missions as domainMissions } from "@/domain/progression/catalog";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Mission Hub Command Center — Nyrava Guardians" },
      { name: "description", content: "Official Incident Command & Mission Selection Hub." },
    ],
  }),
  component: MissionHubPage,
});

function MissionHubPage() {
  const { guardianName } = useGuardian();
  const [selectedTab, setSelectedTab] = useState<"story" | "daily" | "weekly">("story");
  const primaryMission = domainMissions[0]!;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-[0.25em] mb-1">
            <Shield className="size-4" />
            <span>Incident Command Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Mission Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome, {guardianName || "Guardian"}. Select an active mission or assignment.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/isla">
            <Button variant="outline" className="border-cyan-500/40 bg-slate-900/80 text-cyan-300 hover:bg-cyan-950 font-bold text-xs">
              <MapPin className="size-3.5 mr-1.5" /> Isla Central
            </Button>
          </Link>
          <Link to="/classroom">
            <Button variant="outline" className="border-amber-500/40 bg-slate-900/80 text-amber-300 hover:bg-amber-950 font-bold text-xs">
              🎓 Academy Classroom
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-cyan-950 border border-cyan-400/50 text-2xl text-cyan-400 shadow-lg">
                👮‍♀️
              </div>
              <div>
                <span className="rounded-full bg-cyan-950 border border-cyan-400/40 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                  Commanding Officer
                </span>
                <h3 className="text-lg font-black text-white mt-1">Sarah · Security Specialist</h3>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
              "Guardian, we have received reports of suspicious phishing messages circulating through Digital City. I need you to investigate the incident and protect affected accounts."
            </p>
            <Link to="/classroom" className="block">
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl">
                Start Phishing Mission <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-3 border-b border-slate-800 pb-3">
            {[
              { id: "story", label: "Story Missions", icon: Target },
              { id: "daily", label: "Daily Challenges", icon: Calendar },
              { id: "weekly", label: "Weekly Ops", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition " +
                    (selectedTab === tab.id
                      ? "bg-cyan-500 text-slate-950 shadow-lg"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white")
                  }
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {selectedTab === "story" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-cyan-500/40 bg-slate-950/80 p-6 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-950 border border-cyan-400/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    STORY MISSION 1
                  </span>
                  <span className="text-xs font-extrabold text-amber-400">+400 XP</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{primaryMission.title.en}</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">{primaryMission.summary.en}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>Location: Digital City & Academy</span>
                  </div>
                  <Link to="/classroom">
                    <Button size="sm" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg">
                      Launch Mission
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "daily" && (
            <div className="space-y-3">
              {[
                { title: "Identify 3 Phishing Messages", xp: "+120 XP", desc: "Inspect sender domains and links." },
                { title: "Verify Official Domain", xp: "+80 XP", desc: "Check URL safety in Digital City." },
                { title: "Help NPC with Privacy Settings", xp: "+100 XP", desc: "Assist citizen with account security." },
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
                    {item.xp}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "weekly" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-3">
              <Award className="size-10 text-cyan-400 mx-auto" />
              <h3 className="text-lg font-black text-white">Weekly Guardian Op</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Complete all foundation story missions to unlock weekly operations and exclusive Guardian cosmetics.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
