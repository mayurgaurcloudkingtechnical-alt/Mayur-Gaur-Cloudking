-- CreateEnum
CREATE TYPE "UserRoleCode" AS ENUM ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER', 'COUNSELOR', 'TELECALLER', 'TRAINER', 'HR', 'ACCOUNTANT', 'PLACEMENT_OFFICER', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'UPCOMING', 'OPEN_FOR_ENROLLMENT', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'PDF', 'DOCUMENT', 'RICH_TEXT', 'ASSIGNMENT', 'QUIZ', 'TEST', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClassSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'DEMO', 'NEGOTIATION', 'ADMITTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'WALK_IN', 'REFERRAL', 'SOCIAL_MEDIA', 'GOOGLE_SEARCH', 'CAMPUS_DRIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('CALL', 'MESSAGE', 'COUNSELLING_SESSION', 'NOTE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED_FOR_INFORMATION', 'CONVERTED');

-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeStructureStatus" AS ENUM ('ACTIVE', 'REVISED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MODULE_QUIZ', 'FINAL_EXAM', 'PRACTICE');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'TIMED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" "UserRoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "maxDiscountPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roleCode" "UserRoleCode" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "highestDegree" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specializations" TEXT[],
    "bio" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationWeeks" INTEGER NOT NULL DEFAULT 12,
    "baseFee" INTEGER NOT NULL,
    "level" TEXT DEFAULT 'Beginner to Advanced',
    "language" TEXT DEFAULT 'English / Hindi',
    "eligibility" TEXT DEFAULT 'Open to all learners and graduates',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_trainers" (
    "courseId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_trainers_pkey" PRIMARY KEY ("courseId","trainerId")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "maxCapacity" INTEGER NOT NULL DEFAULT 30,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'OFFLINE',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_trainers" (
    "batchId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_trainers_pkey" PRIMARY KEY ("batchId","trainerId")
);

-- CreateTable
CREATE TABLE "scheduled_classes" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "trainerId" TEXT,
    "mode" "DeliveryMode" NOT NULL DEFAULT 'OFFLINE',
    "location" TEXT,
    "agendaNotes" TEXT,
    "status" "ClassSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "statusReason" TEXT,
    "topicCovered" TEXT,
    "coveredLessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "summary" TEXT,
    "type" "LessonType" NOT NULL DEFAULT 'RICH_TEXT',
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_contents" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "videoProvider" TEXT,
    "bunnyVideoId" TEXT,
    "videoUrl" TEXT,
    "storageFileKey" TEXT,
    "fileName" TEXT,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "documentUrl" TEXT,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "batchId" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastAccessedLessonId" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progresses" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedById" TEXT NOT NULL,
    "topicCovered" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_entries" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "interestedCourseId" TEXT,
    "interestedBatchId" TEXT,
    "notes" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_histories" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "FollowUpType" NOT NULL DEFAULT 'CALL',
    "notes" TEXT NOT NULL,
    "nextFollowUpDate" TIMESTAMP(3),
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "batchId" TEXT,
    "counselorId" TEXT,
    "reviewerId" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'SUBMITTED',
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "highestQualification" TEXT,
    "decisionReason" TEXT,
    "convertedStudentProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "batchId" TEXT,
    "totalCourseFee" INTEGER NOT NULL,
    "registrationFee" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "scholarshipAmount" INTEGER NOT NULL DEFAULT 0,
    "netPayableAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "pendingAmount" INTEGER NOT NULL,
    "paymentStatus" "FeePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "FeeStructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_installments" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "installmentId" TEXT,
    "studentId" TEXT,
    "enrollmentId" TEXT,
    "amount" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "providerReference" TEXT,
    "remarks" TEXT,
    "receivedById" TEXT,
    "gateway" TEXT DEFAULT 'RAZORPAY',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "receiptNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "admissionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "instructions" TEXT,
    "type" "ExamType" NOT NULL DEFAULT 'MODULE_QUIZ',
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passingPercentage" INTEGER NOT NULL DEFAULT 50,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "negativeMarksPerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT,
    "questionText" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "topic" TEXT,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "marksOverride" DOUBLE PRECISION,
    "negativeMarksOverride" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeTakenSeconds" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "attemptedQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "unansweredQuestions" INTEGER NOT NULL DEFAULT 0,
    "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negativeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "isMarkedForReview" BOOLEAN NOT NULL DEFAULT false,
    "marksAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatoryName" TEXT NOT NULL DEFAULT 'Director of Academic Affairs',
    "signatoryTitle" TEXT NOT NULL DEFAULT 'Authorized Signatory, SOFTLAB GLOBAL',
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "revocationReason" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_roleCode_idx" ON "users"("roleCode");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_studentId_key" ON "student_profiles"("studentId");

-- CreateIndex
CREATE INDEX "student_profiles_studentId_idx" ON "student_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_profiles_userId_key" ON "trainer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_courseId_idx" ON "batches"("courseId");

-- CreateIndex
CREATE INDEX "batches_status_idx" ON "batches"("status");

-- CreateIndex
CREATE INDEX "scheduled_classes_batchId_scheduledAt_idx" ON "scheduled_classes"("batchId", "scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_classes_trainerId_idx" ON "scheduled_classes"("trainerId");

-- CreateIndex
CREATE INDEX "scheduled_classes_status_idx" ON "scheduled_classes"("status");

-- CreateIndex
CREATE INDEX "modules_courseId_sortOrder_idx" ON "modules"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "modules_courseId_status_idx" ON "modules"("courseId", "status");

-- CreateIndex
CREATE INDEX "lessons_moduleId_sortOrder_idx" ON "lessons"("moduleId", "sortOrder");

-- CreateIndex
CREATE INDEX "lessons_moduleId_status_idx" ON "lessons"("moduleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_contents_lessonId_key" ON "lesson_contents"("lessonId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_key" ON "enrollments"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "lesson_progresses_enrollmentId_idx" ON "lesson_progresses"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progresses_enrollmentId_lessonId_key" ON "lesson_progresses"("enrollmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_key" ON "attendance_records"("sessionId");

-- CreateIndex
CREATE INDEX "attendance_records_batchId_idx" ON "attendance_records"("batchId");

-- CreateIndex
CREATE INDEX "attendance_entries_studentId_idx" ON "attendance_entries"("studentId");

-- CreateIndex
CREATE INDEX "attendance_entries_enrollmentId_idx" ON "attendance_entries"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_entries_recordId_studentId_key" ON "attendance_entries"("recordId", "studentId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_nextFollowUp_idx" ON "leads"("nextFollowUp");

-- CreateIndex
CREATE INDEX "leads_interestedCourseId_idx" ON "leads"("interestedCourseId");

-- CreateIndex
CREATE INDEX "follow_up_histories_leadId_idx" ON "follow_up_histories"("leadId");

-- CreateIndex
CREATE INDEX "follow_up_histories_performedById_idx" ON "follow_up_histories"("performedById");

-- CreateIndex
CREATE INDEX "follow_up_histories_createdAt_idx" ON "follow_up_histories"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_applicationNumber_key" ON "admission_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_convertedStudentProfileId_key" ON "admission_applications"("convertedStudentProfileId");

-- CreateIndex
CREATE INDEX "admission_applications_applicationNumber_idx" ON "admission_applications"("applicationNumber");

-- CreateIndex
CREATE INDEX "admission_applications_leadId_idx" ON "admission_applications"("leadId");

-- CreateIndex
CREATE INDEX "admission_applications_courseId_idx" ON "admission_applications"("courseId");

-- CreateIndex
CREATE INDEX "admission_applications_stage_idx" ON "admission_applications"("stage");

-- CreateIndex
CREATE INDEX "admission_applications_counselorId_idx" ON "admission_applications"("counselorId");

-- CreateIndex
CREATE INDEX "admission_applications_reviewerId_idx" ON "admission_applications"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_enrollmentId_key" ON "fee_structures"("enrollmentId");

-- CreateIndex
CREATE INDEX "fee_structures_studentId_idx" ON "fee_structures"("studentId");

-- CreateIndex
CREATE INDEX "fee_structures_enrollmentId_idx" ON "fee_structures"("enrollmentId");

-- CreateIndex
CREATE INDEX "fee_structures_courseId_idx" ON "fee_structures"("courseId");

-- CreateIndex
CREATE INDEX "fee_structures_batchId_idx" ON "fee_structures"("batchId");

-- CreateIndex
CREATE INDEX "fee_structures_paymentStatus_idx" ON "fee_structures"("paymentStatus");

-- CreateIndex
CREATE INDEX "fee_structures_status_idx" ON "fee_structures"("status");

-- CreateIndex
CREATE INDEX "fee_installments_feeStructureId_idx" ON "fee_installments"("feeStructureId");

-- CreateIndex
CREATE INDEX "fee_installments_status_idx" ON "fee_installments"("status");

-- CreateIndex
CREATE INDEX "fee_installments_dueDate_idx" ON "fee_installments"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "fee_installments_feeStructureId_installmentNumber_key" ON "fee_installments"("feeStructureId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionReference_key" ON "payment_transactions"("transactionReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_gatewayOrderId_key" ON "payment_transactions"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_gatewayPaymentId_key" ON "payment_transactions"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_receiptNumber_key" ON "payment_transactions"("receiptNumber");

-- CreateIndex
CREATE INDEX "payment_transactions_feeStructureId_idx" ON "payment_transactions"("feeStructureId");

-- CreateIndex
CREATE INDEX "payment_transactions_installmentId_idx" ON "payment_transactions"("installmentId");

-- CreateIndex
CREATE INDEX "payment_transactions_studentId_idx" ON "payment_transactions"("studentId");

-- CreateIndex
CREATE INDEX "payment_transactions_enrollmentId_idx" ON "payment_transactions"("enrollmentId");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentDate_idx" ON "payment_transactions"("paymentDate");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_receivedById_idx" ON "payment_transactions"("receivedById");

-- CreateIndex
CREATE INDEX "payment_transactions_gatewayOrderId_idx" ON "payment_transactions"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_gatewayPaymentId_idx" ON "payment_transactions"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_receiptNumber_idx" ON "payment_transactions"("receiptNumber");

-- CreateIndex
CREATE INDEX "payment_transactions_admissionId_idx" ON "payment_transactions"("admissionId");

-- CreateIndex
CREATE INDEX "exams_courseId_idx" ON "exams"("courseId");

-- CreateIndex
CREATE INDEX "exams_moduleId_idx" ON "exams"("moduleId");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "question_bank_courseId_idx" ON "question_bank"("courseId");

-- CreateIndex
CREATE INDEX "question_bank_moduleId_idx" ON "question_bank"("moduleId");

-- CreateIndex
CREATE INDEX "question_bank_isActive_idx" ON "question_bank"("isActive");

-- CreateIndex
CREATE INDEX "exam_questions_examId_idx" ON "exam_questions"("examId");

-- CreateIndex
CREATE INDEX "exam_questions_questionId_idx" ON "exam_questions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examId_questionId_key" ON "exam_questions"("examId", "questionId");

-- CreateIndex
CREATE INDEX "exam_attempts_examId_idx" ON "exam_attempts"("examId");

-- CreateIndex
CREATE INDEX "exam_attempts_studentId_idx" ON "exam_attempts"("studentId");

-- CreateIndex
CREATE INDEX "exam_attempts_enrollmentId_idx" ON "exam_attempts"("enrollmentId");

-- CreateIndex
CREATE INDEX "exam_attempts_status_idx" ON "exam_attempts"("status");

-- CreateIndex
CREATE INDEX "exam_answers_attemptId_idx" ON "exam_answers"("attemptId");

-- CreateIndex
CREATE INDEX "exam_answers_questionId_idx" ON "exam_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_attemptId_questionId_key" ON "exam_answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNo_key" ON "certificates"("certificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationToken_key" ON "certificates"("verificationToken");

-- CreateIndex
CREATE INDEX "certificates_certificateNo_idx" ON "certificates"("certificateNo");

-- CreateIndex
CREATE INDEX "certificates_verificationToken_idx" ON "certificates"("verificationToken");

-- CreateIndex
CREATE INDEX "certificates_studentId_idx" ON "certificates"("studentId");

-- CreateIndex
CREATE INDEX "certificates_courseId_idx" ON "certificates"("courseId");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_trainers" ADD CONSTRAINT "batch_trainers_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_trainers" ADD CONSTRAINT "batch_trainers_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_classes" ADD CONSTRAINT "scheduled_classes_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_classes" ADD CONSTRAINT "scheduled_classes_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_classes" ADD CONSTRAINT "scheduled_classes_coveredLessonId_fkey" FOREIGN KEY ("coveredLessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progresses" ADD CONSTRAINT "lesson_progresses_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progresses" ADD CONSTRAINT "lesson_progresses_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "scheduled_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_entries" ADD CONSTRAINT "attendance_entries_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_entries" ADD CONSTRAINT "attendance_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_entries" ADD CONSTRAINT "attendance_entries_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_interestedCourseId_fkey" FOREIGN KEY ("interestedCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_interestedBatchId_fkey" FOREIGN KEY ("interestedBatchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_histories" ADD CONSTRAINT "follow_up_histories_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_histories" ADD CONSTRAINT "follow_up_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_convertedStudentProfileId_fkey" FOREIGN KEY ("convertedStudentProfileId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_installments" ADD CONSTRAINT "fee_installments_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "fee_installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admission_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

