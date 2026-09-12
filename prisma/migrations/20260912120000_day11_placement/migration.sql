-- CreateEnum
CREATE TYPE "JobDriveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT');

-- CreateEnum
CREATE TYPE "PlacementApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'PLACED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InterviewRoundType" AS ENUM ('APTITUDE', 'TECHNICAL', 'CODING', 'HR', 'GROUP_DISCUSSION', 'OTHER');

-- CreateTable
CREATE TABLE "corporate_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_drives" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "description" TEXT NOT NULL,
    "eligibilityCriteria" TEXT,
    "minPassingPercentage" DOUBLE PRECISION,
    "requireCertification" BOOLEAN NOT NULL DEFAULT false,
    "targetCourseId" TEXT,
    "salaryPackage" TEXT,
    "location" TEXT,
    "openingsCount" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "driveDate" TIMESTAMP(3),
    "status" "JobDriveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_placement_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "resumeUrl" TEXT,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPlaced" BOOLEAN NOT NULL DEFAULT false,
    "placedCompany" TEXT,
    "placedPackage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_placement_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_applications" (
    "id" TEXT NOT NULL,
    "jobDriveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "PlacementApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverNote" TEXT,
    "offeredPackage" TEXT,
    "rejectionReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_rounds" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundType" "InterviewRoundType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "meetingLink" TEXT,
    "feedback" TEXT,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "corporate_partners_isActive_idx" ON "corporate_partners"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "job_drives_slug_key" ON "job_drives"("slug");

-- CreateIndex
CREATE INDEX "job_drives_companyId_idx" ON "job_drives"("companyId");

-- CreateIndex
CREATE INDEX "job_drives_targetCourseId_idx" ON "job_drives"("targetCourseId");

-- CreateIndex
CREATE INDEX "job_drives_status_idx" ON "job_drives"("status");

-- CreateIndex
CREATE INDEX "job_drives_deadline_idx" ON "job_drives"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "student_placement_profiles_studentId_key" ON "student_placement_profiles"("studentId");

-- CreateIndex
CREATE INDEX "student_placement_profiles_studentId_idx" ON "student_placement_profiles"("studentId");

-- CreateIndex
CREATE INDEX "student_placement_profiles_isPlaced_idx" ON "student_placement_profiles"("isPlaced");

-- CreateIndex
CREATE INDEX "placement_applications_jobDriveId_idx" ON "placement_applications"("jobDriveId");

-- CreateIndex
CREATE INDEX "placement_applications_studentId_idx" ON "placement_applications"("studentId");

-- CreateIndex
CREATE INDEX "placement_applications_status_idx" ON "placement_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_applications_jobDriveId_studentId_key" ON "placement_applications"("jobDriveId", "studentId");

-- CreateIndex
CREATE INDEX "interview_rounds_applicationId_idx" ON "interview_rounds"("applicationId");

-- AddForeignKey
ALTER TABLE "job_drives" ADD CONSTRAINT "job_drives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "corporate_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_drives" ADD CONSTRAINT "job_drives_targetCourseId_fkey" FOREIGN KEY ("targetCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_drives" ADD CONSTRAINT "job_drives_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_placement_profiles" ADD CONSTRAINT "student_placement_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_jobDriveId_fkey" FOREIGN KEY ("jobDriveId") REFERENCES "job_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "placement_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

