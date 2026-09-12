"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
} from "lucide-react";

interface ExamPlayerProps {
  exam: any;
  initialAttempt: any;
}

export function ExamPlayer({ exam, initialAttempt }: ExamPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempt] = useState(initialAttempt);

  // Initialize state with pre-existing saved answers from initialAttempt (for clean resume on refresh)
  const initialAnswersMap: Record<string, { answer: string | null; isMarked: boolean }> = {};
  if (Array.isArray(initialAttempt.answers)) {
    for (const ans of initialAttempt.answers) {
      initialAnswersMap[ans.questionId] = {
        answer: ans.selectedAnswer,
        isMarked: ans.isMarkedForReview ?? false,
      };
    }
  }

  const [answers, setAnswers] = useState<Record<string, { answer: string | null; isMarked: boolean }>>(
    initialAnswersMap
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("Saved");

  const startedAt = new Date(attempt.startedAt).getTime();
  const totalSeconds = exam.durationMinutes * 60;
  const initialRemaining = Math.max(
    0,
    Math.floor(totalSeconds - (Date.now() - startedAt) / 1000)
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialRemaining);

  const saveAnswerMutation = api.exam.saveAnswer.useMutation();
  const submitAttemptMutation = api.exam.submitAttempt.useMutation();

  const questions = exam.questions || [];
  const currentQuestionEntry = questions[currentIndex];
  const currentQuestion = currentQuestionEntry?.question;

  const handleFinalSubmit = async (isTimeout = false) => {
    if (isSubmitting) return;
    if (!isTimeout && !window.confirm("Are you sure you want to submit your exam now?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAttemptMutation.mutateAsync({
        attemptId: attempt.id,
        isTimeoutAutoSubmit: isTimeout,
      });
      router.push(`/student/results/${attempt.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to submit exam.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion) return;
    const currentAnswerObj = answers[currentQuestion.id] || { answer: null, isMarked: false };
    const newAnswer = currentAnswerObj.answer === optionId ? null : optionId;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAnswerObj,
        answer: newAnswer,
      },
    }));

    setSaveStatus("Saving...");
    try {
      await saveAnswerMutation.mutateAsync({
        attemptId: attempt.id,
        questionId: currentQuestion.id,
        selectedAnswer: newAnswer,
        isMarkedForReview: currentAnswerObj.isMarked,
      });
      setSaveStatus("Saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("Error saving");
    }
  };

  const handleToggleReview = async () => {
    if (!currentQuestion) return;
    const currentAnswerObj = answers[currentQuestion.id] || { answer: null, isMarked: false };
    const newMarked = !currentAnswerObj.isMarked;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAnswerObj,
        isMarked: newMarked,
      },
    }));

    setSaveStatus("Saving...");
    try {
      await saveAnswerMutation.mutateAsync({
        attemptId: attempt.id,
        questionId: currentQuestion.id,
        selectedAnswer: currentAnswerObj.answer,
        isMarkedForReview: newMarked,
      });
      setSaveStatus("Saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("Error saving");
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getStatusColor = (idx: number) => {
    const qId = questions[idx]?.question?.id;
    const state = answers[qId];
    if (idx === currentIndex) return "ring-2 ring-primary border-primary font-bold";
    if (state?.isMarked) return "bg-purple-100 text-purple-800 border-purple-300";
    if (state?.answer) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 gap-4">
      <header className="flex flex-wrap items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500">
            Course: {exam.course?.title} • Marks: {exam.totalMarks} • Passing: {exam.passingPercentage}%
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500">{saveStatus}</div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-base font-bold ${
              secondsRemaining < 300
                ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse"
                : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => handleFinalSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "Submitting..." : "Submit Exam"}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        <main className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between overflow-y-auto shadow-sm">
          {currentQuestion ? (
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <span className="text-sm font-semibold text-slate-700">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                    {currentQuestionEntry.marksOverride ?? currentQuestion.marks} Marks
                  </span>
                  {exam.negativeMarking && (
                    <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-medium">
                      -{exam.negativeMarksPerQuestion} Negative
                    </span>
                  )}
                </div>
              </div>

              <div className="text-base text-slate-900 font-medium whitespace-pre-wrap leading-relaxed mb-6">
                {currentQuestion.questionText}
              </div>

              <div className="space-y-3">
                {Array.isArray(currentQuestion.options) &&
                  currentQuestion.options.map((opt: any) => {
                    const isSelected = answers[currentQuestion.id]?.answer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-lg border text-sm transition flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                              isSelected
                                ? "border-primary bg-primary text-white font-bold"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No questions available.</div>
          )}

          <footer className="flex items-center justify-between border-t pt-4 mt-6">
            <button
              onClick={handleToggleReview}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm border font-medium transition ${
                answers[currentQuestion?.id]?.isMarked
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{answers[currentQuestion?.id]?.isMarked ? "Marked for Review" : "Mark for Review"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </main>

        <aside className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Question Palette</h2>
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q: any, idx: number) => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition ${getStatusColor(
                    idx
                  )}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-300"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200"></span>
                <span>Not Attempted</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Exam auto-submits when time reaches 00:00.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}