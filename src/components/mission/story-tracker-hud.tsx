import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Shield, ArrowRight } from "lucide-react";
import { type PhishingStoryStep, STORY_STEP_LABELS } from "@/domain/progression/phishing-story";
import { Button } from "@/components/ui/button";

export function StoryTrackerHud() {
  const [step, setStep] = useState<PhishingStoryStep>("SPAWN_ISLA");
  const info = STORY_STEP_LABELS[step];

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md text-white font-sans space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
          <Shield className="size-4" />
          <span>Story Mission 1</span>
        </div>
        <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[9px] font-black text-cyan-300 border border-cyan-500/30">
          ACTIVE
        </span>
      </div>

      <div>
        <h4 className="text-xs font-black text-amber-300">{info.title}</h4>
        <p className="text-[11px] text-slate-300 mt-1 leading-snug">{info.objective}</p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Link to={info.route as any}>
          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] rounded-lg px-2.5 py-1 h-7">
            Go to Objective <ArrowRight className="size-3 ml-1" />
          </Button>
        </Link>
        {step !== "MISSION_COMPLETED" && (
          <button
            type="button"
            onClick={() => {
              const steps: PhishingStoryStep[] = [
                "SPAWN_ISLA",
                "GOTO_MISSION_HUB",
                "TALK_SARAH",
                "TRAVEL_DIGITAL_CITY",
                "INSPECT_TERMINAL",
                "COMPLETE_ACADEMY_LESSON",
                "SOLVE_INCIDENT",
                "RETURN_SARAH",
                "MISSION_COMPLETED",
              ];
              const idx = steps.indexOf(step);
              if (idx < steps.length - 1) setStep(steps[idx + 1]!);
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-white underline"
          >
            Advance Step
          </button>
        )}
      </div>
    </div>
  );
}
