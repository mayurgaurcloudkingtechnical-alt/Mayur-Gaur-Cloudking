-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'EARNED', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM ('ACADEMICS', 'ADMISSIONS', 'FINANCE', 'MARKETING', 'OPERATIONS', 'MANAGEMENT');

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" "StaffDepartment" NOT NULL,
    "designation" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseSalary" INTEGER NOT NULL,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "panNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysCount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL,
    "salarySlipNumber" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "allowances" INTEGER NOT NULL DEFAULT 0,
    "deductions" INTEGER NOT NULL DEFAULT 0,
    "leaveDeductions" INTEGER NOT NULL DEFAULT 0,
    "netSalary" INTEGER NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 30,
    "paidDays" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "unpaidLeaveDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "remarks" TEXT,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_employeeId_key" ON "staff_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "staff_profiles_userId_idx" ON "staff_profiles"("userId");

-- CreateIndex
CREATE INDEX "staff_profiles_employeeId_idx" ON "staff_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "staff_profiles_department_idx" ON "staff_profiles"("department");

-- CreateIndex
CREATE INDEX "staff_profiles_isActive_idx" ON "staff_profiles"("isActive");

-- CreateIndex
CREATE INDEX "leave_requests_staffId_idx" ON "leave_requests"("staffId");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_startDate_idx" ON "leave_requests"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_salarySlipNumber_key" ON "payroll_records"("salarySlipNumber");

-- CreateIndex
CREATE INDEX "payroll_records_staffId_idx" ON "payroll_records"("staffId");

-- CreateIndex
CREATE INDEX "payroll_records_month_idx" ON "payroll_records"("month");

-- CreateIndex
CREATE INDEX "payroll_records_year_idx" ON "payroll_records"("year");

-- CreateIndex
CREATE INDEX "payroll_records_status_idx" ON "payroll_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_staffId_month_year_key" ON "payroll_records"("staffId", "month", "year");

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
