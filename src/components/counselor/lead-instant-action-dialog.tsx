"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  MessageSquare,
  PhoneCall,
  GraduationCap,
  Sparkles,
  ExternalLink,
  UserCheck,
  ArrowRight,
  X,
} from "lucide-react";

export interface LeadActionTarget {
  id?: string;
  fullName: string;
  phone: string;
  courseTitle?: string;
  email?: string;
  city?: string;
  source?: string;
  notes?: string;
  rawLead?: any;
}

interface LeadInstantActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadActionTarget | null;
  counselorProfile?: {
    firstName?: string;
    displayName?: string;
    callingNumber?: string;
    whatsappNumber?: string;
  } | null;
  onProceedToApplication?: (lead: LeadActionTarget) => void;
  onAddAnother?: () => void;
}

export function LeadInstantActionDialog({
  open,
  onOpenChange,
  lead,
  counselorProfile,
  onProceedToApplication,
  onAddAnother,
}: LeadInstantActionDialogProps) {
  if (!lead) return null;

  const rawPhone = lead.phone.replace(/\D/g, "");
  const clean10Phone = rawPhone.slice(-10);
  const waPhone = `91${clean10Phone}`;

  const counselorName = counselorProfile?.displayName || counselorProfile?.firstName || "Counselor";
  const counselorPhone = counselorProfile?.callingNumber || "+91 9196596975";
  const courseName = lead.courseTitle || "our professional tech programs";

  const defaultWhatsappMessage = `Hello ${lead.fullName}! 👋
This is ${counselorName} from SOFTLAB GLOBAL (Civil Lines, Prayagraj).
Thank you for your enquiry regarding ${courseName}.

I am connecting with you directly from our official counseling desk. 
When is a convenient time for a quick 2-minute call to discuss your syllabus, fee structure, and 100% placement support?

Official Campus: SoftLab Global, 4th Floor, No. 31, M.G. Marg, Civil Lines, Prayagraj.
Direct Helpline: ${counselorPhone}`;

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(defaultWhatsappMessage)}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
  };

  const handleProceed = () => {
    onOpenChange(false);
    if (onProceedToApplication) {
      onProceedToApplication(lead);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-2xl border border-emerald-200 shadow-2xl bg-white">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>LEAD SAVED TO CRM</span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-black mt-2 tracking-tight">Instant Lead Outreach & Action</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Connect immediately via WhatsApp or Phone using your assigned official communication line.
          </p>
        </div>

        {/* Lead Profile Summary */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-900">{lead.fullName}</div>
              <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
                📞 +91 {clean10Phone} {lead.email ? `• ✉️ ${lead.email}` : ""}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Course: <strong className="text-slate-800">{courseName}</strong>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-[11px] shrink-0">
              Assigned to You
            </Badge>
          </div>

          {/* Assigned Communication Lines Notice */}
          <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200 text-xs flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-blue-900 block">Your Connected Caller Identity:</span>
              <span className="text-[11px] text-blue-700">
                Staff Line: <strong>{counselorPhone}</strong> • Counselor: <strong>{counselorName}</strong>
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Connected & Active" />
          </div>

          {/* 3 Main Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* 1. WhatsApp Automation Button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>1-Click WhatsApp Automation</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="text-[11px] text-emerald-100">
                    Directly chat with pre-filled greeting & prospectus
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 2. Direct Calling Button */}
            <a
              href={`tel:${clean10Phone}`}
              className="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">1-Click Direct Call</div>
                  <div className="text-[11px] text-blue-100">
                    Dial +91 {clean10Phone} via phone or web dialer
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* 3. Proceed to Admission Application Button */}
            <button
              type="button"
              onClick={handleProceed}
              className="w-full group bg-slate-900 hover:bg-slate-800 text-white rounded-xl p-3.5 flex items-center justify-between border border-slate-700 shadow-sm transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Redirect to Admission Application</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      Fast Track
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Open candidate enrollment & fee ledger pre-filled
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
            {onAddAnother ? (
              <button
                type="button"
                onClick={onAddAnother}
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                + Add Another Lead
              </button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-slate-600 border-slate-300"
            >
              Done / Return to Leads
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
