import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Target, Calendar, Award, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useGuardian } from "@/lib/guardian-context";
import { Button } from "@/components/ui/button";
import { missions as domainMissions } from "@/domain/progression/catalog";
import { advancePhishingStory, getPhishingStoryStep, setPhishingStoryStep } from "@/lib/phishing-story-state";

export const Route = createFileRoute("/missions")({
  head: () => ({ meta: [{ title: "Mission Hub Command Center — Nyrava Guardians" }, { name: "description", content: "Official Incident Command & Mission Selection Hub." }] }),
  component: MissionHubPage,
});

function selectMission(missionId: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem("nyrava-selected-mission", missionId);
}

function MissionHubPage() {
  const { guardianName, locale } = useGuardian();
  const es = locale.startsWith("es");
  const [selectedTab, setSelectedTab] = useState<"story" | "daily" | "weekly">("story");

  useEffect(() => {
    advancePhishingStory("GOTO_MISSION_HUB", "TALK_SARAH");
    advancePhishingStory("RETURN_SARAH", "MISSION_COMPLETED");
  }, []);

  const acceptPhishingMission = () => {
    selectMission("phishing-defense");
    const current = getPhishingStoryStep();
    if (current === "SPAWN_ISLA" || current === "GOTO_MISSION_HUB" || current === "TALK_SARAH" || current === "MISSION_COMPLETED") {
      setPhishingStoryStep("TRAVEL_DIGITAL_CITY");
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-[0.25em] mb-1"><Shield className="size-4" /><span>{es ? "Centro de Comando" : "Incident Command Center"}</span></div>
          <h1 className="text-3xl md:text-4xl font-black text-white">{es ? "Centro de Misiones" : "Mission Hub"}</h1>
          <p className="text-slate-400 text-sm mt-1">{es ? `Bienvenido, ${guardianName || "Guardián"}. Elige una misión.` : `Welcome, ${guardianName || "Guardian"}. Select an active mission or assignment.`}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/isla"><Button variant="outline" className="border-cyan-500/40 bg-slate-900/80 text-cyan-300 font-bold text-xs"><MapPin className="size-3.5 mr-1.5" /> Isla Central</Button></Link>
          <Link to="/classroom"><Button variant="outline" className="border-amber-500/40 bg-slate-900/80 text-amber-300 font-bold text-xs">🎓 {es ? "Academia" : "Academy"}</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-cyan-950 border border-cyan-400/50 text-2xl">🛡️</div><div><span className="rounded-full bg-cyan-950 border border-cyan-400/40 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-300">{es ? "Especialista de Seguridad" : "Security Specialist"}</span><h3 className="text-lg font-black text-white mt-1">Sarah</h3></div></div>
            <p className="text-xs text-slate-300 leading-relaxed rounded-2xl bg-slate-900/80 p-4 border border-slate-800">{es ? "Tenemos reportes de mensajes de phishing en Ciudad Digital. Investiga el incidente y protege las cuentas." : "We have reports of suspicious phishing messages in Digital City. Investigate the incident and protect affected accounts."}</p>
            <Link to="/city" className="block" onClick={acceptPhishingMission}><Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl">{es ? "Aceptar misión de phishing" : "Accept Phishing Mission"} <ArrowRight className="size-4 ml-2" /></Button></Link>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-3 border-b border-slate-800 pb-3">
            {[{ id: "story", label: es ? "Misiones" : "Story Missions", icon: Target }, { id: "daily", label: es ? "Retos diarios" : "Daily Challenges", icon: Calendar }, { id: "weekly", label: es ? "Operaciones semanales" : "Weekly Ops", icon: Award }].map((tab) => {
              const Icon = tab.icon;
              return <button key={tab.id} type="button" onClick={() => setSelectedTab(tab.id as typeof selectedTab)} className={"flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition " + (selectedTab === tab.id ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-white")}><Icon className="size-4" />{tab.label}</button>;
            })}
          </div>

          {selectedTab === "story" && <div className="space-y-4">{domainMissions.map((mission, index) => {
            const phishing = mission.id === "phishing-defense";
            const destination = phishing ? "/city" : "/classroom";
            return <div key={mission.id} className="rounded-3xl border border-cyan-500/40 bg-slate-950/80 p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between"><span className="rounded-full bg-cyan-950 border border-cyan-400/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">{es ? "MISIÓN" : "STORY MISSION"} {index + 1}</span><span className="text-xs font-extrabold text-amber-400">+{mission.xp} XP</span></div>
              <div><h3 className="text-xl font-black text-white">{es ? mission.title.es : mission.title.en}</h3><p className="text-xs text-slate-300 mt-1 max-w-xl">{es ? mission.summary.es : mission.summary.en}</p></div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800"><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><CheckCircle2 className="size-4 text-emerald-400" /><span>{es ? "Recompensa" : "Reward"}: {mission.badgeId} · {mission.credits} Credits</span></div>
                <Link to={destination as any} onClick={() => phishing ? acceptPhishingMission() : selectMission(mission.id)}><Button size="sm" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg">{es ? "Iniciar" : "Launch Mission"}</Button></Link>
              </div>
            </div>;
          })}</div>}

          {selectedTab === "daily" && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center"><Calendar className="size-10 text-cyan-400 mx-auto" /><h3 className="mt-3 text-lg font-black">{es ? "Retos diarios en preparación" : "Daily challenges are being prepared"}</h3><p className="mt-2 text-xs text-slate-400">{es ? "No otorgaremos XP hasta que los retos estén conectados al motor de progreso." : "No XP is awarded until these challenges are connected to the progression engine."}</p></div>}
          {selectedTab === "weekly" && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center"><Award className="size-10 text-cyan-400 mx-auto" /><h3 className="mt-3 text-lg font-black">{es ? "Operaciones semanales bloqueadas" : "Weekly Operations Locked"}</h3><p className="mt-2 text-xs text-slate-400">{es ? "Completa la ruta de Fundamentos para desbloquearlas cuando estén listas." : "Complete the Foundations path. Weekly operations will unlock when the real activity engine is ready."}</p></div>}
        </div>
      </main>
    </div>
  );
}
