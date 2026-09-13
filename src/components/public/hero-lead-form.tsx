"use client";

import * as React from "react";
import { submitEnquiryAction, EnquiryState } from "@/app/actions/enquiry";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PhoneCall, Sparkles, Send, Loader2 } from "lucide-react";

interface HeroLeadFormProps {
  courses: Array<{ id: string; title: string }>;
}

export function HeroLeadForm({ courses }: HeroLeadFormProps) {
  const [state, setState] = React.useState<EnquiryState>({ success: false });
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await submitEnquiryAction(state, formData);
      setState(res);
    } catch (err: any) {
      setState({ success: false, message: err?.message || "Failed to submit." });
    } finally {
      setIsPending(false);
    }
  };

  if (state.success) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Inquiry Received!</h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {state.message}
        </p>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="font-semibold flex items-center justify-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
            <span>Need Immediate Assistance?</span>
          </div>
          <p>Direct Counselor Helpline: <strong>+91 9194085890</strong></p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState({ success: false })}
          className="text-xs text-slate-600"
        >
          Submit Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
      {/* Top Banner */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 h-1.5" />

      <div className="space-y-1 mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Quick Admission & Counseling</span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">
          Book Free Career Counseling
        </h3>
        <p className="text-xs text-slate-500">
          Get customized syllabus, placement report & 1-on-1 counselor guidance.
        </p>
      </div>

      {state.message && !state.success && (
        <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {state.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Honeypot for spam bot prevention */}
        <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="e.g. Mayur Gaur"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
          />
        </div>

        {/* Phone & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              WhatsApp / Mobile <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="10-digit number"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
            />
          </div>
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Select Interested Program
          </label>
          <select
            name="interestedCourseId"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-white"
          >
            <option value="">-- Choose Course of Interest --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* City & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              City / State
            </label>
            <input
              type="text"
              name="city"
              placeholder="e.g. Prayagraj / Noida"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Preferred Mode
            </label>
            <select
              name="trainingMode"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-white"
            >
              <option value="Classroom (Civil Lines Campus)">Classroom (Prayagraj Campus)</option>
              <option value="Live Interactive Online">Live Interactive Online</option>
              <option value="Weekend Professional Batch">Weekend Professional Batch</option>
            </select>
          </div>
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-md transition-all mt-2"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Details...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <span>Get Free Syllabus & Call Back</span>
            </span>
          )}
        </Button>

        <p className="text-[10px] text-slate-400 text-center leading-tight">
          🔒 100% Privacy. Zero spam. We never share your contact details.
        </p>
      </form>
    </div>
  );
}
