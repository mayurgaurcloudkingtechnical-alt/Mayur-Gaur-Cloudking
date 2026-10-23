"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
  ShieldCheck,
  Building,
} from "lucide-react";

interface RecruiterInterviewsViewProps {
  userRole: string;
}

export function RecruiterInterviewsView({ userRole }: RecruiterInterviewsViewProps) {
  const isStudent = userRole === "STUDENT";
  const [selectedInterviewForDecision, setSelectedInterviewForDecision] = useState<any | null>(null);
  const [decision, setDecision] = useState<"SELECTED" | "REJECTED" | "NEXT_ROUND" | "ON_HOLD">("SELECTED");
  const [feedback, setFeedback] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const utils = api.useUtils();

  const { data: studentInterviews = [], isLoading: isStudentLoading } =
    api.recruiterInterview.listStudentInterviews.useQuery(undefined, { enabled: isStudent });

  const { data: recruiterInterviews = [], isLoading: isRecruiterLoading } =
    api.recruiterInterview.listRecruiterInterviews.useQuery(undefined, { enabled: !isStudent });

  const submitDecisionMutation = api.recruiterInterview.submitDecision.useMutation({
    onSuccess: () => {
      setSelectedInterviewForDecision(null);
      setFeedback("");
      setPrivateNotes("");
      utils.recruiterInterview.listRecruiterInterviews.invalidate();
    },
    onError: (err) => alert(`Failed to submit decision: ${err.message}`),
  });

  const interviews = isStudent ? studentInterviews : recruiterInterviews;
  const isLoading = isStudent ? isStudentLoading : isRecruiterLoading;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Briefcase className="w-4 h-4 text-sky-400" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Recruiter & Campus Placement Rounds</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Conduct confidential virtual interview rounds with shortlisted student candidates. Evaluations update directly into the Placement CRM.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strictly Private: Never Published to Public Channels</span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading recruiter interview calendar...</div>
      ) : interviews.length === 0 ? (
        <Card className="border-slate-200 shadow-sm text-center p-12">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 text-sm">No Recruiter Interviews Scheduled</p>
          <p className="text-xs text-slate-500 mt-1">
            {isStudent
              ? "When companies shortlist your profile for a placement round, the interview schedule will appear here."
              : "Shortlist candidates from an active Job Drive to schedule virtual interview rounds."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((iv: any) => {
            const isCompleted = ["SELECTED", "REJECTED", "NEXT_ROUND", "ON_HOLD"].includes(iv.status);

            return (
              <Card key={iv.id} className="border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-mono">
                      {iv.stage}
                    </Badge>
                    <Badge
                      className={
                        iv.status === "SELECTED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : iv.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {iv.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">{iv.title}</CardTitle>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{iv.jobDrive?.company?.name || "Corporate Hiring Partner"}</span>
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(iv.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {isStudent
                          ? `Interviewer: ${iv.recruiter?.firstName} ${iv.recruiter?.lastName}`
                          : `Candidate: ${iv.student?.user?.firstName} ${iv.student?.user?.lastName}`}
                      </span>
                    </div>
                  </div>

                  {!isStudent && iv.student?.placementProfile?.resumeUrl && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-medium">Candidate Résumé:</span>
                      <a
                        href={iv.student.placementProfile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        View CV <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {iv.feedback && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                      <span className="font-bold text-slate-700 block">Recruiter Evaluation:</span>
                      <p className="text-slate-600 line-clamp-2">"{iv.feedback}"</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    {!isStudent && !isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedInterviewForDecision(iv)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        Submit Hiring Decision
                      </Button>
                    )}
                    {isStudent && !isCompleted && (
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        onClick={() => alert(`Interview Room Code: ${iv.roomCode}. Your recruiter will admit you into the private room.`)}
                      >
                        Join Recruiter Interview Room
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Decision Modal */}
      {selectedInterviewForDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Submit Selection Decision</h3>
                <p className="text-xs text-slate-500">
                  {selectedInterviewForDecision.student?.user?.firstName} {selectedInterviewForDecision.student?.user?.lastName} • {selectedInterviewForDecision.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterviewForDecision(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitDecisionMutation.mutate({
                  interviewId: selectedInterviewForDecision.id,
                  selectionDecision: decision,
                  feedback,
                  privateNotes,
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Decision Outcome *</label>
                <select
                  value={decision}
                  onChange={(e: any) => setDecision(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  required
                >
                  <option value="SELECTED">✅ SELECT CANDIDATE (Generate Offer)</option>
                  <option value="NEXT_ROUND">🔄 ADVANCE TO NEXT ROUND</option>
                  <option value="ON_HOLD">⏳ PLACE ON HOLD / WAITLIST</option>
                  <option value="REJECTED">❌ REJECT FOR THIS ROLE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback for Candidate</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="Constructive feedback shared with candidate and placement officer..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Private Internal Notes (Confidential)</label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  rows={2}
                  placeholder="Salary expectations, team fit, or private recruiter observations..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSelectedInterviewForDecision(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitDecisionMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {submitDecisionMutation.isPending ? "Submitting..." : "Confirm Decision"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
