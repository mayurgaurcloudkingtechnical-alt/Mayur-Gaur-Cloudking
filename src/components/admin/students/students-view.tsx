"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  UserPlus,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  History,
  Calendar,
  IndianRupee,
  FileText,
} from "lucide-react";
import { PaymentMethod } from "@prisma/client";

export function StudentsView() {
  // Form filter state
  const [centre, setCentre] = useState("Softlab Global");
  const [candidateName, setCandidateName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [mobileFilter, setMobileFilter] = useState("");

  // Applied query state
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
  });

  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [historicalOpen, setHistoricalOpen] = useState(false);

  // Historical Student Dialog State
  const [histStudentId, setHistStudentId] = useState("");
  const [histAdmissionDate, setHistAdmissionDate] = useState("2024-06-15");
  const [histFirstName, setHistFirstName] = useState("");
  const [histLastName, setHistLastName] = useState("");
  const [histEmail, setHistEmail] = useState("");
  const [histPhone, setHistPhone] = useState("");
  const [histCourseId, setHistCourseId] = useState("");
  const [histBatchId, setHistBatchId] = useState("");
  const [histGender, setHistGender] = useState("MALE");
  const [histCity, setHistCity] = useState("Prayagraj");
  const [histState, setHistState] = useState("Uttar Pradesh");
  const [histPincode, setHistPincode] = useState("211001");
  const [histHighestDegree, setHistHighestDegree] = useState("B.Tech / Graduate");
  const [histGuardianName, setHistGuardianName] = useState("");
  const [histGuardianPhone, setHistGuardianPhone] = useState("");
  const [histTotalFeeRupees, setHistTotalFeeRupees] = useState("45000");
  const [histInitialPaidRupees, setHistInitialPaidRupees] = useState("30000");
  const [histPaymentMethod, setHistPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [histReceiptNumber, setHistReceiptNumber] = useState("");
  const [histRemarks, setHistRemarks] = useState("Migrated historical student admission record");

  // New Student Registration Dialog State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [gender, setGender] = useState("MALE");
  const [highestDegree, setHighestDegree] = useState("B.Tech / BCA");
  const [city, setCity] = useState("Noida");
  const [state, setState] = useState("Uttar Pradesh");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build combined search term
  const effectiveSearch = useMemo(() => {
    return (
      candidateName.trim() ||
      enrollmentNo.trim() ||
      emailFilter.trim() ||
      mobileFilter.trim() ||
      appliedFilters.search
    );
  }, [candidateName, enrollmentNo, emailFilter, mobileFilter, appliedFilters.search]);

  // Queries
  const { data, isLoading, refetch } = api.admin.listStudents.useQuery({
    search: effectiveSearch || undefined,
    page,
    pageSize: 20,
  });

  const { data: coursesData } = api.course.list.useQuery({ pageSize: 50 });
  const { data: batchesData } = api.batch.list.useQuery({
    courseId: courseId || undefined,
    pageSize: 50,
  });

  // Mutations
  const createStudentMutation = api.admin.createStudent.useMutation({
    onSuccess: (res) => {
      setNotification({
        type: "success",
        message: `Student successfully registered! Enrollment ID: ${res.studentId}.`,
      });
      setCreateOpen(false);
      resetRegisterForm();
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to create student record." });
    },
  });

  const resetRegisterForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCourseId("");
    setBatchId("");
    setGuardianName("");
    setGuardianPhone("");
  };

  const { data: histBatchesData } = api.batch.list.useQuery({
    courseId: histCourseId || undefined,
    pageSize: 50,
  });

  const createHistoricalStudentMutation = api.admin.createHistoricalStudent.useMutation({
    onSuccess: (res) => {
      setNotification({
        type: "success",
        message: `Historical student successfully registered! Enrollment ID: ${res.studentId}.`,
      });
      setHistoricalOpen(false);
      resetHistoricalForm();
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to register historical student." });
    },
  });

  const resetHistoricalForm = () => {
    setHistStudentId("");
    setHistAdmissionDate("2024-06-15");
    setHistFirstName("");
    setHistLastName("");
    setHistEmail("");
    setHistPhone("");
    setHistCourseId("");
    setHistBatchId("");
    setHistGuardianName("");
    setHistGuardianPhone("");
    setHistTotalFeeRupees("45000");
    setHistInitialPaidRupees("30000");
    setHistReceiptNumber("");
    setHistRemarks("Migrated historical student admission record");
  };

  const handleHistoricalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!histFirstName.trim() || !histLastName.trim() || !histEmail.trim() || !histPhone.trim() || !histCourseId || !histAdmissionDate) {
      setNotification({ type: "error", message: "Admission date, first name, last name, email, phone, and course are required." });
      return;
    }
    const totalFee = parseFloat(histTotalFeeRupees);
    const initialPaid = parseFloat(histInitialPaidRupees || "0");
    if (isNaN(totalFee) || totalFee < 0) {
      setNotification({ type: "error", message: "Total course fee must be non-negative." });
      return;
    }
    createHistoricalStudentMutation.mutate({
      studentId: histStudentId.trim() || undefined,
      admissionDate: new Date(histAdmissionDate),
      firstName: histFirstName.trim(),
      lastName: histLastName.trim(),
      email: histEmail.trim(),
      phone: histPhone.trim(),
      courseId: histCourseId,
      batchId: histBatchId || undefined,
      gender: histGender,
      city: histCity.trim() || undefined,
      state: histState.trim() || undefined,
      pincode: histPincode.trim() || undefined,
      highestDegree: histHighestDegree.trim() || undefined,
      guardianName: histGuardianName.trim() || undefined,
      guardianPhone: histGuardianPhone.trim() || undefined,
      totalCourseFeeRupees: totalFee,
      initialPaidAmountRupees: isNaN(initialPaid) ? 0 : initialPaid,
      paymentMethod: histPaymentMethod,
      receiptNumber: histReceiptNumber.trim() || undefined,
      remarks: histRemarks.trim() || undefined,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !courseId) {
      setNotification({ type: "error", message: "First name, last name, email, phone, and course are required." });
      return;
    }
    createStudentMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
      courseId,
      batchId: batchId || undefined,
      gender,
      highestDegree,
      city,
      state,
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
    });
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      search: candidateName.trim() || enrollmentNo.trim() || emailFilter.trim() || mobileFilter.trim(),
    });
    setPage(1);
  };

  const handleReset = () => {
    setCandidateName("");
    setEnrollmentNo("");
    setEmailFilter("");
    setMobileFilter("");
    setAppliedFilters({ search: "" });
    setPage(1);
  };

  const students = data?.students || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded border text-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header matching 1.pdf Candidate Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Search</h1>
          <p className="text-xs text-slate-500">Global student registry, enrollment directory, and comprehensive records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoricalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2 rounded shadow-sm uppercase tracking-wide transition-colors"
          >
            <History className="w-3.5 h-3.5" /> ADD EXISTING / OLD STUDENT
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-4 py-2 rounded shadow-sm uppercase tracking-wide transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> ADD NEW CANDIDATE
          </button>
        </div>
      </div>

      {/* Candidate Search Filter Card matching 1.pdf pages 8-10 */}
      <form onSubmit={handleFilter} className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Centre</label>
            <select
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
            >
              <option value="Softlab Global">Softlab Global</option>
              <option value="Main Campus">Main Campus</option>
              <option value="Online">Online Centre</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Student Name</label>
            <Input
              type="text"
              placeholder="Student Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Enrollment Number</label>
            <Input
              type="text"
              placeholder="Enrollment Number"
              value={enrollmentNo}
              onChange={(e) => setEnrollmentNo(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Email</label>
            <Input
              type="email"
              placeholder="Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Mobile Number</label>
            <Input
              type="text"
              placeholder="Mobile Number"
              value={mobileFilter}
              onChange={(e) => setMobileFilter(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* Action Buttons matching 1.pdf */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="submit"
            className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-5 py-1.5 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            FILTER
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs px-5 py-1.5 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Candidate Table matching 1.pdf pages 8-10 with Expandable (+) rows */}
      <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="w-10 text-center px-2 py-3"></th>
              <th className="py-3 px-4">Enroll/Reg No.</th>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Candidate Mobile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 animate-spin text-[#0088cc]" />
                    <span>Loading candidate registry...</span>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-500">
                  <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No candidates found</p>
                  <p className="text-slate-400 text-xs mt-0.5">Try adjusting your filters or register a new candidate.</p>
                </td>
              </tr>
            ) : (
              students.map((s: any) => {
                const isExpanded = expandedIds.has(s.id);
                return (
                  <React.Fragment key={s.id}>
                    <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? "bg-slate-50/60" : ""}`}>
                      <td className="w-10 text-center px-2 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(s.id)}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0088cc] text-white hover:bg-[#0077b3] transition-colors focus:outline-none"
                          title={isExpanded ? "Collapse Details" : "Expand Details"}
                        >
                          {isExpanded ? (
                            <Minus className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Plus className="w-3 h-3 stroke-[3]" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.studentId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/students/${s.id}`} className="hover:text-[#0088cc] hover:underline font-bold">
                            {s.name}
                          </Link>
                          {s.isHistorical && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                              Historical Record
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s.email}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {s.phone || "—"}
                      </td>
                    </tr>

                    {/* Expandable Drawer matching 1.pdf page 9-10 */}
                    {isExpanded && (
                      <tr className="bg-[#f8fafc] border-t border-b border-slate-200">
                        <td colSpan={5} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs flex-1">
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Centre</span>
                                <span className="text-slate-800 font-medium mt-0.5 block">{centre}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Admission Date</span>
                                <span className="text-slate-800 font-medium mt-0.5 block">
                                  {s.admissionDate
                                    ? new Date(s.admissionDate).toLocaleDateString("en-IN")
                                    : new Date(s.createdAt).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Course</span>
                                <span className="text-slate-800 font-medium mt-0.5 block truncate" title={s.activeCourses?.join(", ") || "None"}>
                                  {s.activeCourses?.join(", ") || "None"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Batch</span>
                                <span className="text-slate-800 font-medium mt-0.5 block truncate" title={s.activeBatches?.join(", ") || "None"}>
                                  {s.activeBatches?.join(", ") || "None"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Fee Status</span>
                                <span className="text-emerald-700 font-bold mt-0.5 block">
                                  {s.feeStatus || "N/A"}{s.pendingAmount > 0 ? ` (₹${Math.round(s.pendingAmount / 100)} due)` : ""}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons in drawer matching reference */}
                            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              <Link
                                href={`/admin/students/${s.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold uppercase tracking-wide transition-colors shadow-sm"
                                title="Open 360° Profile"
                              >
                                <Eye className="w-3.5 h-3.5" /> 360° Profile
                              </Link>
                              <Link
                                href={`/admin/finance?studentId=${s.id}`}
                                className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors"
                                title="Fee Ledger"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/attendance?studentId=${s.id}`}
                                className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors"
                                title="Attendance Record"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching 1.pdf */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 text-xs text-slate-600">
        <div>
          Showing {total === 0 ? 0 : (page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} entries
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-[#0088cc] text-white font-semibold rounded text-xs">
            {page}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>

      {/* Register Candidate Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Candidate</h3>
                <p className="text-xs text-slate-500">Provisions user account, student profile, fee ledger, and course enrollment</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name *</label>
                  <Input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name *</label>
                  <Input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email *</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Course *</label>
                  <select
                    required
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      setBatchId("");
                    }}
                    className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-[#0088cc] focus:outline-none"
                  >
                    <option value="">Select Academic Course</option>
                    {coursesData?.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cohort Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-[#0088cc] focus:outline-none"
                  >
                    <option value="">Select Cohort (Optional)</option>
                    {batchesData?.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Father / Guardian Name</label>
                  <Input
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Guardian Name"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Phone</label>
                  <Input
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="Guardian Mobile"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStudentMutation.isPending}
                  className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded text-xs font-bold uppercase transition-colors shadow-sm disabled:opacity-50"
                >
                  {createStudentMutation.isPending ? "REGISTERING..." : "CONFIRM & REGISTER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Existing / Old Student (Historical Record) Modal */}
      {historicalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Existing / Old Student (Historical Migration)</h3>
                  <p className="text-xs text-slate-500">Record institutional learners with past admission dates, IDs, and fee ledgers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoricalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHistoricalSubmit} className="space-y-4 text-xs">
              {/* Identity & Past Admission Meta */}
              <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-200 space-y-3">
                <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-purple-700" />
                  <span>Historical Admission & Credentials</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Existing Student / Enrollment ID (Optional)
                    </label>
                    <Input
                      value={histStudentId}
                      onChange={(e) => setHistStudentId(e.target.value)}
                      placeholder="e.g. SG-2024-0012 (blank to auto-generate)"
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Original Admission Date *
                    </label>
                    <Input
                      type="date"
                      required
                      value={histAdmissionDate}
                      onChange={(e) => setHistAdmissionDate(e.target.value)}
                      className="h-8 text-xs bg-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <Input
                      required
                      value={histFirstName}
                      onChange={(e) => setHistFirstName(e.target.value)}
                      placeholder="e.g. Amit"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <Input
                      required
                      value={histLastName}
                      onChange={(e) => setHistLastName(e.target.value)}
                      placeholder="e.g. Tripathi"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <Input
                      type="email"
                      required
                      value={histEmail}
                      onChange={(e) => setHistEmail(e.target.value)}
                      placeholder="e.g. amit@gmail.com"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                    <Input
                      required
                      value={histPhone}
                      onChange={(e) => setHistPhone(e.target.value)}
                      placeholder="10 digit mobile number"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Course & Cohort Allocation */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Academic Course & Personal Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Enrolled Course *</label>
                    <select
                      required
                      value={histCourseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setHistCourseId(cid);
                        setHistBatchId("");
                        const selectedC = coursesData?.courses.find((c) => c.id === cid);
                        if (selectedC) {
                          setHistTotalFeeRupees((selectedC.baseFee / 100).toString());
                        }
                      }}
                      className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                    >
                      <option value="">Select Enrolled Course</option>
                      {coursesData?.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} {c.providerType === "UNIVERSITY" ? "(DPGU)" : "(SoftLab)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cohort Batch (Optional)</label>
                    <select
                      value={histBatchId}
                      onChange={(e) => setHistBatchId(e.target.value)}
                      className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                    >
                      <option value="">Select Cohort / Historical Batch</option>
                      {histBatchesData?.batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={histGender}
                      onChange={(e) => setHistGender(e.target.value)}
                      className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Highest Degree</label>
                    <Input
                      value={histHighestDegree}
                      onChange={(e) => setHistHighestDegree(e.target.value)}
                      placeholder="e.g. B.Tech / BCA"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <Input
                      value={histCity}
                      onChange={(e) => setHistCity(e.target.value)}
                      placeholder="e.g. Prayagraj"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Father / Guardian Name</label>
                    <Input
                      value={histGuardianName}
                      onChange={(e) => setHistGuardianName(e.target.value)}
                      placeholder="Guardian Name"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guardian Mobile</label>
                    <Input
                      value={histGuardianPhone}
                      onChange={(e) => setHistGuardianPhone(e.target.value)}
                      placeholder="Guardian Contact"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Fee Ledger & Historical Payment */}
              <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-3">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Historical Fee Ledger & Payment Migration</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Course Fee (₹) *</label>
                    <Input
                      required
                      type="number"
                      value={histTotalFeeRupees}
                      onChange={(e) => setHistTotalFeeRupees(e.target.value)}
                      className="h-8 text-xs bg-white font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount Paid in Past (₹)</label>
                    <Input
                      type="number"
                      value={histInitialPaidRupees}
                      onChange={(e) => setHistInitialPaidRupees(e.target.value)}
                      className="h-8 text-xs bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Balance Due (₹)</label>
                    <div className="h-8 px-2 flex items-center rounded border border-slate-200 bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      ₹
                      {Math.max(
                        0,
                        (parseFloat(histTotalFeeRupees) || 0) - (parseFloat(histInitialPaidRupees) || 0)
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Historical Payment Mode</label>
                    <select
                      value={histPaymentMethod}
                      onChange={(e) => setHistPaymentMethod(e.target.value as PaymentMethod)}
                      className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800"
                    >
                      <option value={PaymentMethod.CASH}>Cash Deposit</option>
                      <option value={PaymentMethod.UPI}>UPI / Online QR</option>
                      <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer / NEFT</option>
                      <option value={PaymentMethod.CHEQUE}>Cheque / DD</option>
                      <option value={PaymentMethod.CARD}>Card Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Old Receipt / Voucher No. (Optional)</label>
                    <Input
                      value={histReceiptNumber}
                      onChange={(e) => setHistReceiptNumber(e.target.value)}
                      placeholder="e.g. SLG-HIST-2024-001"
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Internal Migration Remarks</label>
                  <Input
                    value={histRemarks}
                    onChange={(e) => setHistRemarks(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setHistoricalOpen(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHistoricalStudentMutation.isPending}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold uppercase transition-colors shadow-sm disabled:opacity-50"
                >
                  {createHistoricalStudentMutation.isPending ? "MIGRATING..." : "CONFIRM & MIGRATE RECORD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
