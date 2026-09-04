import { useState } from "react";
import { BookOpen, Search, ShieldAlert, Gamepad2, HelpCircle, Trophy, CheckCircle, Lock } from "lucide-react";
import { type GuardianCourse } from "@/domain/progression/guardian-course-schema";
import { StoryStageView } from "./stages/story-stage-view";
import { InvestigationStageView } from "./stages/investigation-stage-view";
import { SkillStageView } from "./stages/skill-stage-view";
import { SimulationStageView } from "./stages/simulation-stage-view";
import { AssessmentStageView, type AssessmentResult } from "./stages/assessment-stage-view";
import { MasteryStageView } from "./stages/mastery-stage-view";

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

const STAGES: { stage: StageNumber; key: string; labelEn: string; labelEs: string; icon: typeof BookOpen }[] = [
  { stage: 1, key: "story", labelEn: "1. Story", labelEs: "1. Historia", icon: BookOpen },
  { stage: 2, key: "investigation", labelEn: "2. Investigation", labelEs: "2. Investigación", icon: Search },
  { stage: 3, key: "skill", labelEn: "3. Rule", labelEs: "3. Regla", icon: ShieldAlert },
  { stage: 4, key: "simulation", labelEn: "4. Simulation", labelEs: "4. Simulación", icon: Gamepad2 },
  { stage: 5, key: "assessment", labelEn: "5. Test", labelEs: "5. Examen", icon: HelpCircle },
  { stage: 6, key: "mastery", labelEn: "6. Mastery", labelEs: "6. Dominio", icon: Trophy },
];

export function CourseEngine({
  course,
  locale = "en-US",
  onCourseComplete,
  onExit,
}: {
  course: GuardianCourse;
  locale?: string;
  onCourseComplete?: (result: AssessmentResult | null) => void;
  onExit?: () => void;
}) {
  const es = locale.startsWith("es");
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [maxStageUnlocked, setMaxStageUnlocked] = useState<StageNumber>(1);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const unlockStage = (next: StageNumber) => {
    setCurrentStage(next);
    if (next > maxStageUnlocked) {
      setMaxStageUnlocked(next);
    }
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    unlockStage(6);
  };

  const handleFinishCourse = () => {
    if (onCourseComplete) {
      onCourseComplete(assessmentResult);
    } else if (onExit) {
      onExit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 6-Stage Top Progress Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-6 gap-1 md:gap-2">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStage === s.stage;
            const isUnlocked = s.stage <= maxStageUnlocked;
            const isCompleted = s.stage < maxStageUnlocked;

            return (
              <button
                key={s.stage}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && setCurrentStage(s.stage)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
                  isCurrent
                    ? "bg-slate-800 border border-cyan-500/60 text-cyan-300 shadow-md scale-[1.02]"
                    : isCompleted
                      ? "bg-slate-900/80 border border-emerald-500/30 text-emerald-300 hover:bg-slate-850 cursor-pointer"
                      : isUnlocked
                        ? "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 cursor-pointer"
                        : "bg-slate-950 border border-slate-900 text-slate-600 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle className="size-4 text-emerald-400" />
                  ) : isUnlocked ? (
                    <Icon className={`size-4 ${isCurrent ? "text-cyan-400" : "text-slate-400"}`} />
                  ) : (
                    <Lock className="size-4 text-slate-600" />
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-black truncate w-full">
                  {es ? s.labelEs : s.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Renderer */}
      <div className="min-h-[500px]">
        {currentStage === 1 && (
          <StoryStageView
            course={course}
            locale={locale}
            onComplete={() => unlockStage(2)}
          />
        )}

        {currentStage === 2 && (
          <InvestigationStageView
            course={course}
            locale={locale}
            onComplete={() => unlockStage(3)}
          />
        )}

        {currentStage === 3 && (
          <SkillStageView
            course={course}
            locale={locale}
            onComplete={() => unlockStage(4)}
          />
        )}

        {currentStage === 4 && (
          <SimulationStageView
            course={course}
            locale={locale}
            onComplete={() => unlockStage(5)}
          />
        )}

        {currentStage === 5 && (
          <AssessmentStageView
            course={course}
            locale={locale}
            onComplete={handleAssessmentComplete}
          />
        )}

        {currentStage === 6 && (
          <MasteryStageView
            course={course}
            result={assessmentResult}
            locale={locale}
            onFinish={handleFinishCourse}
            onRetry={() => setCurrentStage(5)}
          />
        )}
      </div>
    </div>
  );
}
