export interface PermissionDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "students",
    name: "Student Management",
    description: "Manage student accounts, admissions conversion, and student profiles",
    permissions: [
      { id: "students.view", name: "View Students", category: "students", description: "View student lists and basic profiles" },
      { id: "students.create", name: "Create Student", category: "students", description: "Directly enroll new student accounts" },
      { id: "students.edit", name: "Edit Student", category: "students", description: "Update student details and contact information" },
      { id: "students.delete", name: "Delete Student", category: "students", description: "Archive or delete student profiles" },
      { id: "students.restore", name: "Restore Student", category: "students", description: "Restore archived students" },
      { id: "students.activate", name: "Activate Student", category: "students", description: "Activate student login and access" },
      { id: "students.deactivate", name: "Deactivate Student", category: "students", description: "Suspend student login and access" },
      { id: "students.assignCourse", name: "Assign Course", category: "students", description: "Enroll student in courses" },
      { id: "students.assignBatch", name: "Assign Batch", category: "students", description: "Allocate student to a cohort batch" },
      { id: "students.assignTrainer", name: "Assign Trainer", category: "students", description: "Link mentor/trainer to student" },
      { id: "students.resetPassword", name: "Reset Password", category: "students", description: "Generate temporary student password" },
      { id: "students.viewSensitiveData", name: "View Sensitive Data", category: "students", description: "Access phone, guardian and financial data" },
    ],
  },
  {
    id: "courses",
    name: "Course Catalog & CMS",
    description: "Manage authoritative courses, fees, durations, and curriculum",
    permissions: [
      { id: "courses.view", name: "View Courses", category: "courses", description: "View published and draft course catalog" },
      { id: "courses.create", name: "Create Course", category: "courses", description: "Add new courses to catalog" },
      { id: "courses.edit", name: "Edit Course", category: "courses", description: "Modify title, descriptions, syllabus, banners" },
      { id: "courses.delete", name: "Delete Course", category: "courses", description: "Archive or delete course" },
      { id: "courses.publish", name: "Publish Course", category: "courses", description: "Publish course to public website & LMS" },
      { id: "courses.archive", name: "Archive Course", category: "courses", description: "De-list course from public enrollment" },
      { id: "courses.manageContent", name: "Manage Content", category: "courses", description: "Upload video, PDF, lab guides" },
      { id: "courses.manageFees", name: "Manage Course Fees", category: "courses", description: "Configure base fees and installments" },
      { id: "courses.manageCurriculum", name: "Manage Curriculum", category: "courses", description: "Add modules, topics and lessons" },
    ],
  },
  {
    id: "batches",
    name: "Batch Management",
    description: "Manage cohort schedules, trainers, timings, and capacity",
    permissions: [
      { id: "batches.view", name: "View Batches", category: "batches", description: "View batch schedules and active cohorts" },
      { id: "batches.create", name: "Create Batch", category: "batches", description: "Schedule new batch cohorts" },
      { id: "batches.edit", name: "Edit Batch", category: "batches", description: "Update timings, mode, and dates" },
      { id: "batches.delete", name: "Delete Batch", category: "batches", description: "Cancel or archive batches" },
      { id: "batches.assignTrainer", name: "Assign Trainer", category: "batches", description: "Assign primary/secondary trainers" },
      { id: "batches.assignStudents", name: "Assign Students", category: "batches", description: "Add/remove students from cohort" },
      { id: "batches.manageSchedule", name: "Manage Schedule", category: "batches", description: "Plan and reschedule sessions" },
      { id: "batches.manageAttendance", name: "Manage Attendance", category: "batches", description: "Review and edit batch attendance" },
    ],
  },
  {
    id: "admissions",
    name: "Admissions & CRM",
    description: "Manage enquiries, candidate counseling, and applications",
    permissions: [
      { id: "admissions.view", name: "View Admissions", category: "admissions", description: "Access CRM leads and admission applications" },
      { id: "admissions.create", name: "Create Application", category: "admissions", description: "Generate formal admission application" },
      { id: "admissions.edit", name: "Edit Application", category: "admissions", description: "Update candidate information" },
      { id: "admissions.delete", name: "Delete Application", category: "admissions", description: "Archive or remove application" },
      { id: "admissions.approve", name: "Approve Admission", category: "admissions", description: "Formally approve candidate enrollment" },
      { id: "admissions.reject", name: "Reject Admission", category: "admissions", description: "Decline admission application" },
      { id: "admissions.convertToStudent", name: "Convert to Student", category: "admissions", description: "Onboard admitted student to LMS" },
      { id: "admissions.assignCounselor", name: "Assign Counselor", category: "admissions", description: "Route lead to academic counselor" },
      { id: "admissions.assignBatch", name: "Assign Initial Batch", category: "admissions", description: "Attach applicant to target batch" },
    ],
  },
  {
    id: "fees",
    name: "Finance & Fees",
    description: "Manage fee structures, offline payments, and receipts",
    permissions: [
      { id: "fees.view", name: "View Fees", category: "fees", description: "View fee structures and payments ledger" },
      { id: "fees.create", name: "Create Fee Structure", category: "fees", description: "Set up student fee plans" },
      { id: "fees.edit", name: "Edit Fee Plan", category: "fees", description: "Adjust installments and schedules" },
      { id: "fees.delete", name: "Cancel Fee Plan", category: "fees", description: "Cancel fee schedule" },
      { id: "fees.recordPayment", name: "Record Payment", category: "fees", description: "Log cash, UPI, or bank transfer payments" },
      { id: "fees.refund", name: "Issue Refund", category: "fees", description: "Process student fee refund" },
      { id: "fees.applyDiscount", name: "Apply Discount", category: "fees", description: "Authorize scholarship or fee waiver" },
      { id: "fees.generateReceipt", name: "Generate Receipt", category: "fees", description: "Issue official GST tax invoice/receipt" },
    ],
  },
  {
    id: "attendance",
    name: "Attendance Oversight",
    description: "Track student and faculty attendance and session topics",
    permissions: [
      { id: "attendance.view", name: "View Attendance", category: "attendance", description: "View class attendance logs" },
      { id: "attendance.create", name: "Mark Attendance", category: "attendance", description: "Mark session attendance roster" },
      { id: "attendance.edit", name: "Edit Attendance", category: "attendance", description: "Update past attendance records" },
      { id: "attendance.delete", name: "Delete Attendance", category: "attendance", description: "Clear attendance logs" },
      { id: "attendance.approve", name: "Approve Leaves", category: "attendance", description: "Approve student absence requests" },
    ],
  },
  {
    id: "lms",
    name: "LMS & Academics",
    description: "Manage lessons, assignments, quizzes, and exams",
    permissions: [
      { id: "lms.view", name: "View LMS Content", category: "lms", description: "Access student learning resources" },
      { id: "lms.create", name: "Create Assignment/Quiz", category: "lms", description: "Author assignments, quizzes, and tests" },
      { id: "lms.edit", name: "Edit Content", category: "lms", description: "Update questions, rubrics, and deadlines" },
      { id: "lms.delete", name: "Delete Content", category: "lms", description: "Remove assignments or exam papers" },
      { id: "lms.publish", name: "Publish Assessment", category: "lms", description: "Make exam or quiz live for students" },
      { id: "lms.assign", name: "Assign Assessment", category: "lms", description: "Target assessment to specific batch" },
      { id: "lms.evaluate", name: "Grade Submissions", category: "lms", description: "Evaluate student code and practical submissions" },
    ],
  },
  {
    id: "staff",
    name: "Staff & User Access",
    description: "Manage employees, trainers, counselors, and credentials",
    permissions: [
      { id: "staff.view", name: "View Staff", category: "staff", description: "View staff list and profiles" },
      { id: "staff.create", name: "Create User/Staff", category: "staff", description: "Add new team members" },
      { id: "staff.edit", name: "Edit Staff Profile", category: "staff", description: "Update department, designation, contact" },
      { id: "staff.delete", name: "Delete Staff", category: "staff", description: "Deactivate employee account" },
      { id: "staff.activate", name: "Activate Login", category: "staff", description: "Enable portal login" },
      { id: "staff.deactivate", name: "Deactivate Login", category: "staff", description: "Disable portal login" },
      { id: "staff.assignRole", name: "Assign Role", category: "staff", description: "Change user role" },
      { id: "staff.assignPermissions", name: "Assign Custom Permissions", category: "staff", description: "Override role permissions" },
    ],
  },
  {
    id: "settings",
    name: "Settings & System",
    description: "Configure branding, Razorpay, emails, and platform settings",
    permissions: [
      { id: "settings.view", name: "View Settings", category: "settings", description: "View system configurations" },
      { id: "settings.edit", name: "Edit Settings", category: "settings", description: "Update payment keys, campus info, branding" },
      { id: "integrations.view", name: "View Integrations", category: "settings", description: "View connected channels (Meta, Google, Justdial)" },
      { id: "integrations.configure", name: "Configure Integrations", category: "settings", description: "Update API tokens and webhooks" },
      { id: "integrations.test", name: "Test Integrations", category: "settings", description: "Run live API connection diagnostics" },
      { id: "audit.view", name: "View Audit Logs", category: "settings", description: "Inspect system security and change trail" },
      { id: "reports.view", name: "View Reports", category: "settings", description: "View business intelligence analytics" },
      { id: "reports.export", name: "Export Reports", category: "settings", description: "Export CSV/Excel audit reports" },
    ],
  },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_CATEGORIES.flatMap((c) =>
  c.permissions.map((p) => p.id)
);
