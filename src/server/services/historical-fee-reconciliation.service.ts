import { db } from "@/server/db/client";
import { FeePaymentStatus, InstallmentStatus, FeeStructureStatus } from "@prisma/client";
import { CentralFeeCalculatorService } from "./central-fee-calculator.service";

export interface AdmissionAdjustmentItem {
  feeStructureId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  baseCourseFee: number; // In Paise
  discountAmount: number; // In Paise
  previousPayable: number; // In Paise
  previousPaid: number; // In Paise
  previousPending: number; // In Paise
  removedKitFee: number; // In Paise
  removedCertFee: number; // In Paise
  removedGst: number; // In Paise
  totalRemovedCharges: number; // In Paise
  revisedPayable: number; // In Paise
  revisedPending: number; // In Paise
  installmentsAdjustedCount: number;
  status: "ADJUSTMENT_REQUIRED" | "ALREADY_COMPLIANT";
}

export class HistoricalFeeReconciliationService {
  public static readonly EFFECTIVE_TIMESTAMP = new Date("2026-10-30T18:00:00.000Z");

  /**
   * Generates a read-only reconciliation preview of all admissions
   * created before the effective timestamp.
   */
  public static async previewReconciliation(): Promise<{
    totalAdmissionsScanned: number;
    admissionsRequiringAdjustment: number;
    totalAdjustmentAmountPaise: number;
    items: AdmissionAdjustmentItem[];
  }> {
    const feeStructures = await db.feeStructure.findMany({
      where: {
        createdAt: { lt: this.EFFECTIVE_TIMESTAMP },
        status: FeeStructureStatus.ACTIVE,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        course: { select: { title: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const items: AdmissionAdjustmentItem[] = [];
    let totalAdjustmentAmountPaise = 0;
    let admissionsRequiringAdjustment = 0;

    for (const fs of feeStructures) {
      const parsed = CentralFeeCalculatorService.parseFeeStructureSnapshot(fs);
      const studentName = `${fs.student?.user?.firstName || ""} ${fs.student?.user?.lastName || ""}`.trim();

      // Theoretical clean payable = Base Course Fee - Approved Discount
      const baseFee = fs.totalCourseFee || 0;
      const discount = fs.discountAmount || 0;
      const cleanPayable = Math.max(0, baseFee - discount);

      // Check if existing netPayableAmount is inflated by additional charges or GST
      const isInflated = fs.netPayableAmount > cleanPayable;
      const removedCharges = Math.max(0, fs.netPayableAmount - cleanPayable);

      // Paid amount is preserved 100%
      const paid = fs.paidAmount || 0;
      const revisedPending = Math.max(0, cleanPayable - paid);

      const removedKit = parsed.kitFee || fs.registrationFee || 0;
      const removedCert = parsed.globalCertificationFee || fs.softlabServiceFee || 0;
      const removedGst = parsed.gstAmount || Math.max(0, removedCharges - (removedKit + removedCert));

      const unpaidInstallments = fs.installments.filter((i) => i.status !== InstallmentStatus.PAID);

      const requiresAdjustment = isInflated && removedCharges > 0;
      if (requiresAdjustment) {
        admissionsRequiringAdjustment++;
        totalAdjustmentAmountPaise += removedCharges;
      }

      items.push({
        feeStructureId: fs.id,
        studentId: fs.studentId,
        studentName,
        studentEmail: fs.student?.user?.email || "",
        courseTitle: fs.course?.title || "Unknown Course",
        baseCourseFee: baseFee,
        discountAmount: discount,
        previousPayable: fs.netPayableAmount,
        previousPaid: paid,
        previousPending: fs.pendingAmount,
        removedKitFee: requiresAdjustment ? removedKit : 0,
        removedCertFee: requiresAdjustment ? removedCert : 0,
        removedGst: requiresAdjustment ? removedGst : 0,
        totalRemovedCharges: requiresAdjustment ? removedCharges : 0,
        revisedPayable: cleanPayable,
        revisedPending,
        installmentsAdjustedCount: unpaidInstallments.length,
        status: requiresAdjustment ? "ADJUSTMENT_REQUIRED" : "ALREADY_COMPLIANT",
      });
    }

    return {
      totalAdmissionsScanned: feeStructures.length,
      admissionsRequiringAdjustment,
      totalAdjustmentAmountPaise,
      items,
    };
  }

  /**
   * Transactionally applies the approved adjustments to all existing admissions.
   * Preserves historical payment records, receipts, and invoices without deletion.
   */
  public static async applyApprovedAdjustments(authorizedById: string, reason?: string) {
    const preview = await this.previewReconciliation();
    const adjustmentReason =
      reason ||
      "P0 Finance Policy: Removal of unapproved GST, Global Certification & Kit charges from unpaid historical balance";

    const results = await db.$transaction(async (tx) => {
      const updatedRecords: any[] = [];

      for (const item of preview.items) {
        if (item.status !== "ADJUSTMENT_REQUIRED") continue;

        const currentFs = await tx.feeStructure.findUnique({
          where: { id: item.feeStructureId },
          include: {
            installments: { orderBy: { installmentNumber: "asc" } },
          },
        });

        if (!currentFs) continue;

        let existingRemarksObj: any = {};
        try {
          if (currentFs.remarks && currentFs.remarks.trim().startsWith("{")) {
            existingRemarksObj = JSON.parse(currentFs.remarks);
          }
        } catch {}

        const previousDataSnapshot = {
          netPayableAmount: currentFs.netPayableAmount,
          pendingAmount: currentFs.pendingAmount,
          paidAmount: currentFs.paidAmount,
          registrationFee: currentFs.registrationFee,
          softlabServiceFee: currentFs.softlabServiceFee,
          remarks: currentFs.remarks,
        };

        const updatedRemarks = JSON.stringify({
          ...existingRemarksObj,
          policyVersion: "V2_HISTORICAL_ADJUSTED",
          globalCertificationFee: 0,
          slgKitFee: 0,
          gstAmount: 0,
          adjustmentRecord: {
            feeStructureId: item.feeStructureId,
            studentId: item.studentId,
            previousPayable: item.previousPayable,
            revisedPayable: item.revisedPayable,
            previousOutstanding: item.previousPending,
            revisedOutstanding: item.revisedPending,
            removedCharges: {
              kitFee: item.removedKitFee,
              globalCertificationFee: item.removedCertFee,
              gstAmount: item.removedGst,
            },
            adjustmentAmount: item.totalRemovedCharges,
            reason: adjustmentReason,
            timestamp: new Date().toISOString(),
            authorizedBy: authorizedById,
          },
        });

        // 1. Update FeeStructure
        const updatedFs = await tx.feeStructure.update({
          where: { id: item.feeStructureId },
          data: {
            registrationFee: 0,
            softlabServiceFee: 0,
            netPayableAmount: item.revisedPayable,
            pendingAmount: item.revisedPending,
            paymentStatus:
              item.revisedPending === 0
                ? FeePaymentStatus.PAID
                : item.previousPaid > 0
                  ? FeePaymentStatus.PARTIAL
                  : FeePaymentStatus.PENDING,
            remarks: updatedRemarks,
          },
        });

        // 2. Rebalance unpaid future installments
        const unpaidInstallments = currentFs.installments.filter(
          (inst) => inst.status !== InstallmentStatus.PAID
        );

        if (unpaidInstallments.length > 0) {
          const count = unpaidInstallments.length;
          const baseInstallmentAmount = Math.floor(item.revisedPending / count);
          let remainder = item.revisedPending % count;

          for (let i = 0; i < count; i++) {
            const inst = unpaidInstallments[i];
            const extra = remainder > 0 ? 1 : 0;
            if (remainder > 0) remainder--;

            const revisedInstAmount = baseInstallmentAmount + extra;
            const newInstPending = Math.max(0, revisedInstAmount - inst.paidAmount);
            const newStatus =
              newInstPending === 0
                ? InstallmentStatus.PAID
                : inst.paidAmount > 0
                  ? InstallmentStatus.PARTIAL
                  : InstallmentStatus.PENDING;

            await tx.feeInstallment.update({
              where: { id: inst.id },
              data: {
                amount: revisedInstAmount,
                status: newStatus,
                notes: `Historical adjustment applied: revised to ₹${(revisedInstAmount / 100).toLocaleString("en-IN")}`,
              },
            });
          }
        }

        // 3. Create Immutable Audit Log
        await tx.auditLog.create({
          data: {
            actorId: authorizedById,
            action: "FEE_STRUCTURE_HISTORICAL_ADJUSTMENT",
            resourceType: "FeeStructure",
            resourceId: item.feeStructureId,
            previousData: previousDataSnapshot,
            newData: {
              netPayableAmount: item.revisedPayable,
              pendingAmount: item.revisedPending,
              adjustmentAmount: item.totalRemovedCharges,
              authorizedBy: authorizedById,
              reason: adjustmentReason,
            },
          },
        });

        updatedRecords.push({
          feeStructureId: item.feeStructureId,
          studentName: item.studentName,
          adjustedAmountPaise: item.totalRemovedCharges,
          newPayablePaise: item.revisedPayable,
          newPendingPaise: item.revisedPending,
        });
      }

      return updatedRecords;
    });

    return {
      success: true,
      recordsAdjusted: results.length,
      adjustedDetails: results,
    };
  }
}
