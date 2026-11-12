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
import { Badge } from "@/components/ui/badge";
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
  MessageSquare,
  ExternalLink,
  Award,
  Percent,
  Trash2,
  Plus,
  Clock,
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
  const [providerMode, setProviderMode] = useState<"SOFTLAB" | "CERTIFICATION" | "UNIVERSITY">("SOFTLAB");
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
  const [pincode, setPincode] = useState("211011");

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
  const [counselorId, setCounselorId] = useState<string>("");
  const [requestDiscountApproval, setRequestDiscountApproval] = useState<boolean>(false);
  const [customTotalFee, setCustomTotalFee] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [includeGlobalCertification, setIncludeGlobalCertification] = useState<boolean>(false);
  const [includeKitFee, setIncludeKitFee] = useState<boolean>(false);
  const [includeGst, setIncludeGst] = useState<boolean>(false);

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
  const [lumpsumRemainingDueDate, setLumpsumRemainingDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

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
  const [copiedSalesCard, setCopiedSalesCard] = useState(false);

  const utils = api.useUtils();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const filteredCourses = courses.filter((c: any) => {
    if (providerMode === "UNIVERSITY") {
      return c.providerType === "UNIVERSITY";
    }
    if (providerMode === "CERTIFICATION") {
      return c.programCategory === "CERTIFICATION";
    }
    return c.providerType !== "UNIVERSITY" && c.programCategory !== "CERTIFICATION";
  });

  const { data: batchesData } = api.batch.list.useQuery(
    { courseId: courseId || undefined, pageSize: 50 },
    { enabled: !!courseId && providerMode !== "UNIVERSITY" }
  );
  const batches = batchesData?.batches || [];

  const { data: leadsData } = api.crm.listLeads.useQuery({ limit: 50 });
  const leads = leadsData?.leads || [];

  const { data: counselorsList = [] } = api.crm.listCounselors.useQuery(undefined, {
    enabled: isSuperAdminOrDirector,
  });

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

  // CANONICAL P0 ADMISSION FEE CALCULATION (Controlled by Sales Team):
  // 1. Original Course Fee
  // - 2. Sales Team Entered/Approved Discount
  // = 3. Final Discounted Course Fee (Net Course Fee)
  // + 4. Additional Pass-Through Charges (Kit ₹1,000 / Global Cert ₹3,500)
  // + 5. Applicable Tax (GST 18%)
  // = 6. Final Student Payable Amount
  // - 7. Agreed Down Payment
  // = 8. Remaining Outstanding Fee
  const netCourseFeeInr = Math.max(0, courseFeeInr - discountAmountInr);
  const globalCertFeeInr = includeGlobalCertification ? 3500 : 0;
  const kitFeeInr = includeKitFee ? 1000 : 0;
  const additionalChargesInr = globalCertFeeInr + kitFeeInr;
  const taxableBaseInr = netCourseFeeInr + additionalChargesInr;
  const gstAmountInr = includeGst ? Math.round(taxableBaseInr * 0.18) : 0;
  const finalFeeInr = netCourseFeeInr + additionalChargesInr + gstAmountInr;
  const pendingAmountInr = Math.max(0, finalFeeInr - (paidAmount || 0));
  const remainingOutstandingFeeInr = pendingAmountInr;
  const discountPercentCalculated = courseFeeInr > 0 ? Math.round((discountAmountInr / courseFeeInr) * 100) : 0;
  const isPromotionalPeriod = Date.now() <= new Date("2026-11-20T23:59:59.999+05:30").getTime();
  const maxAllowedCounselorDiscountPct = isPromotionalPeriod ? 35 : 10;
  const isCounselor = authUser?.roleCode === "COUNSELOR" || authUser?.roleCode === "TELECALLER";
  const isHigherDiscount = discountPercentCalculated > maxAllowedCounselorDiscountPct;
  const isDiscountOverLimit = isHigherDiscount && !isSuperAdminOrDirector;
  const requiresApproval = isCounselor && (isHigherDiscount || requestDiscountApproval);

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
          if (target.providerType === "UNIVERSITY") {
            setProviderMode("UNIVERSITY");
          } else if (target.programCategory === "CERTIFICATION") {
            setProviderMode("CERTIFICATION");
          } else {
            setProviderMode("SOFTLAB");
          }
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

  const todayDateStr = React.useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Update Slot 1 (Down Payment) when paidAmount changes
  const handleDownPaymentChange = React.useCallback((val: number) => {
    const safeVal = Math.max(0, val);
    setPaidAmount(safeVal);
    setInstallmentsSchedule((prev) => {
      if (prev.length === 0) {
        return [
          {
            installmentNumber: 1,
            amount: safeVal,
            dueDate: todayDateStr,
            notes: "Slot 1 (Admission Down-Payment)",
          },
        ];
      }
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        amount: safeVal,
      };
      return updated;
    });
  }, [todayDateStr]);

  // Synchronize Slot 1 (Down Payment) when finalFeeInr initializes or changes
  React.useEffect(() => {
    setInstallmentsSchedule((prev) => {
      if (prev.length === 0) {
        return [
          {
            installmentNumber: 1,
            amount: paidAmount,
            dueDate: todayDateStr,
            notes: "Slot 1 (Admission Down-Payment)",
          },
        ];
      }
      return prev;
    });
  }, [finalFeeInr, todayDateStr]);

  // Add a new installment row to the agreed schedule
  const handleAddInstallment = () => {
    const totalScheduled = installmentsSchedule.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const remainingUnscheduled = Math.max(0, finalFeeInr - totalScheduled);
    const nextSlotNum = installmentsSchedule.length + 1;
    const lastDateStr = installmentsSchedule.length > 0
      ? installmentsSchedule[installmentsSchedule.length - 1].dueDate
      : todayDateStr;
    const nextDate = new Date(lastDateStr);
    nextDate.setDate(nextDate.getDate() + 30);

    setInstallmentsSchedule([
      ...installmentsSchedule,
      {
        installmentNumber: nextSlotNum,
        amount: remainingUnscheduled,
        dueDate: nextDate.toISOString().split("T")[0],
        notes: `Installment #${nextSlotNum}`,
      },
    ]);
  };

  // Remove an installment row (only future slots, index > 0)
  const handleRemoveInstallment = (index: number) => {
    if (index === 0) return; // Slot 1 is Down Payment, cannot be deleted
    const filtered = installmentsSchedule.filter((_, i) => i !== index);
    const reindexed = filtered.map((slot, i) => ({
      ...slot,
      installmentNumber: i + 1,
      notes: i === 0 ? "Slot 1 (Admission Down-Payment)" : (slot.notes?.startsWith("Installment #") ? `Installment #${i + 1}` : slot.notes),
    }));
    setInstallmentsSchedule(reindexed);
  };

  // Auto-balance the exact difference on the last installment
  const handleAutoBalanceLast = () => {
    if (installmentsSchedule.length <= 1) return;
    const totalWithoutLast = installmentsSchedule.slice(0, -1).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const needed = Math.max(0, finalFeeInr - totalWithoutLast);
    const updated = [...installmentsSchedule];
    updated[updated.length - 1].amount = needed;
    setInstallmentsSchedule(updated);
  };

  // Optional helper tool: divide remaining balance across N future installments
  const handleSplitRemainingEqually = (numInstallments: number) => {
    const parts = Math.max(1, numInstallments);
    const remaining = Math.max(0, finalFeeInr - paidAmount);
    const perPart = Math.floor(remaining / parts);
    let allocated = 0;
    const newSchedule = [
      {
        installmentNumber: 1,
        amount: paidAmount,
        dueDate: todayDateStr,
        notes: "Slot 1 (Admission Down-Payment)",
      },
    ];
    const baseDate = new Date();
    for (let i = 1; i <= parts; i++) {
      const isLast = i === parts;
      const amt = isLast ? (remaining - allocated) : perPart;
      allocated += perPart;
      const d = new Date(baseDate);
      d.setDate(d.getDate() + (i * 30));
      newSchedule.push({
        installmentNumber: i + 1,
        amount: amt,
        dueDate: d.toISOString().split("T")[0],
        notes: `Installment #${i + 1}`,
      });
    }
    setInstallmentsSchedule(newSchedule);
  };

  // Reset to full lumpsum payment
  const handleSetFullSettlement = () => {
    setPaidAmount(finalFeeInr);
    setInstallmentsSchedule([
      {
        installmentNumber: 1,
        amount: finalFeeInr,
        dueDate: todayDateStr,
        notes: "Full Admission Settlement (One-Time)",
      },
    ]);
  };

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

      // If admission requires higher authority approval, don't dispatch direct credentials yet
      if (res.requiresApproval) {
        if (onSuccess && res.application?.id) onSuccess(res.application.id);
        return;
      }

      // Auto-Dispatch 1: Send credentials directly to the student's personal WhatsApp number
      const studPhone = ((res.credentials as any)?.phone || applicantPhone || whatsappNumber || "").replace(/\D/g, "");
      if (studPhone.length >= 10) {
        const fullStudPhone = studPhone.length === 10 ? `91${studPhone}` : studPhone;
        const studentMsg = `🎓 *OFFICIAL ADMISSION CONFIRMED — SOFTLAB GLOBAL* 🚀\n\nDear *${res.credentials?.fullName || applicantName}*,\nCongratulations on your confirmed admission!\n\n📋 *ADMISSION DETAILS*:\n• Student ID: *${res.credentials?.studentId}*\n• Admission No: *${res.credentials?.admissionNumber}*\n• Program: *${res.universityProgram || selectedCourse?.title || "Professional Program"}*\n\n🔑 *STUDENT LMS PORTAL LOGIN CREDENTIALS*:\n• Portal: https://softlabglobal.com/login\n• Username: *${res.credentials?.email || applicantEmail}*\n• Temporary Password: *${res.credentials?.temporaryPassword}*\n\n📞 Admissions Helpline: +91 9196596979\n🌐 www.softlabglobal.com`;
        const studentWaUrl = `https://api.whatsapp.com/send?phone=${fullStudPhone}&text=${encodeURIComponent(studentMsg)}`;
        window.open(studentWaUrl, "_blank");
      }

      // Auto-Dispatch 2: Also open WhatsApp sales group broadcast window
      if (res.salesGroupBroadcastUrl) {
        setTimeout(() => window.open(res.salesGroupBroadcastUrl, "_blank"), 500);
      } else if (res.salesGroupMessage) {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(res.salesGroupMessage)}`;
        setTimeout(() => window.open(url, "_blank"), 500);
      }

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
      if (targetLead.interestedCourseId) {
        setCourseId(targetLead.interestedCourseId);
        const target = courses.find((c: any) => c.id === targetLead.interestedCourseId);
        if (target) {
          if (target.providerType === "UNIVERSITY") {
            setProviderMode("UNIVERSITY");
          } else if (target.programCategory === "CERTIFICATION") {
            setProviderMode("CERTIFICATION");
          } else {
            setProviderMode("SOFTLAB");
          }
          if (target.baseFee) setCustomTotalFee(target.baseFee / 100);
        }
      }
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

    // Down Payment validation
    if (paidAmount > finalFeeInr) {
      setErrorMsg(`Down payment (₹${paidAmount.toLocaleString("en-IN")}) cannot exceed the Final Discounted Fee (₹${finalFeeInr.toLocaleString("en-IN")}).`);
      return;
    }

    // Required Arithmetic Validation:
    // Total of Down Payment + All Scheduled Installments = Final Discounted Fee.
    const totalScheduled = installmentsSchedule.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const scheduleDiff = finalFeeInr - totalScheduled;
    if (scheduleDiff !== 0) {
      setErrorMsg(
        scheduleDiff > 0
          ? `Schedule mismatch: Scheduled total (₹${totalScheduled.toLocaleString("en-IN")}) is ₹${scheduleDiff.toLocaleString("en-IN")} short of Final Discounted Fee (₹${finalFeeInr.toLocaleString("en-IN")}). Please balance the installments.`
          : `Schedule mismatch: Scheduled total (₹${totalScheduled.toLocaleString("en-IN")}) exceeds Final Discounted Fee (₹${finalFeeInr.toLocaleString("en-IN")}) by ₹${Math.abs(scheduleDiff).toLocaleString("en-IN")}. Please correct the installment amounts.`
      );
      return;
    }

    // Prevent negative or zero future installments
    for (const inst of installmentsSchedule) {
      if (inst.amount < 0) {
        setErrorMsg(`Installment #${inst.installmentNumber} cannot have a negative amount.`);
        return;
      }
      if (inst.installmentNumber > 1 && inst.amount === 0) {
        setErrorMsg(`Future Installment #${inst.installmentNumber} cannot be zero. Please remove it or enter an agreed amount.`);
        return;
      }
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
      totalCourseFee: Math.round(courseFeeInr * 100),
      discountType: discountValue > 0 ? discountType : undefined,
      discountValue: discountValue > 0 ? Number(discountValue) : undefined,
      discountAmount: discountAmountInr > 0 ? Math.round(discountAmountInr * 100) : 0,
      discountReason: discountReason.trim() || undefined,
      globalCertificationFee: Math.round(globalCertFeeInr * 100),
      slgKitFee: Math.round(kitFeeInr * 100),
      gstAmount: Math.round(gstAmountInr * 100),
      cgstAmount: Math.round((gstAmountInr * 100) / 2),
      sgstAmount: Math.round((gstAmountInr * 100) / 2),
      finalFee: Math.round(finalFeeInr * 100),
      paidAmount: Math.round((paidAmount || 0) * 100),
      paymentPlan: installmentsSchedule.length > 1 ? "EMI" : "LUMPSUM",
      installmentCount: installmentsSchedule.length,
      installments: installmentsSchedule.length > 0 ? installmentsSchedule.map((s) => ({
        installmentNumber: s.installmentNumber,
        amount: Math.round(Number(s.amount) * 100),
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
      counselorId: isSuperAdminOrDirector && counselorId ? counselorId : undefined,
      requestDiscountApproval: requiresApproval,
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
Advisory Center: 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`
      : `SOFTLAB GLOBAL — STUDENT LMS LOGIN CREDENTIALS
Student Name: ${createdResult.credentials.fullName}
Student ID: ${createdResult.credentials.studentId}
Admission No: ${createdResult.credentials.admissionNumber}
Portal URL: https://softlabglobal.com/login
Login Email: ${createdResult.credentials.email}
Temporary Password: ${createdResult.credentials.temporaryPassword}
Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`;

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
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setLumpsumRemainingDueDate(d.toISOString().split("T")[0]);
    setRemarks("");
    setSelectedSpecialization("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleResetForm(); }}>
      <div className="max-h-[85vh] overflow-y-auto px-1">
        {authUser?.roleCode === "TELECALLER" ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Telecallers do not have permission to create direct admissions or collect fees. Please transfer qualified prospects to an Academic Counselor.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
        {/* =================================================================== */}
        {/* VIEW 1: DUAL FEE RECEIPT MODAL */}
        {/* =================================================================== */}
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
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
        {/* VIEW 3: SUCCESSFUL ADMISSION CONFIRMATION & CREDENTIALS / APPROVAL VIEW */}
        {/* =================================================================== */}
        {createdResult && !viewingReceipt && !viewingIdCard && (
          createdResult.requiresApproval ? (
            <div className="space-y-4 p-4 text-slate-900">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Admission Submitted for Higher Authority Approval
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Application <span className="font-mono font-bold text-slate-800">{createdResult.application?.applicationNumber}</span> has been logged under review.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 pb-2 border-b border-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span>Special Discount Approval Requested</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Applicant Name</span>
                    <span className="font-semibold text-slate-900">{applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Target Program</span>
                    <span className="font-semibold text-slate-900">{selectedCourse?.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Original Course Fee</span>
                    <span className="font-semibold text-slate-800">₹{courseFeeInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Requested Discount</span>
                    <span className="font-bold text-emerald-700">
                      ₹{discountAmountInr.toLocaleString("en-IN")} ({discountPercentCalculated}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Agreed Final Payable</span>
                    <span className="font-bold text-slate-900">₹{finalFeeInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Agreed Down Payment</span>
                    <span className="font-bold text-emerald-800">₹{paidAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                {discountReason && (
                  <div className="pt-2 border-t border-amber-200 text-xs">
                    <span className="text-slate-500 text-[11px] block">Counselor Justification / Reason:</span>
                    <span className="italic text-slate-700 font-medium">"{discountReason}"</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Automatic Post-Approval Dispatch Configured</span>
                </p>
                <p className="text-[11px] text-blue-700">
                  As soon as the Director or Super Admin approves this admission from their desk, the student profile, LMS account credentials, official fee receipt, and student ID card will be automatically generated and dispatched via <strong>Email & WhatsApp</strong> to the student.
                </p>
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreatedResult(null);
                    onOpenChange(false);
                  }}
                  className="text-xs h-8"
                >
                  Close Desk
                </Button>
              </DialogFooter>
            </div>
          ) : (
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

            {/* 1-Click WhatsApp Sales Group Broadcast */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      WhatsApp Sales Group Notification
                      <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full">
                        Automated
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Post complete student admission dossier to the official sales team group.
                    </p>
                  </div>
                </div>
                {createdResult.salesGroupLink && (
                  <a
                    href={createdResult.salesGroupLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-700 underline font-medium hover:text-emerald-900 flex items-center gap-0.5"
                  >
                    <span>Sales Group</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    if (createdResult.salesGroupBroadcastUrl) {
                      window.open(createdResult.salesGroupBroadcastUrl, "_blank");
                    } else if (createdResult.salesGroupMessage) {
                      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(createdResult.salesGroupMessage)}`;
                      window.open(url, "_blank");
                    } else {
                      window.open("https://chat.whatsapp.com/DpyKh8CNUvJBhly9UVEyEK", "_blank");
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 gap-1.5 shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>📢 Post to WhatsApp Sales Group</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (createdResult.salesGroupMessage) {
                      navigator.clipboard.writeText(createdResult.salesGroupMessage);
                      setCopiedSalesCard(true);
                      setTimeout(() => setCopiedSalesCard(false), 3000);
                    }
                  }}
                  className="text-xs h-9 border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedSalesCard ? "Copied!" : "Copy Card"}</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 text-[10px] text-emerald-800 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Auto-opened WhatsApp window to post directly into Sales Group.</span>
                </span>
                {createdResult.counselorDedicatedPhone && (
                  <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                    Sender Line: +91 {createdResult.counselorDedicatedPhone.replace(/\D/g, "").slice(-10)}
                  </span>
                )}
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
                    phone: applicantPhone || undefined,
                    email: createdResult.credentials.email || applicantEmail || undefined,
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
                      globalCertificationFee: 0,
                      slgKitFee: 0,
                      taxableAmount: finalFeeInr * 100,
                      cgstAmount: 0,
                      sgstAmount: 0,
                      totalGstAmount: 0,
                      sacCode: "999293",
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
          )
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

              {/* Counselor Reference (Ref) for Higher Authorities */}
              {isSuperAdminOrDirector && (
                <div className="space-y-1 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-700" />
                      <span>Counselor Reference (Ref) / Attributed Counselor</span>
                    </Label>
                    <span className="text-[10px] text-amber-700 font-medium">Attributed to Counselor</span>
                  </div>
                  <select
                    value={counselorId}
                    onChange={(e) => setCounselorId(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Direct Admission (Higher Authority / Desk Direct) --</option>
                    {counselorsList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email}) — [{c.roleCode}]
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
                    {providerMode === "UNIVERSITY"
                      ? "University Degree Program"
                      : providerMode === "CERTIFICATION"
                      ? "Industry Global Certification"
                      : "SoftLab IT Training"}
                  </span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProviderMode("SOFTLAB");
                      setCourseId("");
                      setBatchId("");
                      setSelectedSpecialization("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      providerMode === "SOFTLAB"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Flagship Courses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderMode("CERTIFICATION");
                      setCourseId("");
                      setBatchId("");
                      setSelectedSpecialization("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      providerMode === "CERTIFICATION"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold border-amber-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Certification Courses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderMode("UNIVERSITY");
                      setCourseId("");
                      setBatchId("");
                      setSelectedSpecialization("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      providerMode === "UNIVERSITY"
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>DP Global University</span>
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

                {/* Top Metrics Cards with Inbuilt 18% GST, Certification & Kit Fee Breakdown */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase">Base Tuition Fee</span>
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
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase">Net Payable (Incl. 18% GST)</span>
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

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-slate-700">Discount Mode & Value</Label>
                      {discountAmountInr > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          -₹{discountAmountInr.toLocaleString("en-IN")} ({discountPercentCalculated}% Off)
                        </span>
                      )}
                    </div>

                    {/* Quick Discount Selector Buttons 5% to 35% (Festive Chhath Puja Offer) */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Quick Discount:</span>
                        <span className="text-emerald-700 font-bold">
                          {isPromotionalPeriod ? "🌅 Chhath Puja Offer: Flat 35% Auto-Deduct" : "Standard Limit: Up to 10%"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[5, 10, 15, 20, 25, 30, 35, 40, 45].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setDiscountType("PERCENTAGE");
                              setDiscountValue(pct);
                              if (!discountReason || discountReason.includes("Scholarship") || discountReason.includes("Offer")) {
                                setDiscountReason(
                                  pct === 35
                                    ? "🌅 Chhath Puja Special Festive Concession (35% Off)"
                                    : `Special Counselor Scholarship (${pct}% Off)`
                                );
                              }
                            }}
                            className={`px-1.5 py-0.5 text-[10px] rounded font-bold border transition ${
                              discountType === "PERCENTAGE" && discountValue === pct
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                                : pct === 35
                                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {pct === 35 ? "35% (Chhath Offer)" : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
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
                        max={discountType === "PERCENTAGE" ? 100 : courseFeeInr}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        placeholder={discountType === "PERCENTAGE" ? "e.g. 35%" : "Flat Discount ₹"}
                        className="h-8 text-xs font-mono font-bold"
                      />
                    </div>
                    {discountAmountInr > 0 && (
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Deducts ₹{discountAmountInr.toLocaleString("en-IN")} from total fee
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Discount Reason / Approval
                    </Label>
                    <Input
                      placeholder="e.g. Chhath Puja Festive Offer, Merit scholarship, Director approved"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="h-8 text-xs"
                    />
                    {isDiscountOverLimit ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-0.5">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Exceeds {maxAllowedCounselorDiscountPct}% Counselor limit (Requires Director Reason)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">
                        {isPromotionalPeriod ? "Chhath Puja festive concession up to 35% pre-approved" : "Counselor approved scholarship up to 10%"}
                      </span>
                    )}

                    {isCounselor && (
                      <div className="pt-2">
                        <label className="flex items-start gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requiresApproval}
                            onChange={(e) => setRequestDiscountApproval(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="text-[11px] text-amber-900 leading-tight">
                            <span className="font-bold flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                              <span>
                                {isHigherDiscount
                                  ? `⚡ Higher Authority Approval Required (${discountPercentCalculated}% > ${maxAllowedCounselorDiscountPct}% limit)`
                                  : "Submit for Higher Authority Discount Approval"}
                              </span>
                            </span>
                            <span className="text-[10px] text-amber-700 block mt-0.5">
                              {isHigherDiscount
                                ? `Discounts above counselor limit (${maxAllowedCounselorDiscountPct}% until 10th Nov, 10% standard) require Director / Admin approval. Login credentials, receipt & WhatsApp dispatch automatically upon approval.`
                                : "Check this to route this application for Director / Super Admin discount sanction before issuing student credentials."}
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Pass-through Charges & Tax Configuration (P0 Section 4 Policy) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Additional Pass-Through Charges & Tax Options (Separately Itemized)
                    </Label>
                    <span className="text-[10px] text-slate-400">Policy: Configurable per candidate terms</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${includeGlobalCertification ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold" : "bg-white border-slate-200 text-slate-700"}`}>
                      <input
                        type="checkbox"
                        checked={includeGlobalCertification}
                        onChange={(e) => setIncludeGlobalCertification(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <span>Global Certification</span>
                        <span className="block text-[10px] text-indigo-700 font-mono">+₹3,500</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${includeKitFee ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold" : "bg-white border-slate-200 text-slate-700"}`}>
                      <input
                        type="checkbox"
                        checked={includeKitFee}
                        onChange={(e) => setIncludeKitFee(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <span>SoftLab Welcome Kit</span>
                        <span className="block text-[10px] text-indigo-700 font-mono">+₹1,000</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${includeGst ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold" : "bg-white border-slate-200 text-slate-700"}`}>
                      <input
                        type="checkbox"
                        checked={includeGst}
                        onChange={(e) => setIncludeGst(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <span>GST Tax (18%)</span>
                        <span className="block text-[10px] text-indigo-700 font-mono">
                          {includeGst ? `+₹${gstAmountInr.toLocaleString("en-IN")}` : "Exempt / Unbilled"}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Dynamic Commercial Fee Summary Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4" />
                      Canonical Commercial Fee Calculation
                    </span>
                    <Badge variant="outline" className="text-[10px] text-white border-white/30 font-mono">
                      Base - Discount + Charges + Tax
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="text-[10px] text-slate-300">Base Course Fee</div>
                      <div className="text-xs font-bold font-mono text-white mt-0.5">
                        ₹{courseFeeInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="text-[10px] text-amber-300">Sales Discount</div>
                      <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">
                        -₹{discountAmountInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="text-[10px] text-emerald-300">Net Course Fee</div>
                      <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                        ₹{netCourseFeeInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="text-[10px] text-indigo-300">Charges + GST</div>
                      <div className="text-xs font-bold font-mono text-indigo-300 mt-0.5">
                        +₹{(additionalChargesInr + gstAmountInr).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-2 border border-emerald-400/40">
                      <div className="text-[10px] text-emerald-300 font-semibold">Final Payable</div>
                      <div className="text-sm font-black font-mono text-emerald-300 mt-0.5">
                        ₹{finalFeeInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-blue-500/20 rounded-lg p-2 border border-blue-400/40">
                      <div className="text-[10px] text-blue-300 font-semibold">Remaining Due</div>
                      <div className="text-sm font-black font-mono text-blue-300 mt-0.5">
                        ₹{remainingOutstandingFeeInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completely Dynamic Agreed Installment Schedule */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-emerald-600" />
                        <span>Agreed Payment Schedule & Installment Breakdown</span>
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        Custom dates, equal or unequal amounts agreed with student. No forced fixed EMI schedules.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddInstallment}
                        className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1 font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Installment
                      </Button>

                      {remainingOutstandingFeeInr > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSplitRemainingEqually(Number(e.target.value));
                              e.target.value = "";
                            }
                          }}
                          defaultValue=""
                          className="h-7 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 font-medium"
                        >
                          <option value="" disabled>Quick Split Remaining...</option>
                          <option value="2">Split across 2 Months</option>
                          <option value="3">Split across 3 Months</option>
                          <option value="4">Split across 4 Months</option>
                          <option value="5">Split across 5 Months</option>
                          <option value="6">Split across 6 Months</option>
                          <option value="8">Split across 8 Months</option>
                          <option value="10">Split across 10 Months</option>
                          <option value="12">Split across 12 Months</option>
                        </select>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleSetFullSettlement}
                        className="h-7 text-xs text-slate-600 hover:text-slate-900"
                      >
                        Full Lumpsum
                      </Button>
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3 text-left w-36">Slot / Milestone</th>
                          <th className="py-2 px-3 text-left w-40">Agreed Due Date</th>
                          <th className="py-2 px-3 text-right w-36">Agreed Amount (₹)</th>
                          <th className="py-2 px-3 text-left">Terms / Purpose Notes</th>
                          <th className="py-2 px-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {installmentsSchedule.map((slot, index) => {
                          const isDownPayment = index === 0;
                          return (
                            <tr key={slot.installmentNumber} className={isDownPayment ? "bg-emerald-50/40" : "hover:bg-slate-50/50"}>
                              <td className="py-2 px-3 font-bold text-slate-800">
                                {isDownPayment ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-sans font-bold hover:bg-emerald-100">
                                    Slot 1 (Down Payment)
                                  </Badge>
                                ) : (
                                  <span className="text-slate-700 font-sans text-xs font-semibold">
                                    Installment #{slot.installmentNumber}
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
                                  className="h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 w-full"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={slot.amount}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    if (isDownPayment) {
                                      handleDownPaymentChange(val);
                                    } else {
                                      const updated = [...installmentsSchedule];
                                      updated[index].amount = val;
                                      setInstallmentsSchedule(updated);
                                    }
                                  }}
                                  className="h-7 w-28 px-2 border border-slate-300 rounded text-xs text-right font-bold text-slate-900 bg-white"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={slot.notes || ""}
                                  placeholder={isDownPayment ? "Admission down payment" : `Installment #${slot.installmentNumber} note`}
                                  onChange={(e) => {
                                    const updated = [...installmentsSchedule];
                                    updated[index].notes = e.target.value;
                                    setInstallmentsSchedule(updated);
                                  }}
                                  className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-700 w-full font-sans"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                {!isDownPayment ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInstallment(index)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                    title="Remove this installment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-sans">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Arithmetic Validation Status Banner */}
                  {(() => {
                    const totalScheduled = installmentsSchedule.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
                    const scheduleDiff = finalFeeInr - totalScheduled;
                    if (scheduleDiff === 0) {
                      return (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold">
                              Schedule Perfectly Balanced: Total Scheduled (₹{totalScheduled.toLocaleString("en-IN")}) = Final Discounted Fee (₹{finalFeeInr.toLocaleString("en-IN")}).
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-[10px]">
                            Exact 100% Match
                          </Badge>
                        </div>
                      );
                    } else if (scheduleDiff > 0) {
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Under-Allocated:</strong> Scheduled ₹{totalScheduled.toLocaleString("en-IN")} of ₹{finalFeeInr.toLocaleString("en-IN")}. Difference: <strong>₹{scheduleDiff.toLocaleString("en-IN")}</strong> remaining to be scheduled.
                            </span>
                          </div>
                          {installmentsSchedule.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAutoBalanceLast}
                              className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white shrink-0 font-semibold"
                            >
                              Auto-add ₹{scheduleDiff.toLocaleString("en-IN")} to Last Slot
                            </Button>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              <strong>Over-Allocated:</strong> Scheduled ₹{totalScheduled.toLocaleString("en-IN")} exceeds Final Discounted Fee (₹{finalFeeInr.toLocaleString("en-IN")}) by <strong>₹{Math.abs(scheduleDiff).toLocaleString("en-IN")}</strong>. Please reduce installment amounts.
                            </span>
                          </div>
                          {installmentsSchedule.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAutoBalanceLast}
                              className="h-7 text-xs bg-rose-700 hover:bg-rose-800 text-white shrink-0 font-semibold"
                            >
                              Trim from Last Slot
                            </Button>
                          )}
                        </div>
                      );
                    }
                  })()}
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
                        onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                        className="h-8 text-xs font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        {paidAmount >= finalFeeInr
                          ? "Full one-time fee payment (100% cleared)"
                          : paidAmount > 0
                          ? `Down payment received today (Remaining balance ₹${(finalFeeInr - paidAmount).toLocaleString("en-IN")} scheduled across future slots)`
                          : "Zero down payment today (full balance scheduled across installments)"}
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

              {(() => {
                const totalScheduledVal = installmentsSchedule.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
                const isMismatched = finalFeeInr > 0 && totalScheduledVal !== finalFeeInr;
                return (
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
                      disabled={createMutation.isPending || isUploadingPhoto || isMismatched}
                      className={`text-xs h-8 font-semibold gap-1.5 ${
                        isMismatched
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : requiresApproval
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>
                        {isMismatched
                          ? "Schedule Mismatched (Balance to Submit)"
                          : requiresApproval
                          ? "Confirm & Submit for Higher Authority Approval"
                          : "Generate Admission & Activate Account"}
                      </span>
                    </Button>
                  </DialogFooter>
                );
              })()}
            </form>
          </div>
        )}
          </>
        )}
      </div>
    </Dialog>
  );
}
