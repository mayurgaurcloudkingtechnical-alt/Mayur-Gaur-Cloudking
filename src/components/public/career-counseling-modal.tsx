"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitEnquiryAction, EnquiryState } from "@/app/actions/enquiry";
import { SITE_CONFIG } from "@/lib/constants/site";
import {
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Phone,
  MessageCircle,
  Calendar,
  Loader2,
  HelpCircle,
  Clock,
  MapPin,
} from "lucide-react";

interface CareerCounselingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultCourse?: string;
}

const COURSES_LIST = [
  "Technical Support Engineer",
  "C++ Programming Complete Course (Basic To Advanced)",
  "MySQL Advanced Course (Beginner To Expert)",
  "Digital Marketing Master Class",
  "Java Full Stack Developer",
  "Python Full Stack Developer",
  "Full Web Development",
  "Graphics Designing Master Level",
  "Cyber Security Complete Course",
  "Oracle Database Administration (DBA) with Oracle Cloud Integration",
  "Data Science Master Level",
  "MERN Full Stack Developer",
  "Master in Artificial Intelligence and Machine Learning",
  "Certificate in Cloud Computing and Cyber Security With AI",
  "Certificate in Cloud Computing With DevOps",
  "Certificate in Advance Networking",
  "Master in Cloud Administration",
  "Master in Linux Administration",
  "Master in Server Administration",
  "Certificate in Office 365 Admin",
  "Certificate in C Language",
];

const UNIVERSITY_PROGRAMS_LIST = [
  "Polytechnic Diploma",
  "B.Tech (Bachelor of Technology)",
  "M.Tech (Master of Technology)",
  "B.Pharma (Bachelor of Pharmacy)",
  "D.Pharma (Diploma in Pharmacy)",
  "BBA (Bachelor of Business Administration)",
  "MBA (Master of Business Administration)",
  "B.Com (Honours)",
  "B.Com (Computer Application)",
  "M.Com (Master of Commerce)",
  "B.Sc (Bachelor of Science)",
  "M.Sc (Master of Science)",
  "DCA (Diploma in Computer Applications)",
  "BCA (Bachelor of Computer Applications)",
  "PGDCA (Post Graduate Diploma in Computer Applications)",
  "MCA (Master of Computer Applications)",
  "M.A (Master of Arts)",
  "B.A (Bachelor of Arts)",
  "B.Ed (Bachelor of Education)",
  "M.A in Education",
  "LLB (Bachelor of Legislative Law)",
  "BA-LLB (Integrated Bachelor of Law)",
  "LLM (Master of Laws)",
  "Ph.D — Technical (Doctor of Philosophy)",
  "Ph.D — Non-Technical (Doctor of Philosophy)",
];

const STORAGE_KEY = "softlab_counseling_dismissed_until";

export function CareerCounselingModal({
  isOpen: controlledOpen,
  onClose,
  defaultCourse,
}: CareerCounselingModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [state, setState] = React.useState<EnquiryState>({ success: false });
  const [isPending, setIsPending] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState(
    defaultCourse || "AI & Machine Learning Complete Masterclass"
  );
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const dismissPopup = React.useCallback((days = 7) => {
    try {
      const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, expiry.toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      dismissPopup(30);
    } else {
      dismissPopup(3);
    }

    if (onClose) onClose();
    else setInternalOpen(false);

    setTimeout(() => setState({ success: false }), 400);
  };

  // Configured automatic popup behavior:
  // Opens automatically after 10 seconds on the public website if not dismissed.
  React.useEffect(() => {
    if (controlledOpen !== undefined) return;
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Ignore storage error
    }

    const timer = setTimeout(() => {
      setInternalOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [controlledOpen]);

  // Listen for global window trigger events
  React.useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ course?: string }>;
      if (customEvent.detail?.course) {
        setSelectedCourse(customEvent.detail.course);
      }
      setInternalOpen(true);
    };

    const eventNames = ["open-counseling-modal", "open-career-modal", "open-enquiry-popup"];
    eventNames.forEach((name) => window.addEventListener(name, handleOpenEvent));
    return () => {
      eventNames.forEach((name) => window.removeEventListener(name, handleOpenEvent));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("source", "WEBSITE_CAREER_POPUP");

    try {
      const res = await submitEnquiryAction(state, formData);
      setState(res);
      if (res.success) {
        dismissPopup(30);
      }
    } catch (err: any) {
      setState({
        success: false,
        message: err?.message || "Failed to submit counseling request. Please call our campus directly.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const whatsappDeskUrl = `https://wa.me/${SITE_CONFIG.contact.phoneTel.replace(/\+/g, "")}?text=${encodeURIComponent(
    `Hello SoftLab Global! I am interested in career counseling for ${selectedCourse}. Please guide me on syllabus, admission, and placement support.`
  )}`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <div className="max-h-[85vh] overflow-y-auto pr-1">
        {state.success ? (
          <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-center text-slate-900">
                Counseling Session Booked!
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 max-w-sm mx-auto">
                {state.message ||
                  "Thank you! Our Senior Academic Counselor will call you shortly to discuss your syllabus, fee structure, and batch schedule."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5 text-left">
              <div className="font-bold flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Direct Admissions Desk — Civil Lines Campus:</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-800">{SITE_CONFIG.contact.phone}</p>
              <p className="text-[11px] text-emerald-700">
                Patrika Chauraha, Tashkent Marg, Civil Lines, Prayagraj
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1 border-slate-300 text-xs">
                <a href={whatsappDeskUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] mr-1.5" />
                  Chat on WhatsApp
                </a>
              </Button>

              <Button
                onClick={handleClose}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Close & Return
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <DialogHeader className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 w-fit mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>SOFTLAB GLOBAL • Career Advisory Cell</span>
              </div>

              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Confused About Your IT Career?
              </DialogTitle>

              <DialogDescription className="text-xs sm:text-sm font-medium text-emerald-700">
                Get a FREE Career Counselling Session with SOFTLAB GLOBAL.
              </DialogDescription>
            </DialogHeader>

            {state.message && !state.success && (
              <div className="p-2.5 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {state.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs mt-3">
              <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="hidden" name="source" value="WEBSITE_CAREER_POPUP" />

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Srishti Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50/50"
                />
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Qualification & Interested Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Current Qualification
                  </label>
                  <select
                    name="qualification"
                    defaultValue="B.Tech / BCA / MCA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="B.Tech / BE / BCA / MCA">B.Tech / BE / BCA / MCA</option>
                    <option value="B.Sc / M.Sc / Science">B.Sc / M.Sc / Science</option>
                    <option value="B.Com / BBA / Non-Technical">B.Com / BBA / Non-Technical</option>
                    <option value="Working IT / Non-IT Professional">Working IT / Non-IT Professional</option>
                    <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                    <option value="12th / School Student">12th / School Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Interested Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="interestedCourseId"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-medium"
                  >
                    {selectedCourse &&
                      !COURSES_LIST.includes(selectedCourse) &&
                      !UNIVERSITY_PROGRAMS_LIST.includes(selectedCourse) &&
                      !UNIVERSITY_PROGRAMS_LIST.some((p) => selectedCourse.includes(p)) && (
                        <option value={selectedCourse}>{selectedCourse}</option>
                      )}

                    <optgroup label="Dr. Preeti Global University Programs">
                      {UNIVERSITY_PROGRAMS_LIST.map((prog) => (
                        <option key={prog} value={`Dr. Preeti Global University - ${prog}`}>
                          {prog} (DPGU)
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="SoftLab Global IT & Engineering Courses">
                      {COURSES_LIST.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <option value="Other / General Career Counseling">Other / Need Career Guidance</option>
                  </select>
                </div>
              </div>

              {/* Preferred Mode & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Preferred Mode
                  </label>
                  <select
                    name="trainingMode"
                    defaultValue="Classroom (Prayagraj Campus)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="Classroom (Prayagraj Campus)">Classroom (Prayagraj Campus)</option>
                    <option value="Live Interactive Online">Live Interactive Online</option>
                    <option value="Hybrid (Classroom + Online)">Hybrid (Classroom + Online)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue="Prayagraj"
                    placeholder="Your City"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Message / Career Goals (Optional)
                </label>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="e.g. Final year student wanting 100% placement support in AI/ML or Web Dev..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs resize-none bg-slate-50/50"
                />
              </div>

              {/* Primary Action Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 text-xs shadow-lg shadow-emerald-900/20 rounded-xl"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking Your Session...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Get Free Counselling</span>
                  </div>
                )}
              </Button>

              {/* Instant Secondary Buttons: WhatsApp & Call Now */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold h-10 rounded-xl"
                >
                  <a href={whatsappDeskUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[#128C7E]">
                    <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                </Button>

                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold h-10 rounded-xl"
                >
                  <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Now</span>
                  </a>
                </Button>
              </div>

              {/* Cooldown checkbox / Don't show again */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Don&apos;t show this popup again</span>
                </label>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// Global helper to open the modal from any button on the site
export function openCareerCounselingModal(course?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-counseling-modal", { detail: { course } }));
  }
}
