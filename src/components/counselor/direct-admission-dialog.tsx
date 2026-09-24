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
import { LeadSource, PaymentMethod } from "@prisma/client";
import {
  Loader2,
  GraduationCap,
  User,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  Camera,
  CheckCircle2,
  Copy,
  Printer,
  X,
  CreditCard,
  FileText,
  ShieldCheck,
  Calendar as CalendarIcon,
  Layers,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { StudentIdCardView, StudentIdCardData } from "@/components/common/student-id-card-view";

interface DirectAdmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLeadId?: string | null;
  initialLead?: {
    id?: string;
    fullName?: string;
    applicantName?: string;
    email?: string;
    phone?: string;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    address?: string | null;
    fatherName?: string | null;
    motherName?: string | null;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    whatsappNumber?: string | null;
    alternatePhone?: string | null;
    schoolOrCollege?: string | null;
    passingYear?: string | null;
    percentageOrCgpa?: string | null;
    qualification?: string | null;
    highestQualification?: string | null;
    interestedCourseId?: string | null;
    courseId?: string | null;
    source?: LeadSource;
    customTotalFee?: number | null;
    discountValue?: number | null;
    paymentPlan?: "LUMPSUM" | "EMI";
    paidAmount?: number | null;
    photoUrl?: string | null;
    notes?: string | null;
  } | null;
  onSuccess?: (applicationId: string) => void;
}

export function DirectAdmissionDialog({
  open,
  onOpenChange,
  initialLeadId,
  initialLead,
  onSuccess,
}: DirectAdmissionDialogProps) {
  // Provider & Course selection
  const [providerMode, setProviderMode] = useState<"SOFTLAB" | "UNIVERSITY">("SOFTLAB");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [admissionSession, setAdmissionSession] = useState<string>("2025-2026");

  // Personal
  const [applicantName, setApplicantName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("MALE");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Prayagraj");
  const [state, setState] = useState("Uttar Pradesh");
  const [pincode, setPincode] = useState("211001");

  // Academic
  const [highestQualification, setHighestQualification] = useState("B.Tech / Graduate");
  const [schoolOrCollege, setSchoolOrCollege] = useState("");
  const [passingYear, setPassingYear] = useState("2025");
  const [percentageOrCgpa, setPercentageOrCgpa] = useState("");

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial & Discount
  const [source, setSource] = useState<LeadSource>(LeadSource.WALK_IN);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [customTotalFee, setCustomTotalFee] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");

  // Payment Options (Lumpsum vs EMI & Offline vs Online)
  const [paymentPlan, setPaymentPlan] = useState<"LUMPSUM" | "EMI">("LUMPSUM");
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [paymentType, setPaymentType] = useState<"OFFLINE" | "ONLINE">("OFFLINE");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [installmentsSchedule, setInstallmentsSchedule] = useState<Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
    notes?: string;
  }>>([]);

  const [remarks, setRemarks] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Authority & Role Verification
  const { data: authUser } = api.auth.me.useQuery();
  const isSuperAdminOrDirector =
    authUser?.roleCode === "SUPER_ADMIN" ||
    authUser?.roleCode === "DIRECTOR" ||
    authUser?.roleCode === "ADMIN";

  // Success / Post-Admission View State
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [viewingIdCard, setViewingIdCard] = useState<StudentIdCardData | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);

  const utils = api.useUtils();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const filteredCourses = courses.filter((c: any) =>
    providerMode === "UNIVERSITY"
      ? c.providerType === "UNIVERSITY"
      : c.providerType !== "UNIVERSITY"
  );

  const { data: batchesData } = api.batch.list.useQuery(
    { courseId: courseId || undefined, pageSize: 50 },
    { enabled: !!courseId && providerMode !== "UNIVERSITY" }
  );
  const batches = batchesData?.batches || [];

  const { data: leadsData } = api.crm.listLeads.useQuery({ limit: 100 });
  const leads = leadsData?.leads || [];

  const selectedCourse = courses.find((c: any) => c.id === courseId);
  const isUniversity = providerMode === "UNIVERSITY" || selectedCourse?.providerType === "UNIVERSITY";

  // Effective course fee (defaults to course base fee, but editable by user)
  const courseFeeInr = typeof customTotalFee === "number" && customTotalFee >= 0
    ? customTotalFee
    : (selectedCourse?.baseFee ? selectedCourse.baseFee / 100 : 0);

  const discountAmountInr =
    discountType === "PERCENTAGE"
      ? Math.round((courseFeeInr * (discountValue || 0)) / 100)
      : Math.min(courseFeeInr, discountValue || 0);

  const finalFeeInr = Math.max(0, courseFeeInr - discountAmountInr);
  const pendingAmountInr = Math.max(0, finalFeeInr - (paidAmount || 0));
  const discountPercentCalculated = courseFeeInr > 0 ? Math.round((discountAmountInr / courseFeeInr) * 100) : 0;
  const isDiscountOverLimit = discountPercentCalculated > 15 && !isSuperAdminOrDirector;

  // Auto-fill course baseFee into customTotalFee when course changes
  const handleCourseSelect = (selectedId: string) => {
    setCourseId(selectedId);
    setBatchId("");
    const target = courses.find((c: any) => c.id === selectedId);
    if (target?.baseFee) {
      setCustomTotalFee(target.baseFee / 100);
    } else {
      setCustomTotalFee(0);
    }
    if (target?.specializations && target.specializations.length > 0) {
      setSelectedSpecialization(target.specializations[0]);
    } else if (target?.specialization) {
      setSelectedSpecialization(target.specialization);
    } else {
      setSelectedSpecialization("");
    }
  };

  // Pre-fill lead data if provided
  React.useEffect(() => {
    if (initialLead) {
      if (initialLead.id) setSelectedLeadId(initialLead.id);
      setApplicantName(initialLead.applicantName || initialLead.fullName || "");
      setApplicantEmail(initialLead.email || "");
      setApplicantPhone(initialLead.phone || "");
      setWhatsappNumber(initialLead.whatsappNumber || initialLead.phone || "");
      if (initialLead.fatherName) setFatherName(initialLead.fatherName);
      if (initialLead.motherName) setMotherName(initialLead.motherName);
      if (initialLead.dateOfBirth) {
        const d = new Date(initialLead.dateOfBirth);
        if (!isNaN(d.getTime())) setDateOfBirth(d.toISOString().split("T")[0]);
      }
      if (initialLead.gender) setGender(initialLead.gender);
      if (initialLead.alternatePhone) setAlternatePhone(initialLead.alternatePhone);
      if (initialLead.address) setAddress(initialLead.address);
      if (initialLead.city) setCity(initialLead.city);
      if (initialLead.state) setState(initialLead.state);
      if (initialLead.pincode) setPincode(initialLead.pincode);
      if (initialLead.highestQualification || initialLead.qualification) {
        setHighestQualification(initialLead.highestQualification || initialLead.qualification || "");
      }
      if (initialLead.schoolOrCollege) setSchoolOrCollege(initialLead.schoolOrCollege);
      if (initialLead.passingYear) setPassingYear(initialLead.passingYear);
      if (initialLead.percentageOrCgpa) setPercentageOrCgpa(initialLead.percentageOrCgpa);
      if (initialLead.photoUrl) setPhotoUrl(initialLead.photoUrl);
      if (typeof initialLead.customTotalFee === "number") setCustomTotalFee(initialLead.customTotalFee);
      if (typeof initialLead.discountValue === "number") setDiscountValue(initialLead.discountValue);
      if (initialLead.paymentPlan) setPaymentPlan(initialLead.paymentPlan);
      if (typeof initialLead.paidAmount === "number") setPaidAmount(initialLead.paidAmount);

      const targetCourseId = initialLead.interestedCourseId || initialLead.courseId;
      if (targetCourseId) {
        setCourseId(targetCourseId);
        const target = courses.find((c: any) => c.id === targetCourseId);
        if (target) {
          setProviderMode(target.providerType === "UNIVERSITY" ? "UNIVERSITY" : "SOFTLAB");
          if (target.baseFee && typeof initialLead.customTotalFee !== "number") {
            setCustomTotalFee(target.baseFee / 100);
          }
        }
      }
      if (initialLead.source) setSource(initialLead.source);
    }
  }, [initialLead, courses]);

  React.useEffect(() => {
    if (initialLeadId && !initialLead && leads.length > 0) {
      handleLeadSelect(initialLeadId);
    }
  }, [initialLeadId, leads]);

  // Recalculate EMI Slots whenever paymentPlan, finalFeeInr, or installmentCount changes
  React.useEffect(() => {
    if (paymentPlan === "EMI" && finalFeeInr > 0) {
      const count = Math.max(2, Math.min(6, installmentCount));
      const baseInstAmount = Math.floor(finalFeeInr / count);
      const remainder = finalFeeInr - (baseInstAmount * count);
      const newSchedule = [];
      const today = new Date();

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + (i * 30));
        const amount = i === 0 ? (baseInstAmount + remainder) : baseInstAmount;
        newSchedule.push({
          installmentNumber: i + 1,
          amount,
          dueDate: dueDate.toISOString().split("T")[0],
          notes: i === 0 ? "1st EMI / Admission Down-Payment" : `EMI Slot ${i + 1} (Due in ${i * 30} days)`,
        });
      }
      setInstallmentsSchedule(newSchedule);
      if (paidAmount === 0 || paidAmount === finalFeeInr) {
        setPaidAmount(newSchedule[0].amount);
      }
    } else if (paymentPlan === "LUMPSUM") {
      if (paidAmount === 0 || (installmentsSchedule.length > 0 && paidAmount === installmentsSchedule[0]?.amount)) {
        setPaidAmount(finalFeeInr);
      }
    }
  }, [paymentPlan, finalFeeInr, installmentCount]);

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds the 5MB limit.");
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setPhotoUrl(data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const createMutation = api.crm.createDirectAdmission.useMutation({
    onSuccess: (res) => {
      setErrorMsg(null);
      utils.crm.listApplications.invalidate();
      utils.crm.getStats.invalidate();
      utils.crm.listLeads.invalidate();
      utils.admin.listStudents.invalidate();

      setCreatedResult(res);

      if (onSuccess) onSuccess(res.application.id);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to generate admission application.");
    },
  });

  const handleLeadSelect = (id: string) => {
    setSelectedLeadId(id);
    if (!id) return;
    const targetLead = leads.find((l: any) => l.id === id);
    if (targetLead) {
      setApplicantName(targetLead.fullName);
      setApplicantEmail(targetLead.email);
      setApplicantPhone(targetLead.phone);
      setWhatsappNumber(targetLead.phone);
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
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      alternatePhone: alternatePhone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      highestQualification: highestQualification.trim() || undefined,
      schoolOrCollege: schoolOrCollege.trim() || undefined,
      passingYear: passingYear.trim() || undefined,
      percentageOrCgpa: percentageOrCgpa.trim() || undefined,
      photoUrl: photoUrl || undefined,
      leadId: selectedLeadId || undefined,
      source,
      totalCourseFee: courseFeeInr * 100,
      discountType: discountValue > 0 ? discountType : undefined,
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountAmount: discountAmountInr > 0 ? discountAmountInr * 100 : undefined,
      discountReason: discountReason.trim() || undefined,
      finalFee: finalFeeInr * 100,
      paidAmount: paidAmount > 0 ? paidAmount * 100 : undefined,
      paymentPlan,
      installmentCount: paymentPlan === "EMI" ? installmentCount : undefined,
      installments: paymentPlan === "EMI" ? installmentsSchedule.map((s) => ({
        installmentNumber: s.installmentNumber,
        amount: s.amount * 100,
        dueDate: new Date(s.dueDate),
        notes: s.notes,
      })) : undefined,
      paymentType,
      paymentReference: paymentReference.trim() || undefined,
      paymentMethod: paymentType === "ONLINE" ? PaymentMethod.RAZORPAY : paymentMethod,
      remarks: remarks.trim() || undefined,
      providerType: isUniversity ? "UNIVERSITY" : "SOFTLAB",
      providerName: isUniversity ? (selectedCourse?.providerName || "Dr. Preeti Global University") : "SoftLab Global",
      universityName: isUniversity ? (selectedCourse?.universityName || "Dr. Preeti Global University") : undefined,
      universityProgram: isUniversity ? selectedCourse?.title : undefined,
      universitySpecialization: isUniversity ? (selectedSpecialization || selectedCourse?.specialization || undefined) : undefined,
      admissionSession: isUniversity ? admissionSession : undefined,
      universityRegistrationFee: isUniversity ? (selectedCourse?.registrationFee ?? 100000) : undefined,
      universityExaminationFee: isUniversity ? (selectedCourse?.examinationFee ?? 100000) : undefined,
      universityFee: isUniversity ? (selectedCourse?.universityFeeYear ?? selectedCourse?.baseFee ?? undefined) : undefined,
    });
  };

  const handleCopyCredentials = () => {
    if (!createdResult?.credentials) return;
    const isUniv = createdResult.isUniversity || createdResult.credentials.providerType === "UNIVERSITY";
    const credText = isUniv
      ? `SOFTLAB GLOBAL — UNIVERSITY ADMISSION & STUDENT LMS CREDENTIALS
Candidate Name: ${createdResult.credentials.fullName}
Education Partner: Dr. Preeti Global University
Enrolled Program: ${createdResult.universityProgram || selectedCourse?.title}
${createdResult.universitySpecialization ? `Specialization: ${createdResult.universitySpecialization}\n` : ""}Student ID: ${createdResult.credentials.studentId}
Admission No: ${createdResult.credentials.admissionNumber}
Session: ${createdResult.admissionSession || admissionSession}
SoftLab LMS: https://softlabglobal.com/login
DPGU Student Portal: https://student.dpguindia.com/Default.aspx
Login Email: ${createdResult.credentials.email}
Temporary Password: ${createdResult.credentials.temporaryPassword}
Advisory Center: Patrika Chauraha, Civil Lines, Prayagraj`
      : `SOFTLAB GLOBAL — STUDENT LMS LOGIN CREDENTIALS
Student Name: ${createdResult.credentials.fullName}
Student ID: ${createdResult.credentials.studentId}
Admission No: ${createdResult.credentials.admissionNumber}
Portal URL: https://softlabglobal.com/login
Login Email: ${createdResult.credentials.email}
Temporary Password: ${createdResult.credentials.temporaryPassword}
Campus: Patrika Chauraha, Civil Lines, Prayagraj`;

    navigator.clipboard.writeText(credText);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleResetForm = () => {
    setCreatedResult(null);
    setViewingIdCard(null);
    setViewingReceipt(null);
    setApplicantName("");
    setFatherName("");
    setMotherName("");
    setDateOfBirth("");
    setApplicantEmail("");
    setApplicantPhone("");
    setWhatsappNumber("");
    setPhotoUrl(null);
    setPaidAmount(0);
    setDiscountValue(0);
    setCustomTotalFee("");
    setDiscountReason("");
    setPaymentPlan("LUMPSUM");
    setInstallmentCount(3);
    setPaymentType("OFFLINE");
    setPaymentReference("");
    setInstallmentsSchedule([]);
    setRemarks("");
    setSelectedSpecialization("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleResetForm(); }}>
      <div className="max-h-[85vh] overflow-y-auto px-1">
        {/* =================================================================== */}
        {/* VIEW 1: DUAL FEE RECEIPT MODAL */}
        {/* =================================================================== */}
        {viewingReceipt && (
          <div className="space-y-4">
            <DualFeeReceipt
              data={viewingReceipt}
              onClose={() => setViewingReceipt(null)}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: STUDENT ID CARD VIEW */}
        {/* =================================================================== */}
        {viewingIdCard && (
          <div className="space-y-4">
            <StudentIdCardView
              data={viewingIdCard}
              onClose={() => setViewingIdCard(null)}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: SUCCESSFUL ADMISSION CONFIRMATION & CREDENTIALS */}
        {/* =================================================================== */}
        {createdResult && !viewingReceipt && !viewingIdCard && (
          <div className="space-y-4 p-2 text-slate-900">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Admission Confirmed & LMS Account Activated!
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {createdResult.isUniversity
                      ? "Dr. Preeti Global University admission recorded. Permanent ID, enrollment, and credentials provisioned."
                      : "Student profile, permanent ID, enrollment, and credentials have been provisioned."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Student ID</span>
                  <span className="font-mono font-bold text-base text-blue-700">
                    {createdResult.credentials.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Number</span>
                  <span className="font-mono font-bold text-base text-slate-800">
                    {createdResult.credentials.admissionNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-bold text-slate-800">{createdResult.credentials.fullName}</span>
                </div>
                {createdResult.isUniversity && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Academic Provider:</span>
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Dr. Preeti Global University
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Enrolled Program:</span>
                  <span className="font-semibold text-slate-900">
                    {createdResult.universityProgram || selectedCourse?.title}
                    {createdResult.universitySpecialization ? ` (${createdResult.universitySpecialization})` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Login Email:</span>
                  <span className="font-mono font-medium text-slate-900 bg-white px-2 py-0.5 rounded border">
                    {createdResult.credentials.email}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Temporary Password:</span>
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {createdResult.credentials.temporaryPassword}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedCredentials ? "Copied to Clipboard!" : "Copy Full Credentials"}</span>
                </Button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewingIdCard({
                    studentName: createdResult.credentials.fullName,
                    studentId: createdResult.credentials.studentId,
                    admissionNumber: createdResult.credentials.admissionNumber,
                    courseTitle: selectedCourse?.title || "Professional Program",
                    educationProvider: createdResult.isUniversity ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL",
                    universityName: createdResult.isUniversity ? (createdResult.universityName || "Dr. Preeti Global University") : undefined,
                    universityProgram: createdResult.isUniversity ? (createdResult.universityProgram || selectedCourse?.title) : undefined,
                    photoUrl: photoUrl || null,
                    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                  });
                }}
                className="text-xs h-9 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>View / Print ID Card</span>
              </Button>

              {createdResult.receiptNumber ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingReceipt({
                      receiptNumber: createdResult.receiptNumber,
                      receiptDate: new Date(),
                      studentName: createdResult.credentials.fullName,
                      studentId: createdResult.credentials.studentId,
                      admissionNumber: createdResult.credentials.admissionNumber,
                      courseTitle: selectedCourse?.title || "Professional Program",
                      providerType: createdResult.isUniversity ? "UNIVERSITY" : "SOFTLAB",
                      providerName: createdResult.isUniversity ? "Dr. Preeti Global University" : "SoftLab Global",
                      universityName: createdResult.isUniversity ? (createdResult.universityName || "Dr. Preeti Global University") : undefined,
                      universityProgram: createdResult.isUniversity ? (createdResult.universityProgram || selectedCourse?.title) : undefined,
                      universitySpecialization: createdResult.isUniversity ? createdResult.universitySpecialization : undefined,
                      registrationFee: createdResult.isUniversity ? (selectedCourse?.registrationFee ?? 100000) : undefined,
                      examinationFee: createdResult.isUniversity ? (selectedCourse?.examinationFee ?? 100000) : undefined,
                      universityFee: createdResult.isUniversity ? (selectedCourse?.universityFeeYear ?? selectedCourse?.baseFee) : undefined,
                      totalFee: courseFeeInr * 100,
                      discountAmount: discountAmountInr * 100,
                      netPayable: finalFeeInr * 100,
                      amountPaid: paidAmount * 100,
                      pendingAmount: pendingAmountInr * 100,
                      paymentMode: paymentType === "ONLINE" ? "RAZORPAY" : paymentMethod,
                      transactionReference: createdResult.payment?.transactionReference || paymentReference || "PAY-TXN",
                    });
                  }}
                  className="text-xs h-9 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print A4 Receipt</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="text-xs h-9 gap-1.5 text-slate-400"
                >
                  <span>No Initial Payment</span>
                </Button>
              )}
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button onClick={handleResetForm} className="bg-slate-900 text-white text-xs h-8">
                Done & Close
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: MAIN ADMISSION FORM (PHASE 8 COMPLETE ADMISSION FORM) */}
        {/* =================================================================== */}
        {!createdResult && !viewingReceipt && !viewingIdCard && (
          <div className="space-y-3">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                <span>New Student Institutional Admission</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Complete admission workflow: provisions Student Profile, LMS account, ID card, and A4 fee receipt.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {errorMsg && (
                <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* CRM Prospect Link */}
              {leads.length > 0 && (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Optional: Link to Existing CRM Prospect
                  </Label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => handleLeadSelect(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                  >
                    <option value="">-- Create New / Walk-In Applicant Directly --</option>
                    {leads.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName} ({l.phone}) — {l.course?.title || "General Enquiry"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Admission Stream / Institutional Provider Selector */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Admission Stream / Academic Partner *</span>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                    {providerMode === "UNIVERSITY" ? "University Degree Program" : "SoftLab IT Training"}
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProviderMode("SOFTLAB");
                      setCourseId("");
                      setBatchId("");
                      setSelectedSpecialization("");
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      providerMode === "SOFTLAB"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>SoftLab Global Courses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderMode("UNIVERSITY");
                      setCourseId("");
                      setBatchId("");
                      setSelectedSpecialization("");
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      providerMode === "UNIVERSITY"
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Dr. Preeti Global University</span>
                  </button>
                </div>
              </div>

              {/* Program & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-slate-400" />
                    <span>
                      {providerMode === "UNIVERSITY" ? "University Program / Degree *" : "Target Training Program *"}
                    </span>
                  </Label>
                  <select
                    value={courseId}
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    required
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                  >
                    <option value="">
                      {providerMode === "UNIVERSITY" ? "-- Choose University Program --" : "-- Choose Course --"}
                    </option>
                    {filteredCourses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.baseFee ? `(₹${(c.baseFee / 100).toLocaleString("en-IN")}${providerMode === "UNIVERSITY" ? "/yr" : ""})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {providerMode === "UNIVERSITY" ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-slate-400" />
                      <span>Specialization / Branch</span>
                    </Label>
                    {selectedCourse?.specializations && selectedCourse.specializations.length > 0 ? (
                      <select
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                      >
                        {selectedCourse.specializations.map((spec: string) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="General / Default Specialization"
                        value={selectedSpecialization || selectedCourse?.specialization || "General"}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-slate-400" />
                      <span>Assigned Batch (Optional)</span>
                    </Label>
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      disabled={!courseId}
                      className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 disabled:bg-slate-100"
                    >
                      <option value="">-- Unassigned / To Be Allocated --</option>
                      {batches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.name}) - {b.deliveryMode}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* University Program Meta Info Pill (When DPGU is selected) */}
              {isUniversity && selectedCourse && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">Session</span>
                      <span className="font-semibold">{admissionSession}</span>
                    </div>
                    {selectedCourse.durationYears && (
                      <div className="border-l border-amber-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block">Duration</span>
                        <span className="font-semibold">{selectedCourse.durationYears} Years</span>
                      </div>
                    )}
                    {selectedCourse.isLateralEligible && (
                      <div className="border-l border-amber-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">Lateral Entry</span>
                        <span className="font-semibold text-emerald-800">
                          Eligible (₹{((selectedCourse.lateralEntryFee || 0) / 100).toLocaleString("en-IN")})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-amber-800">
                    Reg: ₹1,000 | Exam: ₹1,000/exam
                  </div>
                </div>
              )}

              {/* Photo Upload Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-18 border-2 border-dashed border-slate-300 rounded bg-white overflow-hidden flex items-center justify-center shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Student Identity Photograph</Label>
                  <p className="text-[11px] text-slate-500">
                    Passport size format. Printed on official student ID card. (JPEG, PNG, max 5MB)
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="text-xs h-7 gap-1"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-3 w-3" />
                          <span>{photoUrl ? "Change Photo" : "Upload Photo"}</span>
                        </>
                      )}
                    </Button>
                    {photoUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setPhotoUrl(null)}
                        className="text-xs h-7 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                  1. Personal & Contact Dossier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      placeholder="Candidate full name"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Father&apos;s Name</Label>
                    <Input
                      placeholder="Father's full name"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Mother&apos;s Name</Label>
                    <Input
                      placeholder="Mother's full name"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Date of Birth</Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Gender</Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Mobile (10 digits) *</Label>
                    <Input
                      placeholder="9876543210"
                      value={applicantPhone}
                      onChange={(e) => {
                        setApplicantPhone(e.target.value);
                        if (!whatsappNumber) setWhatsappNumber(e.target.value);
                      }}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">WhatsApp Number</Label>
                    <Input
                      placeholder="WhatsApp No"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Login Email *</Label>
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Alternate / Guardian Phone</Label>
                    <Input
                      placeholder="Emergency contact number"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Residential Address</Label>
                    <Input
                      placeholder="House / Street / Locality"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Pincode</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                  2. Academic Background
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Highest Qualification</Label>
                    <Input
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-700">College / University</Label>
                    <Input
                      placeholder="Institute name"
                      value={schoolOrCollege}
                      onChange={(e) => setSchoolOrCollege(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Passing Year</Label>
                    <Input
                      placeholder="2025"
                      value={passingYear}
                      onChange={(e) => setPassingYear(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Breakdown & Immediate Payment */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    <span>
                      {isUniversity
                        ? "3. University Fee, Custom Total & Payment Collection"
                        : "3. Tuition Fee, Discount & Payment Collection"}
                    </span>
                  </h4>
                  {isSuperAdminOrDirector ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                      <ShieldCheck className="h-3 w-3 text-purple-600" />
                      Director / Admin Special Authorization
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500">
                      Counselor Standard Authorization Desk
                    </span>
                  )}
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Program Fee</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      ₹{courseFeeInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Discount</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      -₹{discountAmountInr.toLocaleString("en-IN")}
                      {discountPercentCalculated > 0 && ` (${discountPercentCalculated}%)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Net Payable</span>
                    <span className="font-bold text-blue-700 font-mono text-sm">
                      ₹{finalFeeInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Balance After Today</span>
                    <span className={`font-bold font-mono text-sm ${pendingAmountInr > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                      ₹{pendingAmountInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Editable Total Fee & Discount Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                      <span>Editable Total Fee (₹) *</span>
                      <span className="text-[9px] text-blue-600 font-normal">Customizable</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={customTotalFee}
                      onChange={(e) => setCustomTotalFee(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Enter custom total fee"
                      required
                      className="h-8 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Default base: ₹{((selectedCourse?.baseFee || 0) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Discount Mode & Value</Label>
                    <div className="flex gap-1.5">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shrink-0 w-24"
                      >
                        <option value="PERCENTAGE">% Off</option>
                        <option value="FIXED">Flat ₹</option>
                      </select>
                      <Input
                        type="number"
                        min={0}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        placeholder="Discount"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    {discountAmountInr > 0 && (
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Deducts ₹{discountAmountInr.toLocaleString("en-IN")} from total
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Discount Reason / Approval
                    </Label>
                    <Input
                      placeholder="e.g. Merit scholarship, Early bird, Director approved"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="h-8 text-xs"
                    />
                    {isDiscountOverLimit ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-0.5">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Exceeds 15% Counselor limit (Requires Director Reason)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">Required if discount &gt; 15%</span>
                    )}
                  </div>
                </div>

                {/* Payment Plan Selector: Lumpsum vs EMI Slots */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      <span>Payment Structure / Fee Collection Plan *</span>
                    </Label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Select Lumpsum (One-Time) or EMI Installments
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan("LUMPSUM")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        paymentPlan === "LUMPSUM"
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <span>Lumpsum (One-Time Payment)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPlan("EMI")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        paymentPlan === "EMI"
                          ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
                      }`}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>EMI Slot / Installment Schedule</span>
                    </button>
                  </div>

                  {/* EMI Slot Configuration Box */}
                  {paymentPlan === "EMI" && (
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Select Number of EMI Slots:</span>
                        <div className="flex gap-1.5">
                          {[2, 3, 4, 6].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setInstallmentCount(count)}
                              className={`px-2.5 py-1 text-xs rounded font-bold border transition ${
                                installmentCount === count
                                  ? "bg-blue-600 text-white border-blue-700"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                              }`}
                            >
                              {count} EMIs
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Installments Schedule Table */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold">
                            <tr>
                              <th className="py-1.5 px-3 text-left">Slot</th>
                              <th className="py-1.5 px-3 text-left">Due Date</th>
                              <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                              <th className="py-1.5 px-3 text-left">Notes / Terms</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {installmentsSchedule.map((slot, index) => (
                              <tr key={slot.installmentNumber} className={index === 0 ? "bg-emerald-50/50" : ""}>
                                <td className="py-2 px-3 font-bold text-slate-800">
                                  {index === 0 ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-800 font-sans text-[11px] font-bold">
                                      Slot 1 (Admission)
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 font-sans text-[11px]">
                                      Slot {slot.installmentNumber}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="date"
                                    value={slot.dueDate}
                                    onChange={(e) => {
                                      const updated = [...installmentsSchedule];
                                      updated[index].dueDate = e.target.value;
                                      setInstallmentsSchedule(updated);
                                    }}
                                    className="h-7 px-2 border rounded text-xs bg-white text-slate-800"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    value={slot.amount}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const updated = [...installmentsSchedule];
                                      updated[index].amount = val;
                                      setInstallmentsSchedule(updated);
                                      if (index === 0) setPaidAmount(val);
                                    }}
                                    className="h-7 w-24 px-2 border rounded text-xs text-right font-bold text-slate-900 bg-white"
                                  />
                                </td>
                                <td className="py-2 px-3 font-sans text-[10px] text-slate-500">
                                  {slot.notes}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Mode & Amount Paid Today */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <Label className="text-xs font-bold text-slate-800">Payment Collection (Today)</Label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentType("OFFLINE")}
                        className={`px-2.5 py-0.5 text-xs rounded font-semibold transition ${
                          paymentType === "OFFLINE"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Offline (Cash/UPI/Bank)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("ONLINE")}
                        className={`px-2.5 py-0.5 text-xs rounded font-semibold transition ${
                          paymentType === "ONLINE"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Online Gateway
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-emerald-700">Amount Paid Today (₹) *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={finalFeeInr}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="h-8 text-xs font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        {paymentPlan === "EMI"
                          ? "Defaults to Slot 1 admission fee"
                          : "Enter amount collected today"}
                      </span>
                    </div>

                    {paymentType === "OFFLINE" ? (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Offline Payment Mode</Label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value={PaymentMethod.CASH}>Cash (Center Handover)</option>
                          <option value={PaymentMethod.UPI}>UPI / QR Scanner</option>
                          <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/IMPS)</option>
                          <option value={PaymentMethod.CARD}>Debit / Credit Card (POS)</option>
                          <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Online Gateway</Label>
                        <div className="h-8 px-2.5 py-1 text-xs rounded border border-blue-200 bg-blue-50 text-blue-800 flex items-center font-medium">
                          SoftLab Instant Razorpay / UPI Link
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Transaction Ref / Cheque / UTR
                      </Label>
                      <Input
                        placeholder="e.g. UPI-9840248204 or CHQ-0021"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || isUploadingPhoto}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Generate Admission & Activate Account</span>
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
}
