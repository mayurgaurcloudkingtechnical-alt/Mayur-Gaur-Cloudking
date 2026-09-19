"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadSource } from "@prisma/client";
import { Loader2, GraduationCap, User, Phone, Mail, BookOpen, MapPin } from "lucide-react";

interface DirectAdmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (applicationId: string) => void;
}

export function DirectAdmissionDialog({
  open,
  onOpenChange,
  onSuccess,
}: DirectAdmissionDialogProps) {
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [highestQualification, setHighestQualification] = useState("B.Tech / Graduate");
  const [city, setCity] = useState("Prayagraj");
  const [state, setState] = useState("Uttar Pradesh");
  const [source, setSource] = useState<LeadSource>(LeadSource.WALK_IN);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const { data: batchesData } = api.batch.list.useQuery(
    { courseId: courseId || undefined, pageSize: 50 },
    { enabled: !!courseId }
  );
  const batches = batchesData?.batches || [];

  const { data: leadsData } = api.crm.listLeads.useQuery({ limit: 50 });
  const leads = leadsData?.leads || [];

  const selectedCourse = courses.find((c: any) => c.id === courseId);
  const courseFeeInr = selectedCourse?.baseFee ? selectedCourse.baseFee / 100 : 0;
  const discountAmountInr =
    discountType === "PERCENTAGE"
      ? Math.round((courseFeeInr * (discountValue || 0)) / 100)
      : Math.min(courseFeeInr, discountValue || 0);
  const finalFeeInr = Math.max(0, courseFeeInr - discountAmountInr);
  const pendingAmountInr = Math.max(0, finalFeeInr - (paidAmount || 0));

  const createMutation = api.crm.createDirectAdmission.useMutation({
    onSuccess: (app) => {
      setErrorMsg(null);
      utils.crm.listApplications.invalidate();
      utils.crm.getStats.invalidate();
      utils.crm.listLeads.invalidate();
      onOpenChange(false);
      // Reset
      setApplicantName("");
      setApplicantEmail("");
      setApplicantPhone("");
      setSelectedLeadId("");
      setBatchId("");
      setDiscountValue(0);
      setPaidAmount(0);
      setRemarks("");
      if (onSuccess) onSuccess(app.id);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to generate admission application.");
    },
  });

  // When a lead is selected from the existing list, auto-fill fields
  const handleLeadSelect = (id: string) => {
    setSelectedLeadId(id);
    if (!id) return;
    const targetLead = leads.find((l: any) => l.id === id);
    if (targetLead) {
      setApplicantName(targetLead.fullName);
      setApplicantEmail(targetLead.email);
      setApplicantPhone(targetLead.phone);
      if (targetLead.city) setCity(targetLead.city);
      if (targetLead.interestedCourseId) setCourseId(targetLead.interestedCourseId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setErrorMsg("Please select the target training program.");
      return;
    }

    const cleanPhone = applicantPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please provide a valid 10-digit mobile number.");
      return;
    }

    createMutation.mutate({
      courseId,
      batchId: batchId || undefined,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: cleanPhone,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      highestQualification: highestQualification.trim() || undefined,
      leadId: selectedLeadId || undefined,
      source,
      discountType: discountValue > 0 ? discountType : undefined,
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountAmount: discountAmountInr > 0 ? discountAmountInr * 100 : undefined,
      finalFee: finalFeeInr * 100,
      paidAmount: paidAmount > 0 ? paidAmount * 100 : undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <span>New Student Admission Application</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Generate formal student application for walk-in learners or convert an active CRM lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Quick Select from Active CRM Leads */}
          {leads.length > 0 && (
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <Label className="text-[11px] font-semibold text-slate-700">
                Optional: Link to Existing Prospect Lead
              </Label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadSelect(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="">-- Create New / Walk-In Applicant Directly --</option>
                {leads.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.phone} • {l.city || "Direct"}) — {l.course?.title || "General"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-slate-400" />
                <span>Target Program / Course</span>
                <span className="text-red-500">*</span>
              </Label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setBatchId("");
                }}
                required
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
              >
                <option value="">-- Choose Program --</option>
                {courses.map((c: { id: string; title: string; baseFee?: number }) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.baseFee ? `(₹${(c.baseFee / 100).toLocaleString("en-IN")})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-slate-400" />
                <span>Assigned Cohort / Batch (Optional)</span>
              </Label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                disabled={!courseId}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">-- Unassigned / To Be Allocated --</option>
                {batches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.name}) - {b.deliveryMode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                <span>Applicant Full Name</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Candidate name as per 10th marksheet"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                <span>Applicant Email</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                <span>Contact Mobile</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>City</span>
              </Label>
              <Input
                placeholder="Prayagraj"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Source</Label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value={LeadSource.WALK_IN}>Walk-in Campus</option>
                <option value={LeadSource.JUSTDIAL}>Justdial Inquiry</option>
                <option value={LeadSource.META_ADS_FB}>Meta Ads</option>
                <option value={LeadSource.GOOGLE_ADS}>Google Ads</option>
                <option value={LeadSource.WHATSAPP}>WhatsApp Direct</option>
                <option value={LeadSource.REFERRAL}>Student Referral</option>
              </select>
            </div>
          </div>

          {/* Institutional Fee & Discount Calculator */}
          {courseId && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Institutional Fee & Concession Structure
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  Standard Fee: ₹{courseFeeInr.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Discount Type</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Discount Value {discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={discountType === "PERCENTAGE" ? 100 : courseFeeInr}
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Initial Paid Amount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={finalFeeInr}
                    value={paidAmount || ""}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Discount Approval Authority / Reason Note
                </Label>
                <Input
                  placeholder="e.g. Director approved 10% merit scholarship / Early bird walk-in"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              {/* Mandatory Fee Ledger Preview */}
              <div className="grid grid-cols-5 gap-2 rounded-lg bg-white p-2.5 border border-emerald-200/80 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Course Fee</div>
                  <div className="text-xs font-bold text-slate-800">₹{courseFeeInr.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Discount</div>
                  <div className="text-xs font-bold text-amber-600">-₹{discountAmountInr.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Final Fee</div>
                  <div className="text-xs font-bold text-emerald-700">₹{finalFeeInr.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Paid</div>
                  <div className="text-xs font-bold text-blue-700">₹{paidAmount.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Pending</div>
                  <div className="text-xs font-bold text-rose-600">₹{pendingAmountInr.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating Application...
                </>
              ) : (
                "Submit Admission Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
