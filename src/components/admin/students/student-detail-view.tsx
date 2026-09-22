"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  ArrowLeft,
  User,
  BookOpen,
  Calendar,
  IndianRupee,
  ClipboardCheck,
  Award,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  FileCheck2,
  Shield,
  PlusCircle,
  CreditCard,
  Edit3,
  Printer,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  UploadCloud,
  Eye,
} from "lucide-react";
import { PaymentMethod, UserStatus } from "@prisma/client";
import { StudentIdCardView } from "@/components/common/student-id-card-view";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";

interface StudentDetailViewProps {
  studentId: string;
}

export function StudentDetailView({ studentId }: StudentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "courses" | "finance" | "documents" | "attendance" | "academics" | "lms" | "idcard"
  >("profile");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedReceiptData, setSelectedReceiptData] = useState<DualReceiptData | null>(null);

  // Modals / subforms
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [assignCourseOpen, setAssignCourseOpen] = useState(false);
  const [reassignBatchEnrollmentId, setReassignBatchEnrollmentId] = useState<string | null>(null);

  // Extended Edit Profile form
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editDegree, setEditDegree] = useState("");
  const [editGuardianName, setEditGuardianName] = useState("");
  const [editGuardianPhone, setEditGuardianPhone] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editAlternatePhone, setEditAlternatePhone] = useState("");
  const [editSchoolOrCollege, setEditSchoolOrCollege] = useState("");
  const [editPassingYear, setEditPassingYear] = useState("");
  const [editPercentageOrCgpa, setEditPercentageOrCgpa] = useState("");
  const [editCenter, setEditCenter] = useState("");
  const [editAdmissionDate, setEditAdmissionDate] = useState("");
  const [editIsHistorical, setEditIsHistorical] = useState(false);

  // Edit Payment modal state
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<{
    id: string;
    amount: number;
    receiptNumber: string;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    providerReference: string;
    remarks: string;
  } | null>(null);

  // Document management state
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("ID_PROOF");
  const [docUrl, setDocUrl] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // ID Card Generation state
  const [idCardValidYears, setIdCardValidYears] = useState(1);

  // Payment form
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState("");
  const [paymentAmountRupees, setPaymentAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isHistoricalPayment, setIsHistoricalPayment] = useState(false);

  // Assign Course form
  const [newCourseId, setNewCourseId] = useState("");
  const [newBatchId, setNewBatchId] = useState("");

  // Reassign Batch
  const [targetBatchId, setTargetBatchId] = useState("");

  // Reset password form
  const [newPassword, setNewPassword] = useState("");

  // Queries
  const { data: student, isLoading, refetch } = api.admin.getStudentDetails.useQuery({
    id: studentId,
  });

  React.useEffect(() => {
    if (student) {
      setEditFirstName(student.user.firstName);
      setEditLastName(student.user.lastName);
      setEditPhone(student.user.phone || "");
      setEditPhotoUrl((student as any).photoUrl || student.user.avatarUrl || "");
      setEditGender(student.gender || "MALE");
      setEditDob(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "");
      setEditAddress(student.address || "");
      setEditCity(student.city || "");
      setEditState(student.state || "");
      setEditPincode(student.pincode || "");
      setEditDegree(student.highestDegree || "");
      setEditGuardianName(student.guardianName || "");
      setEditGuardianPhone(student.guardianPhone || "");
      setEditFatherName((student as any).fatherName || "");
      setEditMotherName((student as any).motherName || "");
      setEditWhatsappNumber((student as any).whatsappNumber || "");
      setEditAlternatePhone((student as any).alternatePhone || "");
      setEditSchoolOrCollege((student as any).schoolOrCollege || "");
      setEditPassingYear((student as any).passingYear || "");
      setEditPercentageOrCgpa((student as any).percentageOrCgpa || "");
      setEditCenter((student as any).center || "");
      setEditAdmissionDate(
        (student as any).admissionDate
          ? new Date((student as any).admissionDate).toISOString().split("T")[0]
          : new Date(student.createdAt).toISOString().split("T")[0]
      );
      setEditIsHistorical((student as any).isHistorical || false);
    }
  }, [student]);

  const { data: coursesData } = api.course.list.useQuery({ pageSize: 50 });
  const { data: batchesData } = api.batch.list.useQuery({
    courseId: newCourseId || undefined,
    pageSize: 50,
  });

  // Mutations
  const updateProfileMutation = api.admin.updateStudentProfile.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Student profile updated successfully." });
      setIsEditingProfile(false);
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update profile." });
    },
  });

  const recordPaymentMutation = api.finance.recordOfflinePayment.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Payment recorded successfully and fee structure updated." });
      setPaymentOpen(false);
      setPaymentAmountRupees("");
      setPaymentReference("");
      setPaymentRemarks("");
      setReceiptNumber("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setIsHistoricalPayment(false);
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to record payment." });
    },
  });

  const updatePaymentMutation = api.finance.updatePayment.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Payment transaction record updated successfully." });
      setEditPaymentOpen(false);
      setEditingPayment(null);
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update payment transaction." });
    },
  });

  const addDocumentMutation = api.admin.addStudentDocument.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Student document successfully uploaded and linked." });
      setAddDocOpen(false);
      setDocTitle("");
      setDocUrl("");
      setDocFileName("");
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to upload document." });
    },
  });

  const deleteDocumentMutation = api.admin.deleteStudentDocument.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Student document deleted successfully." });
      setDeletingDocId(null);
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to delete document." });
    },
  });

  const generateIdCardMutation = api.admin.generateStudentIdCard.useMutation({
    onSuccess: (card) => {
      setNotification({
        type: "success",
        message: `Official Student ID Card (${card.cardNumber}) successfully issued!`,
      });
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to generate ID card." });
    },
  });

  const assignCourseMutation = api.admin.assignCourseToStudent.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "New course and fee structure successfully assigned!" });
      setAssignCourseOpen(false);
      setNewCourseId("");
      setNewBatchId("");
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to assign course." });
    },
  });

  const updateBatchMutation = api.admin.updateEnrollmentBatch.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Cohort/batch reassigned successfully." });
      setReassignBatchEnrollmentId(null);
      setTargetBatchId("");
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to reassign batch." });
    },
  });

  const resetPasswordMutation = api.admin.resetPassword.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "LMS Password reset successfully." });
      setNewPassword("");
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to reset password." });
    },
  });

  const toggleStatusMutation = api.admin.toggleUserStatus.useMutation({
    onSuccess: (updated) => {
      setNotification({ type: "success", message: `LMS access status changed to ${updated.status}.` });
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to change user status." });
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-3 text-slate-600">
          <Clock className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-base font-medium">Loading comprehensive student dossier...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Student Profile Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested student ID could not be retrieved from the database.</p>
        <Link href="/admin/students">
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Back to Student Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/students">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-slate-200">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          {((student as any).photoUrl || student.user.avatarUrl) ? (
            <img
              src={(student as any).photoUrl || student.user.avatarUrl || ""}
              alt={student.user.firstName}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-200">
              {student.user.firstName[0]}
              {student.user.lastName?.[0] || ""}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {student.user.firstName} {student.user.lastName}
              </h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-bold">
                {student.studentId}
              </Badge>
              {(student as any).isHistorical && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs">
                  HISTORICAL RECORD
                </Badge>
              )}
              <Badge
                className={
                  student.user.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {student.user.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                {student.user.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {student.user.phone}
              </span>
              <span>•</span>
              <span>
                Admission:{" "}
                {(student as any).admissionDate
                  ? new Date((student as any).admissionDate).toLocaleDateString("en-IN")
                  : new Date(student.createdAt).toLocaleDateString("en-IN")}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setAssignCourseOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Assign New Course
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg border text-sm font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Enrolled Courses</p>
              <h4 className="text-xl font-bold text-slate-800">{student.enrollments.length}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Attendance Ratio</p>
              <h4 className="text-xl font-bold text-slate-800">
                {student.attendanceStats.percentage}%
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Exams & Certs</p>
              <h4 className="text-xl font-bold text-slate-800">
                {student.examAttempts.length} / {student.certificates.length}
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Total Outstanding</p>
              <h4 className="text-xl font-bold text-slate-800">
                ₹
                {(
                  student.enrollments.reduce(
                    (sum, e) => sum + (e.feeStructure?.pendingAmount || 0),
                    0
                  ) / 100
                ).toLocaleString("en-IN")}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: "profile", label: "Profile & Personal Info", icon: <User className="h-4 w-4" /> },
            { id: "idcard", label: "Student ID Card", icon: <CreditCard className="h-4 w-4" /> },
            { id: "courses", label: "Courses & Batches", icon: <BookOpen className="h-4 w-4" /> },
            { id: "finance", label: "Fee Ledger & Receipts", icon: <IndianRupee className="h-4 w-4" /> },
            { id: "documents", label: "Documents & Records", icon: <FileText className="h-4 w-4" /> },
            { id: "attendance", label: "Attendance History", icon: <ClipboardCheck className="h-4 w-4" /> },
            { id: "academics", label: "Academics & Exams", icon: <FileCheck2 className="h-4 w-4" /> },
            { id: "lms", label: "LMS Credentials", icon: <KeyRound className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PROFILE & PERSONAL INFO */}
      {activeTab === "profile" && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Personal & Demographic Dossier</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-xs gap-1.5 border-slate-200"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {isEditingProfile ? "Cancel Editing" : "Edit Profile"}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isEditingProfile ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate({
                    studentProfileId: student.id,
                    firstName: editFirstName,
                    lastName: editLastName,
                    phone: editPhone,
                    photoUrl: editPhotoUrl.trim() || undefined,
                    gender: editGender,
                    dateOfBirth: editDob ? new Date(editDob) : undefined,
                    address: editAddress,
                    city: editCity,
                    state: editState,
                    pincode: editPincode,
                    highestDegree: editDegree,
                    guardianName: editGuardianName,
                    guardianPhone: editGuardianPhone,
                    fatherName: editFatherName,
                    motherName: editMotherName,
                    whatsappNumber: editWhatsappNumber,
                    alternatePhone: editAlternatePhone,
                    schoolOrCollege: editSchoolOrCollege,
                    passingYear: editPassingYear,
                    percentageOrCgpa: editPercentageOrCgpa,
                    center: editCenter,
                    admissionDate: editAdmissionDate ? new Date(editAdmissionDate) : undefined,
                    isHistorical: editIsHistorical,
                  });
                }}
                className="space-y-6"
              >
                {/* 1. Student Photograph */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0">
                    {editPhotoUrl ? (
                      <img
                        src={editPhotoUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-500 flex flex-col items-center justify-center text-xs border border-slate-300">
                        <User className="h-6 w-6 text-slate-400 mb-0.5" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <Label className="text-xs font-semibold text-slate-700">Student Photograph URL</Label>
                    <Input
                      placeholder="Paste image URL (e.g. https://... or leave unchanged to preserve existing photo)"
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      className="mt-1 text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports direct JPEG/PNG image links. Leave unchanged to keep the current photograph.
                    </p>
                  </div>
                </div>

                {/* 2. Personal & Identity Details */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Personal & Demographic Identity
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">First Name *</Label>
                      <Input
                        required
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Last Name *</Label>
                      <Input
                        required
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Gender</Label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        aria-label="Gender"
                        className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Date of Birth</Label>
                      <Input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contact Numbers */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Communication & Contact Channels
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Primary Mobile *</Label>
                      <Input
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">WhatsApp Number</Label>
                      <Input
                        placeholder="e.g. 9876543210"
                        value={editWhatsappNumber}
                        onChange={(e) => setEditWhatsappNumber(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Alternate Contact Phone</Label>
                      <Input
                        placeholder="e.g. Landline / Parent phone"
                        value={editAlternatePhone}
                        onChange={(e) => setEditAlternatePhone(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Family & Guardian Details */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Parents & Guardian Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Father's Name</Label>
                      <Input
                        value={editFatherName}
                        onChange={(e) => setEditFatherName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Mother's Name</Label>
                      <Input
                        value={editMotherName}
                        onChange={(e) => setEditMotherName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Guardian / Relative Name</Label>
                      <Input
                        value={editGuardianName}
                        onChange={(e) => setEditGuardianName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Guardian Contact Number</Label>
                      <Input
                        value={editGuardianPhone}
                        onChange={(e) => setEditGuardianPhone(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Address & Location */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Residential Address & Campus Center
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">Street Address</Label>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">City</Label>
                      <Input
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">State</Label>
                      <Input
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label className="text-xs font-semibold">Pincode</Label>
                      <Input
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Branch Center / Campus</Label>
                      <Input
                        placeholder="e.g. SoftLab Global, Prayagraj"
                        value={editCenter}
                        onChange={(e) => setEditCenter(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Academic Background */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Previous Education & Qualifications
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Highest Degree</Label>
                      <Input
                        placeholder="e.g. B.Tech / BCA / 12th"
                        value={editDegree}
                        onChange={(e) => setEditDegree(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">School / College / University</Label>
                      <Input
                        placeholder="e.g. Allahabad University"
                        value={editSchoolOrCollege}
                        onChange={(e) => setEditSchoolOrCollege(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Passing Year</Label>
                      <Input
                        placeholder="e.g. 2024"
                        value={editPassingYear}
                        onChange={(e) => setEditPassingYear(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Percentage / CGPA</Label>
                      <Input
                        placeholder="e.g. 78% or 8.2 CGPA"
                        value={editPercentageOrCgpa}
                        onChange={(e) => setEditPercentageOrCgpa(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Admission Administration */}
                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Institutional Admission Records
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Official Admission Date</Label>
                      <Input
                        type="date"
                        value={editAdmissionDate}
                        onChange={(e) => setEditAdmissionDate(e.target.value)}
                        className="mt-1 text-sm bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="editIsHistoricalCheck"
                        checked={editIsHistorical}
                        onChange={(e) => setEditIsHistorical(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="editIsHistoricalCheck" className="text-xs font-medium text-amber-900 cursor-pointer">
                        Mark as Historical / Legacy Student Record
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile Changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Basic & Demographic</h4>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-slate-500">Full Name: </span>
                      <span className="font-semibold text-slate-800">
                        {student.user.firstName} {student.user.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Enrollment ID: </span>
                      <span className="font-mono font-semibold text-emerald-700">{student.studentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Gender: </span>
                      <span className="font-medium text-slate-800">{student.gender || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date of Birth: </span>
                      <span className="font-medium text-slate-800">
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString("en-IN")
                          : "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Father's Name: </span>
                      <span className="font-medium text-slate-800">{(student as any).fatherName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Mother's Name: </span>
                      <span className="font-medium text-slate-800">{(student as any).motherName || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Contact & Address</h4>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-slate-500">Email: </span>
                      <span className="font-medium text-slate-800">{student.user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone: </span>
                      <span className="font-medium text-slate-800">{student.user.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">WhatsApp: </span>
                      <span className="font-medium text-slate-800">{(student as any).whatsappNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Alternate Phone: </span>
                      <span className="font-medium text-slate-800">{(student as any).alternatePhone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Address: </span>
                      <span className="font-medium text-slate-800">
                        {student.address || "N/A"}, {student.city || ""}, {student.state || ""}{" "}
                        {student.pincode ? `- ${student.pincode}` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Center: </span>
                      <span className="font-medium text-slate-800">
                        {(student as any).center || "SoftLab Global, Prayagraj"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Academic & Admission</h4>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-slate-500">Highest Degree: </span>
                      <span className="font-medium text-slate-800">{student.highestDegree || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">School / College: </span>
                      <span className="font-medium text-slate-800">{(student as any).schoolOrCollege || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Passing Year: </span>
                      <span className="font-medium text-slate-800">{(student as any).passingYear || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Percentage / CGPA: </span>
                      <span className="font-medium text-slate-800">{(student as any).percentageOrCgpa || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Admission Date: </span>
                      <span className="font-medium text-slate-800">
                        {(student as any).admissionDate
                          ? new Date((student as any).admissionDate).toLocaleDateString("en-IN")
                          : new Date(student.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Guardian Name: </span>
                      <span className="font-medium text-slate-800">{student.guardianName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Guardian Phone: </span>
                      <span className="font-medium text-slate-800">{student.guardianPhone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* TAB: OFFICIAL STUDENT ID CARD */}
      {activeTab === "idcard" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Card Management Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Official Institutional ID Card</h3>
                {(student as any).idCard ? (
                  <Badge className="bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold">
                    ISSUED: {(student as any).idCard.cardNumber}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 text-xs font-semibold">
                    NOT YET ISSUED
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(student as any).idCard
                  ? `Card Number: ${(student as any).idCard.cardNumber} • Valid Until: ${new Date(
                      (student as any).idCard.validUntil
                    ).toLocaleDateString("en-IN")}`
                  : "Generate a cryptographically verifiable student identity card linked to real learner records."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(student as any).idCard ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={generateIdCardMutation.isPending}
                  onClick={() => {
                    generateIdCardMutation.mutate({
                      studentProfileId: student.id,
                      validYears: idCardValidYears,
                    });
                  }}
                  className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold h-9"
                >
                  {generateIdCardMutation.isPending ? "Updating..." : "Re-generate ID Card"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={generateIdCardMutation.isPending}
                  onClick={() => {
                    generateIdCardMutation.mutate({
                      studentProfileId: student.id,
                      validYears: idCardValidYears,
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 shadow-sm"
                >
                  {generateIdCardMutation.isPending ? "Generating..." : "Generate Official ID Card"}
                </Button>
              )}
            </div>
          </div>

          <StudentIdCardView
            data={{
              studentName: `${student.user.firstName} ${student.user.lastName}`,
              studentId: student.studentId,
              admissionNumber: (student as any).convertedApplication?.applicationNumber || undefined,
              courseTitle: student.enrollments[0]?.course?.title || "Professional Program",
              batchCode: student.enrollments[0]?.batch?.code || undefined,
              photoUrl: (student as any).photoUrl || student.user.avatarUrl || null,
              validUntil:
                (student as any).idCard?.validUntil ||
                new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              admissionDate: (student as any).admissionDate || student.createdAt,
              center: (student as any).center || "SOFTLAB GLOBAL Campus, Prayagraj",
              emergencyPhone: student.guardianPhone || student.user.phone || undefined,
              educationProvider: (student as any).educationProvider || undefined,
              universityName: (student as any).universityName || undefined,
              universityProgram: (student as any).universityProgram || undefined,
            }}
          />
        </div>
      )}

      {/* TAB 2: ENROLLED COURSES & BATCHES */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Enrolled Courses & Batch Assignments</h3>
            <Button
              size="sm"
              onClick={() => setAssignCourseOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Assign Additional Course
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {student.enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{enrollment.course.title}</h4>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Slug: {enrollment.course.slug} • Enrolled:{" "}
                      {new Date(enrollment.enrolledAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReassignBatchEnrollmentId(enrollment.id)}
                      className="text-xs border-slate-200 hover:bg-slate-100 gap-1"
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {enrollment.batch ? "Change Batch" : "Assign Batch"}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Assigned Cohort</span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {enrollment.batch ? enrollment.batch.name : "Pending Batch Allocation"}
                      </p>
                      {enrollment.batch && (
                        <p className="text-xs text-slate-500">Cohort Code: {enrollment.batch.code}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Curriculum Progress</span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {enrollment.lessonProgress.length} Lessons Finished
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Linked Fee Ledger</span>
                      <p className="font-semibold text-slate-800 mt-1">
                        ₹
                        {((enrollment.feeStructure?.totalCourseFee || 0) / 100).toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          (Paid: ₹{((enrollment.feeStructure?.paidAmount || 0) / 100).toLocaleString("en-IN")})
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FEE LEDGER & RECEIPTS */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Fee Ledger & Transaction History</h3>
              <p className="text-xs text-slate-500">Track tuition installments, offline collections, and receipts</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (student.enrollments[0]?.feeStructure?.id) {
                    setSelectedFeeStructureId(student.enrollments[0].feeStructure.id);
                    setPaymentAmountRupees("");
                    setPaymentReference("");
                    setPaymentRemarks("Historical Fee Collection");
                    setReceiptNumber("");
                    const pastDate = (student as any).admissionDate
                      ? new Date((student as any).admissionDate).toISOString().split("T")[0]
                      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    setPaymentDate(pastDate);
                    setIsHistoricalPayment(true);
                    setPaymentOpen(true);
                  } else {
                    setNotification({ type: "error", message: "No active fee structure found for student." });
                  }
                }}
                className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs gap-1.5 shadow-sm font-semibold"
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Add Historical Fee</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (student.enrollments[0]?.feeStructure?.id) {
                    setSelectedFeeStructureId(student.enrollments[0].feeStructure.id);
                    setPaymentAmountRupees("");
                    setPaymentReference("");
                    setPaymentRemarks("");
                    setReceiptNumber("");
                    setPaymentDate(new Date().toISOString().split("T")[0]);
                    setIsHistoricalPayment(false);
                    setPaymentOpen(true);
                  } else {
                    setNotification({ type: "error", message: "No active fee structure found for student." });
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm font-semibold"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Record Manual Payment</span>
              </Button>
            </div>
          </div>

          {student.enrollments.map((enrollment) => {
            const fs = enrollment.feeStructure;
            if (!fs) return null;

            return (
              <Card key={fs.id} className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5 flex flex-row items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{enrollment.course.title} — Fee Account</h4>
                    <p className="text-xs text-slate-500">Ledger ID: {fs.id.slice(0, 12)}</p>
                  </div>
                  <Badge
                    className={
                      fs.paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800 font-semibold"
                        : fs.paymentStatus === "PARTIAL"
                        ? "bg-amber-100 text-amber-800 font-semibold"
                        : "bg-red-100 text-red-800 font-semibold"
                    }
                  >
                    {fs.paymentStatus}
                  </Badge>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                  {/* Mandatory Ledger totals: Course Fee | Discount | Final Fee | Paid | Pending */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Course Fee</span>
                      <p className="text-base font-bold text-slate-900">
                        ₹{(fs.totalCourseFee / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-amber-600">Discount</span>
                      <p className="text-base font-bold text-amber-700">
                        {fs.discountAmount > 0 ? `-₹${(fs.discountAmount / 100).toLocaleString("en-IN")}` : "₹0"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700">Final Fee</span>
                      <p className="text-base font-bold text-slate-900">
                        ₹{(fs.netPayableAmount / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-600">Paid</span>
                      <p className="text-base font-bold text-emerald-700">
                        ₹{(fs.paidAmount / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-rose-600">Pending</span>
                      <p className="text-base font-bold text-rose-700">
                        ₹{(fs.pendingAmount / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Transaction Receipts ({fs.payments?.length || 0})
                    </h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Receipt / Txn ID</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Payment Method</th>
                            <th className="py-2.5 px-3">Reference / UTR</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fs.payments && fs.payments.length > 0 ? (
                            fs.payments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                                  <span>{p.receiptNumber || p.transactionReference || p.id.slice(0, 10)}</span>
                                  {(p as any).isHistorical && (
                                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200">
                                      HISTORICAL
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700">
                                  ₹{(p.amount / 100).toLocaleString("en-IN")}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant="outline" className="text-[10px]">
                                    {p.paymentMethod}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">
                                  {p.providerReference || "Direct Receipt"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">SUCCESS</Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingPayment({
                                          id: p.id,
                                          amount: p.amount,
                                          receiptNumber: p.receiptNumber || "",
                                          paymentDate: new Date(p.paymentDate).toISOString().split("T")[0],
                                          paymentMethod: p.paymentMethod,
                                          providerReference: p.providerReference || "",
                                          remarks: p.remarks || "",
                                        });
                                        setEditPaymentOpen(true);
                                      }}
                                      className="text-[10px] h-6 px-2 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 font-semibold"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                      <span>Edit</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedReceiptData({
                                          receiptNumber: p.receiptNumber || p.transactionReference || `SLG-REC-${p.id.slice(0, 8)}`,
                                          receiptDate: (p as any).paymentDate || (p as any).paidAt || new Date(),
                                          studentName: `${student.user.firstName} ${student.user.lastName}`,
                                          studentId: student.studentId,
                                          admissionNumber: (student as any).convertedApplication?.applicationNumber || undefined,
                                          courseTitle: enrollment.course.title,
                                          batchCode: enrollment.batch?.code || undefined,
                                          totalFee: fs.totalCourseFee,
                                          discountAmount: fs.discountAmount,
                                          netPayable: fs.netPayableAmount,
                                          amountPaid: p.amount,
                                          pendingAmount: fs.pendingAmount,
                                          paymentMode: p.paymentMethod,
                                          transactionReference: p.providerReference || p.transactionReference || p.receiptNumber || "Direct Receipt",
                                          providerType: (enrollment.course as any).providerType || undefined,
                                          universityName: (enrollment.course as any).universityName || undefined,
                                          universityProgram: (enrollment.course as any).universityProgram || undefined,
                                          universitySpecialization: (enrollment.course as any).universitySpecialization || undefined,
                                        });
                                      }}
                                      className="text-[10px] h-6 px-2 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
                                    >
                                      <Printer className="h-3 w-3" />
                                      <span>Print Receipt</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400">
                                No payments recorded yet. Click &apos;Record Manual Payment&apos; to add a receipt.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB: DOCUMENTS & IDENTITY PROOFS */}
      {activeTab === "documents" && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Student Documents & KYC Verification</CardTitle>
              <p className="text-xs text-slate-500">
                Official certificates, identity records, marksheets, and enrollment documents
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setDocTitle("");
                setDocType("ID_PROOF");
                setDocUrl("");
                setDocFileName("");
                setAddDocOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm font-semibold"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Document
            </Button>
          </CardHeader>

          <CardContent className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">File / Source</th>
                    <th className="py-2.5 px-3">Uploaded Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(student as any).documents && (student as any).documents.length > 0 ? (
                    (student as any).documents.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{doc.title}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-mono">
                            {doc.documentType}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[200px]">
                          {doc.fileName || doc.documentUrl}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </a>
                            <a
                              href={doc.documentUrl}
                              download={doc.fileName || doc.title}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete document "${doc.title}"?`)) {
                                  deleteDocumentMutation.mutate({ documentId: doc.id });
                                }
                              }}
                              disabled={deleteDocumentMutation.isPending}
                              className="text-[10px] h-6 px-1.5 text-red-600 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No student documents uploaded yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click &apos;Upload Document&apos; to link Aadhaar, past degree marksheets, or verification proofs.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ATTENDANCE HISTORY */}
      {activeTab === "attendance" && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Class Attendance Log</CardTitle>
              <p className="text-xs text-slate-500">Session presence record tracked across enrolled cohorts</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Cumulative Presence:</span>
              <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                {student.attendanceStats.percentage}% ({student.attendanceStats.present} /{" "}
                {student.attendanceStats.total} Sessions)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Batch / Cohort</th>
                    <th className="py-2.5 px-3">Session Title</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.attendanceEntries.length > 0 ? (
                    student.attendanceEntries.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {new Date(att.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {att.record?.batch?.name || "Cohort Session"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {att.record?.session?.title || "Regular Lecture & Practical"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              att.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : att.status === "LATE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {att.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No session attendance logged yet for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: ACADEMICS & EXAMS */}
      {activeTab === "academics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Exams & Assessment Results</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Exam Title</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.examAttempts.length > 0 ? (
                      student.examAttempts.map((ea) => (
                        <tr key={ea.id}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{ea.exam.title}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(ea.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {ea.finalScore !== null ? `${ea.finalScore} / ${ea.exam.totalMarks} (${ea.percentage}%)` : "Submitted"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">
                          No exam attempts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Certificates Issued</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Certificate Number</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.certificates.length > 0 ? (
                      student.certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">
                            {cert.certificateNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">{cert.course.title}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(cert.issuedDate).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">
                          No certificates issued yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: LMS ACCESS & CREDENTIALS */}
      {activeTab === "lms" && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">LMS Access Control & Security Credentials</CardTitle>
            <p className="text-xs text-slate-500">Manage student student-login credentials and portal access status</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Status Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Student Portal Access</h4>
                    <p className="text-xs text-slate-500">Control active authorization for student-login</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs text-slate-600 mb-2">
                    Current Status:{" "}
                    <Badge
                      className={
                        student.user.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-red-100 text-red-800 font-bold"
                      }
                    >
                      {student.user.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    Last Authenticated:{" "}
                    {student.user.lastLoginAt
                      ? new Date(student.user.lastLoginAt).toLocaleString("en-IN")
                      : "Never logged in"}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextStatus =
                        student.user.status === UserStatus.ACTIVE
                          ? UserStatus.SUSPENDED
                          : UserStatus.ACTIVE;
                      toggleStatusMutation.mutate({
                        userId: student.user.id,
                        status: nextStatus,
                      });
                    }}
                    disabled={toggleStatusMutation.isPending}
                    className={
                      student.user.status === "ACTIVE"
                        ? "border-red-200 text-red-700 hover:bg-red-50 text-xs"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                    }
                  >
                    {student.user.status === "ACTIVE" ? "Suspend Portal Access" : "Re-activate Portal Access"}
                  </Button>
                </div>
              </div>

              {/* Password Reset Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-100 rounded-lg text-sky-700">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Reset Portal Password</h4>
                    <p className="text-xs text-slate-500">Issue a new secure password for this learner</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPassword || newPassword.length < 6) {
                      setNotification({ type: "error", message: "Password must be at least 6 characters long." });
                      return;
                    }
                    resetPasswordMutation.mutate({
                      userId: student.user.id,
                      newPassword,
                    });
                  }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">New Password</Label>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 text-sm bg-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={resetPasswordMutation.isPending}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
                  >
                    {resetPasswordMutation.isPending ? "Updating..." : "Update Student Password"}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isHistoricalPayment ? "Record Historical Fee / Backdated Receipt" : "Record Manual Fee Receipt"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHistoricalPayment
                    ? "Record legacy offline fee with admin-specified historical date"
                    : "Record current tuition installment collection"}
                </p>
              </div>
              <button
                onClick={() => setPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amountPaise = Math.round(parseFloat(paymentAmountRupees) * 100);
                if (isNaN(amountPaise) || amountPaise <= 0) {
                  setNotification({ type: "error", message: "Enter a valid positive payment amount." });
                  return;
                }
                recordPaymentMutation.mutate({
                  feeStructureId: selectedFeeStructureId,
                  amount: amountPaise,
                  paymentMethod,
                  providerReference: paymentReference || undefined,
                  remarks: paymentRemarks || undefined,
                  receiptNumber: receiptNumber.trim() || undefined,
                  paymentDate: new Date(paymentDate),
                  isHistorical: isHistoricalPayment,
                });
              }}
              className="p-6 space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Amount Collected (₹ INR) *</Label>
                  <Input
                    required
                    type="number"
                    placeholder="e.g. 15000"
                    value={paymentAmountRupees}
                    onChange={(e) => setPaymentAmountRupees(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    {isHistoricalPayment ? "Historical Payment Date *" : "Payment Date *"}
                  </Label>
                  <Input
                    required
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Preserves entered historical date</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Receipt / Voucher Number (Optional)</Label>
                <Input
                  placeholder="e.g. SLG-REC-2024-0012 (leave empty to auto-generate)"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Payment Mode *</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  aria-label="Payment Mode"
                  className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <option value={PaymentMethod.UPI}>UPI / QR Code</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer / NEFT / IMPS</option>
                  <option value={PaymentMethod.CASH}>Cash Deposit</option>
                  <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
                  <option value={PaymentMethod.CARD}>Debit / Credit Card</option>
                  <option value={PaymentMethod.OTHER}>Other / Gateway</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Transaction ID / UTR / Reference</Label>
                <Input
                  placeholder="e.g. UPI-12345678 or Cheque #987654"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Remarks / Internal Notes</Label>
                <Input
                  placeholder="e.g. 1st installment paid at campus reception"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <input
                  type="checkbox"
                  id="isHistoricalPaymentCheck"
                  checked={isHistoricalPayment}
                  onChange={(e) => setIsHistoricalPayment(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isHistoricalPaymentCheck" className="text-xs font-medium text-amber-900 cursor-pointer">
                  Mark as Historical / Backdated Fee Record
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {recordPaymentMutation.isPending
                    ? "Recording..."
                    : isHistoricalPayment
                    ? "Save Historical Fee"
                    : "Save Receipt"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Dialog */}
      {editPaymentOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Payment Transaction</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Amount: ₹{(editingPayment.amount / 100).toLocaleString("en-IN")} • ID: {editingPayment.id.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditPaymentOpen(false);
                  setEditingPayment(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePaymentMutation.mutate({
                  paymentId: editingPayment.id,
                  paymentMethod: editingPayment.paymentMethod,
                  providerReference: editingPayment.providerReference.trim() || undefined,
                  remarks: editingPayment.remarks.trim() || undefined,
                  receiptNumber: editingPayment.receiptNumber.trim() || undefined,
                  paymentDate: new Date(editingPayment.paymentDate),
                });
              }}
              className="p-6 space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Payment Date *</Label>
                  <Input
                    required
                    type="date"
                    value={editingPayment.paymentDate}
                    onChange={(e) =>
                      setEditingPayment((prev) => (prev ? { ...prev, paymentDate: e.target.value } : null))
                    }
                    className="mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Preserves entered payment date</span>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Payment Mode *</Label>
                  <select
                    value={editingPayment.paymentMethod}
                    onChange={(e) =>
                      setEditingPayment((prev) =>
                        prev ? { ...prev, paymentMethod: e.target.value as PaymentMethod } : null
                      )
                    }
                    className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                  >
                    <option value={PaymentMethod.UPI}>UPI / QR Code</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer / NEFT / IMPS</option>
                    <option value={PaymentMethod.CASH}>Cash Deposit</option>
                    <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
                    <option value={PaymentMethod.CARD}>Debit / Credit Card</option>
                    <option value={PaymentMethod.OTHER}>Other / Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Receipt / Voucher Number</Label>
                <Input
                  value={editingPayment.receiptNumber}
                  onChange={(e) =>
                    setEditingPayment((prev) => (prev ? { ...prev, receiptNumber: e.target.value } : null))
                  }
                  placeholder="e.g. SLG-REC-2024-0012"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Transaction ID / Reference / UTR</Label>
                <Input
                  value={editingPayment.providerReference}
                  onChange={(e) =>
                    setEditingPayment((prev) => (prev ? { ...prev, providerReference: e.target.value } : null))
                  }
                  placeholder="e.g. UPI-12345678 or Cheque #987654"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Remarks / Internal Notes</Label>
                <Input
                  value={editingPayment.remarks}
                  onChange={(e) =>
                    setEditingPayment((prev) => (prev ? { ...prev, remarks: e.target.value } : null))
                  }
                  placeholder="e.g. Verified by campus accountant"
                  className="mt-1 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditPaymentOpen(false);
                    setEditingPayment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePaymentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatePaymentMutation.isPending ? "Saving Changes..." : "Save Payment Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload / Link Document Dialog */}
      {addDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload Student Document</h3>
                <p className="text-xs text-slate-500 mt-0.5">Attach identity proofs or educational certificates</p>
              </div>
              <button
                onClick={() => setAddDocOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!docTitle.trim() || !docUrl.trim()) {
                  setNotification({ type: "error", message: "Document title and URL are required." });
                  return;
                }
                addDocumentMutation.mutate({
                  studentProfileId: student.id,
                  title: docTitle.trim(),
                  documentType: docType,
                  documentUrl: docUrl.trim(),
                  fileName: docFileName.trim() || undefined,
                });
              }}
              className="p-6 space-y-4 text-sm"
            >
              <div>
                <Label className="text-xs font-semibold text-slate-700">Document Title *</Label>
                <Input
                  required
                  placeholder="e.g. Aadhaar Card Copy or 10th Marksheet"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Document Type *</Label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <option value="ID_PROOF">Identity Proof (Aadhaar / Voter ID / Passport)</option>
                  <option value="ACADEMIC_CERTIFICATE">Academic Marksheet / Certificate</option>
                  <option value="ENROLLMENT_FORM">Signed Admission / Enrollment Form</option>
                  <option value="FEE_RECEIPT">Old Fee Receipt / Bank Challan</option>
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate / Migration</option>
                  <option value="OTHER">Other Verification Proof</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Document File URL / Secure Link *</Label>
                <Input
                  required
                  placeholder="https://... or /uploads/docs/student-doc.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="mt-1 text-xs"
                />
                <span className="text-[10px] text-slate-400">Direct download or preview URL for the document file</span>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">File Name (Optional)</Label>
                <Input
                  placeholder="e.g. aadhaar_front_back.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDocOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addDocumentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {addDocumentMutation.isPending ? "Saving..." : "Save Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Course Dialog */}
      {assignCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Assign Additional Course</h3>
              <button
                onClick={() => setAssignCourseOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCourseId) {
                  setNotification({ type: "error", message: "Please select a course to enroll." });
                  return;
                }
                assignCourseMutation.mutate({
                  studentProfileId: student.id,
                  courseId: newCourseId,
                  batchId: newBatchId || undefined,
                });
              }}
              className="p-6 space-y-4 text-sm"
            >
              <div>
                <Label className="text-xs font-semibold text-slate-700">Select Course *</Label>
                <select
                  required
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  aria-label="Select Course to Enroll"
                  className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesData?.courses?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (₹{(c.baseFee / 100).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Select Batch (Optional)</Label>
                <select
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  aria-label="Select Batch"
                  className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <option value="">-- Assign Later --</option>
                  {batchesData?.batches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignCourseOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignCourseMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {assignCourseMutation.isPending ? "Assigning..." : "Assign Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Batch Dialog */}
      {reassignBatchEnrollmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Allocate / Change Batch</h3>
              <button
                onClick={() => setReassignBatchEnrollmentId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateBatchMutation.mutate({
                  enrollmentId: reassignBatchEnrollmentId,
                  batchId: targetBatchId || null,
                });
              }}
              className="p-6 space-y-4 text-sm"
            >
              <div>
                <Label className="text-xs font-semibold text-slate-700">Target Cohort / Batch</Label>
                <select
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  aria-label="Target Cohort or Batch"
                  className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <option value="">-- Unassign (Pending Batch) --</option>
                  {batchesData?.batches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReassignBatchEnrollmentId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateBatchMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {updateBatchMutation.isPending ? "Saving..." : "Update Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUAL A4 FEE RECEIPT MODAL (PHASE 11: STUDENT COPY + CENTRE COPY) */}
      {selectedReceiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:p-0 print:border-none">
            <DualFeeReceipt
              data={selectedReceiptData}
              onClose={() => setSelectedReceiptData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
