"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  FileText,
  Printer,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StaffLettersTab() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("OFFER_LETTER");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [renderedLetter, setRenderedLetter] = useState<any>(null);

  const { data: templates, isLoading: loadingTemplates } = api.staffErp.listTemplates.useQuery();
  const { data: staffList } = api.staffErp.listStaff.useQuery();
  const { data: applicants } = api.staffErp.listApplicants.useQuery();

  const generateMutation = api.staffErp.generateLetter.useMutation({
    onSuccess: (data) => {
      setRenderedLetter(data);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      templateKey: selectedTemplateKey,
      staffId: selectedStaffId || undefined,
      applicantId: selectedApplicantId || undefined,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Institutional Letter & Document Generator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal Offer Letters, Appointment Letters, Relieving Letters, and Experience Certificates with automated variable replacement.
          </p>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-500">Letter Parameters</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Document Template *</label>
            <select
              value={selectedTemplateKey}
              onChange={(e) => setSelectedTemplateKey(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              {templates?.map((t) => (
                <option key={t.templateKey} value={t.templateKey}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Active Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                if (e.target.value) setSelectedApplicantId("");
              }}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              <option value="">-- Or Choose Current Staff --</option>
              {staffList?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.employeeId} - {s.user.firstName} {s.user.lastName} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Or Select Job Applicant</label>
            <select
              value={selectedApplicantId}
              onChange={(e) => {
                setSelectedApplicantId(e.target.value);
                if (e.target.value) setSelectedStaffId("");
              }}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              <option value="">-- Choose Candidate --</option>
              {applicants?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.opening.title})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
            onClick={handleGenerate}
            disabled={(!selectedStaffId && !selectedApplicantId) || generateMutation.isPending}
          >
            <FileText className="w-4 h-4" />
            {generateMutation.isPending ? "Generating Document..." : "Generate Official Letter"}
          </Button>
        </div>
      </div>

      {/* Rendered Letter Preview & Print Container */}
      {renderedLetter ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700">Official Document Preview</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(renderedLetter.content);
                  alert("Letter contents copied to clipboard.");
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs flex items-center gap-1.5"
                onClick={handlePrint}
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </Button>
            </div>
          </div>

          {/* Letterhead Paper View */}
          <div className="bg-white p-10 md:p-14 rounded-xl border border-slate-200 shadow-md max-w-4xl mx-auto font-serif print:border-none print:shadow-none print:p-0">
            {/* Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  SOFTLAB GLOBAL
                </h1>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Center for Excellence in Advanced Software & Technology Education
                </p>
                <p className="text-[11px] text-slate-400 font-sans">
                  Patrika Chauraha, Civil Lines, Prayagraj, UP – 211001 • info@softlabglobal.com
                </p>
              </div>
              <div className="text-right font-sans">
                <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                  {renderedLetter.templateKey}
                </Badge>
                <p className="text-[11px] text-slate-500 mt-1">
                  Date: {renderedLetter.variablesUsed.Date}
                </p>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-6 font-sans font-bold text-sm text-slate-900">
              Subject: {renderedLetter.subject}
            </div>

            {/* Letter Body */}
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {renderedLetter.content}
            </div>

            {/* Footer / Signatures */}
            <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans text-xs text-slate-600">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-2"></div>
                <p className="font-semibold text-slate-800">Authorized Signatory</p>
                <p className="text-[11px] text-slate-400">SoftLab Global Institutional Board</p>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-2 ml-auto"></div>
                <p className="font-semibold text-slate-800">
                  {renderedLetter.variablesUsed.EmployeeName}
                </p>
                <p className="text-[11px] text-slate-400">Candidate / Employee Acknowledgment</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No Document Generated</p>
          <p className="text-xs text-slate-400 mt-1">
            Select a document template and an employee or candidate above, then click &quot;Generate Official Letter&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
