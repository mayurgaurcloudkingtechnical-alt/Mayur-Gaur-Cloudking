"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { ApplicationStage } from "@prisma/client";
import {
  Loader2,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Camera,
  X,
  Calendar,
  School,
  Building,
  CheckCircle2,
} from "lucide-react";

interface EditApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any | null;
  onSuccess?: () => void;
}

export function EditApplicationDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: EditApplicationDialogProps) {
  // Personal Details
  const [applicantName, setApplicantName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("MALE");

  // Contact Details
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [center, setCenter] = useState("");

  // Academic Details
  const [highestQualification, setHighestQualification] = useState("");
  const [schoolOrCollege, setSchoolOrCollege] = useState("");
  const [passingYear, setPassingYear] = useState("");
  const [percentageOrCgpa, setPercentageOrCgpa] = useState("");

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Batch
  const [batchId, setBatchId] = useState<string>("");
  const [stage, setStage] = useState<ApplicationStage>(ApplicationStage.UNDER_REVIEW);
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "contact" | "academic" | "admission" | "fee">("personal");

  // Financial & Installments State
  const [totalCourseFeeInr, setTotalCourseFeeInr] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [paidAmountInr, setPaidAmountInr] = useState<number>(0);
  const [paymentPlan, setPaymentPlan] = useState<"LUMPSUM" | "EMI">("LUMPSUM");
  const [installmentCount, setInstallmentCount] = useState<number>(6);
  const [installmentsSchedule, setInstallmentsSchedule] = useState<
    Array<{ installmentNumber: number; amount: number; dueDate: string; notes?: string }>
  >([]);
  const [lumpsumRemainingDueDate, setLumpsumRemainingDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const todayDateStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const maxLumpsumDueDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split("T")[0];
  }, []);

  const utils = api.useUtils();

  const { data: batchesData } = api.batch.list.useQuery(
    { courseId: application?.courseId, pageSize: 50 },
    { enabled: !!application?.courseId && open }
  );
  const batches = batchesData?.batches || [];

  const discountAmountInr =
    discountValue > 0
      ? discountType === "PERCENTAGE"
        ? Math.round((totalCourseFeeInr * discountValue) / 100)
        : Math.min(totalCourseFeeInr, discountValue)
      : 0;

  const finalFeeInr = Math.max(0, totalCourseFeeInr - discountAmountInr);
  const pendingAmountInr = Math.max(0, finalFeeInr - paidAmountInr);

  const generateInstallments = (count: number, netPayable: number, downPayment: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    const validDownPayment = Math.max(0, Math.min(netPayable, downPayment));
    const remaining = Math.max(0, netPayable - validDownPayment);
    const slots: Array<{ installmentNumber: number; amount: number; dueDate: string; notes: string }> = [];
    const today = new Date();

    // Slot 1: Down Payment (Admission Handover)
    slots.push({
      installmentNumber: 1,
      amount: validDownPayment,
      dueDate: today.toISOString().split("T")[0],
      notes: "Slot 1 (Admission Down-Payment)",
    });

    if (remaining > 0) {
      const perMonth = Math.floor(remaining / validCount);
      let allocated = 0;

      for (let i = 1; i <= validCount; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + (i * 30));
        const isLast = i === validCount;
        const amt = isLast ? (remaining - allocated) : perMonth;
        allocated += perMonth;
        slots.push({
          installmentNumber: i + 1,
          amount: Math.max(0, amt),
          dueDate: d.toISOString().split("T")[0],
          notes: `EMI Slot ${i} of ${validCount} (Due in ${i * 30} days)`,
        });
      }
    }
    setInstallmentsSchedule(slots);
  };

  const generateLumpsumSchedule = (netPayable: number, downPayment: number, dueDateStr?: string) => {
    const validDownPayment = Math.max(0, Math.min(netPayable, downPayment));
    const remaining = Math.max(0, netPayable - validDownPayment);
    const slots: Array<{ installmentNumber: number; amount: number; dueDate: string; notes: string }> = [];
    const today = new Date();

    slots.push({
      installmentNumber: 1,
      amount: validDownPayment,
      dueDate: today.toISOString().split("T")[0],
      notes: remaining === 0 ? "Full Lumpsum Admission Fee" : "Slot 1 (Admission Down-Payment)",
    });

    if (remaining > 0) {
      slots.push({
        installmentNumber: 2,
        amount: remaining,
        dueDate: dueDateStr || todayDateStr,
        notes: "Remaining Lumpsum Balance (Due within 45 days)",
      });
    }
    setInstallmentsSchedule(slots);
  };

  const handleDownPaymentChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setPaidAmountInr(safeVal);
    if (paymentPlan === "EMI") {
      generateInstallments(installmentCount, finalFeeInr, safeVal);
    } else {
      generateLumpsumSchedule(finalFeeInr, safeVal, lumpsumRemainingDueDate);
    }
  };

  const handleSelectPaymentPlan = (plan: "LUMPSUM" | "EMI") => {
    setPaymentPlan(plan);
    if (plan === "EMI") {
      const dp = (paidAmountInr >= finalFeeInr || paidAmountInr === 0) ? 0 : paidAmountInr;
      setPaidAmountInr(dp);
      generateInstallments(installmentCount, finalFeeInr, dp);
    } else {
      const dp = paidAmountInr === 0 ? finalFeeInr : paidAmountInr;
      setPaidAmountInr(dp);
      generateLumpsumSchedule(finalFeeInr, dp, lumpsumRemainingDueDate);
    }
  };

  const handleTenureChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(10, count));
    setInstallmentCount(safeCount);
    if (paymentPlan === "EMI") {
      generateInstallments(safeCount, finalFeeInr, paidAmountInr);
    }
  };

  useEffect(() => {
    if (application) {
      setApplicantName(application.applicantName || "");
      setFatherName(application.fatherName || "");
      setMotherName(application.motherName || "");
      if (application.dateOfBirth) {
        const d = new Date(application.dateOfBirth);
        if (!isNaN(d.getTime())) {
          setDateOfBirth(d.toISOString().split("T")[0]);
        } else {
          setDateOfBirth("");
        }
      } else {
        setDateOfBirth("");
      }
      setGender(application.gender || "MALE");

      setApplicantEmail(application.applicantEmail || "");
      setApplicantPhone(application.applicantPhone || "");
      setAlternatePhone(application.alternatePhone || "");
      setWhatsappNumber(application.whatsappNumber || "");
      setAddress(application.address || "");
      setCity(application.city || "");
      setState(application.state || "");
      setPincode(application.pincode || "");
      setCenter(application.center || "");

      setHighestQualification(application.highestQualification || "");
      setSchoolOrCollege(application.schoolOrCollege || "");
      setPassingYear(application.passingYear || "");
      setPercentageOrCgpa(application.percentageOrCgpa || "");

      // Financial Details
      const fs = application.convertedStudentProfile?.feeStructures?.[0];
      const initialTotal = fs?.totalCourseFee
        ? fs.totalCourseFee / 100
        : application.course?.baseFee
        ? application.course.baseFee / 100
        : 0;
      const initialPaid = fs?.paidAmount ? fs.paidAmount / 100 : 0;
      const initialDiscount = fs?.discountAmount ? fs.discountAmount / 100 : 0;

      setTotalCourseFeeInr(initialTotal);
      setPaidAmountInr(initialPaid);

      if (initialDiscount > 0 && initialTotal > 0) {
        setDiscountType("PERCENTAGE");
        setDiscountValue(Math.round((initialDiscount / initialTotal) * 100));
      } else {
        setDiscountValue(0);
      }

      if (fs?.installments && fs.installments.length > 0) {
        setPaymentPlan("EMI");
        setInstallmentCount(fs.installments.length);
        setInstallmentsSchedule(
          fs.installments.map((i: any) => ({
            installmentNumber: i.installmentNumber,
            amount: i.amount / 100,
            dueDate: new Date(i.dueDate).toISOString().split("T")[0],
            notes: i.notes || "",
          }))
        );
      } else {
        setPaymentPlan("LUMPSUM");
        setInstallmentCount(6);
        generateInstallments(6, initialTotal - initialDiscount, initialPaid);
      }

      // Initial photo from application or converted profile/user
      const initialPhoto =
        application.photoUrl ||
        application.convertedStudentProfile?.photoUrl ||
        application.convertedStudentProfile?.user?.avatarUrl ||
        null;
      setPhotoUrl(initialPhoto);

      setBatchId(application.batchId || "");
      setStage(application.stage || ApplicationStage.UNDER_REVIEW);
      setRemarks(application.remarks || fs?.remarks || "");
      setErrorMsg(null);
      setActiveTab("personal");
    }
  }, [application]);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateMutation = api.crm.updateApplication.useMutation({
    onSuccess: () => {
      setErrorMsg(null);
      utils.crm.listApplications.invalidate();
      utils.crm.getApplicationDetails.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update application.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    const cleanPhone = applicantPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please provide a valid 10-digit mobile number.");
      return;
    }

    // Down Payment validation
    if (paidAmountInr > finalFeeInr) {
      setErrorMsg(`Down payment (₹${paidAmountInr.toLocaleString("en-IN")}) cannot exceed the total payable fee (₹${finalFeeInr.toLocaleString("en-IN")}).`);
      return;
    }

    // EMI Tenure validation (1 to 10 months)
    if (paymentPlan === "EMI" && (installmentCount < 1 || installmentCount > 10)) {
      setErrorMsg("EMI duration must be between 1 and 10 months.");
      return;
    }

    // Lumpsum 45-day validation
    if (paymentPlan === "LUMPSUM" && paidAmountInr < finalFeeInr) {
      const todayMs = new Date().setHours(0, 0, 0, 0);
      const dueMs = new Date(lumpsumRemainingDueDate).setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));
      if (diffDays > 45) {
        setErrorMsg("Lumpsum remaining balance due date cannot exceed 45 days from admission date.");
        return;
      }
      if (diffDays < 0) {
        setErrorMsg("Lumpsum remaining balance due date cannot be in the past.");
        return;
      }
    }

    // Total Installments Sum validation
    if (finalFeeInr > 0 && installmentsSchedule.length > 0) {
      const totalScheduled = installmentsSchedule.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      if (totalScheduled !== finalFeeInr) {
        setErrorMsg(`Total of all installment slots (₹${totalScheduled.toLocaleString("en-IN")}) must equal the final payable fee (₹${finalFeeInr.toLocaleString("en-IN")}).`);
        return;
      }
    }

    updateMutation.mutate({
      applicationId: application.id,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: cleanPhone,
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || undefined,
      alternatePhone: alternatePhone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      center: center.trim() || undefined,
      highestQualification: highestQualification.trim() || undefined,
      schoolOrCollege: schoolOrCollege.trim() || undefined,
      passingYear: passingYear.trim() || undefined,
      percentageOrCgpa: percentageOrCgpa.trim() || undefined,
      photoUrl: photoUrl || undefined,
      batchId: batchId || null,
      stage,
      totalCourseFee: totalCourseFeeInr > 0 ? totalCourseFeeInr * 100 : undefined,
      discountType: discountValue > 0 ? discountType : undefined,
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountAmount: discountAmountInr > 0 ? discountAmountInr * 100 : undefined,
      finalFee: finalFeeInr * 100,
      paymentPlan,
      installmentCount: paymentPlan === "EMI" ? installmentCount : undefined,
      installments:
        installmentsSchedule.length > 0
          ? installmentsSchedule.map((s) => ({
              installmentNumber: s.installmentNumber,
              amount: Math.round(s.amount * 100),
              dueDate: new Date(s.dueDate),
              notes: s.notes,
            }))
          : undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 max-h-[90vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-600" />
              <span>Edit Student Admission: {application.applicationNumber}</span>
            </DialogTitle>
            {application.convertedStudentProfile && (
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                Admitted ({application.convertedStudentProfile.studentId || "Student"})
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Edit full candidate credentials, passport photo (updates ID card live), academic, fee, discount (5-45%), and 10M EMI details.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 text-xs font-medium space-x-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "personal"
                ? "border-emerald-600 text-emerald-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            1. Personal & Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "contact"
                ? "border-emerald-600 text-emerald-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            2. Contact & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("academic")}
            className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "academic"
                ? "border-emerald-600 text-emerald-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            3. Academic Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admission")}
            className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "admission"
                ? "border-emerald-600 text-emerald-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            4. Cohort & Stage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fee")}
            className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "fee"
                ? "border-emerald-600 text-emerald-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>5. Fee, 5-45% Discount & 10M EMI</span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
              Live
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* TAB 1: Personal Details & Student Photo */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              {/* Photo Upload Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <Label className="text-xs font-semibold text-slate-700 block mb-2">
                  Student Passport Photograph (Real-time Student ID Card Photo)
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-24 border-2 border-dashed border-slate-300 rounded-md bg-white flex items-center justify-center overflow-hidden shadow-sm">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Student Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <User className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="text-[9px] text-slate-400">No Photo</span>
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center gap-1.5 h-8 bg-white border-slate-300 hover:border-emerald-500 hover:text-emerald-700"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>{photoUrl ? "Change Photo" : "Upload Photo"}</span>
                      </Button>
                      {photoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhotoUrl(null)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      This photo is instantly printed on the student's ID Card and profile across LMS. Max 5MB (JPG, PNG).
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>Candidate Full Name *</span>
                  </Label>
                  <Input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                    placeholder="Candidate full name"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Gender</Label>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Father's Name</Label>
                  <Input
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's full name"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Mother's Name</Label>
                  <Input
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Mother's full name"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Date of Birth</span>
                  </Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Admission Center / Branch</Label>
                  <Input
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    placeholder="e.g. Civil Lines, Prayagraj"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contact & Address Coordinates */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>Primary Mobile Number *</span>
                  </Label>
                  <Input
                    type="tel"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    required
                    placeholder="10-digit mobile"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span>Email Address *</span>
                  </Label>
                  <Input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    required
                    placeholder="student@example.com"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">WhatsApp Number</Label>
                  <Input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="WhatsApp contact"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Alternate Phone</Label>
                  <Input
                    type="tel"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="Parent / Guardian contact"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>Permanent / Current Residential Address</span>
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat No, Street, Landmark"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Prayagraj"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">State</Label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Pincode</Label>
                  <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 211001"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Academic Profile */}
          {activeTab === "academic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 text-slate-400" />
                    <span>Highest Qualification</span>
                  </Label>
                  <Input
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    placeholder="e.g. B.Tech CS / BCA / MCA"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <School className="h-3 w-3 text-slate-400" />
                    <span>School / College / University</span>
                  </Label>
                  <Input
                    value={schoolOrCollege}
                    onChange={(e) => setSchoolOrCollege(e.target.value)}
                    placeholder="e.g. University of Allahabad / AKTU"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Passing Year</Label>
                  <Input
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                    placeholder="e.g. 2024 / 2025"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Percentage / CGPA</Label>
                  <Input
                    value={percentageOrCgpa}
                    onChange={(e) => setPercentageOrCgpa(e.target.value)}
                    placeholder="e.g. 78.5% or 8.2 CGPA"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Cohort & Admission Stage */}
          {activeTab === "admission" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="h-3 w-3 text-slate-400" />
                    <span>Assigned Cohort / Batch</span>
                  </Label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                  >
                    <option value="">-- None / Unassigned --</option>
                    {batches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Admission Stage</Label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ApplicationStage)}
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                  >
                    {Object.values(ApplicationStage).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Counselor / Official Remarks</Label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Add any internal admission or verification remarks..."
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 5: Fee, 5-45% Discount & 10M EMI */}
          {activeTab === "fee" && (
            <div className="space-y-4">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Fee</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    ₹{totalCourseFeeInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Discount</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">
                    -₹{discountAmountInr.toLocaleString("en-IN")}
                    {discountValue > 0 && discountType === "PERCENTAGE" && ` (${discountValue}%)`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Net Payable</span>
                  <span className="font-bold text-blue-700 font-mono text-sm">
                    ₹{finalFeeInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Paid So Far</span>
                  <span className="font-bold text-emerald-800 font-mono text-sm">
                    ₹{paidAmountInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Balance Due</span>
                  <span className={`font-bold font-mono text-sm ${pendingAmountInr > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    ₹{pendingAmountInr.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Editable Fee, Discount & Down Payment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-800">
                    Editable Total Course Fee (₹) *
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={totalCourseFeeInr}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setTotalCourseFeeInr(val);
                      if (paymentPlan === "EMI") {
                        const newNet = Math.max(0, val - discountAmountInr);
                        generateInstallments(installmentCount, newNet, paidAmountInr);
                      }
                    }}
                    required
                    className="h-8 text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Base course tuition fee. Updates live in student profile.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-slate-700">Quick Scholarship Discount</Label>
                    {discountAmountInr > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        -₹{discountAmountInr.toLocaleString("en-IN")} Off
                      </span>
                    )}
                  </div>

                  {/* 5% to 45% Quick Buttons */}
                  <div className="flex flex-wrap gap-1 items-center pb-1">
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountType("PERCENTAGE");
                          setDiscountValue(pct);
                          setDiscountReason(`Counselor Scholarship (${pct}% Off)`);
                          if (paymentPlan === "EMI") {
                            const newDiscount = Math.round((totalCourseFeeInr * pct) / 100);
                            const newNet = Math.max(0, totalCourseFeeInr - newDiscount);
                            generateInstallments(installmentCount, newNet, paidAmountInr);
                          }
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-bold border transition ${
                          discountType === "PERCENTAGE" && discountValue === pct
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shrink-0 w-24 font-medium"
                    >
                      <option value="PERCENTAGE">% Off</option>
                      <option value="FIXED">Flat ₹</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setDiscountValue(val);
                        if (paymentPlan === "EMI") {
                          const discAmt = discountType === "PERCENTAGE" ? Math.round((totalCourseFeeInr * val) / 100) : val;
                          const newNet = Math.max(0, totalCourseFeeInr - discAmt);
                          generateInstallments(installmentCount, newNet, paidAmountInr);
                        }
                      }}
                      placeholder={discountType === "PERCENTAGE" ? "5 - 45%" : "Flat Discount ₹"}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-emerald-700">
                    Down Payment / Paid Today (₹)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={finalFeeInr}
                    value={paidAmountInr}
                    onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                    className="h-8 text-xs font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {paymentPlan === "EMI"
                      ? "Actual down payment; remainder splits into EMIs"
                      : paidAmountInr < finalFeeInr
                      ? "Balance must be cleared within 45 days"
                      : "Full fee paid"}
                  </span>
                </div>
              </div>

              {/* Payment Plan: Lumpsum vs EMI Slot */}
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Payment Structure & EMI Schedule</span>
                  </Label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Lumpsum or Monthly EMI (Up to 10 Months)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentPlan("LUMPSUM")}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      paymentPlan === "LUMPSUM"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>Lumpsum (One-Time Payment)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentPlan("EMI")}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      paymentPlan === "EMI"
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
                    }`}
                  >
                    <span>EMI Plan (Up to 10 Months)</span>
                  </button>
                </div>

                {/* Lumpsum Remaining Balance (Due within 45 Days) */}
                {paymentPlan === "LUMPSUM" && paidAmountInr < finalFeeInr && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-amber-700" />
                          <span>Lumpsum Remaining Balance (Due within 45 Days)</span>
                        </span>
                        <span className="font-mono font-bold text-amber-800 text-sm">
                          ₹{(finalFeeInr - paidAmountInr).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Under Lumpsum policy, remaining balance after down payment must be cleared within maximum 45 days.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Label className="text-[11px] font-semibold text-amber-900 shrink-0">
                          Balance Due Date:
                        </Label>
                        <input
                          type="date"
                          min={todayDateStr}
                          max={maxLumpsumDueDateStr}
                          value={lumpsumRemainingDueDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLumpsumRemainingDueDate(val);
                            generateLumpsumSchedule(finalFeeInr, paidAmountInr, val);
                          }}
                          className="h-7 px-2 border border-amber-300 rounded text-xs bg-white text-slate-800 font-medium"
                        />
                        <span className="text-[10px] text-amber-600">
                          (Max allowed: {maxLumpsumDueDateStr})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMI Slot Configuration Box */}
                {paymentPlan === "EMI" && (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700">
                        Select EMI Duration (1 to 10 Months):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => handleTenureChange(count)}
                            className={`px-2 py-1 text-xs rounded font-bold border transition ${
                              installmentCount === count
                                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {count}M
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
                                    Slot 1 (Admission Down-Payment)
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
                                  className="h-7 rounded border border-slate-300 px-2 py-0.5 text-xs font-mono"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={slot.amount}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    if (index === 0) {
                                      handleDownPaymentChange(val);
                                    } else {
                                      const updated = [...installmentsSchedule];
                                      updated[index].amount = val;
                                      setInstallmentsSchedule(updated);
                                    }
                                  }}
                                  className="h-7 w-24 text-right rounded border border-slate-300 px-2 py-0.5 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">
                                <input
                                  type="text"
                                  value={slot.notes || ""}
                                  onChange={(e) => {
                                    const updated = [...installmentsSchedule];
                                    updated[index].notes = e.target.value;
                                    setInstallmentsSchedule(updated);
                                  }}
                                  placeholder="Slot notes"
                                  className="h-7 w-full rounded border border-slate-200 px-2 text-xs"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Real-time sync to Student ID card and Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending || isUploadingPhoto}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending || isUploadingPhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save & Sync All"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}