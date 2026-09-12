# SOFTLAB GLOBAL — Relational Database Architecture & Prisma Schema

> **Document Version:** 1.0.0  
> **Database Engine:** PostgreSQL 16 (Relational, ACID Compliant)  
> **ORM Layer:** Prisma 5.x  
> **Primary Keys:** CUID2 (Collision-resistant, URL-safe, non-sequential)  
> **Currency Representation:** All amounts stored as unsigned integers in **Paise** (1 INR = 100 Paise)

---

## 1. Database Architectural Principles

1. **Deterministic Relational Integrity**: All domain dependencies (Enrollments → Students, Modules → Courses, Payments → Admissions) enforce strict foreign key constraints.
2. **Precision Financials**: Fractional currency and floating-point errors are prevented at the database level by storing all monetary amounts as integer Paise (e.g., ₹45,000 is stored as `4500000`).
3. **Audit Trail & Soft Deletion**: Entities with academic, legal, or fiscal significance (Users, Courses, Admissions, Payments) utilize `deletedAt` timestamps for soft-deletion and record changes via an immutable `AuditLog` table.
4. **Optimized Indexing Strategy**: B-Tree composite indexes applied on high-frequency search paths (e.g., `[studentId, courseId]`, `[batchId, date]`, `[status, nextFollowUp]`).
5. **No Private Leaks via ID Sequencing**: All public-facing identifiers (User IDs, Course Slugs, Certificate Codes, Marksheet Numbers) avoid auto-incrementing integer sequences to prevent URL enumeration and competitor scraping.

---

## 2. Entity-Relationship Domain Map

```
┌──────────────┐          ┌───────────────────┐          ┌─────────────────┐
│     User     ├─────────►│  StudentProfile   ├─────────►│   Enrollment    │
│  (Auth/Role) │          │(Student ID, D.O.B)│          │ (Active Status) │
└──────┬───────┘          └─────────┬─────────┘          └────────┬────────┘
       │                            │                             │
       ├──────────────┐             ├───────────────┐             ▼
       ▼              ▼             ▼               ▼    ┌─────────────────┐
┌──────────────┐┌──────────────┐┌──────────────┐┌───────┐│  LessonProgress │
│TrainerProfile││   Employee   ││Certificates  ││Placem.││ (Watch/Complete)│
│(Expertise)   ││ (HR / Staff) ││(Verifiable)  ││Profile│└─────────────────┘
└──────┬───────┘└──────────────┘└──────────────┘└───────┘
       │                                                          ▲
       ▼                                                          │
┌──────────────┐          ┌───────────────────┐          ┌────────┴────────┐
│    Batch     │◄─────────┤      Course       ├─────────►│     Lesson      │
│  (Schedule)  │          │(Catalog & Pricing)│          │ (Video/Doc/Quiz)│
└──────┬───────┘          └─────────┬─────────┘          └─────────────────┘
       │                            │
       ▼                            ▼
┌──────────────┐          ┌───────────────────┐          ┌─────────────────┐
│  Attendance  │          │     Admission     ├─────────►│     Payment     │
│(Batch Record)│          │(Discount & Fees)  │          │(Razorpay / Rec.)│
└──────────────┘          └───────────────────┘          └─────────────────┘
```

---

## 3. Complete Prisma Schema Specification

```prisma
// datasource and generator configuration
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==============================================================================
// 1. IDENTITY, ACCESS & AUDIT DOMAIN
// ==============================================================================

enum UserRoleCode {
  SUPER_ADMIN
  DIRECTOR
  ADMIN
  MANAGER
  COUNSELOR
  TELECALLER
  TRAINER
  HR
  ACCOUNTANT
  PLACEMENT_OFFICER
  STUDENT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}

model Role {
  id                  String       @id @default(cuid())
  code                UserRoleCode @unique
  name                String
  description         String?
  permissions         String[]     // Array of granular resource:action strings
  maxDiscountPercent  Int          @default(0) // Maximum % discount this role can authorize
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  users               User[]

  @@map("roles")
}

model User {
  id              String        @id @default(cuid())
  email           String        @unique
  phone           String?       @unique
  passwordHash    String
  firstName       String
  lastName        String
  avatarUrl       String?
  roleCode        UserRoleCode
  role            Role          @relation(fields: [roleCode], references: [code])
  status          UserStatus    @default(ACTIVE)
  emailVerifiedAt DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  // Profile extensions
  studentProfile  StudentProfile?
  trainerProfile  TrainerProfile?
  employeeProfile Employee?

  // Direct operations relationships
  createdLeads         Lead[]             @relation("LeadCreator")
  assignedLeads        Lead[]             @relation("LeadAssignee")
  counseledAdmissions  Admission[]        @relation("AdmissionCounselor")
  approvedAdmissions   Admission[]        @relation("AdmissionApprover")
  markedAttendances    AttendanceRecord[] @relation("AttendanceMarker")
  auditActions         AuditLog[]         @relation("AuditActor")
  notifications        Notification[]     @relation("UserNotifications")

  @@index([email])
  @@index([phone])
  @@index([roleCode])
  @@index([status])
  @@map("users")
}

model AuditLog {
  id           String   @id @default(cuid())
  actorId      String?
  actor        User?    @relation("AuditActor", fields: [actorId], references: [id])
  action       String   // e.g., 'DISCOUNT_OVERRIDE', 'ROLE_CHANGE', 'PAYMENT_CAPTURE'
  resourceType String   // e.g., 'Admission', 'Course', 'Payment'
  resourceId   String
  previousData Json?
  newData      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  @@index([actorId])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ==============================================================================
// 2. STUDENT & TRAINER PROFILES
// ==============================================================================

model StudentProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  studentId     String    @unique // e.g., "SLG-2024-0042"
  dateOfBirth   DateTime?
  gender        String?
  address       String?
  city          String?
  state         String?
  pincode       String?
  highestDegree String?
  guardianName  String?
  guardianPhone String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  enrollments      Enrollment[]
  attendanceLogs   AttendanceEntry[]
  submissions      AssignmentSubmission[]
  examAttempts     ExamAttempt[]
  certificates     Certificate[]
  placementProfile PlacementProfile?

  @@index([studentId])
  @@map("student_profiles")
}

model TrainerProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  specializations String[] // e.g., ["Full Stack", "Cloud DevOps"]
  bio             String?
  experienceYears Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  assignedCourses CourseTrainer[]
  assignedBatches BatchTrainer[]

  @@map("trainer_profiles")
}

// ==============================================================================
// 3. COURSE CONTENT MANAGEMENT SYSTEM (CMS)
// ==============================================================================

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum LessonType {
  VIDEO
  PDF
  DOCUMENT
  RICH_TEXT
  ASSIGNMENT
  QUIZ
  TEST
}

model Course {
  id          String        @id @default(cuid())
  title       String
  slug        String        @unique
  summary     String
  description String        @db.Text
  thumbnailUrl String?
  durationWeeks Int         @default(12)
  baseFee     Int           // Base fee in Paise (e.g., 5000000 = ₹50,000)
  status      ContentStatus @default(DRAFT)
  sortOrder   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  modules       Module[]
  trainers      CourseTrainer[]
  batches       Batch[]
  admissions    Admission[]
  enrollments   Enrollment[]
  certificates  Certificate[]
  questionBank  QuestionBank[]
  exams         Exam[]

  @@index([slug])
  @@index([status])
  @@map("courses")
}

model CourseTrainer {
  courseId  String
  course    Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  trainerId String
  trainer   TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())

  @@id([courseId, trainerId])
  @@map("course_trainers")
}

model Module {
  id          String        @id @default(cuid())
  courseId    String
  course      Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  description String?       @db.Text
  sortOrder   Int           @default(0)
  status      ContentStatus @default(DRAFT)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  lessons     Lesson[]

  @@index([courseId, sortOrder])
  @@map("modules")
}

model Lesson {
  id          String        @id @default(cuid())
  moduleId    String
  module      Module        @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  type        LessonType
  durationMin Int           @default(30)
  sortOrder   Int           @default(0)
  status      ContentStatus @default(DRAFT)
  isFreePreview Boolean     @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  contentDetails LessonContent?
  progressRecords LessonProgress[]
  submissions     AssignmentSubmission[]

  @@index([moduleId, sortOrder])
  @@index([status])
  @@map("lessons")
}

model LessonContent {
  id             String   @id @default(cuid())
  lessonId       String   @unique
  lesson         Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  // Secure Video details
  bunnyVideoId   String?  // Bunny.net Stream GUID
  // Secure PDF/Document details
  storageFileKey String?  // Private S3/R2 Key
  fileSizeBytes  Int?
  mimeType       String?
  // Rich Text / Notes
  bodyHtml       String?  @db.Text
  // Assessment links
  examId         String?  @unique
  exam           Exam?    @relation(fields: [examId], references: [id])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("lesson_contents")
}

// ==============================================================================
// 4. BATCHES, SCHEDULES & ATTENDANCE
// ==============================================================================

enum BatchStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

model Batch {
  id          String      @id @default(cuid())
  courseId    String
  course      Course      @relation(fields: [courseId], references: [id])
  code        String      @unique // e.g., "MERN-2024-B1"
  name        String
  startDate   DateTime
  endDate     DateTime?
  status      BatchStatus @default(UPCOMING)
  maxCapacity Int         @default(30)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  trainers    BatchTrainer[]
  enrollments Enrollment[]
  admissions  Admission[]
  attendance  AttendanceRecord[]
  classes     ScheduledClass[]
  exams       Exam[]

  @@index([courseId])
  @@index([status])
  @@map("batches")
}

model BatchTrainer {
  batchId   String
  batch     Batch          @relation(fields: [batchId], references: [id], onDelete: Cascade)
  trainerId String
  trainer   TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  isPrimary Boolean        @default(false)

  @@id([batchId, trainerId])
  @@map("batch_trainers")
}

model ScheduledClass {
  id          String   @id @default(cuid())
  batchId     String
  batch       Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  title       String
  scheduledAt DateTime
  durationMin Int      @default(60)
  meetingUrl  String?
  agendaNotes String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([batchId, scheduledAt])
  @@map("scheduled_classes")
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

model AttendanceRecord {
  id          String   @id @default(cuid())
  batchId     String
  batch       Batch    @relation(fields: [batchId], references: [id])
  date        DateTime @db.Date
  markedById  String
  markedBy    User     @relation("AttendanceMarker", fields: [markedById], references: [id])
  topicCovered String?
  createdAt   DateTime @default(now())

  entries     AttendanceEntry[]

  @@unique([batchId, date])
  @@index([batchId, date])
  @@map("attendance_records")
}

model AttendanceEntry {
  id         String           @id @default(cuid())
  recordId   String
  record     AttendanceRecord @relation(fields: [recordId], references: [id], onDelete: Cascade)
  studentId  String
  student    StudentProfile   @relation(fields: [studentId], references: [id])
  status     AttendanceStatus @default(ABSENT)
  remark     String?

  @@unique([recordId, studentId])
  @@index([studentId])
  @@map("attendance_entries")
}

// ==============================================================================
// 5. COUNSELOR CRM, ADMISSIONS & DISCOUNT ENGINE
// ==============================================================================

enum LeadStatus {
  NEW
  CONTACTED
  FOLLOW_UP
  INTERESTED
  DEMO
  NEGOTIATION
  ADMITTED
  LOST
}

enum LeadSource {
  WEBSITE
  WALK_IN
  REFERRAL
  SOCIAL_MEDIA
  GOOGLE_SEARCH
  CAMPUS_DRIVE
  OTHER
}

model Lead {
  id               String     @id @default(cuid())
  name             String
  email            String?
  phone            String
  source           LeadSource @default(WEBSITE)
  interestedCourse String?
  status           LeadStatus @default(NEW)
  notes            String?    @db.Text
  nextFollowUp     DateTime?
  assignedToId     String?
  assignedTo       User?      @relation("LeadAssignee", fields: [assignedToId], references: [id])
  createdById      String
  createdBy        User       @relation("LeadCreator", fields: [createdById], references: [id])
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  followUps  FollowUpHistory[]
  admission  Admission?

  @@index([phone])
  @@index([status])
  @@index([assignedToId])
  @@index([nextFollowUp])
  @@map("leads")
}

model FollowUpHistory {
  id          String    @id @default(cuid())
  leadId      String
  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  summary     String    @db.Text
  statusAfter LeadStatus
  scheduledAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([leadId])
  @@map("follow_up_histories")
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum AdmissionStatus {
  DRAFT
  PENDING_DISCOUNT_APPROVAL
  APPROVED
  ENROLLED
  CANCELLED
}

model Admission {
  id                 String          @id @default(cuid())
  leadId             String          @unique
  lead               Lead            @relation(fields: [leadId], references: [id])
  courseId           String
  course             Course          @relation(fields: [courseId], references: [id])
  batchId            String?
  batch              Batch?          @relation(fields: [batchId], references: [id])
  counselorId        String
  counselor          User            @relation("AdmissionCounselor", fields: [counselorId], references: [id])
  status             AdmissionStatus @default(DRAFT)

  // Pricing & Discount Engine (Stored in Paise)
  originalCourseFee  Int             // Paise
  discountType       DiscountType?
  discountValue      Int?            // Percentage value (e.g. 20) or Paise amount
  discountAmount     Int             @default(0) // Calculated server-side in Paise
  finalPayableFee    Int             // Paise = original - discountAmount

  // Discount Approval Workflow
  requiresApproval   Boolean         @default(false)
  approvedById       String?
  approvedBy         User?           @relation("AdmissionApprover", fields: [approvedById], references: [id])
  approvedAt         DateTime?
  rejectionReason    String?

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  payments           Payment[]
  enrollment         Enrollment?

  @@index([courseId])
  @@index([status])
  @@index([counselorId])
  @@map("admissions")
}

// ==============================================================================
// 6. PAYMENTS & ENROLLMENT
// ==============================================================================

enum PaymentProvider {
  RAZORPAY
  OFFLINE_CASH
  OFFLINE_BANK_TRANSFER
  OFFLINE_UPI
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  SUCCESS
  FAILED
  REFUNDED
}

model Payment {
  id                String          @id @default(cuid())
  admissionId       String
  admission         Admission       @relation(fields: [admissionId], references: [id])
  amount            Int             // In Paise
  provider          PaymentProvider @default(RAZORPAY)
  status            PaymentStatus   @default(PENDING)
  
  // Gateway specific IDs
  gatewayOrderId    String?         @unique // Razorpay order_id
  gatewayPaymentId  String?         @unique // Razorpay payment_id
  webhookVerified   Boolean         @default(false)
  webhookReceivedAt DateTime?

  // Offline or Institutional reference
  receiptNumber     String?         @unique // e.g., "REC-2024-00089"
  receiptFileUrl    String?
  transactionNotes  String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([admissionId])
  @@index([status])
  @@index([gatewayOrderId])
  @@map("payments")
}

// ==============================================================================
// 6. ENROLLMENT, FEES & PAYMENT TRANSACTION FOUNDATION (Day 8)
// ==============================================================================

enum FeePaymentStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum FeeStructureStatus {
  ACTIVE
  REVISED
  CANCELLED
}

enum InstallmentStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentMethod {
  CASH
  UPI
  BANK_TRANSFER
  CARD
  CHEQUE
  OTHER
}

enum PaymentTransactionStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
}

model FeeStructure {
  id                 String             @id @default(cuid())
  studentId          String
  student            StudentProfile     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  enrollmentId       String             @unique
  enrollment         Enrollment         @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  courseId           String
  course             Course             @relation(fields: [courseId], references: [id])
  batchId            String?
  batch              Batch?             @relation(fields: [batchId], references: [id], onDelete: SetNull)
  totalCourseFee     Int                // Stored in integer Paise (e.g. ₹50,000 = 5000000)
  registrationFee    Int                @default(0)
  discountAmount     Int                @default(0)
  scholarshipAmount  Int                @default(0)
  netPayableAmount   Int                // gross - deductions (must be >= 0)
  paidAmount         Int                @default(0)
  pendingAmount      Int
  paymentStatus      FeePaymentStatus   @default(PENDING)
  status             FeeStructureStatus @default(ACTIVE)
  remarks            String?            @db.Text
  createdById        String?
  createdBy          User?              @relation("FeeStructureCreator", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  installments       FeeInstallment[]
  payments           PaymentTransaction[]

  @@index([studentId])
  @@index([enrollmentId])
  @@index([courseId])
  @@index([batchId])
  @@index([paymentStatus])
  @@index([status])
  @@map("fee_structures")
}

model FeeInstallment {
  id                 String            @id @default(cuid())
  feeStructureId     String
  feeStructure       FeeStructure      @relation(fields: [feeStructureId], references: [id], onDelete: Cascade)
  installmentNumber  Int
  amount             Int               // Stored in integer Paise
  paidAmount         Int               @default(0)
  dueDate            DateTime
  status             InstallmentStatus @default(PENDING)
  notes              String?
  paidAt             DateTime?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  payments           PaymentTransaction[]

  @@unique([feeStructureId, installmentNumber])
  @@index([feeStructureId])
  @@index([status])
  @@index([dueDate])
  @@map("fee_installments")
}

model PaymentTransaction {
  id                   String                   @id @default(cuid())
  transactionReference String                   @unique // e.g. "PAY-2026-0001"
  feeStructureId       String
  feeStructure         FeeStructure             @relation(fields: [feeStructureId], references: [id], onDelete: Cascade)
  installmentId        String?
  installment          FeeInstallment?          @relation(fields: [installmentId], references: [id], onDelete: SetNull)
  studentId            String
  student              StudentProfile           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  enrollmentId         String
  enrollment           Enrollment               @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  amount               Int                      // Stored in integer Paise
  paymentDate          DateTime                 @default(now())
  paymentMethod        PaymentMethod
  status               PaymentTransactionStatus @default(SUCCESS)
  providerReference    String?                  // Bank Ref / UTR / Cheque Number
  remarks              String?                  @db.Text
  receivedById         String
  receivedBy           User                     @relation("PaymentReceiver", fields: [receivedById], references: [id])
  createdAt            DateTime                 @default(now())
  updatedAt            DateTime                 @updatedAt

  @@index([feeStructureId])
  @@index([installmentId])
  @@index([studentId])
  @@index([enrollmentId])
  @@index([paymentDate])
  @@index([status])
  @@index([receivedById])
  @@map("payment_transactions")
}

enum EnrollmentStatus {
  ACTIVE
  SUSPENDED
  COMPLETED
  CANCELLED
}

model Enrollment {
  id           String           @id @default(cuid())
  studentId    String
  student      StudentProfile   @relation(fields: [studentId], references: [id])
  courseId     String
  course       Course           @relation(fields: [courseId], references: [id])
  batchId      String?
  batch        Batch?           @relation(fields: [batchId], references: [id])
  status       EnrollmentStatus @default(ACTIVE)
  enrolledAt   DateTime         @default(now())
  completedAt  DateTime?
  updatedAt    DateTime         @updatedAt

  lessonProgress LessonProgress[]
  feeStructure   FeeStructure?
  payments       PaymentTransaction[]

  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
  @@index([status])
  @@map("enrollments")
}

model LessonProgress {
  id            String     @id @default(cuid())
  enrollmentId  String
  enrollment    Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lessonId      String
  lesson        Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  isCompleted   Boolean    @default(false)
  watchedSeconds Int       @default(0)
  completedAt   DateTime?
  updatedAt     DateTime   @updatedAt

  @@unique([enrollmentId, lessonId])
  @@index([enrollmentId])
  @@map("lesson_progresses")
}

// ==============================================================================
// 7. ASSESSMENTS, EXAMS & DIGITAL MARKSHEETS
// ==============================================================================

enum QuestionType {
  MCQ_SINGLE
  MCQ_MULTIPLE
  TRUE_FALSE
  SUBJECTIVE_LONG
  CODE_SNIPPET
}

enum ExamType {
  PRACTICE_QUIZ
  MODULE_TEST
  FINAL_EXAMINATION
}

model QuestionBank {
  id           String       @id @default(cuid())
  courseId     String
  course       Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questionText String       @db.Text
  type         QuestionType @default(MCQ_SINGLE)
  optionsJson  Json?        // Array: [{ "id": "A", "text": "Option", "isCorrect": true }]
  idealAnswer  String?      @db.Text
  explanation  String?      @db.Text
  defaultMarks Int          @default(1)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  examQuestions ExamQuestion[]

  @@index([courseId])
  @@map("question_bank")
}

model Exam {
  id              String         @id @default(cuid())
  courseId        String
  course          Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  batchId         String?
  batch           Batch?         @relation(fields: [batchId], references: [id])
  title           String
  type            ExamType       @default(MODULE_TEST)
  durationMinutes Int            @default(60)
  totalMarks      Int            @default(100)
  passingMarks    Int            @default(40)
  maxAttempts     Int            @default(1)
  isPublished     Boolean        @default(false)
  instructions    String?        @db.Text
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  questions       ExamQuestion[]
  attempts        ExamAttempt[]
  lessonContent   LessonContent?

  @@index([courseId])
  @@map("exams")
}

model ExamQuestion {
  id          String       @id @default(cuid())
  examId      String
  exam        Exam         @relation(fields: [examId], references: [id], onDelete: Cascade)
  questionId  String
  question    QuestionBank @relation(fields: [questionId], references: [id])
  marksWeight Int          @default(1)
  sortOrder   Int          @default(0)

  @@unique([examId, questionId])
  @@index([examId])
  @@map("exam_questions")
}

model ExamAttempt {
  id           String         @id @default(cuid())
  examId       String
  exam         Exam           @relation(fields: [examId], references: [id])
  studentId    String
  student      StudentProfile @relation(fields: [studentId], references: [id])
  startedAt    DateTime       @default(now())
  submittedAt  DateTime?
  obtainedMarks Int?
  percentage   Decimal?       @db.Decimal(5, 2)
  grade        String?        // "A+", "A", "B", "C", "F"
  isPassed     Boolean?
  gradedById   String?
  gradedAt     DateTime?

  answers      ExamAnswer[]

  @@index([examId])
  @@index([studentId])
  @@map("exam_attempts")
}

model ExamAnswer {
  id             String       @id @default(cuid())
  attemptId      String
  attempt        ExamAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId     String
  selectedAnswer Json?        // Storing options chosen or subjective text
  isCorrect      Boolean?
  marksAwarded   Int?
  feedback       String?

  @@index([attemptId])
  @@map("exam_answers")
}

model AssignmentSubmission {
  id           String         @id @default(cuid())
  lessonId     String
  lesson       Lesson         @relation(fields: [lessonId], references: [id])
  studentId    String
  student      StudentProfile @relation(fields: [studentId], references: [id])
  fileKey      String         // S3/R2 storage key for student zip/pdf
  fileName     String
  notes        String?        @db.Text
  submittedAt  DateTime       @default(now())
  gradedAt     DateTime?
  marksAwarded Int?
  feedback     String?        @db.Text

  @@index([lessonId])
  @@index([studentId])
  @@map("assignment_submissions")
}

// ==============================================================================
// 8. VERIFIABLE CERTIFICATE DOMAIN
// ==============================================================================

model Certificate {
  id             String         @id @default(cuid())
  certificateNo  String         @unique // e.g., "SLG-CERT-2024-8931"
  studentId      String
  student        StudentProfile @relation(fields: [studentId], references: [id])
  courseId       String
  course         Course         @relation(fields: [courseId], references: [id])
  completionDate DateTime
  issuedDate     DateTime       @default(now())
  signatoryName  String         @default("Director of Academic Affairs")
  signatoryTitle String         @default("Authorized Signatory, SOFTLAB GLOBAL")
  pdfStorageKey  String?        // Private S3/R2 key
  isRevoked      Boolean        @default(false)
  revocationNotes String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([certificateNo])
  @@index([studentId])
  @@map("certificates")
}

// ==============================================================================
// 9. PLACEMENT & RECRUITMENT DOMAIN
// ==============================================================================

enum PlacementStatus {
  SEEKING
  SHORTLISTED
  INTERVIEWING
  PLACED
  HIGHER_STUDIES
}

model PlacementProfile {
  id               String          @id @default(cuid())
  studentId        String          @unique
  student          StudentProfile  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  resumeStorageKey String?
  skills           String[]
  githubUrl        String?
  linkedinUrl      String?
  portfolioUrl     String?
  projectsJson     Json?           // Array: [{ "title": "", "link": "", "description": "" }]
  status           PlacementStatus @default(SEEKING)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  applications JobApplication[]

  @@map("placement_profiles")
}

model Company {
  id          String   @id @default(cuid())
  name        String   @unique
  website     String?
  industry    String?
  city        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contacts    CompanyContact[]
  jobOpenings JobOpening[]

  @@map("companies")
}

model CompanyContact {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name      String
  designation String?
  email     String?
  phone     String?

  @@index([companyId])
  @@map("company_contacts")
}

model JobOpening {
  id               String    @id @default(cuid())
  companyId        String
  company          Company   @relation(fields: [companyId], references: [id])
  title            String
  description      String    @db.Text
  minSalaryPaise   Int?      // Paise per annum
  maxSalaryPaise   Int?
  requiredSkills   String[]
  eligibleCourses  String[]  // Array of Course IDs
  deadlineDate     DateTime?
  isActive         Boolean   @default(true)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  applications JobApplication[]

  @@index([companyId])
  @@index([isActive])
  @@map("job_openings")
}

enum ApplicationStatus {
  APPLIED
  RESUME_SHORTLISTED
  INTERVIEW_SCHEDULED
  SELECTED
  REJECTED
  OFFER_ACCEPTED
}

model JobApplication {
  id          String            @id @default(cuid())
  openingId   String
  opening     JobOpening        @relation(fields: [openingId], references: [id], onDelete: Cascade)
  profileId   String
  profile     PlacementProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  status      ApplicationStatus @default(APPLIED)
  appliedAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  interviews  InterviewSchedule[]

  @@unique([openingId, profileId])
  @@index([profileId])
  @@map("job_applications")
}

model InterviewSchedule {
  id            String         @id @default(cuid())
  applicationId String
  application   JobApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  roundNumber   Int            @default(1)
  roundTitle    String         // "Technical Round 1", "HR Round"
  scheduledAt   DateTime
  meetingUrl    String?
  feedback      String?        @db.Text
  isPassed      Boolean?

  @@index([applicationId])
  @@map("interview_schedules")
}

// ==============================================================================
// 10. HR & STAFF MANAGEMENT DOMAIN
// ==============================================================================

model Department {
  id        String     @id @default(cuid())
  name      String     @unique
  createdAt DateTime   @default(now())
  employees Employee[]

  @@map("departments")
}

model Designation {
  id        String     @id @default(cuid())
  title     String     @unique
  createdAt DateTime   @default(now())
  employees Employee[]

  @@map("designations")
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  PROBATION
  RESIGNED
  TERMINATED
}

model Employee {
  id             String         @id @default(cuid())
  userId         String         @unique
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  employeeCode   String         @unique // e.g., "SLG-EMP-012"
  departmentId   String
  department     Department     @relation(fields: [departmentId], references: [id])
  designationId  String
  designation    Designation    @relation(fields: [designationId], references: [id])
  joiningDate    DateTime
  monthlySalary  Int?           // Sensitive: Stored in Paise
  status         EmployeeStatus @default(ACTIVE)
  documentsFolder String?       // S3 key prefix
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  leaveRequests LeaveRequest[]

  @@index([departmentId])
  @@index([status])
  @@map("employees")
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}

model LeaveRequest {
  id          String      @id @default(cuid())
  employeeId  String
  employee    Employee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  type        String      // "CASUAL", "MEDICAL", "UNPAID"
  startDate   DateTime    @db.Date
  endDate     DateTime    @db.Date
  reason      String      @db.Text
  status      LeaveStatus @default(PENDING)
  reviewedBy  String?
  createdAt   DateTime    @default(now())

  @@index([employeeId])
  @@index([status])
  @@map("leave_requests")
}

// ==============================================================================
// 11. NOTIFICATIONS & IN-APP ALERTS
// ==============================================================================

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String   @db.Text
  category  String   // "ADMISSION", "FEE_DUE", "EXAM_PUBLISHED", "JOB_ALERT"
  linkUrl   String?
  isRead    Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@map("notifications")
}
```
