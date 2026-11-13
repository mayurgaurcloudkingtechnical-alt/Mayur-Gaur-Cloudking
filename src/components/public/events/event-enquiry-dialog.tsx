"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc/react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Sparkles,
  MessageSquare,
} from "lucide-react";

interface EventEnquiryDialogProps {
  event: {
    id: string;
    title: string;
    programType: string;
    fee: number;
    duration: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventEnquiryDialog({
  event,
  open,
  onOpenChange,
}: EventEnquiryDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [qualification, setQualification] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const enquiryMutation = api.events.submitEventEnquiry.useMutation();

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      setErrorMessage("Please fill all required fields (Name, Phone, Email).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await enquiryMutation.mutateAsync({
        eventId: event.id,
        fullName,
        email,
        phone,
        city,
        qualification,
        notes,
        honeypot,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-semibold">
              Counseling & Enquiry
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Enquire about {event.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Have questions about syllabus, batch timings, or fee plans? Talk directly with our Senior Academic Counselors.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 space-y-5 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Enquiry Received!</h3>
              <p className="text-xs text-slate-300">
                Thank you, <strong className="text-white">{fullName}</strong>! An Academic Counselor will call or WhatsApp you at <strong className="text-emerald-400">{phone}</strong> within 15–30 minutes during working hours.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Spam Honeypot */}
            <div className="hidden">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="enq-name" className="text-xs text-slate-300 font-medium">
                  Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="enq-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="enq-phone" className="text-xs text-slate-300 font-medium">
                  WhatsApp / Phone <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="enq-phone"
                  type="tel"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="enq-email" className="text-xs text-slate-300 font-medium">
                  Email Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="enq-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="enq-city" className="text-xs text-slate-300 font-medium">
                  City
                </Label>
                <Input
                  id="enq-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="enq-qual" className="text-xs text-slate-300 font-medium">
                Current Qualification / Degree
              </Label>
              <Input
                id="enq-qual"
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. BCA 2nd Year / B.Tech / Working Professional"
                className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="enq-notes" className="text-xs text-slate-300 font-medium">
                What questions do you have?
              </Label>
              <Input
                id="enq-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Batch timings, scholarship, placement guidance, etc."
                className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs shadow-lg shadow-emerald-950/60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Submitting Enquiry...</span>
                </>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5" />
                  Request Free Callback & Syllabus PDF
                </span>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}