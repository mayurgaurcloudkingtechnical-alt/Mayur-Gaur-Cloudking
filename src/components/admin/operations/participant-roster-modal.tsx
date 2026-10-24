"use client";

import React from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Clock, CheckCircle2, AlertTriangle, XCircle, Edit3 } from "lucide-react";

interface ParticipantRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
  onEditAttendance?: (attendanceId: string, studentName: string, currentStatus: string, currentDuration: number) => void;
}

export function ParticipantRosterModal({
  isOpen,
  onClose,
  classId,
  onEditAttendance,
}: ParticipantRosterModalProps) {
  const { data, isLoading } = api.management.getClassParticipantsRoster.useQuery(
    { classId: classId! },
    { enabled: !!classId && isOpen }
  );

  if (!classId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Class Participants & Attendance Audit
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  {data?.title} • Batch {data?.batchCode} ({data?.batchName})
                </DialogDescription>
              </div>
            </div>
            {data && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  Enrolled: {data.totalEnrolled}
                </Badge>
                <Badge variant="outline" className="border-emerald-700 bg-emerald-950/40 text-emerald-400">
                  Attended: {data.totalAttended}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading live participant records...</div>
          ) : !data?.roster.length ? (
            <div className="py-12 text-center text-slate-500">No enrolled students found in this batch.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-800/80 sticky top-0">
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Student</TableHead>
                  <TableHead className="text-slate-300">First Join / Last Left</TableHead>
                  <TableHead className="text-slate-300">Duration</TableHead>
                  <TableHead className="text-slate-300">Percentage</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-right text-slate-300">Audit Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.roster.map((p) => {
                  const minutes = Math.floor(p.totalDurationSeconds / 60);
                  const seconds = p.totalDurationSeconds % 60;

                  return (
                    <TableRow key={p.studentId} className="border-slate-800 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">
                          {p.studentCode} • {p.phone || p.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {p.hasJoined ? (
                          <>
                            <div>In: {new Date(p.firstJoinedAt!).toLocaleTimeString("en-IN")}</div>
                            <div className="text-slate-400">
                              Out: {p.lastLeftAt ? new Date(p.lastLeftAt).toLocaleTimeString("en-IN") : "Active"}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500">Never Joined</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.hasJoined ? (
                          <span className="font-mono text-slate-200">
                            {minutes}m {seconds}s
                          </span>
                        ) : (
                          <span className="text-slate-500">0s</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-200">{p.attendancePercentage}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {p.status === "PRESENT" && (
                            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">
                              PRESENT
                            </Badge>
                          )}
                          {(p.status === "LATE" || (p.status as any) === "PARTIAL") && (
                            <Badge className="bg-amber-950 text-amber-400 border border-amber-800">
                              {p.status}
                            </Badge>
                          )}
                          {p.status === "ABSENT" && (
                            <Badge className="bg-rose-950 text-rose-400 border border-rose-800">
                              ABSENT
                            </Badge>
                          )}
                          {p.isManuallyCorrected && (
                            <span className="text-[10px] text-amber-400/90 font-mono" title={p.correctionReason || ""}>
                              * Corrected by Admin
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.hasJoined && onEditAttendance && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onEditAttendance(
                                p.studentId, // Or we pass target
                                p.name,
                                p.status,
                                p.totalDurationSeconds
                              )
                            }
                            className="h-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Correct
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
