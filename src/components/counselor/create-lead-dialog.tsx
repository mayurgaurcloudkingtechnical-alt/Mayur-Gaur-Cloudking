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
import { Loader2, UserPlus, Phone, Mail, MapPin, BookOpen, Clock } from "lucide-react";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leadId: string) => void;
}

export function CreateLeadDialog({ open, onOpenChange, onSuccess }: CreateLeadDialogProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Prayagraj");
  const [qualification, setQualification] = useState("");
  const [interestedCourseId, setInterestedCourseId] = useState("");
  const [source, setSource] = useState<LeadSource>(LeadSource.WALK_IN);
  const [qualityScore, setQualityScore] = useState<string>("HOT");
  const [notes, setNotes] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const { data: counselors = [] } = api.crm.listCounselors.useQuery();

  const createMutation = api.crm.createLead.useMutation({
    onSuccess: (data: any) => {
      setErrorMsg(null);
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      utils.crm.getPipelineOverview.invalidate();
      onOpenChange(false);
      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setNotes("");
      if (onSuccess) onSuccess(data.lead.id);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create lead record.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    createMutation.mutate({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      qualification: qualification.trim() || undefined,
      interestedCourseId: interestedCourseId || undefined,
      source,
      qualityScore,
      notes: notes.trim() || undefined,
      assignedToId: assignedToId || undefined,
      nextFollowUp: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            <span>Add New Prospect / Lead</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Log walk-ins, inbound calls, referrals, or direct queries into the institutional CRM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Candidate Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                <span>Mobile Phone (10 Digits)</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                <span>Email Address</span>
              </Label>
              <Input
                type="email"
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>City / District</span>
              </Label>
              <Input
                placeholder="e.g. Prayagraj"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-slate-400" />
                <span>Target Training Course</span>
              </Label>
              <select
                value={interestedCourseId}
                onChange={(e) => setInterestedCourseId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
              >
                <option value="">-- Select Target Course --</option>
                {courses.map((c: { id: string; title: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Lead Source</Label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 font-medium"
              >
                <option value={LeadSource.WALK_IN}>Walk-in (Campus Visit)</option>
                <option value={LeadSource.JUSTDIAL}>Justdial Local Search</option>
                <option value={LeadSource.META_ADS_FB}>Meta Facebook Ads</option>
                <option value={LeadSource.META_ADS_IG}>Meta Instagram Ads</option>
                <option value={LeadSource.GOOGLE_ADS}>Google Ads Search</option>
                <option value={LeadSource.WHATSAPP}>WhatsApp Direct</option>
                <option value={LeadSource.WEBSITE}>Website Contact Form</option>
                <option value={LeadSource.REFERRAL}>Student Referral</option>
                <option value={LeadSource.CAMPUS_DRIVE}>Campus Drive / Workshop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Lead Quality</Label>
              <select
                value={qualityScore}
                onChange={(e) => setQualityScore(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="HOT">HOT (High Intent)</option>
                <option value="WARM">WARM (Interested)</option>
                <option value="COLD">COLD (General)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Assign To Staff</Label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="">Myself (Default)</option>
                {counselors.map((c: { id: string; firstName: string; lastName: string; roleCode: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.roleCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Next Follow-Up</span>
              </Label>
              <Input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Counseling Notes / Discussion</Label>
            <textarea
              rows={2}
              placeholder="Candidate background, batch timing preference, fee inquiry notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <DialogFooter className="pt-2">
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
                  Adding Lead...
                </>
              ) : (
                "Save & Add to Pipeline"
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
