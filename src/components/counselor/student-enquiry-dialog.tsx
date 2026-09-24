"use client";

import * as React from "react";
import { useState, useRef } from "react";
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
import {
  Loader2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  Printer,
  ArrowRight,
  CheckCircle2,
  Save,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export interface StudentEnquiryData {
  // Enquiry Details
  enquiryNo: string;
  enquiryDate: string;
  counselorName: string;
  leadSource: string;

  // 1. Personal Details
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  aadharNumber: string;

  // 2. Contact Details
  mobileNumber: string;
  alternateMobileNumber: string;
  emailId: string;
  city: string;
  state: string;
  pinCode: string;
  currentAddress: string;

  // 3. Educational Qualification
  qualifications: {
    tenth: { board: string; year: string; score: string };
    twelfth: { board: string; year: string; score: string };
    diploma: { board: string; year: string; score: string };
    graduation: { degree: string; board: string; year: string; score: string };
    postGraduation: { degree: string; board: string; year: string; score: string };
  };

  // 4. Professional Details
  currentStatus: string;
  companyName: string;
  currentDesignation: string;
  experience: string;

  // 5. Course Interested In
  selectedCourses: string[];
  otherCourse: string;

  // 6. Training Preferences
  preferredBatch: string;
  trainingMode: string;

  // 7. Career Goal
  careerReason: string;
  expectedJobRole: string;
  expectedSalary: string;

  // 8. Previous Skills
  languagesKnown: string;
  toolsKnown: string;
  certifications: string;

  // 9. How Did You Hear
  heardFrom: string[];
  otherHeardFrom: string;

  // 10. Counselling Notes (Office Use Only)
  studentRequirement: string;
  recommendedCourse: string;
  recommendedCourseId?: string;
  courseDuration: string;
  courseFees: string;
  discountOffered: string;
  registrationAmount: string;
  emiOption: string;
  counselorRemarks: string;
  followUpDate: string;
  admissionStatus: string;
  notInterestedReason: string;
}

const ALL_COURSES = [
  "Full Stack Java Development",
  "Python Programming",
  "Data Science",
  "Data Analytics",
  "Artificial Intelligence & Machine Learning",
  "C Programming",
  "C++ Programming",
  "Oracle DBA with Cloud",
  "SQL & PL/SQL",
  "Web Development",
  "Front-End Development",
  "Back-End Development",
  "PHP Development",
  ".NET Development",
  "JavaScript",
  "React JS",
  "Node JS",
  "Cyber Security",
  "Ethical Hacking",
  "Networking",
  "Linux Administration",
  "Cloud Computing (AWS)",
  "Microsoft Azure",
  "Google Cloud Platform (GCP)",
  "DevOps",
  "Docker & Kubernetes",
  "Microsoft Office",
  "Advanced Excel",
  "Power BI",
  "Graphic Designing",
  "Digital Marketing",
  "Technical Support Engineer",
];

const HEARD_SOURCES = [
  "Google Search",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "WhatsApp",
  "Friend/Relative",
  "Student Reference",
  "College",
  "Seminar",
  "Advertisement",
];

interface StudentEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToAdmission?: (enquiryData: StudentEnquiryData, createdLeadId?: string) => void;
  onSuccess?: (leadId: string) => void;
}

export function StudentEnquiryDialog({
  open,
  onOpenChange,
  onProceedToAdmission,
  onSuccess,
}: StudentEnquiryDialogProps) {
  const { data: authUser } = api.auth.me.useQuery();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const utils = api.useUtils();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"enquiry" | "personal" | "academic" | "courses" | "counselling">("enquiry");
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<StudentEnquiryData>({
    enquiryNo: `ENQ-${Date.now().toString().slice(-6)}`,
    enquiryDate: new Date().toISOString().split("T")[0],
    counselorName: authUser ? `${authUser.firstName} ${authUser.lastName}` : "Counsellor",
    leadSource: "Walk-in",

    fullName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "Male",
    maritalStatus: "Single",
    nationality: "Indian",
    aadharNumber: "",

    mobileNumber: "",
    alternateMobileNumber: "",
    emailId: "",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    pinCode: "211001",
    currentAddress: "",

    qualifications: {
      tenth: { board: "", year: "", score: "" },
      twelfth: { board: "", year: "", score: "" },
      diploma: { board: "", year: "", score: "" },
      graduation: { degree: "", board: "", year: "", score: "" },
      postGraduation: { degree: "", board: "", year: "", score: "" },
    },

    currentStatus: "Student",
    companyName: "",
    currentDesignation: "",
    experience: "",

    selectedCourses: [],
    otherCourse: "",

    preferredBatch: "Morning",
    trainingMode: "Classroom",

    careerReason: "",
    expectedJobRole: "",
    expectedSalary: "",

    languagesKnown: "",
    toolsKnown: "",
    certifications: "",

    heardFrom: [],
    otherHeardFrom: "",

    studentRequirement: "",
    recommendedCourse: "",
    recommendedCourseId: "",
    courseDuration: "6 Months",
    courseFees: "",
    discountOffered: "0",
    registrationAmount: "1000",
    emiOption: "Yes",
    counselorRemarks: "",
    followUpDate: "",
    admissionStatus: "Interested",
    notInterestedReason: "",
  });

  // Sync counselor name when authUser loads
  React.useEffect(() => {
    if (authUser && (!formData.counselorName || formData.counselorName === "Counsellor")) {
      setFormData((prev) => ({
        ...prev,
        counselorName: `${authUser.firstName} ${authUser.lastName}`,
      }));
    }
  }, [authUser]);

  const handleCourseToggle = (course: string) => {
    setFormData((prev) => {
      const exists = prev.selectedCourses.includes(course);
      const updated = exists
        ? prev.selectedCourses.filter((c) => c !== course)
        : [...prev.selectedCourses, course];
      return {
        ...prev,
        selectedCourses: updated,
        recommendedCourse: prev.recommendedCourse || (!exists ? course : ""),
      };
    });
  };

  const handleHeardToggle = (source: string) => {
    setFormData((prev) => {
      const exists = prev.heardFrom.includes(source);
      return {
        ...prev,
        heardFrom: exists
          ? prev.heardFrom.filter((s) => s !== source)
          : [...prev.heardFrom, source],
      };
    });
  };

  const createLeadMutation = api.crm.createLead.useMutation();

  const mapLeadSource = (src: string): LeadSource => {
    const s = src.toUpperCase().replace(/\s+/g, "_");
    if (s.includes("WALK")) return LeadSource.WALK_IN;
    if (s.includes("WEB")) return LeadSource.WEBSITE;
    if (s.includes("GOOGLE")) return LeadSource.GOOGLE_SEARCH;
    if (s.includes("FACEBOOK") || s.includes("INSTA") || s.includes("SOCIAL")) return LeadSource.SOCIAL_MEDIA;
    if (s.includes("WHATSAPP")) return LeadSource.WHATSAPP;
    if (s.includes("REFER")) return LeadSource.REFERRAL;
    if (s.includes("SEMINAR") || s.includes("CAMPUS") || s.includes("DRIVE")) return LeadSource.CAMPUS_DRIVE;
    return LeadSource.OTHER;
  };

  const saveAsLead = async (): Promise<string | null> => {
    const cleanPhone = formData.mobileNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number for the student.");
      setActiveTab("personal");
      return null;
    }
    if (!formData.fullName.trim()) {
      setErrorMsg("Candidate full name is required.");
      setActiveTab("personal");
      return null;
    }

    try {
      const selectedCourseObj = courses.find(
        (c: any) =>
          c.title.toLowerCase() === formData.recommendedCourse.toLowerCase() ||
          formData.selectedCourses.some((sc) => c.title.toLowerCase().includes(sc.toLowerCase()))
      );

      const comprehensiveNotes = [
        `[OFFICIAL SOFTLAB STUDENT ENQUIRY - ${formData.enquiryNo}]`,
        `Enquiry Date: ${formData.enquiryDate} | Counselor: ${formData.counselorName}`,
        `Father: ${formData.fatherName || "N/A"} | Mother: ${formData.motherName || "N/A"} | DOB: ${formData.dateOfBirth || "N/A"} | Gender: ${formData.gender}`,
        `Address: ${formData.currentAddress || "N/A"}, ${formData.city}, ${formData.state} - ${formData.pinCode}`,
        `Alternate Phone: ${formData.alternateMobileNumber || "N/A"} | Aadhaar: ${formData.aadharNumber || "N/A"}`,
        `Status: ${formData.currentStatus} | Company: ${formData.companyName || "N/A"} | Role: ${formData.currentDesignation || "N/A"} | Exp: ${formData.experience || "N/A"}`,
        `Selected Courses: ${formData.selectedCourses.join(", ") || formData.otherCourse || "General Inquiry"}`,
        `Training Preference: ${formData.preferredBatch} (${formData.trainingMode})`,
        `Career Goal: ${formData.careerReason || "N/A"} | Target Role: ${formData.expectedJobRole || "N/A"} | Exp Salary: ${formData.expectedSalary || "N/A"}`,
        `Skills: Langs: ${formData.languagesKnown || "N/A"} | Tools: ${formData.toolsKnown || "N/A"} | Certs: ${formData.certifications || "N/A"}`,
        `Sources: ${formData.heardFrom.join(", ")} ${formData.otherHeardFrom ? `(${formData.otherHeardFrom})` : ""}`,
        `Office Notes: Quoted Fee ₹${formData.courseFees || "0"}, Discount ₹${formData.discountOffered || "0"}, Reg Amount ₹${formData.registrationAmount || "0"}, EMI: ${formData.emiOption}`,
        `Admission Status: ${formData.admissionStatus} | Remarks: ${formData.counselorRemarks || "N/A"}`,
      ].join("\n");

      const res = await createLeadMutation.mutateAsync({
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        email: formData.emailId.trim() || undefined,
        city: formData.city.trim() || "Prayagraj",
        qualification:
          formData.qualifications.graduation.degree ||
          formData.qualifications.diploma.board ||
          formData.qualifications.twelfth.board ||
          "Graduate",
        interestedCourseId: selectedCourseObj?.id || undefined,
        source: mapLeadSource(formData.leadSource),
        qualityScore: formData.admissionStatus === "Interested" || formData.admissionStatus === "Registered" ? "HOT" : "WARM",
        notes: comprehensiveNotes,
        nextFollowUp: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
      });

      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      return res.lead.id;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save enquiry as lead.");
      return null;
    }
  };

  const handleSaveOnly = async () => {
    setErrorMsg(null);
    const leadId = await saveAsLead();
    if (leadId) {
      alert(`Student Enquiry logged successfully! Saved as CRM Lead.`);
      onOpenChange(false);
      if (onSuccess) onSuccess(leadId);
    }
  };

  const handleProceedToAdmission = async () => {
    setErrorMsg(null);
    const leadId = await saveAsLead();
    if (leadId && onProceedToAdmission) {
      onOpenChange(false);
      onProceedToAdmission(formData, leadId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3 max-h-[92vh] overflow-y-auto p-1 font-sans">
        {/* Header */}
        <DialogHeader className="border-b border-slate-200 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>SoftLab Global - Student Enquiry Form</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Official candidate walk-in & admission enquiry form (Printable & CRM Synced).
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintPreview(!isPrintPreview)}
                className="text-xs h-8 border-slate-300"
              >
                {isPrintPreview ? "Back to Edit" : "Print View (A4)"}
              </Button>
              {isPrintPreview && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* PRINT PREVIEW MODE */}
        {isPrintPreview ? (
          <div ref={printAreaRef} className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm text-slate-800 text-xs space-y-4 print:p-0 print:border-none">
            {/* Header Document */}
            <div className="text-center border-b pb-3 space-y-1">
              <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase">SOFTLAB GLOBAL</h1>
              <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">STUDENT ENQUIRY FORM</h2>
            </div>

            {/* Admission Enquiry Details */}
            <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50 flex flex-wrap justify-between gap-3 text-xs">
              <div><span className="font-semibold text-slate-600">Enquiry No.:</span> <span className="font-bold">{formData.enquiryNo}</span></div>
              <div><span className="font-semibold text-slate-600">Enquiry Date:</span> <span className="font-bold">{formData.enquiryDate}</span></div>
              <div><span className="font-semibold text-slate-600">Counsellor Name:</span> <span className="font-bold">{formData.counselorName}</span></div>
              <div><span className="font-semibold text-slate-600">Lead Source:</span> <span className="font-bold">{formData.leadSource}</span></div>
            </div>

            {/* 1. Personal Details */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">1. Personal Details</h3>
              <div className="grid grid-cols-3 gap-2 px-1">
                <div><span className="text-slate-500">Full Name:</span> <span className="font-semibold">{formData.fullName || "________________"}</span></div>
                <div><span className="text-slate-500">Father's Name:</span> <span className="font-semibold">{formData.fatherName || "________________"}</span></div>
                <div><span className="text-slate-500">Mother's Name:</span> <span className="font-semibold">{formData.motherName || "________________"}</span></div>
                <div><span className="text-slate-500">Date of Birth:</span> <span className="font-semibold">{formData.dateOfBirth || "____/____/________"}</span></div>
                <div><span className="text-slate-500">Gender:</span> <span className="font-semibold">{formData.gender}</span></div>
                <div><span className="text-slate-500">Marital Status:</span> <span className="font-semibold">{formData.maritalStatus}</span></div>
                <div><span className="text-slate-500">Nationality:</span> <span className="font-semibold">{formData.nationality}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Aadhaar (Optional):</span> <span className="font-semibold">{formData.aadharNumber || "________________"}</span></div>
              </div>
            </div>

            {/* 2. Contact Details */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">2. Contact Details</h3>
              <div className="grid grid-cols-3 gap-2 px-1">
                <div><span className="text-slate-500">Mobile No.:</span> <span className="font-semibold">{formData.mobileNumber || "________________"}</span></div>
                <div><span className="text-slate-500">Alternate Mobile:</span> <span className="font-semibold">{formData.alternateMobileNumber || "________________"}</span></div>
                <div><span className="text-slate-500">Email ID:</span> <span className="font-semibold">{formData.emailId || "________________"}</span></div>
                <div><span className="text-slate-500">City:</span> <span className="font-semibold">{formData.city}</span></div>
                <div><span className="text-slate-500">State:</span> <span className="font-semibold">{formData.state}</span></div>
                <div><span className="text-slate-500">Pin Code:</span> <span className="font-semibold">{formData.pinCode}</span></div>
                <div className="col-span-3"><span className="text-slate-500">Current Address:</span> <span className="font-semibold">{formData.currentAddress || "________________________________________________"}</span></div>
              </div>
            </div>

            {/* 3. Educational Qualification */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">3. Educational Qualification</h3>
              <table className="w-full border-collapse border border-slate-300 text-center text-[11px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1">Qualification</th>
                    <th className="border border-slate-300 p-1">Board / University</th>
                    <th className="border border-slate-300 p-1">Passing Year</th>
                    <th className="border border-slate-300 p-1">Percentage / CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-1 font-medium">10th</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.tenth.board || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.tenth.year || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.tenth.score || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1 font-medium">12th</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.twelfth.board || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.twelfth.year || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.twelfth.score || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1 font-medium">Diploma</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.diploma.board || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.diploma.year || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.diploma.score || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1 font-medium">Graduation ({formData.qualifications.graduation.degree || "Degree"})</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.graduation.board || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.graduation.year || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.graduation.score || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1 font-medium">Post Graduation</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.postGraduation.board || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.postGraduation.year || "-"}</td>
                    <td className="border border-slate-300 p-1">{formData.qualifications.postGraduation.score || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4 & 5. Professional & Course Interested */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">4. Professional Details</h3>
                <div className="px-1 space-y-0.5 text-[11px]">
                  <div><span className="text-slate-500">Currently:</span> <span className="font-semibold">{formData.currentStatus}</span></div>
                  <div><span className="text-slate-500">Company:</span> <span className="font-semibold">{formData.companyName || "N/A"}</span></div>
                  <div><span className="text-slate-500">Designation:</span> <span className="font-semibold">{formData.currentDesignation || "N/A"}</span></div>
                  <div><span className="text-slate-500">Experience:</span> <span className="font-semibold">{formData.experience || "N/A"}</span></div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">5. Course Interested In</h3>
                <div className="px-1 text-[11px]">
                  <p className="font-semibold text-emerald-800">
                    {formData.selectedCourses.length > 0 ? formData.selectedCourses.join(", ") : formData.otherCourse || "Not specified"}
                  </p>
                  <div className="mt-1 flex gap-3 text-slate-600">
                    <span>Batch: <b>{formData.preferredBatch}</b></span>
                    <span>Mode: <b>{formData.trainingMode}</b></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Career Goal & Skills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">7. Career Goal</h3>
                <div className="px-1 text-[11px] space-y-0.5">
                  <div><span className="text-slate-500">Reason:</span> {formData.careerReason || "-"}</div>
                  <div><span className="text-slate-500">Expected Role:</span> <b>{formData.expectedJobRole || "-"}</b></div>
                  <div><span className="text-slate-500">Expected Salary:</span> <b>₹{formData.expectedSalary || "-"}</b></div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">8. Previous Skills</h3>
                <div className="px-1 text-[11px] space-y-0.5">
                  <div><span className="text-slate-500">Languages:</span> {formData.languagesKnown || "-"}</div>
                  <div><span className="text-slate-500">Tools:</span> {formData.toolsKnown || "-"}</div>
                  <div><span className="text-slate-500">Certifications:</span> {formData.certifications || "-"}</div>
                </div>
              </div>
            </div>

            {/* 10. Counselling Notes (Office Use Only) */}
            <div className="space-y-1.5 border-t border-slate-300 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded">10. Counselling Notes (Office Use Only)</h3>
              <div className="grid grid-cols-4 gap-2 px-1 text-[11px]">
                <div><span className="text-slate-500">Recommended Course:</span> <span className="font-bold">{formData.recommendedCourse || "-"}</span></div>
                <div><span className="text-slate-500">Duration:</span> <span className="font-bold">{formData.courseDuration || "-"}</span></div>
                <div><span className="text-slate-500">Course Fees:</span> <span className="font-bold">₹{formData.courseFees || "0"}</span></div>
                <div><span className="text-slate-500">Discount Offered:</span> <span className="font-bold">₹{formData.discountOffered || "0"}</span></div>
                <div><span className="text-slate-500">Registration Amount:</span> <span className="font-bold">₹{formData.registrationAmount || "0"}</span></div>
                <div><span className="text-slate-500">EMI Option:</span> <span className="font-bold">{formData.emiOption}</span></div>
                <div><span className="text-slate-500">Admission Status:</span> <span className="font-bold text-emerald-700">{formData.admissionStatus}</span></div>
                <div><span className="text-slate-500">Follow-up Date:</span> <span className="font-bold">{formData.followUpDate || "-"}</span></div>
              </div>
            </div>

            {/* 11. Declaration & Signatures */}
            <div className="pt-4 border-t border-slate-300 space-y-4 text-[11px]">
              <p className="italic text-slate-600">
                11. Declaration: "I hereby declare that the information provided above is true and correct to the best of my knowledge."
              </p>
              <div className="flex justify-between pt-6 px-4">
                <div className="text-center border-t border-slate-400 pt-1 w-44">
                  <span>Student Signature</span>
                </div>
                <div className="text-center border-t border-slate-400 pt-1 w-44">
                  <span>Counsellor Signature</span>
                </div>
                <div className="text-center border-t border-slate-400 pt-1 w-44">
                  <span>Branch Head / Authorized Seal</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* INTERACTIVE EDIT TABS */
          <div className="space-y-3">
            {/* Tab Nav */}
            <div className="flex border-b border-slate-200 text-xs font-medium space-x-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("enquiry")}
                className={`pb-1.5 px-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === "enquiry"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Enquiry Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`pb-1.5 px-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === "personal"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. Personal & Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("academic")}
                className={`pb-1.5 px-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === "academic"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3. Qualifications & Work
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className={`pb-1.5 px-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === "courses"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                4. Courses & Preferences
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("counselling")}
                className={`pb-1.5 px-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === "counselling"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                5. Fees & Counselling Notes
              </button>
            </div>

            {/* TAB 1: Enquiry Details */}
            {activeTab === "enquiry" && (
              <div className="space-y-3 py-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Enquiry No.</Label>
                    <Input
                      value={formData.enquiryNo}
                      onChange={(e) => setFormData({ ...formData, enquiryNo: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Enquiry Date</Label>
                    <Input
                      type="date"
                      value={formData.enquiryDate}
                      onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Counsellor Name</Label>
                    <Input
                      value={formData.counselorName}
                      onChange={(e) => setFormData({ ...formData, counselorName: e.target.value })}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Lead Source / Enquiry Influx</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {["Walk-in", "Website", "Google", "Facebook", "Instagram", "WhatsApp", "YouTube", "Reference", "Newspaper", "Seminar", "Other"].map((src) => (
                      <label key={src} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200">
                        <input
                          type="radio"
                          name="leadSource"
                          value={src}
                          checked={formData.leadSource === src}
                          onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                          className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-800">{src}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Personal & Contact Details */}
            {activeTab === "personal" && (
              <div className="space-y-3 py-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Candidate full name"
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Father's Name</Label>
                    <Input
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="Father's full name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Mother's Name</Label>
                    <Input
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="Mother's full name"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Gender</Label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Marital Status</Label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Aadhaar (Optional)</Label>
                    <Input
                      value={formData.aadharNumber}
                      onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                      placeholder="12-digit Aadhaar"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Mobile Number *</Label>
                      <Input
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="10-digit number"
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Alternate Mobile</Label>
                      <Input
                        type="tel"
                        value={formData.alternateMobileNumber}
                        onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                        placeholder="Parent / Guardian number"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Email ID</Label>
                      <Input
                        type="email"
                        value={formData.emailId}
                        onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                        placeholder="candidate@example.com"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">State</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Pin Code</Label>
                      <Input
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mt-2">
                    <Label className="text-xs font-semibold text-slate-700">Current Residential Address</Label>
                    <Input
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      placeholder="Full residential address"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Academic Qualifications & Professional Status */}
            {activeTab === "academic" && (
              <div className="space-y-3 py-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">3. Educational Qualification</h4>
                  <table className="w-full border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700">
                        <th className="border border-slate-200 p-1.5 text-left">Level</th>
                        <th className="border border-slate-200 p-1.5 text-left">Board / University / Degree</th>
                        <th className="border border-slate-200 p-1.5 w-24 text-left">Passing Year</th>
                        <th className="border border-slate-200 p-1.5 w-28 text-left">% / CGPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 p-1 font-semibold text-slate-600">10th</td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.tenth.board}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                tenth: { ...formData.qualifications.tenth, board: e.target.value },
                              },
                            })}
                            placeholder="CBSE / ICSE / State Board"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.tenth.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                tenth: { ...formData.qualifications.tenth, year: e.target.value },
                              },
                            })}
                            placeholder="2018"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.tenth.score}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                tenth: { ...formData.qualifications.tenth, score: e.target.value },
                              },
                            })}
                            placeholder="82%"
                            className="h-7 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-1 font-semibold text-slate-600">12th</td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.twelfth.board}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                twelfth: { ...formData.qualifications.twelfth, board: e.target.value },
                              },
                            })}
                            placeholder="CBSE / UP Board"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.twelfth.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                twelfth: { ...formData.qualifications.twelfth, year: e.target.value },
                              },
                            })}
                            placeholder="2020"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.twelfth.score}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                twelfth: { ...formData.qualifications.twelfth, score: e.target.value },
                              },
                            })}
                            placeholder="75%"
                            className="h-7 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-1 font-semibold text-slate-600">Diploma</td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.diploma.board}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                diploma: { ...formData.qualifications.diploma, board: e.target.value },
                              },
                            })}
                            placeholder="Polytechnic / Diploma"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.diploma.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                diploma: { ...formData.qualifications.diploma, year: e.target.value },
                              },
                            })}
                            placeholder="Year"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.diploma.score}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                diploma: { ...formData.qualifications.diploma, score: e.target.value },
                              },
                            })}
                            placeholder="Score"
                            className="h-7 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-1 font-semibold text-slate-600">Graduation</td>
                        <td className="border border-slate-200 p-1 flex gap-1">
                          <Input
                            value={formData.qualifications.graduation.degree}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                graduation: { ...formData.qualifications.graduation, degree: e.target.value },
                              },
                            })}
                            placeholder="B.Tech CS / BCA / B.Sc"
                            className="h-7 text-xs w-1/2"
                          />
                          <Input
                            value={formData.qualifications.graduation.board}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                graduation: { ...formData.qualifications.graduation, board: e.target.value },
                              },
                            })}
                            placeholder="University"
                            className="h-7 text-xs w-1/2"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.graduation.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                graduation: { ...formData.qualifications.graduation, year: e.target.value },
                              },
                            })}
                            placeholder="2024"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.graduation.score}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                graduation: { ...formData.qualifications.graduation, score: e.target.value },
                              },
                            })}
                            placeholder="7.8 CGPA"
                            className="h-7 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 p-1 font-semibold text-slate-600">Post Grad</td>
                        <td className="border border-slate-200 p-1 flex gap-1">
                          <Input
                            value={formData.qualifications.postGraduation.degree}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                postGraduation: { ...formData.qualifications.postGraduation, degree: e.target.value },
                              },
                            })}
                            placeholder="MCA / M.Tech"
                            className="h-7 text-xs w-1/2"
                          />
                          <Input
                            value={formData.qualifications.postGraduation.board}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                postGraduation: { ...formData.qualifications.postGraduation, board: e.target.value },
                              },
                            })}
                            placeholder="University"
                            className="h-7 text-xs w-1/2"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.postGraduation.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                postGraduation: { ...formData.qualifications.postGraduation, year: e.target.value },
                              },
                            })}
                            placeholder="Year"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <Input
                            value={formData.qualifications.postGraduation.score}
                            onChange={(e) => setFormData({
                              ...formData,
                              qualifications: {
                                ...formData.qualifications,
                                postGraduation: { ...formData.qualifications.postGraduation, score: e.target.value },
                              },
                            })}
                            placeholder="Score"
                            className="h-7 text-xs"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">4. Professional Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs mb-3">
                    {["Student", "Fresher", "Working Professional", "Business", "Job Seeker", "Other"].map((status) => (
                      <label key={status} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200">
                        <input
                          type="radio"
                          name="currentStatus"
                          value={status}
                          checked={formData.currentStatus === status}
                          onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}
                          className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-800">{status}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Company Name (If Working)</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Company name"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Current Designation</Label>
                      <Input
                        value={formData.currentDesignation}
                        onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                        placeholder="e.g. Associate Trainee"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Total Experience</Label>
                      <Input
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 1 Year"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Courses Interested & Training Preferences */}
            {activeTab === "courses" && (
              <div className="space-y-3 py-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-bold text-slate-800">
                      5. IT & Software Courses Interested In (Select all that apply)
                    </Label>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Selected: {formData.selectedCourses.length} courses
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    {ALL_COURSES.map((course) => {
                      const checked = formData.selectedCourses.includes(course);
                      return (
                        <label
                          key={course}
                          className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer border text-[11px] transition-all ${
                            checked
                              ? "bg-emerald-50 border-emerald-500 font-semibold text-emerald-900 shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCourseToggle(course)}
                            className="h-3.5 w-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="truncate" title={course}>{course}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">6. Preferred Batch</Label>
                    <div className="flex gap-2">
                      {["Morning", "Afternoon", "Evening", "Weekend"].map((b) => (
                        <label key={b} className="flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                          <input
                            type="radio"
                            name="preferredBatch"
                            value={b}
                            checked={formData.preferredBatch === b}
                            onChange={(e) => setFormData({ ...formData, preferredBatch: e.target.value })}
                            className="h-3 w-3 text-emerald-600"
                          />
                          <span>{b}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">Training Mode</Label>
                    <div className="flex gap-2">
                      {["Classroom", "Online", "Hybrid"].map((m) => (
                        <label key={m} className="flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                          <input
                            type="radio"
                            name="trainingMode"
                            value={m}
                            checked={formData.trainingMode === m}
                            onChange={(e) => setFormData({ ...formData, trainingMode: e.target.value })}
                            className="h-3 w-3 text-emerald-600"
                          />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">7. Career Goal & 8. Prior Skills</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Why join this course?</Label>
                      <Input
                        value={formData.careerReason}
                        onChange={(e) => setFormData({ ...formData, careerReason: e.target.value })}
                        placeholder="e.g. Job switch, Upskilling"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Expected Job Role</Label>
                      <Input
                        value={formData.expectedJobRole}
                        onChange={(e) => setFormData({ ...formData, expectedJobRole: e.target.value })}
                        placeholder="e.g. Full Stack Developer"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Expected Salary (₹)</Label>
                      <Input
                        value={formData.expectedSalary}
                        onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                        placeholder="e.g. 4.5 LPA / 40,000 pm"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Programming Languages Known</Label>
                      <Input
                        value={formData.languagesKnown}
                        onChange={(e) => setFormData({ ...formData, languagesKnown: e.target.value })}
                        placeholder="e.g. C, Python, Basic Java"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Software / Tools Known</Label>
                      <Input
                        value={formData.toolsKnown}
                        onChange={(e) => setFormData({ ...formData, toolsKnown: e.target.value })}
                        placeholder="e.g. VS Code, Git, MS Office"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Certifications (If Any)</Label>
                      <Input
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        placeholder="e.g. Oracle Certified Associate"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <Label className="text-xs font-bold text-slate-800 block mb-1.5">
                    9. How Did You Hear About Softlab Global?
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {HEARD_SOURCES.map((h) => {
                      const checked = formData.heardFrom.includes(h);
                      return (
                        <label key={h} className="flex items-center gap-1.5 p-1 rounded bg-slate-50 border border-slate-200 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleHeardToggle(h)}
                            className="h-3 w-3 text-emerald-600 rounded"
                          />
                          <span>{h}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Counselling Notes & Office Fee Structure */}
            {activeTab === "counselling" && (
              <div className="space-y-3 py-1">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    10. Counselling Notes (Office Use Only)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Recommended Course</Label>
                      <select
                        value={formData.recommendedCourse}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = courses.find((c: any) => c.title === val);
                          setFormData({
                            ...formData,
                            recommendedCourse: val,
                            recommendedCourseId: found?.id || "",
                            courseFees: found?.baseFee ? String(found.baseFee / 100) : formData.courseFees,
                          });
                        }}
                        className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 font-medium"
                      >
                        <option value="">-- Select Course --</option>
                        {courses.map((c: any) => (
                          <option key={c.id} value={c.title}>
                            {c.title} {c.providerType === "UNIVERSITY" ? "(University)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Course Duration</Label>
                      <Input
                        value={formData.courseDuration}
                        onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                        placeholder="e.g. 6 Months / 1 Year"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Course Fees (₹)</Label>
                      <Input
                        type="number"
                        value={formData.courseFees}
                        onChange={(e) => setFormData({ ...formData, courseFees: e.target.value })}
                        placeholder="e.g. 35000"
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Discount Offered (₹)</Label>
                      <Input
                        type="number"
                        value={formData.discountOffered}
                        onChange={(e) => setFormData({ ...formData, discountOffered: e.target.value })}
                        placeholder="e.g. 5000"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Registration Amount (₹)</Label>
                      <Input
                        type="number"
                        value={formData.registrationAmount}
                        onChange={(e) => setFormData({ ...formData, registrationAmount: e.target.value })}
                        placeholder="e.g. 1000"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">EMI Option Available?</Label>
                      <select
                        value={formData.emiOption}
                        onChange={(e) => setFormData({ ...formData, emiOption: e.target.value })}
                        className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                      >
                        <option value="Yes">Yes (Monthly Installments)</option>
                        <option value="No">No (Lumpsum Only)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Admission Status</Label>
                      <select
                        value={formData.admissionStatus}
                        onChange={(e) => setFormData({ ...formData, admissionStatus: e.target.value })}
                        className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 font-semibold"
                      >
                        <option value="Interested">Interested</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Demo Class">Demo Class</option>
                        <option value="Registered">Registered</option>
                        <option value="Not Interested">Not Interested</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Next Follow-up Date</Label>
                      <Input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Counsellor Remarks</Label>
                      <Input
                        value={formData.counselorRemarks}
                        onChange={(e) => setFormData({ ...formData, counselorRemarks: e.target.value })}
                        placeholder="Remarks regarding candidate interest, budget, timeline"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        <DialogFooter className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official SoftLab Global Enquiry Protocol</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveOnly}
              disabled={createLeadMutation.isPending}
              className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5"
            >
              {createLeadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Save as CRM Lead</span>
            </Button>

            {onProceedToAdmission && (
              <Button
                type="button"
                size="sm"
                onClick={handleProceedToAdmission}
                disabled={createLeadMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Proceed to Admission</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
