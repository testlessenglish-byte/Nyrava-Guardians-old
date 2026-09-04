import { Trophy, ShieldCheck, RefreshCw, Zap, Coins, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GuardianCourse } from "@/domain/progression/guardian-course-schema";
import { type AssessmentResult } from "./assessment-stage-view";

export function MasteryStageView({
  course,
  result,
  locale = "en-US",
  onFinish,
  onRetry,
}: {
  course: GuardianCourse;
  result: AssessmentResult | null;
  locale?: string;
  onFinish: () => void;
  onRetry: () => void;
}) {
  const es = locale.startsWith("es");
  const text = (val: { en: string; es: string }) => (es ? val.es : val.en);

  const score = result?.score ?? 100;
  const passed = result ? result.passed : true;

  // Identify weak skills for remediation
  const skillBreakdown = course.skills.map((skill) => {
    const stat = result?.skillScores?.[skill.id] ?? { correct: 1, total: 1 };
    const skillPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 100;
    const isMastered = skillPct >= skill.criticalThreshold;
    return {
      ...skill,
      scorePct: skillPct,
      isMastered,
    };
  });

  const weakSkills = skillBreakdown.filter((s) => !s.isMastered);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stage Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
          <Trophy className="size-4" /> 🏆 Stage 6: Mastery & Skill Report
        </span>
        <span className="text-xs font-extrabold text-slate-400">
          {text(course.title)}
        </span>
      </div>

      {/* Main Results Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl space-y-6 text-center">
        {passed ? (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center rounded-full bg-emerald-950/80 border-2 border-emerald-400 p-4 shadow-emerald-500/20 shadow-lg">
              <ShieldCheck className="size-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              {es ? "¡Felicidades, Guardian!" : "Congratulations, Guardian!"}
            </h2>
            <p className="text-sm font-semibold text-slate-300 max-w-md mx-auto">
              {es
                ? `Has demostrado un dominio del ${score}% en la prevención de ataques de phishing.`
                : `You demonstrated ${score}% mastery in Phishing Defense & Cyber Safety.`}
            </p>

            {/* Rewards summary */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/50 px-4 py-2 text-xs font-extrabold text-amber-300">
                <Zap className="size-4 text-amber-400" />
                +{course.xpReward} XP
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-950/50 px-4 py-2 text-xs font-extrabold text-cyan-300">
                <Coins className="size-4 text-cyan-400" />
                +{course.creditReward} Credits
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-950/50 px-4 py-2 text-xs font-extrabold text-purple-300">
                <Sparkles className="size-4 text-purple-400" />
                Badge: {course.badgeId.toUpperCase()}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center rounded-full bg-amber-950/80 border-2 border-amber-400 p-4">
              <AlertCircle className="size-12 text-amber-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              {es ? "Entrenamiento Incompleto" : "Training Not Yet Complete"}
            </h2>
            <p className="text-sm font-semibold text-slate-300 max-w-md mx-auto">
              {es
                ? `Obtuviste ${score}%. Se requiere ${course.assessment.passingScore}% para obtener la insignia de Guardian.`
                : `You scored ${score}%. A minimum score of ${course.assessment.passingScore}% is required to unlock your Guardian Badge.`}
            </p>
          </div>
        )}
      </div>

      {/* Skill Diagnostic Breakdown */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
          {es ? "Desglose de Habilidades" : "Skill Diagnostic Report"}
        </h3>
        <div className="grid gap-3">
          {skillBreakdown.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white">{text(s.name)}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Threshold: {s.criticalThreshold}%)
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">{text(s.description)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-black text-white font-mono">{s.scorePct}%</span>
                {s.isMastered ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-500/40 px-3 py-1 text-[10px] font-black text-emerald-300">
                    <CheckCircle className="size-3" /> {es ? "DOMINADO" : "MASTERED"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-950 border border-amber-500/40 px-3 py-1 text-[10px] font-black text-amber-300">
                    <AlertCircle className="size-3" /> {es ? "REFORZAR" : "REMEDIATION"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remediation Callout if weak skills exist */}
      {weakSkills.length > 0 && (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-950/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
            <AlertCircle className="size-4 text-amber-400" />
            {es ? "Áreas de Refuerzo Identificadas" : "Targeted Remediation Needed"}
          </div>
          <p className="text-xs font-semibold text-amber-200/90 leading-relaxed">
            {es
              ? "Nyrava ha preparado un módulo de refuerzo enfocado en las habilidades donde no alcanzaste el umbral crítico de seguridad."
              : "Nyrava flagged specific skills below safety thresholds. You can retry the assessment or complete targeted practice to reach 100% mastery."}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-slate-700 bg-slate-900 text-slate-300 font-bold"
        >
          <RefreshCw className="size-4 mr-2" />
          {es ? "Reintentar Evaluación" : "Retry Assessment"}
        </Button>

        <Button
          onClick={onFinish}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
        >
          {es ? "Completar Curso y Volver al Salón" : "Complete Course & Return to Classroom"}
        </Button>
      </div>
    </div>
  );
}
