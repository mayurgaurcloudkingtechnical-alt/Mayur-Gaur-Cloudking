"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

interface PublicCourseItem {
  id: string;
  title: string;
  slug: string;
}

interface PublicEnquiryFormProps {
  preselectedCourseId?: string;
  preselectedCourseSlug?: string;
  className?: string;
}

export function PublicEnquiryForm({
  preselectedCourseId,
  preselectedCourseSlug,
  className,
}: PublicEnquiryFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [courseId, setCourseId] = useState(preselectedCourseId || "");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: rawCourses, isLoading: isLoadingCourses } = api.crm.listPublicCourses.useQuery();
  const courses = React.useMemo(() => (rawCourses || []) as PublicCourseItem[], [rawCourses]);

  // If preselectedCourseSlug is provided and courses are loaded, match by slug
  React.useEffect(() => {
    if (preselectedCourseSlug && courses.length > 0 && !courseId) {
      const match = courses.find((c: PublicCourseItem) => c.slug === preselectedCourseSlug);
      if (match) {
        setCourseId(match.id);
      }
    }
  }, [preselectedCourseSlug, courses, courseId]);

  const submitMutation = api.crm.submitEnquiry.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setErrorMessage(null);
      setFullName("");
      setEmail("");
      setPhone("");
      setCity("");
      setNotes("");
      setHoneypot("");
    },
    onError: (err: { message?: string }) => {
      setErrorMessage(err.message || "Unable to submit your enquiry. Please try again or call our desk.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage("Please complete your name, email, and 10-digit phone number.");
      return;
    }

    submitMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim() || undefined,
      interestedCourseId: courseId || undefined,
      notes: notes.trim() || undefined,
      honeypot: honeypot.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <Card className={`border-emerald-200 bg-emerald-50/50 ${className || ""}`}>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Enquiry Received Successfully!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for reaching out to SOFTLAB GLOBAL. An academic counselor will review your inquiry and contact you via phone or email shortly.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
          >
            Submit Another Enquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-200 bg-white shadow-sm ${className || ""}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Request Academic Consultation
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Leave your details and our senior counselor will call you to discuss syllabus, batch timings, workstation prerequisites, and eligibility.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Anti-spam honeypot (hidden from normal users) */}
          <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
            <label htmlFor="website_url">Leave this empty</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="enquiry-fullName" className="text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="enquiry-fullName"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitMutation.isPending}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enquiry-email" className="text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="enquiry-email"
                type="email"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitMutation.isPending}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="enquiry-phone" className="text-xs font-semibold text-slate-700">
                Contact Mobile <span className="text-red-500">*</span>
              </Label>
              <Input
                id="enquiry-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={submitMutation.isPending}
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-slate-400">10-digit Indian mobile number</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enquiry-city" className="text-xs font-semibold text-slate-700">
                Current City / Location
              </Label>
              <Input
                id="enquiry-city"
                type="text"
                placeholder="e.g. Prayagraj, Varanasi, Lucknow"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={submitMutation.isPending}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enquiry-course" className="text-xs font-semibold text-slate-700">
              Course of Interest
            </Label>
            <select
              id="enquiry-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={submitMutation.isPending || isLoadingCourses}
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Select a program (or General Inquiry) --</option>
              {courses.map((c: PublicCourseItem) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enquiry-notes" className="text-xs font-semibold text-slate-700">
              Questions or Notes
            </Label>
            <textarea
              id="enquiry-notes"
              rows={3}
              placeholder="Tell us about your background or questions regarding batch schedules, prerequisites, fees..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitMutation.isPending}
              className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Enquiry...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Enquiry to Admissions</span>
                </>
              )}
            </Button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Protected by rate limiting. We respect your privacy and do not share contact details.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
