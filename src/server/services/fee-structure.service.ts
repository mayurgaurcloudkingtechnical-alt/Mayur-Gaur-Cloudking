import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { FeePaymentStatus, FeeStructureStatus, Prisma } from "@prisma/client";
import { CentralFeeCalculatorService } from "./central-fee-calculator.service";

export interface CreateFeeStructureInput {
  enrollmentId: string;
  totalCourseFee?: number; // In Paise (Entered by Sales Team)
  registrationFee?: number; // In Paise
  discountAmount?: number; // In Paise
  scholarshipAmount?: number; // In Paise
  remarks?: string;
  installments?: Array<{
    amount: number; // In Paise
    dueDate: Date;
    notes?: string;
  }>;
}

export interface ListFeeStructuresInput {
  paymentStatus?: FeePaymentStatus;
  courseId?: string;
  batchId?: string;
  studentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateFeeStructureInput {
  feeStructureId: string;
  totalCourseFee?: number; // In Paise
  discountAmount?: number; // In Paise
  scholarshipAmount?: number; // In Paise
  remarks?: string;
  installments?: Array<{
    installmentNumber?: number;
    amount: number; // In Paise
    dueDate: Date | string;
    notes?: string;
  }>;
}

export class FeeStructureService {
  public static readonly GLOBAL_CERTIFICATION_FEE = 350000; // ₹3,500 in Paise
  public static readonly SLG_KIT_FEE = 100000; // ₹1,000 in Paise (One-time)
  public static readonly GST_RATE = 0.18; // 18% GST (9% CGST + 9% SGST)
  public static readonly SAC_CODE = "999293";

  /**
   * Calculates financial totals in integer Paise with non-negative validation,
   * including mandatory 18% GST, ₹3,500 Global Certification Fee, and ₹1,000 SLG Kit Fee.
   */
  static calculateNetPayable(params: {
    totalCourseFee: number;
    registrationFee?: number;
    discountAmount: number;
    scholarshipAmount: number;
    globalCertFee?: number;
    kitFee?: number;
    applyGst?: boolean;
    otherCharges?: number;
  }): {
    taxableBase: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    netPayable: number;
    isValid: boolean;
  } {
    const res = CentralFeeCalculatorService.calculate({
      baseCourseFee: params.totalCourseFee,
      discountAmount: params.discountAmount,
      scholarshipAmount: params.scholarshipAmount,
      globalCertificationFee: params.globalCertFee,
      kitFee: params.kitFee ?? params.registrationFee,
      otherCharges: params.otherCharges,
      applyGst: params.applyGst,
    });

    return {
      taxableBase: res.taxableBase,
      gstAmount: res.gstAmount,
      cgstAmount: res.cgstAmount,
      sgstAmount: res.sgstAmount,
      netPayable: res.finalPayable,
      isValid: res.finalPayable >= 0 && (params.discountAmount || 0) >= 0 && (params.scholarshipAmount || 0) >= 0,
    };
  }

  /**
   * Creates a fee structure for an enrollment, validating gross fees, deductions, and installment sums.
   */
  static async createFeeStructure(user: AuthenticatedUser, input: CreateFeeStructureInput) {
    const canCreate =
      hasPermission(user.permissions, "payments:record_offline") ||
      hasPermission(user.permissions, "admissions:create") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ACCOUNTANT";

    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to create student fee structures.",
      });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: input.enrollmentId },
      include: {
        course: true,
        student: true,
        feeStructure: true,
      },
    });

    if (!enrollment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Enrollment with ID '${input.enrollmentId}' not found.`,
      });
    }

    if (enrollment.feeStructure) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A fee structure already exists for this enrollment.",
      });
    }

    const totalCourseFee = input.totalCourseFee && input.totalCourseFee > 0 ? Math.floor(input.totalCourseFee) : enrollment.course.baseFee;
    const registrationFee = Math.max(0, Math.floor(input.registrationFee || 0));
    const discountAmount = Math.max(0, Math.floor(input.discountAmount || 0));
    const scholarshipAmount = Math.max(0, Math.floor(input.scholarshipAmount || 0));
    const netPayable = Math.max(0, totalCourseFee + registrationFee - discountAmount - scholarshipAmount);

    if (!isValid || netPayable < 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Total discounts and scholarships cannot exceed total course fee plus registration fee.",
      });
    }

    // Validate installment plan if supplied
    if (input.installments && input.installments.length > 0) {
      const sumInstallments = input.installments.reduce((acc, inst) => acc + Math.floor(inst.amount), 0);
      if (sumInstallments !== netPayable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Installments total (${sumInstallments} Paise) must exactly equal net payable amount (${netPayable} Paise).`,
        });
      }
    }

    return await db.$transaction(async (tx) => {
      const breakdownRemarks = JSON.stringify({
        baseFee: totalCourseFee,
        discount: discountAmount,
        scholarship: scholarshipAmount,
        globalCertificationFee: this.GLOBAL_CERTIFICATION_FEE,
        slgKitFee: this.SLG_KIT_FEE,
        taxableBase: taxableBase,
        gstRate: "18%",
        cgst: cgstAmount,
        sgst: sgstAmount,
        gstTotal: gstAmount,
        grossPayable: netPayable,
        sacCode: this.SAC_CODE,
        userRemarks: input.remarks?.trim() || null,
      });

      const feeStructure = await tx.feeStructure.create({
        data: {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          batchId: enrollment.batchId,
          totalCourseFee,
          registrationFee: registrationFee,
          softlabServiceFee: 0,
          discountAmount,
          scholarshipAmount,
          netPayableAmount: netPayable,
          paidAmount: 0,
          pendingAmount: netPayable,
          paymentStatus: netPayable === 0 ? FeePaymentStatus.PAID : FeePaymentStatus.PENDING,
          status: FeeStructureStatus.ACTIVE,
          remarks: breakdownRemarks,
          createdById: user.id,
        },
      });

      if (input.installments && input.installments.length > 0) {
        for (let i = 0; i < input.installments.length; i++) {
          const inst = input.installments[i];
          await tx.feeInstallment.create({
            data: {
              feeStructureId: feeStructure.id,
              installmentNumber: i + 1,
              amount: Math.floor(inst.amount),
              paidAmount: 0,
              dueDate: new Date(inst.dueDate),
              notes: inst.notes?.trim() || null,
            },
          });
        }
      }

      await AuditService.log({
        actorId: user.id,
        action: "FEE_STRUCTURE_CREATED",
        resourceType: "FeeStructure",
        resourceId: feeStructure.id,
        newData: {
          enrollmentId: enrollment.id,
          netPayableAmount: netPayable,
          installmentsCount: input.installments?.length || 0,
        },
      });

      return await tx.feeStructure.findUnique({
        where: { id: feeStructure.id },
        include: {
          installments: { orderBy: { installmentNumber: "asc" } },
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          course: { select: { id: true, title: true } },
        },
      });
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Retrieves fee structure by enrollment ID.
   */
  static async getByEnrollment(user: AuthenticatedUser, enrollmentId: string) {
    const fee = await db.feeStructure.findUnique({
      where: { enrollmentId },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        course: { select: { id: true, title: true, baseFee: true } },
        batch: { select: { id: true, code: true, name: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!fee) return null;

    if (user.roleCode === "STUDENT") {
      const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
      if (!studentProfile || studentProfile.id !== fee.studentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only access your own fee details." });
      }
    }

    return fee;
  }

  /**
   * Lists fee structures with filtering and pagination.
   */
  static async listFeeStructures(user: AuthenticatedUser, input: ListFeeStructuresInput) {
    const canView =
      hasPermission(user.permissions, "payments:view_ledger") ||
      hasPermission(user.permissions, "admissions:read") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "COUNSELOR" ||
      user.roleCode === "MANAGER";

    if (!canView) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to view institutional fee records." });
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FeeStructureWhereInput = {
      status: FeeStructureStatus.ACTIVE,
    };

    const isCompanyFinanceAdmin =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "MANAGER";

    if (!isCompanyFinanceAdmin && user.roleCode !== "STUDENT") {
      where.OR = [
        { student: { convertedApplication: { counselorId: user.id } } },
        { student: { convertedApplication: { lead: { assignedToId: user.id } } } },
      ];
    }

    if (input.paymentStatus) where.paymentStatus = input.paymentStatus;
    if (input.courseId) where.courseId = input.courseId;
    if (input.batchId) where.batchId = input.batchId;
    if (input.studentId) where.studentId = input.studentId;

    if (input.search) {
      const q = input.search.trim();
      where.OR = [
        { student: { studentId: { contains: q, mode: "insensitive" } } },
        { student: { user: { firstName: { contains: q, mode: "insensitive" } } } },
        { student: { user: { lastName: { contains: q, mode: "insensitive" } } } },
        { student: { user: { email: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, items] = await Promise.all([
      db.feeStructure.count({ where }),
      db.feeStructure.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
          course: { select: { id: true, title: true, baseFee: true } },
          batch: { select: { id: true, code: true, name: true } },
          installments: { orderBy: { installmentNumber: "asc" } },
          payments: {
            where: { status: "SUCCESS" },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              receiptNumber: true,
              transactionReference: true,
              paymentMethod: true,
              paymentDate: true,
              remarks: true,
              status: true,
            },
          },
          _count: { select: { installments: true, payments: true } },
        },
      }),
    ]);

    const enrichedItems = items.map((fee) => {
      const snap = CentralFeeCalculatorService.parseFeeStructureSnapshot(fee);
      return {
        ...fee,
        baseCourseFee: snap.baseCourseFee,
        discountAmount: snap.discountAmount,
        discountedCourseFee: snap.discountedCourseFee,
        kitFee: snap.kitFee,
        globalCertificationFee: snap.globalCertificationFee,
        otherCharges: snap.otherCharges,
        totalAdditionalCharges: snap.totalAdditionalCharges,
        gstAmount: snap.gstAmount,
        finalPayable: snap.finalPayable,
        paidAmount: snap.paidAmount,
        pendingAmount: snap.pendingAmount,
        policyVersion: snap.policyVersion,
        isHistoricalAdjusted: snap.isHistoricalAdjusted,
      };
    });

    return { items: enrichedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Updates an existing fee structure atomically, recalculating net payable and outstanding balance.
   */
  static async updateFeeStructure(user: AuthenticatedUser, input: UpdateFeeStructureInput) {
    const canEdit =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "COUNSELOR" ||
      user.roleCode === "MANAGER" ||
      hasPermission(user.permissions, "payments:record_offline") ||
      hasPermission(user.permissions, "admissions:create");

    if (!canEdit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to edit student fee structures.",
      });
    }

    const fee = await db.feeStructure.findUnique({
      where: { id: input.feeStructureId },
      include: {
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: { where: { status: "SUCCESS" } },
      },
    });

    if (!fee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Fee structure '${input.feeStructureId}' not found.`,
      });
    }

    const newTotalCourseFee =
      input.totalCourseFee !== undefined ? Math.floor(input.totalCourseFee) : fee.totalCourseFee;
    const newDiscount =
      input.discountAmount !== undefined ? Math.floor(input.discountAmount) : fee.discountAmount;
    const newScholarship =
      input.scholarshipAmount !== undefined ? Math.floor(input.scholarshipAmount) : fee.scholarshipAmount;
    const newRemarks = input.remarks !== undefined ? input.remarks : fee.remarks;

    const newNetPayable = Math.max(0, newTotalCourseFee - newDiscount - newScholarship);

    // Sum all recorded successful payments
    const totalPaid = fee.payments.reduce((acc, p) => acc + p.amount, 0);
    const newPending = Math.max(0, newNetPayable - totalPaid);
    const newStatus =
      newPending === 0
        ? FeePaymentStatus.PAID
        : totalPaid > 0
        ? FeePaymentStatus.PARTIAL
        : FeePaymentStatus.PENDING;

    return await db.$transaction(async (tx) => {
      // 1. Recreate/adjust installments if provided
      if (input.installments && input.installments.length > 0) {
        await tx.feeInstallment.deleteMany({
          where: { feeStructureId: fee.id },
        });

        let remainingPaid = totalPaid;
        for (let i = 0; i < input.installments.length; i++) {
          const inst = input.installments[i];
          const instAmount = Math.floor(inst.amount);
          let instPaid = 0;
          let instStatus: any = "PENDING";

          if (remainingPaid > 0) {
            if (remainingPaid >= instAmount) {
              instPaid = instAmount;
              instStatus = "PAID";
              remainingPaid -= instAmount;
            } else {
              instPaid = remainingPaid;
              instStatus = "PARTIAL";
              remainingPaid = 0;
            }
          }

          await tx.feeInstallment.create({
            data: {
              feeStructureId: fee.id,
              installmentNumber: inst.installmentNumber || i + 1,
              amount: instAmount,
              paidAmount: instPaid,
              dueDate: new Date(inst.dueDate),
              status: instStatus,
              paidAt: instPaid > 0 ? new Date() : null,
              notes: inst.notes || (i === 0 && instPaid > 0 ? "Initial installment payment" : null),
            },
          });
        }
      }

      // 2. Update FeeStructure record
      const updated = await tx.feeStructure.update({
        where: { id: fee.id },
        data: {
          totalCourseFee: newTotalCourseFee,
          discountAmount: newDiscount,
          scholarshipAmount: newScholarship,
          netPayableAmount: newNetPayable,
          paidAmount: totalPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
          remarks: newRemarks,
        },
        include: {
          student: { include: { user: true } },
          course: true,
          installments: { orderBy: { installmentNumber: "asc" } },
          payments: { where: { status: "SUCCESS" } },
        },
      });

      // 3. Audit log
      await AuditService.log({
        actorId: user.id,
        action: "FEE_STRUCTURE_UPDATED",
        resourceType: "FeeStructure",
        resourceId: fee.id,
        newData: {
          totalCourseFee: newTotalCourseFee,
          discountAmount: newDiscount,
          netPayableAmount: newNetPayable,
          paidAmount: totalPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
        },
      });

      return updated;
    });
  }

  /**
   * Aggregates live institutional finance metrics in Paise.
   */
  static async getOverviewMetrics(user: AuthenticatedUser) {
    const canView =
      hasPermission(user.permissions, "payments:view_ledger") ||
      hasPermission(user.permissions, "admissions:read") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "COUNSELOR" ||
      user.roleCode === "MANAGER";

    if (!canView || user.roleCode === "STUDENT") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to financial ledger metrics." });
    }

    const now = new Date();

    const isCompanyFinanceAdmin =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "MANAGER";

    if (!isCompanyFinanceAdmin) {
      // Counselors and non-admin staff: ONLY see their own collections and dues.
      // Total company revenue / company total turnover is strictly protected and hidden.
      const feeWhere: Prisma.FeeStructureWhereInput = {
        status: FeeStructureStatus.ACTIVE,
        OR: [
          { student: { convertedApplication: { counselorId: user.id } } },
          { student: { convertedApplication: { lead: { assignedToId: user.id } } } },
        ],
      };

      const paymentWhere: Prisma.PaymentTransactionWhereInput = {
        status: "SUCCESS",
        OR: [
          { receivedById: user.id },
          { admission: { counselorId: user.id } },
          { student: { convertedApplication: { counselorId: user.id } } },
          { feeStructure: { student: { convertedApplication: { counselorId: user.id } } } },
        ],
      };

      const [myFeeAggr, myPaymentAggr, recentPayments, pendingStudents, myAllStructures] = await Promise.all([
        db.feeStructure.aggregate({
          where: feeWhere,
          _sum: {
            totalCourseFee: true,
            discountAmount: true,
            netPayableAmount: true,
            paidAmount: true,
            pendingAmount: true,
          },
          _count: { id: true },
        }),
        db.paymentTransaction.aggregate({
          where: paymentWhere,
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.paymentTransaction.findMany({
          where: paymentWhere,
          take: 6,
          orderBy: { paymentDate: "desc" },
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            feeStructure: { include: { course: { select: { title: true } } } },
          },
        }),
        db.feeStructure.findMany({
          where: { ...feeWhere, pendingAmount: { gt: 0 } },
          take: 6,
          orderBy: { pendingAmount: "desc" },
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            course: { select: { title: true } },
            batch: { select: { name: true, code: true } },
          },
        }),
        db.feeStructure.findMany({
          where: feeWhere,
          select: {
            totalCourseFee: true,
            discountAmount: true,
            registrationFee: true,
            softlabServiceFee: true,
            otherCharges: true,
            netPayableAmount: true,
            paidAmount: true,
            pendingAmount: true,
            remarks: true,
          },
        }),
      ]);

      let myOriginalCourseFee = 0;
      let myDiscountGiven = 0;
      let myNetCourseRevenue = 0;
      let myTotalBilling = 0;
      let myTotalPending = 0;

      for (const fs of myAllStructures) {
        const snap = CentralFeeCalculatorService.parseFeeStructureSnapshot(fs);
        myOriginalCourseFee += snap.baseCourseFee;
        myDiscountGiven += snap.discountAmount;
        myNetCourseRevenue += snap.discountedCourseFee;
        myTotalBilling += snap.finalPayable;
        myTotalPending += snap.pendingAmount;
      }

      const myCollected = myPaymentAggr._sum.amount || 0;
      const myReceivable = myTotalBilling;
      const myOutstanding = myTotalPending;
      const collectionRate = myReceivable > 0 ? Math.round((myCollected / myReceivable) * 100) : 100;

      return {
        isRestrictedView: true,
        originalCourseFee: myOriginalCourseFee,
        discountGiven: myDiscountGiven,
        netDiscountedCourseRevenue: myNetCourseRevenue,
        gstLiability: 0,
        globalCertificationCharges: 0,
        kitCharges: 0,
        otherCharges: 0,
        totalStudentBilling: myTotalBilling,
        actualPaymentsCollected: myCollected,
        outstandingReceivables: myOutstanding,
        adjustmentsWaivers: 0,
        totalBusiness: 0, // Total company revenue hidden
        totalDiscount: myDiscountGiven,
        totalReceivable: myReceivable,
        totalCollected: myCollected, // Only counselor's own collections!
        myCollection: myCollected,
        totalOutstanding: myOutstanding,
        overdueAmount: 0,
        collectionRate,
        totalEnrolledFees: myFeeAggr._count.id,
        partialCount: 0,
        recentPayments,
        pendingStudents,
      };
    }

    // Company Finance Admins (Super Admin, Director, Admin, Accountant, Manager)
    const [aggregates, overdueInstallments, partialCount, recentPayments, pendingStudents, allStructures] = await Promise.all([
      db.feeStructure.aggregate({
        where: { status: FeeStructureStatus.ACTIVE },
        _sum: {
          totalCourseFee: true,
          discountAmount: true,
          netPayableAmount: true,
          paidAmount: true,
          pendingAmount: true,
        },
        _count: { id: true },
      }),
      db.feeInstallment.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          dueDate: { lt: now },
        },
        select: { amount: true, paidAmount: true },
      }),
      db.feeStructure.count({
        where: { paymentStatus: FeePaymentStatus.PARTIAL, status: FeeStructureStatus.ACTIVE },
      }),
      db.paymentTransaction.findMany({
        take: 6,
        orderBy: { paymentDate: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          feeStructure: { include: { course: { select: { title: true } } } },
        },
      }),
      db.feeStructure.findMany({
        where: { pendingAmount: { gt: 0 }, status: FeeStructureStatus.ACTIVE },
        take: 6,
        orderBy: { pendingAmount: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          course: { select: { title: true } },
          batch: { select: { name: true, code: true } },
        },
      }),
      db.feeStructure.findMany({
        where: { status: FeeStructureStatus.ACTIVE },
        select: {
          totalCourseFee: true,
          discountAmount: true,
          registrationFee: true,
          softlabServiceFee: true,
          otherCharges: true,
          netPayableAmount: true,
          paidAmount: true,
          pendingAmount: true,
          remarks: true,
        },
      }),
    ]);

    let originalCourseFee = 0;
    let discountGiven = 0;
    let netDiscountedCourseRevenue = 0;
    let globalCertificationCharges = 0;
    let kitCharges = 0;
    let otherCharges = 0;
    let gstLiability = 0;
    let totalStudentBilling = 0;
    let actualPaymentsCollected = 0;
    let outstandingReceivables = 0;
    let adjustmentsWaivers = 0;

    for (const fs of allStructures) {
      const snap = CentralFeeCalculatorService.parseFeeStructureSnapshot(fs);
      originalCourseFee += snap.baseCourseFee;
      discountGiven += snap.discountAmount;
      netDiscountedCourseRevenue += snap.discountedCourseFee;
      globalCertificationCharges += snap.globalCertificationFee;
      kitCharges += snap.kitFee;
      otherCharges += snap.otherCharges;
      gstLiability += snap.gstAmount;
      totalStudentBilling += snap.finalPayable;
      actualPaymentsCollected += snap.paidAmount;
      outstandingReceivables += snap.pendingAmount;
    }

    const totalBusiness = netDiscountedCourseRevenue; // Net Course Revenue! Never misleadingly includes tax or pass-through
    const totalDiscount = discountGiven;
    const totalReceivable = totalStudentBilling;
    const totalCollected = actualPaymentsCollected;
    const totalOutstanding = outstandingReceivables;

    const overdueAmount = overdueInstallments.reduce((acc, inst) => {
      const remaining = inst.amount - inst.paidAmount;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    const collectionRate = totalReceivable > 0 ? Math.round((totalCollected / totalReceivable) * 100) : 100;

    return {
      isRestrictedView: false,
      // Section 5 Reporting Metrics:
      originalCourseFee, // A. Original Course Fee
      discountGiven, // B. Discount Given
      netDiscountedCourseRevenue, // C. Net Discounted Course Revenue (Pure Course Revenue!)
      gstLiability, // D. GST Collected / Tax Liability
      globalCertificationCharges, // E. Global Certification Charges
      kitCharges, // F. Kit Charges
      otherCharges, // G. Other Additional Charges
      totalStudentBilling, // H. Total Student Billing
      actualPaymentsCollected, // I. Actual Payments Collected
      outstandingReceivables, // J. Outstanding Receivables
      adjustmentsWaivers, // K. Refunds and Approved Adjustments

      // Legacy / compatibility aliases:
      totalBusiness,
      totalDiscount,
      totalReceivable,
      totalCollected,
      myCollection: totalCollected,
      totalOutstanding,
      overdueAmount,
      collectionRate,
      totalEnrolledFees: aggregates._count.id,
      partialCount,
      recentPayments,
      pendingStudents,
    };
  }

  /**
   * Deletes a fee structure and all associated installments & payment records cleanly.
   */
  static async deleteFeeStructure(user: AuthenticatedUser, feeStructureId: string) {
    if (!["SUPER_ADMIN", "ADMIN", "DIRECTOR"].includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can delete a fee structure record.",
      });
    }

    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: { student: { include: { user: true } }, course: true },
    });

    if (!feeStructure) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Fee structure not found." });
    }

    await db.$transaction(async (tx) => {
      // 1. Delete payment transactions linked to this fee structure
      await tx.paymentTransaction.deleteMany({
        where: { feeStructureId },
      });

      // 2. Delete installments
      await tx.feeInstallment.deleteMany({
        where: { feeStructureId },
      });

      // 3. Delete fee structure itself
      await tx.feeStructure.delete({
        where: { id: feeStructureId },
      });
    });

    await AuditService.log({
      actorId: user.id,
      action: "FEE_STRUCTURE_DELETED",
      resourceType: "FeeStructure",
      resourceId: feeStructureId,
      newData: {
        studentId: feeStructure.studentId,
        courseId: feeStructure.courseId,
        studentName: `${feeStructure.student?.user?.firstName || ""} ${feeStructure.student?.user?.lastName || ""}`,
        courseName: feeStructure.course?.title,
      },
    });

    return { success: true };
  }
}
