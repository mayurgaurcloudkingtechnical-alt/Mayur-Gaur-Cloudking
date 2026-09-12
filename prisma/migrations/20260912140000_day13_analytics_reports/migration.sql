-- CreateEnum
CREATE TYPE "ReportExportType" AS ENUM ('FINANCIAL_LEDGER', 'FEE_DEFAULTERS', 'ADMISSIONS_FUNNEL', 'EXAM_PERFORMANCE', 'PLACEMENT_RECORD', 'STAFF_PAYROLL');

-- CreateTable
CREATE TABLE "audit_report_exports" (
    "id" TEXT NOT NULL,
    "reportType" "ReportExportType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "filtersApplied" JSONB,
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_report_exports_reportType_idx" ON "audit_report_exports"("reportType");

-- CreateIndex
CREATE INDEX "audit_report_exports_generatedById_idx" ON "audit_report_exports"("generatedById");

-- CreateIndex
CREATE INDEX "audit_report_exports_createdAt_idx" ON "audit_report_exports"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_report_exports" ADD CONSTRAINT "audit_report_exports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
