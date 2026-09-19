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
} from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Search</h1>
          <p className="text-xs text-slate-500">Global student registry, enrollment directory, and comprehensive records</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-4 py-2 rounded shadow-sm uppercase tracking-wide transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> ADD NEW CANDIDATE
        </button>
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
                        <Link href={`/admin/students/${s.id}`} className="hover:text-[#0088cc] hover:underline">
                          {s.name}
                        </Link>
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs flex-1">
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Centre</span>
                                <span className="text-slate-800 font-medium mt-0.5 block">{centre}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Father / Guardian</span>
                                <span className="text-slate-800 font-medium mt-0.5 block">{s.guardianName || "Not Provided"}</span>
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
    </div>
  );
}
