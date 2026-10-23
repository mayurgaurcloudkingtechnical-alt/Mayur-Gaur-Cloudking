"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Star,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";

interface MockInterviewsViewProps {
  userRole: string;
}

export function MockInterviewsView({ userRole }: MockInterviewsViewProps) {
  const isStudent = userRole === "STUDENT";
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<any | null>(null);

  // Form State
  const [studentId, setStudentId] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [title, setTitle] = useState("");
  const [interviewType, setInterviewType] = useState<"HR" | "TECHNICAL" | "COMMUNICATION" | "APTITUDE" | "ROLE_SPECIFIC">("TECHNICAL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [instructions, setInstructions] = useState("");

  // Feedback State
  const [commScore, setCommScore] = useState(8);
  const [techScore, setTechScore] = useState(8);
  const [confScore, setConfScore] = useState(8);
  const [probScore, setProbScore] = useState(8);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const utils = api.useUtils();

  const { data: studentInterviews = [], isLoading: isStudentLoading } =
    api.mockInterview.listMyInterviews.useQuery(undefined, { enabled: isStudent });

  const { data: staffInterviews = [], isLoading: isStaffLoading } =
    api.mockInterview.listAssignedInterviews.useQuery(undefined, { enabled: !isStudent });

  const scheduleMutation = api.mockInterview.schedule.useMutation({
    onSuccess: () => {
      setIsScheduleOpen(false);
      setTitle("");
      setScheduledAt("");
      setInstructions("");
      utils.mockInterview.listAssignedInterviews.invalidate();
    },
    onError: (err) => alert(`Failed to schedule interview: ${err.message}`),
  });

  const feedbackMutation = api.mockInterview.submitFeedback.useMutation({
    onSuccess: () => {
      setSelectedInterviewForFeedback(null);
      setStrengths("");
      setImprovements("");
      setRecommendations("");
      utils.mockInterview.listAssignedInterviews.invalidate();
    },
    onError: (err) => alert(`Feedback error: ${err.message}`),
  });

  const interviews = isStudent ? studentInterviews : staffInterviews;
  const isLoading = isStudent ? isStudentLoading : isStaffLoading;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Award className="w-4 h-4 text-amber-400" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Virtual Placement Mock Interviews</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Industry simulation rounds for Technical, HR, Communication, and Aptitude readiness with structured competency scorecards.
          </p>
        </div>

        {!isStudent && (
          <Button
            onClick={() => setIsScheduleOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-2 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Mock Interview</span>
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading interview calendar...</div>
      ) : interviews.length === 0 ? (
        <Card className="border-slate-200 shadow-sm text-center p-12">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 text-sm">No Mock Interviews Scheduled</p>
          <p className="text-xs text-slate-500 mt-1">
            {isStudent
              ? "Your placement cell will allocate your monthly mock interview rounds here."
              : "Schedule a mock interview round for your batch candidates."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((iv: any) => {
            const isCompleted = iv.status === "COMPLETED";

            return (
              <Card key={iv.id} className="border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
                      {iv.interviewType} ROUND
                    </Badge>
                    <Badge
                      className={
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {iv.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">{iv.title}</CardTitle>
                  <p className="text-xs text-slate-500">
                    {isStudent
                      ? `Interviewer: ${iv.interviewer?.firstName} ${iv.interviewer?.lastName}`
                      : `Candidate: ${iv.student?.user?.firstName} ${iv.student?.user?.lastName} (${iv.student?.studentId})`}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(iv.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{iv.durationMin} minutes</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">Overall Score:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">{iv.overallScore} / 100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 pt-1 border-t border-emerald-200/60">
                        <span>Technical: {iv.scoreTechnical}/10</span>
                        <span>Communication: {iv.scoreCommunication}/10</span>
                        <span>Confidence: {iv.scoreConfidence}/10</span>
                        <span>Problem Solving: {iv.scoreProblemSolving}/10</span>
                      </div>
                      {iv.recommendations && (
                        <p className="text-slate-700 pt-1 italic line-clamp-2">
                          "{iv.recommendations}"
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    {!isStudent && !isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedInterviewForFeedback(iv)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        Evaluate & Submit Scorecard
                      </Button>
                    )}
                    {isStudent && !isCompleted && (
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        onClick={() => alert(`Interview Room Code: ${iv.roomCode}. Your interviewer will admit you at the scheduled time.`)}
                      >
                        Join Virtual Interview Lobby
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Evaluate Scorecard Modal */}
      {selectedInterviewForFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Candidate Evaluation Scorecard</h3>
                <p className="text-xs text-slate-500">
                  {selectedInterviewForFeedback.student?.user?.firstName} {selectedInterviewForFeedback.student?.user?.lastName} • {selectedInterviewForFeedback.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterviewForFeedback(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                feedbackMutation.mutate({
                  interviewId: selectedInterviewForFeedback.id,
                  scoreCommunication: commScore,
                  scoreTechnical: techScore,
                  scoreConfidence: confScore,
                  scoreProblemSolving: probScore,
                  strengths,
                  improvements,
                  recommendations,
                  status: "COMPLETED",
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Technical Skills (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={techScore}
                    onChange={(e) => setTechScore(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Communication (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={commScore}
                    onChange={(e) => setCommScore(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confidence (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={confScore}
                    onChange={(e) => setConfScore(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Problem Solving (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={probScore}
                    onChange={(e) => setProbScore(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Candidate Strengths *</label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  rows={2}
                  placeholder="Strong understanding of REST APIs and React lifecycle..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Areas for Improvement *</label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  rows={2}
                  placeholder="Needs deeper practice on database indexing and SQL joins..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Actionable Recommendations & Next Steps *</label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={2}
                  placeholder="Recommended to build full-stack project portfolio before recruiter drive..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSelectedInterviewForFeedback(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={feedbackMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {feedbackMutation.isPending ? "Submitting..." : "Save Evaluation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
