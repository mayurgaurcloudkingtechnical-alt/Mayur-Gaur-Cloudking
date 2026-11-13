"use client";

import * as React from "react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import {
  AlertCircle,
  Clock,
  MessageSquare,
  Mail,
  Search,
  CheckCircle2,
  Loader2,
  ExternalLink,
  CreditCard,
  Edit,
  Copy,
  Check,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface OverdueInstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectPayment?: (feeStructureId: string, studentName: string, amountPaise: number) => void;
  onEditFee?: (feeStructureId: string) => void;
}

export function OverdueInstallmentsDialog({
  open,
  onOpenChange,
  onCollectPayment,
  onEditFee,
}: OverdueInstallmentsDialogProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, { email?: boolean; wa?: boolean; timestamp?: string }>>({});
  const [activeInstallmentForNote, setActiveInstallmentForNote] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");

  const utils = api.useUtils();
  const { data: overdueList = [], isLoading, refetch } = api.finance.listOverdueInstallments.useQuery(undefined, {
    enabled: open,
  });

  const sendNoticeMutation = api.finance.sendOverdueReminderNotice.useMutation({
    onSuccess: (data, variables) => {
      setDispatchStatus((prev) => ({
        ...prev,
        [variables.installmentId]: {
          email: data.emailSent,
          wa: data.whatsappSent,
          timestamp: new Date().toLocaleTimeString("en-IN"),
        },
      }));
      utils.finance.getOverviewMetrics.invalidate();
    },
    onError: (err) => {
      alert(err.message || "Failed to dispatch overdue notice.");
    },
  });

  const filteredList = overdueList.filter((item) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      item.studentName.toLowerCase().includes(query) ||
      item.studentId.toLowerCase().includes(query) ||
      item.courseTitle.toLowerCase().includes(query) ||
      item.studentPhone.toLowerCase().includes(query) ||
      item.studentEmail.toLowerCase().includes(query)
    );
  });

  const totalOverduePaise = overdueList.reduce((acc, curr) => acc + curr.overdueAmount, 0);

  const handleCopyNotice = (item: (typeof overdueList)[0]) => {
    const formattedAmount = formatPaiseToRupees(item.overdueAmount);
    const formattedDueDate = formatDate(item.dueDate);
    const text = `🚨 *URGENT FEE OVERDUE NOTICE — SOFTLAB GLOBAL*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nDear *${item.studentName}* (${item.studentId}),\n\nYour tuition installment *#${item.installmentNumber}* for *${item.courseTitle}* was due on *${formattedDueDate}* and is currently *OVERDUE* (${item.daysOverdue} days).\n\n💰 *Overdue Amount:* *${formattedAmount}*\n\n💳 *Pay Online Immediately:* https://lms.softlabglobal.com/pay\n\n⚠️ *Mandatory Policy:* Late fee penalty charges will be assessed on your account if not cleared immediately.\n\nHelpline: +91 99363 43015 / accounts@softlabglobal.com`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = (item: (typeof overdueList)[0]) => {
    const formattedAmount = formatPaiseToRupees(item.overdueAmount);
    const formattedDueDate = formatDate(item.dueDate);
    const cleanPhone = item.studentPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const text = `🚨 *URGENT FEE OVERDUE NOTICE — SOFTLAB GLOBAL*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nDear *${item.studentName}* (${item.studentId}),\n\nYour tuition installment *#${item.installmentNumber}* for *${item.courseTitle}* was due on *${formattedDueDate}* and is currently *OVERDUE* (${item.daysOverdue} days).\n\n💰 *Overdue Amount Due:* *${formattedAmount}*\n\n💳 *Pay Instantly Online:* https://lms.softlabglobal.com/pay\n\n⚠️ *IMPORTANT NOTICE:* As per institutional guidelines, recurring *late fee penalty charges* will be applicable if not cleared immediately. Continued non-payment may restrict LMS access and live classes.\n\nSoftLab Global Directorate of Accounts\nHelpline: +91 99363 43015`;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

    // Also trigger automated backend WhatsApp log
    sendNoticeMutation.mutate({
      installmentId: item.id,
      channel: "WHATSAPP",
    });
  };

  const handleSendEmail = (item: (typeof overdueList)[0]) => {
    sendNoticeMutation.mutate({
      installmentId: item.id,
      channel: "EMAIL",
      customNote: activeInstallmentForNote === item.id && customNote.trim() ? customNote.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-white">
                  Overdue Tuition Fees & Defaulters Desk
                </DialogTitle>
                <Badge className="bg-rose-600 text-white hover:bg-rose-600 text-[10px] px-2 py-0.5 uppercase tracking-wide">
                  Action Required
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-300">
                Inspect candidate overdue installments, dispatch 1-click legal WhatsApp & Email notices with late fee penalty alerts, and collect payments.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Telemetry Strip & Search Filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-md bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Overdue Dues</span>
                <strong className="text-lg font-bold text-rose-700">{formatPaiseToRupees(totalOverduePaise)}</strong>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Overdue Installments</span>
                <strong className="text-lg font-bold text-slate-800">{overdueList.length} Accounts</strong>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-amber-200 bg-amber-50/50 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-100 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-[11px] text-amber-900 leading-snug">
                <strong>Mandatory Policy:</strong> Late fee charges will be assessed on students exceeding grace period.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search student name, student ID, course, or contact phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs text-slate-600"
            >
              Refresh Dues
            </Button>
          </div>
        </div>

        {/* Overdue Accounts List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:#94a3b8_#f1f5f9]">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
              <span>Scanning institutional fee ledgers for overdue installments...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <strong className="text-sm text-slate-800">No Overdue Fee Defaulters Found</strong>
              <p className="text-slate-500">All student installments are currently settled or within scheduled grace dates.</p>
            </div>
          ) : (
            filteredList.map((item) => {
              const status = dispatchStatus[item.id];
              const isSending = sendNoticeMutation.isPending && (sendNoticeMutation.variables as any)?.installmentId === item.id;
              const hasCleanPhone = Boolean(item.studentPhone && item.studentPhone.replace(/\D/g, "").length >= 10);

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-rose-200/80 rounded-xl p-4 shadow-sm hover:border-rose-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm shrink-0 border border-rose-200">
                        {item.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.studentName}</h4>
                          <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-700">
                            {item.studentId}
                          </Badge>
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold">
                            Installment #{item.installmentNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Program: <strong className="text-slate-800">{item.courseTitle}</strong> • {item.batchName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Overdue Amount</span>
                        <span className="text-xl font-black text-rose-700 block">
                          {formatPaiseToRupees(item.overdueAmount)}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                        <span className="text-[10px] uppercase font-bold text-rose-600 block">Status</span>
                        <span className="text-xs font-black text-rose-800">
                          {item.daysOverdue > 0 ? `${item.daysOverdue} Days Overdue` : "Due Today"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info & Due Date Coordinates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scheduled Due Date</span>
                      <strong className="text-rose-700 font-mono">{formatDate(item.dueDate)}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Phone / WhatsApp</span>
                      <strong className="text-slate-800 font-mono">{item.studentPhone || "No Phone Recorded"}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Email Address</span>
                      <strong className="text-slate-800 font-mono truncate block" title={item.studentEmail}>
                        {item.studentEmail || "No Email"}
                      </strong>
                    </div>
                  </div>

                  {/* Dispatch Feedback / Audit Badge */}
                  {status && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Overdue notice dispatched successfully ({status.timestamp})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        {status.email && <span className="text-emerald-700">• Email Delivered</span>}
                        {status.wa && <span className="text-emerald-700">• WhatsApp Active</span>}
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Command Center */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp 1-Click Action */}
                      <Button
                        size="sm"
                        onClick={() => handleSendWhatsApp(item)}
                        disabled={!hasCleanPhone || isSending}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                        title="Send urgent overdue notice with late fee penalty alert via WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Send WhatsApp Notice</span>
                      </Button>

                      {/* Email 1-Click Action */}
                      <Button
                        size="sm"
                        onClick={() => handleSendEmail(item)}
                        disabled={!item.studentEmail || isSending}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs"
                        title="Dispatch formal branded overdue email notice with late fee warning and BCC to management"
                      >
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                        <span>Send Email Notice</span>
                      </Button>

                      {/* Copy WhatsApp / SMS text */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyNotice(item)}
                        className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 gap-1"
                        title="Copy overdue reminder message text to clipboard"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span>Copy Notice</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Collect Payment Action */}
                      {onCollectPayment && (
                        <Button
                          size="sm"
                          onClick={() => onCollectPayment(item.feeStructureId, item.studentName, item.overdueAmount)}
                          className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5 shadow-xs"
                          title="Record offline payment or issue receipt for this overdue installment"
                        >
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Collect Payment</span>
                        </Button>
                      )}

                      {/* Edit / Reschedule Action */}
                      {onEditFee && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditFee(item.feeStructureId)}
                          className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-medium gap-1"
                          title="Adjust installment due date, amount or remarks"
                        >
                          <Edit className="h-3 w-3 text-slate-500" />
                          <span>Reschedule</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Overdue reminder dispatches are audit-logged and BCC'd to management.</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Close Desk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
