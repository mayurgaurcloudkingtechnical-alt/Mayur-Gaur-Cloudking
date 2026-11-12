"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStage } from "@prisma/client";
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Download,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Loader2,
  Printer,
  IndianRupee,
  MailCheck,
  User,
  CheckCircle2,
  ShieldCheck,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DirectAdmissionDialog } from "./direct-admission-dialog";
import { EditApplicationDialog } from "./edit-application-dialog";
import { ResendWelcomePostcardDialog } from "./resend-welcome-postcard-dialog";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { formatPaiseToRupees } from "@/lib/utils";

interface ApplicationsListViewProps {
  basePath?: string;
}

export function ApplicationsListView({ basePath = "/counselor/admissions" }: ApplicationsListViewProps) {
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [stage, setStage] = useState<ApplicationStage | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);
  const [postcardAppId, setPostcardAppId] = useState<string | null>(null);
  const [reviewingApp, setReviewingApp] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [customDiscountRupees, setCustomDiscountRupees] = useState<number | "">("");
  const [customDownPaymentRupees, setCustomDownPaymentRupees] = useState<number | "">("");
  const [isEditingTerms, setIsEditingTerms] = useState<boolean>(false);

  const { data: authUser } = api.auth.me.useQuery();
  const isHigherAuthority =
    authUser?.roleCode === "SUPER_ADMIN" ||
    authUser?.roleCode === "DIRECTOR" ||
    authUser?.roleCode === "ADMIN";

  const utils = api.useUtils();

  const handleOpenReceipt = async (applicationId: string) => {
    try {
      setLoadingReceiptId(applicationId);
      const res = await utils.crm.getAdmissionReceipt.fetch({ applicationId });
      if (res) {
        setViewingReceipt({
          receiptNumber: res.receiptNumber,
          receiptDate: res.receiptDate,
          studentName: res.student.name,
          studentId: res.student.studentId || "SG-STUDENT",
          admissionNumber: res.admission?.applicationNumber || "N/A",
          courseTitle: res.course.title,
          totalFee: res.financials.totalCourseFeePaise,
          discountAmount: res.financials.discountPaise,
          netPayable: res.financials.netPayablePaise,
          amountPaid: res.financials.amountPaidPaise,
          pendingAmount:
            res.financials.pendingAmountPaise !== undefined
              ? res.financials.pendingAmountPaise
              : Math.max(0, res.financials.netPayablePaise - (res.financials.totalPaidSoFarPaise ?? res.financials.amountPaidPaise)),
          previousCollections: res.financials.previousCollectionsPaise,
          totalPaidSoFar: res.financials.totalPaidSoFarPaise,
          amountInWords: res.financials.amountInWords,
          paymentMode: res.payment.paymentMethod,
          transactionReference: res.payment.transactionReference,
          globalCertificationFee: res.financials.globalCertFeePaise || 0,
          slgKitFee: res.financials.slgKitFeePaise || 0,
          taxableAmount: res.financials.taxableBasePaise || 0,
          cgstAmount: res.financials.cgstPaise || 0,
          sgstAmount: res.financials.sgstPaise || 0,
          totalGstAmount: res.financials.totalGstPaise || 0,
          sacCode: res.financials.sacCode || "999293",
        });
      }
    } catch (err: any) {
      alert("Failed to load fee receipt: " + (err.message || "Unknown error"));
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const { data, isLoading, error } = api.crm.listApplications.useQuery({
    stage: stage === "ALL" ? undefined : stage,
    search: search.trim() || undefined,
    page,
    limit: 15,
  });

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const archiveMutation = api.crm.archiveApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const restoreMutation = api.crm.restoreApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const deleteMutation = api.crm.deleteApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const broadcastMutation = api.crm.broadcastToExistingAdmittedStudents.useMutation({
    onSuccess: (res) => {
      alert(`Broadcast Complete!\nProcessed: ${res.processed} admitted students\nSent successfully: ${res.successful}\nFailed/Skipped: ${res.failed}\n\nOfficial confirmation & credentials dispatched to students (Email & WhatsApp), and BCC copy archived to softlabglobal9@gmail.com.`);
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => {
      alert(`Broadcast failed: ${err.message}`);
    },
  });

  const approveMutation = api.crm.approveAdmissionWithDiscount.useMutation({
    onSuccess: (res) => {
      alert(
        `🎉 Admission Successfully Approved & Converted!\n\n` +
        `• Student ID: ${res.studentId}\n` +
        `• Admission Number: ${res.admissionNumber}\n` +
        `• Official Fee Receipt & ID Card Generated\n\n` +
        `LMS credentials, fee receipt, and official confirmation have been dispatched via Email & WhatsApp to the student.`
      );
      setReviewingApp(null);
      setApprovalNotes("");
      setIsRejecting(false);
      utils.crm.listApplications.invalidate();
      utils.crm.getStats.invalidate();
      utils.admin.listStudents.invalidate();
    },
    onError: (err) => {
      alert(`Approval failed: ${err.message}`);
    },
  });

  const rejectMutation = api.crm.rejectAdmissionDiscount.useMutation({
    onSuccess: () => {
      alert("Application discount request has been rejected.");
      setReviewingApp(null);
      setRejectionReason("");
      setIsRejecting(false);
      utils.crm.listApplications.invalidate();
      utils.crm.getStats.invalidate();
    },
    onError: (err) => {
      alert(`Rejection failed: ${err.message}`);
    },
  });

  const handleBroadcastToExisting = () => {
    const confirmed = window.confirm(
      "Dispatch Admission Confirmation, Course Details, and Student LMS Login Credentials to all existing admitted students in the database?\n\n" +
      "• Official confirmation and credentials will be sent to each student's Email & WhatsApp.\n" +
      "• Management copy will be automatically BCC'd to softlabglobal9@gmail.com.\n\n" +
      "Click OK to proceed."
    );
    if (confirmed) {
      broadcastMutation.mutate();
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await utils.crm.exportApplications.fetch({
        stage: stage === "ALL" ? undefined : stage,
      });
      if (res && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.fileName || "admissions-export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      alert("Failed to export: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by APP number, candidate name, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={broadcastMutation.isPending}
                onClick={handleBroadcastToExisting}
                className="border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 h-8"
                title="Send admission confirmation and LMS login credentials to all already admitted students (BCC: softlabglobal9@gmail.com)"
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                ) : (
                  <MailCheck className="h-3.5 w-3.5 text-indigo-600" />
                )}
                <span>{broadcastMutation.isPending ? "Sending Credentials..." : "Notify All Admitted"}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isExporting}
                onClick={handleExportCsv}
                className="border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 h-8"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span>Export CSV</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setAdmissionOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs h-8"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Admission Application</span>
              </Button>
            </div>
          </div>

          {/* Stage Filters */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => {
                setStage("ALL");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stage === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Applications
            </button>
            {Object.values(ApplicationStage).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStage(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  stage === st
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Admission Applications</span>
            {pagination && (
              <span className="text-xs font-normal text-slate-400">({pagination.total} total)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading applications...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-600">{error.message}</div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No admission applications found matching the selected stage filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Application #</th>
                    <th className="py-2.5 px-3 font-semibold">Applicant</th>
                    <th className="py-2.5 px-3 font-semibold">Target Program</th>
                    <th className="py-2.5 px-3 font-semibold">Total Fee</th>
                    <th className="py-2.5 px-3 font-semibold">Stage</th>
                    <th className="py-2.5 px-3 font-semibold">Ref / Counselor</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-400">{app.applicantEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-900">{app.course.title}</span>
                          {((app.course as any)?.providerType === "UNIVERSITY" || (app as any).providerType === "UNIVERSITY") && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              DPGU
                            </span>
                          )}
                        </div>
                        {app.batch && (
                          <div className="text-[11px] text-slate-400">{app.batch.code}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {(() => {
                          const enrolledFee = (app as any).convertedStudentProfile?.feeStructures?.[0];
                          let pendingDecision: any = null;
                          try {
                            if (app.decisionReason && app.decisionReason.trim().startsWith("{")) {
                              pendingDecision = JSON.parse(app.decisionReason);
                            }
                          } catch (e) {}

                          const totalFeePaise =
                            enrolledFee?.netPayableAmount ||
                            enrolledFee?.totalCourseFee ||
                            pendingDecision?.finalFee ||
                            pendingDecision?.netPayableAmountPaise ||
                            (app.course as any)?.baseFee ||
                            0;

                          const paidFeePaise =
                            enrolledFee?.paidAmount ||
                            ((app as any).payments?.[0]?.amount ?? 0) ||
                            pendingDecision?.paidAmount ||
                            pendingDecision?.downPaymentPaise ||
                            0;

                          const discountPaise =
                            enrolledFee?.discountAmount ||
                            pendingDecision?.discountAmount ||
                            pendingDecision?.discountPaise ||
                            0;

                          return (
                            <>
                              <div className="font-bold text-slate-900">
                                {totalFeePaise > 0 ? formatPaiseToRupees(totalFeePaise) : "—"}
                              </div>
                              {discountPaise > 0 && (
                                <div className="text-[10px] text-emerald-700 font-semibold">
                                  Disc: -{formatPaiseToRupees(discountPaise)}
                                </div>
                              )}
                              <div className="text-[10px] text-blue-700 font-semibold">
                                Paid: {formatPaiseToRupees(paidFeePaise)}
                              </div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="secondary"
                          className={
                            app.stage === ApplicationStage.APPROVED
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : app.stage === ApplicationStage.CONVERTED
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : app.stage === ApplicationStage.REJECTED
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {app.stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-700 text-[11px]">
                        {app.counselor ? (
                          <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                            <User className="h-3 w-3 text-amber-600" />
                            {app.counselor.firstName} {app.counselor.lastName}
                          </span>
                        ) : (() => {
                          let cName = "";
                          try {
                            if (app.decisionReason?.startsWith("{")) {
                              const d = JSON.parse(app.decisionReason);
                              cName = d.submittedByCounselorName || "";
                            }
                          } catch (e) {}
                          return cName ? (
                            <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                              <User className="h-3 w-3 text-amber-600" />
                              {cName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Direct Desk</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.stage === ApplicationStage.UNDER_REVIEW && isHigherAuthority && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setReviewingApp(app);
                                setIsRejecting(false);
                                setApprovalNotes("");
                                setRejectionReason("");
                                setIsEditingTerms(false);
                                let dData: any = null;
                                try {
                                  if (app.decisionReason?.startsWith("{")) {
                                    dData = JSON.parse(app.decisionReason);
                                  }
                                } catch (e) {}
                                const dTerms = dData?.commercialTerms || dData || {};
                                setCustomDiscountRupees(dTerms.discountAmount ? Math.floor(dTerms.discountAmount / 100) : "");
                                setCustomDownPaymentRupees(dTerms.paidAmount ? Math.floor(dTerms.paidAmount / 100) : "");
                              }}
                              className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 font-semibold shadow-xs"
                              title="Review & Approve Special Discount Admission"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Review & Approve</span>
                            </Button>
                          )}
                          {app.stage === ApplicationStage.UNDER_REVIEW && !isHigherAuthority && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-medium">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              Pending Approval
                            </Badge>
                          )}
                          {((app as any).payments?.length > 0 || app.stage === ApplicationStage.CONVERTED) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={loadingReceiptId === app.id}
                              onClick={() => handleOpenReceipt(app.id)}
                              className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-medium"
                              title="Print Fee Receipt"
                            >
                              {loadingReceiptId === app.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Printer className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                              <span>Receipt</span>
                            </Button>
                          )}
                          {app.stage === ApplicationStage.CONVERTED && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setPostcardAppId(app.id)}
                                className="h-7 px-2 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 font-medium"
                                title="Send / Resend Welcome Postcard & Login Credentials"
                              >
                                <MailCheck className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Postcard</span>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1 font-medium">
                                <Link href={`/counselor/fees?search=${encodeURIComponent(app.applicantName || "")}`}>
                                  <IndianRupee className="h-3 w-3 text-blue-600" />
                                  <span>Collect EMI</span>
                                </Link>
                              </Button>
                            </>
                          )}
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs border-slate-300">
                            <Link href={`${basePath}/${app.id}`}>Review</Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingApp(app)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                            title="Edit Application"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {app.stage === ApplicationStage.REJECTED ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Restore application ${app.applicationNumber} back to Under Review?`)) {
                                  restoreMutation.mutate({ applicationId: app.id });
                                }
                              }}
                              disabled={restoreMutation.isPending}
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-800"
                              title="Restore Application"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : app.stage !== ApplicationStage.CONVERTED ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = prompt("Enter reason for archiving application:");
                                if (reason !== null) {
                                  archiveMutation.mutate({ applicationId: app.id, reason });
                                }
                              }}
                              disabled={archiveMutation.isPending}
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-800"
                              title="Archive Application"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  `Permanently delete application ${app.applicationNumber}? This cannot be undone.`
                                )
                              ) {
                                deleteMutation.mutate({ applicationId: app.id });
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            title="Delete Application"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DirectAdmissionDialog
        open={admissionOpen}
        onOpenChange={setAdmissionOpen}
      />

      <EditApplicationDialog
        open={!!editingApp}
        onOpenChange={(open) => !open && setEditingApp(null)}
        application={editingApp}
      />

      <ResendWelcomePostcardDialog
        open={!!postcardAppId}
        onOpenChange={(open) => !open && setPostcardAppId(null)}
        applicationId={postcardAppId || undefined}
      />

      {/* Higher Authority Discount Review & Sanction Dialog */}
      {reviewingApp && (
        <Dialog open={!!reviewingApp} onOpenChange={(open) => !open && setReviewingApp(null)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200">
              <DialogHeader>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        Review & Sanction Admission Discount
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        Application <span className="font-mono font-bold text-slate-800">{reviewingApp.applicationNumber}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => setReviewingApp(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </DialogHeader>

              {(() => {
                let decisionData: any = null;
                try {
                  if (reviewingApp.decisionReason?.startsWith("{")) {
                    decisionData = JSON.parse(reviewingApp.decisionReason);
                  }
                } catch (e) {}

                const terms = decisionData?.commercialTerms || decisionData || {};
                const courseFee =
                  Number(terms.totalCourseFee) ||
                  Number(terms.totalCourseFeePaise) ||
                  reviewingApp.course?.baseFee ||
                  0;
                const discountAmt =
                  Number(terms.discountAmount) ||
                  Number(terms.discountPaise) ||
                  0;
                const discountPct =
                  terms.discountPercent !== undefined
                    ? terms.discountPercent
                    : terms.discountPercentage !== undefined
                    ? terms.discountPercentage
                    : terms.discountValue !== undefined
                    ? terms.discountValue
                    : courseFee > 0
                    ? Math.round((discountAmt / courseFee) * 100)
                    : 0;
                const additionalCharges =
                  (Number(terms.globalCertificationFee) || 0) +
                  (Number(terms.slgKitFee) || 0);
                const gstAmt = Number(terms.gstAmount) || 0;
                const netFee =
                  Number(terms.finalFee) ||
                  Number(terms.netPayableAmountPaise) ||
                  Math.max(0, courseFee - discountAmt + additionalCharges + gstAmt);
                const downPayment =
                  Number(terms.paidAmount) ||
                  Number(terms.downPaymentPaise) ||
                  0;
                const remainingOutstanding = Math.max(0, netFee - downPayment);
                const installments = Array.isArray(terms.installments) ? terms.installments : [];
                const discountReasonText = terms.discountReason || terms.notes || "";
                const paymentPlanText = terms.paymentPlan || (installments.length > 1 ? "EMI" : "LUMPSUM");
                const counselorName =
                  terms.submittedByCounselorName ||
                  (reviewingApp.counselor
                    ? `${reviewingApp.counselor.firstName} ${reviewingApp.counselor.lastName}`
                    : "Direct Desk");

                const activeDiscountPaise =
                  typeof customDiscountRupees === "number" && customDiscountRupees >= 0
                    ? customDiscountRupees * 100
                    : discountAmt;
                const activeDownPaymentPaise =
                  typeof customDownPaymentRupees === "number" && customDownPaymentRupees >= 0
                    ? customDownPaymentRupees * 100
                    : downPayment;
                const activeNetFee = Math.max(0, courseFee - activeDiscountPaise + additionalCharges + gstAmt);
                const activeRemaining = Math.max(0, activeNetFee - activeDownPaymentPaise);
                const activeDiscountPct = courseFee > 0 ? Math.round((activeDiscountPaise / courseFee) * 100) : 0;

                return (
                  <div className="space-y-4">
                    {/* Candidate & Counselor attribution */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Candidate</span>
                        <span className="font-semibold text-slate-900 block">{reviewingApp.applicantName}</span>
                        <span className="text-[11px] text-slate-500 block">{reviewingApp.applicantEmail}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">{reviewingApp.applicantPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Ref / Counselor</span>
                        <span className="font-semibold text-amber-900 inline-flex items-center gap-1 mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <User className="h-3 w-3 text-amber-700" />
                          {counselorName}
                        </span>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mt-2">Target Program</span>
                        <span className="font-medium text-slate-800 block truncate">{reviewingApp.course?.title}</span>
                      </div>
                    </div>

                    {/* Commercial Terms Breakdown (Exact Counselor Input) */}
                    <div className="bg-amber-50/70 rounded-lg p-3.5 border border-amber-200 space-y-2.5 text-xs">
                      <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between border-b border-amber-200 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <IndianRupee className="h-3.5 w-3.5 text-amber-700" />
                          <span>Exact Commercial Pricing (Counselor Entry)</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800 font-semibold">
                            {paymentPlanText === "EMI" ? `Flexible EMI (${installments.length} Slots)` : "Lumpsum Plan"}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setIsEditingTerms(!isEditingTerms)}
                            className="text-[10px] text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer"
                          >
                            {isEditingTerms ? "Hide Adjustment" : "✏️ Adjust Sanction"}
                          </button>
                        </div>
                      </div>

                      {/* Optional Higher Authority Override / Adjustment Panel */}
                      {isEditingTerms && (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-300 space-y-2">
                          <span className="text-[10px] font-bold text-amber-900 block uppercase">
                            Higher Authority Commercial Override / Sanction
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-slate-600 block mb-0.5">Approved Discount (₹)</Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder={`e.g. ${Math.floor(discountAmt / 100)}`}
                                value={customDiscountRupees}
                                onChange={(e) => setCustomDiscountRupees(e.target.value === "" ? "" : Number(e.target.value))}
                                className="h-7 text-xs font-mono font-bold"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-slate-600 block mb-0.5">Approved Down Payment (₹)</Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder={`e.g. ${Math.floor(downPayment / 100)}`}
                                value={customDownPaymentRupees}
                                onChange={(e) => setCustomDownPaymentRupees(e.target.value === "" ? "" : Number(e.target.value))}
                                className="h-7 text-xs font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="bg-white/80 p-2 rounded border border-amber-100">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Course Fee</span>
                          <span className="font-bold text-slate-800 text-sm">{formatPaiseToRupees(courseFee)}</span>
                        </div>
                        <div className="bg-emerald-50/80 p-2 rounded border border-emerald-200">
                          <span className="text-emerald-800 text-[10px] uppercase font-bold block">Approved Discount</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            -{formatPaiseToRupees(activeDiscountPaise)} ({activeDiscountPct}% Off)
                          </span>
                        </div>
                        <div className="bg-emerald-100/60 p-2 rounded border border-emerald-300">
                          <span className="text-emerald-900 text-[10px] uppercase font-bold block">Final Payable Net Fee</span>
                          <span className="font-extrabold text-emerald-900 text-sm">{formatPaiseToRupees(activeNetFee)}</span>
                        </div>
                      </div>

                      {additionalCharges > 0 && (
                        <div className="text-[11px] text-slate-600 flex justify-between bg-white/60 px-2.5 py-1 rounded border border-slate-200">
                          <span>Additional Charges (Global Cert / Kit):</span>
                          <span className="font-semibold text-slate-800">+{formatPaiseToRupees(additionalCharges)}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-amber-200">
                        <div className="space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Down Payment Received Today</span>
                          <span className="font-bold text-emerald-800 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            {formatPaiseToRupees(activeDownPaymentPaise)}
                          </span>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Remaining Outstanding Balance</span>
                          <span className="font-bold text-amber-900 text-sm bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 inline-block">
                            {formatPaiseToRupees(activeRemaining)}
                          </span>
                        </div>
                      </div>

                      {discountReasonText && (
                        <div className="pt-1.5 text-[11px] text-amber-950 bg-amber-100/70 p-2 rounded border border-amber-200">
                          <span className="font-bold text-amber-900">Counselor Justification: </span>
                          <span className="italic">"{discountReasonText}"</span>
                        </div>
                      )}
                    </div>

                    {/* Installments schedule if any */}
                    {installments.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          Agreed Installment Schedule ({installments.length} Slots)
                        </span>
                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs max-h-36 overflow-y-auto">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="py-1 px-2.5 font-semibold">Slot #</th>
                                <th className="py-1 px-2.5 font-semibold">Due Date</th>
                                <th className="py-1 px-2.5 font-semibold text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {installments.map((inst: any) => (
                                <tr key={inst.installmentNumber}>
                                  <td className="py-1 px-2.5 font-mono text-slate-600">Installment {inst.installmentNumber}</td>
                                  <td className="py-1 px-2.5 text-slate-700">
                                    {new Date(inst.dueDate).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="py-1 px-2.5 text-right font-bold text-slate-900">
                                    {formatPaiseToRupees(inst.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Notice of automatic dispatch */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 space-y-0.5">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>Upon Approval — Instant Automatic Dispatch:</span>
                      </span>
                      <p className="text-blue-700">
                        Student LMS account will be activated, official fee receipt & collision-proof ID card generated, and login credentials + receipt will be dispatched via <strong>Email & WhatsApp</strong> to the student.
                      </p>
                    </div>

                    {/* Approval Notes or Rejection Reason */}
                    {!isRejecting ? (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Director / Admin Approval Note (Optional)
                        </Label>
                        <Input
                          placeholder="e.g. Sanctioned as special merit discount by Director"
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        <Label className="text-[11px] font-bold text-red-800">
                          Rejection Reason (Required)
                        </Label>
                        <Input
                          placeholder="e.g. Discount percentage too high, counter-offer at 10%"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="h-8 text-xs border-red-300 focus:border-red-500"
                        />
                      </div>
                    )}

                    <DialogFooter className="pt-3 border-t flex items-center justify-between gap-2">
                      {!isRejecting ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRejecting(true)}
                            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Reject Request
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setReviewingApp(null)}
                              className="text-xs h-8"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                approveMutation.mutate({
                                  applicationId: reviewingApp.id,
                                  approvalNotes: approvalNotes.trim() || undefined,
                                  approvedDiscountAmount: activeDiscountPaise,
                                  approvedDownPayment: activeDownPaymentPaise,
                                });
                              }}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                            >
                              {approveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              <span>Approve Admission ({formatPaiseToRupees(activeNetFee)}) & Dispatch</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsRejecting(false)}
                            className="text-xs h-8"
                          >
                            Back to Review
                          </Button>
                          <Button
                            type="button"
                            disabled={rejectMutation.isPending || rejectionReason.trim().length < 3}
                            onClick={() => {
                              rejectMutation.mutate({
                                applicationId: reviewingApp.id,
                                rejectionReason: rejectionReason.trim(),
                              });
                            }}
                            className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                          >
                            {rejectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>Confirm Rejection</span>
                          </Button>
                        </>
                      )}
                    </DialogFooter>
                  </div>
                );
              })()}
            </div>
          </div>
        </Dialog>
      )}

      {/* Dual Fee Receipt Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <DualFeeReceipt
            data={viewingReceipt}
            onClose={() => setViewingReceipt(null)}
          />
        </div>
      )}
    </div>
  );
}
