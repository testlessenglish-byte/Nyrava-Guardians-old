import { useState } from "react";
import { ArrowLeft, ArrowRight, Award, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { missions } from "@/domain/progression/catalog";

export function FullViewportCourseExperience({
  onExit,
  onComplete,
}: {
  onExit: () => void;
  onComplete: (score: number) => void;
}) {
  const activeMission = missions[0]!;
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const lessonSteps = activeMission.lesson;
  const questions = activeMission.questions;

  const isQuizStep = stepIndex >= lessonSteps.length + 1;
  const totalSteps = lessonSteps.length + 2;

  const handleQuizSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedOptions[q.id] === 0) {
        correctCount++;
      }
    });
    const calculatedScore = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    setScore(calculatedScore);
    setSubmitted(true);
    onComplete(calculatedScore);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col font-sans select-none"
      style={{
        background: "linear-gradient(180deg, #07111f 0%, #0b1728 100%)",
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* TOP HEADER */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="font-bold">Return to Classroom</span>
          </Button>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Lesson 1 · Digital Safety Foundations
            </p>
            <h1 className="text-sm font-black text-white">{activeMission.title.en}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-48">
            <div className="flex justify-between text-[11px] font-extrabold text-slate-400 mb-1">
              <span>Progress</span>
              <span className="text-cyan-300">{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-300"
                style={{ width: ((stepIndex + 1) / totalSteps) * 100 + "%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl backdrop-blur-xl">
          {stepIndex === 0 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-cyan-950 border border-cyan-400/40 text-4xl shadow-xl text-cyan-300">
                🛡️
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{activeMission.title.en}</h2>
                <p className="mt-2 text-base text-slate-300 max-w-xl mx-auto">
                  {activeMission.summary.en}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Class Outcomes</p>
                <ul className="space-y-2 text-sm text-slate-200 font-medium">
                  <li className="flex items-center gap-2">✓ Recognize deceptive urgency and fake sender addresses</li>
                  <li className="flex items-center gap-2">✓ Verify link destinations before clicking</li>
                  <li className="flex items-center gap-2">✓ Earn 75%+ on assessment to claim your Digital Safety Certificate</li>
                </ul>
              </div>
            </div>
          )}

          {stepIndex > 0 && stepIndex <= lessonSteps.length && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Concept {stepIndex} of {lessonSteps.length}
                </span>
                <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                  Core Rule
                </span>
              </div>
              <div className="py-4">
                <p className="text-2xl font-bold leading-relaxed text-slate-100">
                  "{lessonSteps[stepIndex - 1]?.en}"
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex items-center gap-4">
                <div className="text-3xl">💡</div>
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  Always remember: Real organizations will never rush you into giving away your password or security details over an unverified message.
                </p>
              </div>
            </div>
          )}

          {isQuizStep && (
            <div className="space-y-6">
              {!submitted ? (
                <>
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                      Final Knowledge Assessment
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">Answer to Earn Your Certificate</h3>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                      <div key={q.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                        <p className="text-sm font-black text-white">
                          {qIdx + 1}. {q.prompt.en}
                        </p>
                        <div className="grid gap-2">
                          {q.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setSelectedOptions((prev) => ({ ...prev, [q.id]: optIdx }))}
                              className={"w-full rounded-xl border p-3 text-left text-xs font-semibold transition " +
                                (selectedOptions[q.id] === optIdx
                                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold"
                                  : "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800")}
                            >
                              {opt.en}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(selectedOptions).length < questions.length}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl"
                  >
                    Submit Assessment
                  </Button>
                </>
              ) : (
                <div className="space-y-6 text-center py-4">
                  {score >= 75 ? (
                    <>
                      <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-emerald-950 border border-emerald-400/50 text-4xl text-emerald-400 shadow-2xl">
                        🏆
                      </div>
                      <div>
                        <span className="rounded-full bg-emerald-950 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                          PASSED — {score}%
                        </span>
                        <h2 className="mt-3 text-3xl font-black text-white">Assessment Complete!</h2>
                        <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                          Congratulations, Guardian! You demonstrated mastery in Phishing Defense and earned your certificate.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 flex items-center justify-center gap-3 text-emerald-300">
                        <Award className="size-6" />
                        <span className="text-sm font-black">Digital Safety Foundations Certificate Granted!</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-rose-950 border border-rose-400/50 text-4xl text-rose-400 shadow-2xl">
                        <XCircle className="size-12" />
                      </div>
                      <div>
                        <span className="rounded-full bg-rose-950 px-4 py-1 text-xs font-black uppercase tracking-widest text-rose-400 border border-rose-500/30">
                          SCORE: {score}% (Required: 75%)
                        </span>
                        <h2 className="mt-3 text-3xl font-black text-white">Review & Try Again</h2>
                        <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                          You need 75% or higher to pass. Review the lesson concepts and try again!
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex justify-center gap-4 pt-4">
                    {score < 75 && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSubmitted(false);
                          setStepIndex(1);
                        }}
                        className="bg-slate-800 text-white font-bold"
                      >
                        Review Lesson
                      </Button>
                    )}
                    <Button
                      onClick={onExit}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6"
                    >
                      Return to Classroom
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      {!isQuizStep && (
        <div className="flex h-20 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950/90 px-8 backdrop-blur-md">
          <Button
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 font-bold"
          >
            <ArrowLeft className="size-4 mr-2" /> Previous
          </Button>

          <span className="text-xs font-bold text-slate-400">
            Step {stepIndex + 1} of {totalSteps}
          </span>

          <Button
            onClick={() => setStepIndex((prev) => prev + 1)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
          >
            {stepIndex === lessonSteps.length ? "Take Quiz" : "Continue"} <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
