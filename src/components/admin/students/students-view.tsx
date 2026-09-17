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
  Search,
  UserPlus,
  BookOpen,
  Calendar,
  IndianRupee,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Award,
  Filter,
} from "lucide-react";
import { EnrollmentStatus } from "@prisma/client";

export function StudentsView() {
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  // New Student Form
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

  // Queries
  const { data, isLoading, refetch } = api.admin.listStudents.useQuery({
    search: search.trim() || undefined,
    courseId: selectedCourseId || undefined,
    batchId: selectedBatchId || undefined,
    page,
    pageSize: 15,
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
        message: `Student successfully registered! Enrollment ID: ${res.studentId}. Auto-initialized FeeStructure and LMS credentials.`,
      });
      setCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to create student record." });
    },
  });

  const resetForm = () => {
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

  const students = data?.students || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-slate-800">{total}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Registered learners</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Active Courses</p>
              <h3 className="text-2xl font-bold text-slate-800">{coursesData?.courses?.length || 21}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Across IT & Cloud</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Active Cohorts</p>
              <h3 className="text-2xl font-bold text-slate-800">{batchesData?.batches?.length || 0}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned batches</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Ledger Status</p>
              <h3 className="text-2xl font-bold text-slate-800">Auto-Linked</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated fee structures</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster Controls */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Student Directory & Academic Roster</CardTitle>
              <p className="text-xs text-slate-500">Real-time student registry with SG-YYYY-XXXXX enrollment numbers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 text-sm shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Enroll New Student
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name, ID (e.g. SG-2026-00001), email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-slate-50 border-slate-200 text-sm"
              />
            </div>

            <div>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by course"
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Courses ({coursesData?.courses?.length || 0})</option>
                {coursesData?.courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSelectedCourseId("");
                  setSelectedBatchId("");
                  setPage(1);
                  refetch();
                }}
                className="w-full text-slate-600 border-slate-200 hover:bg-slate-100"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Enrolled Course & Batch</th>
                  <th className="py-3 px-4">Fee Status</th>
                  <th className="py-3 px-4 text-center">Academics</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-5 w-5 animate-spin text-emerald-600" />
                        <span>Loading student registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <GraduationCap className="h-10 w-10 text-slate-300" />
                        <p className="font-semibold text-slate-700">No students found matching your criteria</p>
                        <p className="text-xs text-slate-400">Try adjusting your search terms or enroll a new student.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{student.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-mono font-semibold">
                            {student.studentId}
                          </Badge>
                          {student.highestDegree && (
                            <span className="text-[11px] text-slate-400">({student.highestDegree})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{student.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800 line-clamp-1">
                          {student.activeCourses.length > 0 ? student.activeCourses.join(", ") : "Not assigned"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Batch: {student.activeBatches.length > 0 ? student.activeBatches.join(", ") : "Pending Batch"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <Badge
                            className={`text-[11px] font-semibold ${
                              student.feeStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : student.feeStatus === "PARTIAL"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.feeStatus}
                          </Badge>
                          {student.pendingAmount > 0 && (
                            <div className="text-[11px] text-red-600 font-medium mt-0.5">
                              Due: ₹{(student.pendingAmount / 100).toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <span>Att: <strong>{student.attendanceCount}</strong></span>
                          <span>•</span>
                          <span>Exams: <strong>{student.examCount}</strong></span>
                          {student.certificatesCount > 0 && (
                            <>
                              <span>•</span>
                              <Award className="h-3 w-3 text-amber-600" />
                              <span className="text-amber-700 font-bold">{student.certificatesCount}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            student.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                              : "bg-red-50 text-red-700 border-red-200 text-xs"
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/students/${student.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Showing {students.length} of {total} registered students (Page {page} of {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-8"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs h-8"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Student Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Direct Student Enrollment</h3>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Enroll a new student. A secure LMS account and sequential Enrollment ID (format: <strong>SG-2026-XXXXX</strong>) will be created automatically, and a corresponding <strong>FeeStructure</strong> will be initialized.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">First Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Last Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Verma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Email Address (LMS Login) *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. rahul.verma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Primary Course *</Label>
                  <select
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    aria-label="Primary Course"
                    className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Enrolled Course --</option>
                    {coursesData?.courses?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (₹{(c.baseFee / 100).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Assign Cohort / Batch (Optional)</Label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    aria-label="Assign Cohort or Batch"
                    className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Assign Later / Pending Batch --</option>
                    {batchesData?.batches?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Gender</Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    aria-label="Gender"
                    className="w-full h-10 px-3 mt-1 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Highest Qualification</Label>
                  <Input
                    placeholder="e.g. B.Tech CS, BCA, MCA"
                    value={highestDegree}
                    onChange={(e) => setHighestDegree(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">City / Location</Label>
                  <Input
                    placeholder="e.g. Noida / Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Guardian / Parent Name</Label>
                  <Input
                    placeholder="e.g. Ramesh Verma"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Guardian Phone</Label>
                  <Input
                    placeholder="Guardian 10-digit number"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStudentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {createStudentMutation.isPending ? "Enrolling..." : "Complete Enrollment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
