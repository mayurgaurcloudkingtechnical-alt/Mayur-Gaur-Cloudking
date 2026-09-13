"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitEnquiryAction, EnquiryState } from "@/app/actions/enquiry";
import { Sparkles, CheckCircle2, PhoneCall, Send, Loader2, Calendar, GraduationCap } from "lucide-react";

interface CareerCounselingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultCourse?: string;
}

export function CareerCounselingModal({ isOpen: controlledOpen, onClose, defaultCourse }: CareerCounselingModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [state, setState] = React.useState<EnquiryState>({ success: false });
  const [isPending, setIsPending] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState(defaultCourse || "AI & Machine Learning Complete Course");

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
    // Reset state after close
    setTimeout(() => setState({ success: false }), 300);
  };

  // Listen for global window events: window.dispatchEvent(new CustomEvent('open-counseling-modal', { detail: { course: '...' } }))
  React.useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ course?: string }>;
      if (customEvent.detail?.course) {
        setSelectedCourse(customEvent.detail.course);
      }
      setInternalOpen(true);
    };

    window.addEventListener("open-counseling-modal", handleOpenEvent);
    return () => window.removeEventListener("open-counseling-modal", handleOpenEvent);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await submitEnquiryAction(state, formData);
      setState(res);
    } catch (err: any) {
      setState({ success: false, message: err?.message || "Failed to submit counseling request." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <div className="p-1">
        {state.success ? (
          <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center text-slate-900">
                Counseling Session Booked!
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 max-w-sm mx-auto">
                {state.message || "Thank you! Our Senior Academic Counselor will call you shortly to discuss your syllabus, fee structure, and batch schedule."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <div className="font-bold flex items-center justify-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Urgent Inquiries & Direct Admission Desk:</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-800">+91 9196596975</p>
              <p className="text-[11px] text-emerald-700">Civil Lines Campus, Prayagraj</p>
            </div>

            <Button
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2 rounded-xl"
            >
              Done & Close
            </Button>
          </div>
        ) : (
          <div>
            <DialogHeader>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Personalized Career Guidance</span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900">
                Book Free 1-on-1 Career Counseling
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Speak directly with industry mentors & senior academic counselors to map out your high-growth tech career.
              </DialogDescription>
            </DialogHeader>

            {state.message && !state.success && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {state.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs mt-3">
              <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Srishti Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 9196596975"
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
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Interested Course / Tech Stack <span className="text-rose-500">*</span>
                </label>
                <select
                  name="courseTitle"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-white"
                >
                  <option value="AI & Machine Learning Complete Course">AI & Machine Learning Complete Course (Master Level)</option>
                  <option value="Full Stack Web Development (MERN / Next.js)">Full Stack Web Development (MERN / Next.js)</option>
                  <option value="Cloud Computing & DevOps (AWS / Docker / K8s)">Cloud Computing & DevOps (AWS / Docker / K8s)</option>
                  <option value="Data Science & Business Analytics">Data Science & Business Analytics</option>
                  <option value="Cyber Security & Ethical Hacking">Cyber Security & Ethical Hacking</option>
                  <option value="Other / General Counseling">Other / Need Guidance</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Preferred Learning Mode
                  </label>
                  <select
                    name="deliveryMode"
                    defaultValue="OFFLINE"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-white"
                  >
                    <option value="OFFLINE">Classroom (Prayagraj Campus)</option>
                    <option value="ONLINE">Live Interactive Online</option>
                    <option value="HYBRID">Hybrid (Weekend / Flexible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Current Qualification
                  </label>
                  <select
                    name="qualification"
                    defaultValue="B.Tech / BCA / MCA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-white"
                  >
                    <option value="B.Tech / BCA / MCA">B.Tech / BCA / MCA</option>
                    <option value="B.Sc / M.Sc / Other Degree">B.Sc / M.Sc / Other Degree</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Diploma / School Student">Diploma / School Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Any Specific Questions or Target Job Roles? (Optional)
                </label>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="e.g. Want to know about placement package, EMI options, down payment of ₹5,000..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs shadow-md shadow-emerald-900/20"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking Your Session...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Confirm Free Counseling Appointment</span>
                  </div>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-400">
                100% Free Counseling • No Hidden Fees • Direct Call from SoftLab Head Counselor (+91 9196596975)
              </p>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// Global helper to open the modal from any client component
export function openCareerCounselingModal(course?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-counseling-modal", { detail: { course } }));
  }
}
