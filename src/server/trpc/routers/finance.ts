import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { FeeStructureService } from "@/server/services/fee-structure.service";
import { FeeInstallmentService } from "@/server/services/fee-installment.service";
import { PaymentService } from "@/server/services/payment.service";
import { ReceiptService } from "@/server/services/receipt.service";
import { GstBillingService } from "@/server/services/gst-billing.service";
import { VendorBillingService } from "@/server/services/vendor-billing.service";
import { ExpenseManagementService } from "@/server/services/expense-management.service";
import { CreditDebitNoteService } from "@/server/services/credit-debit-note.service";
import { FinancialAccountingService } from "@/server/services/financial-accounting.service";
import { FinancialSettingsService } from "@/server/services/financial-settings.service";
import { HistoricalFeeReconciliationService } from "@/server/services/historical-fee-reconciliation.service";
import { EmailService } from "@/server/services/email.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { AuditService } from "@/server/services/audit.service";
import {
  FeePaymentStatus,
  PaymentMethod,
  GstInvoiceStatus,
  GstCustomerType,
  InvoiceItemType,
  VendorBillStatus,
  ExpenseCategory,
  ExpenseApprovalStatus,
  NoteType,
  NotePartyType,
  GstTaxCategory,
  UserRoleCode,
} from "@prisma/client";
import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

export const financeRouter = router({
  // ==========================================
  // FEES & FINANCIAL METRICS
  // ==========================================
  getOverviewMetrics: protectedProcedure.query(async ({ ctx }) => {
    return FeeStructureService.getOverviewMetrics(asAuthUser(ctx.user));
  }),

  previewHistoricalFeeAdjustments: protectedProcedure.query(async () => {
    return HistoricalFeeReconciliationService.previewReconciliation();
  }),

  applyHistoricalFeeAdjustments: protectedProcedure
    .input(z.object({ reason: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const allowedRoles: UserRoleCode[] = [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ACCOUNTANT,
        UserRoleCode.ADMIN,
      ];
      if (!allowedRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only authorized Finance & Management authorities can apply financial adjustments.",
        });
      }
      return HistoricalFeeReconciliationService.applyApprovedAdjustments(ctx.user.id, input?.reason);
    }),

  listFeeStructures: protectedProcedure
    .input(
      z.object({
        paymentStatus: z.nativeEnum(FeePaymentStatus).optional(),
        courseId: z.string().optional(),
        batchId: z.string().optional(),
        studentId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return FeeStructureService.listFeeStructures(asAuthUser(ctx.user), input);
    }),

  getFeeByEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return FeeStructureService.getByEnrollment(asAuthUser(ctx.user), input.enrollmentId);
    }),

  createFeeStructure: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        registrationFee: z.number().min(0).default(0),
        discountAmount: z.number().min(0).default(0),
        scholarshipAmount: z.number().min(0).default(0),
        remarks: z.string().optional(),
        installments: z
          .array(
            z.object({
              amount: z.number().min(1),
              dueDate: z.date(),
              notes: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeStructureService.createFeeStructure(asAuthUser(ctx.user), input);
    }),

  updateFeeStructure: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string(),
        totalCourseFee: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        scholarshipAmount: z.number().min(0).optional(),
        remarks: z.string().optional(),
        installments: z
          .array(
            z.object({
              installmentNumber: z.number().optional(),
              amount: z.number().min(1),
              dueDate: z.coerce.date(),
              notes: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT", "COUNSELOR", "MANAGER"];
      if (!allowedRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to update fee structures." });
      }
      return FeeStructureService.updateFeeStructure(asAuthUser(ctx.user), input);
    }),

  deleteFeeStructure: protectedProcedure
    .input(z.object({ feeStructureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN"].includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can delete fee structure records.",
        });
      }
      return FeeStructureService.deleteFeeStructure(asAuthUser(ctx.user), input.feeStructureId);
    }),

  // ==========================================
  // INSTALLMENTS
  // ==========================================
  createInstallmentSchedule: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string(),
        installments: z
          .array(
            z.object({
              amount: z.number().min(1),
              dueDate: z.date(),
              notes: z.string().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeInstallmentService.createSchedule(asAuthUser(ctx.user), input);
    }),

  listInstallments: protectedProcedure
    .input(z.object({ feeStructureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return FeeInstallmentService.listInstallments(asAuthUser(ctx.user), input.feeStructureId);
    }),

  updateInstallment: protectedProcedure
    .input(
      z.object({
        installmentId: z.string(),
        dueDate: z.coerce.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeInstallmentService.updateInstallment(asAuthUser(ctx.user), input);
    }),

  listOverdueInstallments: protectedProcedure.query(async ({ ctx }) => {
    const user = asAuthUser(ctx.user);
    const now = new Date();

    const isCompanyFinanceAdmin = [
      "SUPER_ADMIN",
      "DIRECTOR",
      "ADMIN",
      "ACCOUNTANT",
      "MANAGER",
    ].includes(ctx.user.roleCode);

    const whereClause: any = {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: now },
    };

    if (!isCompanyFinanceAdmin) {
      whereClause.feeStructure = {
        OR: [
          { student: { convertedApplication: { counselorId: user.id } } },
          { student: { convertedApplication: { lead: { assignedToId: user.id } } } },
        ],
      };
    }

    const items = await db.feeInstallment.findMany({
      where: whereClause,
      orderBy: { dueDate: "asc" },
      include: {
        feeStructure: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
                convertedApplication: {
                  include: {
                    counselor: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return items.map((inst) => {
      const remainingAmount = Math.max(0, inst.amount - inst.paidAmount);
      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const studentUser = inst.feeStructure?.student?.user;
      const studentProfile = inst.feeStructure?.student;
      const rawPhone = studentUser?.phone || (studentProfile as any)?.whatsappNumber || "";
      const counselor = inst.feeStructure?.student?.convertedApplication?.counselor;

      return {
        id: inst.id,
        feeStructureId: inst.feeStructureId,
        installmentNumber: inst.installmentNumber,
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        overdueAmount: remainingAmount,
        dueDate: inst.dueDate,
        daysOverdue,
        status: inst.status,
        notes: inst.notes,
        studentId: studentProfile?.studentId || "SG-STUDENT",
        studentProfileId: studentProfile?.id,
        studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : "Student",
        studentEmail: studentUser?.email || "",
        studentPhone: rawPhone,
        courseTitle: inst.feeStructure?.course?.title || "IT Program",
        batchName: inst.feeStructure?.batch?.name || "Regular Batch",
        counselorName: counselor ? `${counselor.firstName} ${counselor.lastName}`.trim() : "Admissions Desk",
      };
    });
  }),

  sendOverdueReminderNotice: protectedProcedure
    .input(
      z.object({
        installmentId: z.string(),
        channel: z.enum(["EMAIL", "WHATSAPP", "BOTH"]).default("BOTH"),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = asAuthUser(ctx.user);
      const installment = await db.feeInstallment.findUnique({
        where: { id: input.installmentId },
        include: {
          feeStructure: {
            include: {
              student: {
                include: {
                  user: true,
                  convertedApplication: {
                    include: {
                      counselor: true,
                    },
                  },
                },
              },
              course: true,
            },
          },
        },
      });

      if (!installment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Installment record not found." });
      }

      const student = installment.feeStructure.student;
      const studentUser = student.user;
      const course = installment.feeStructure.course;
      const remainingAmount = Math.max(0, installment.amount - installment.paidAmount);
      const daysOverdue = Math.max(
        0,
        Math.floor((Date.now() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const rawPhone = studentUser.phone || (student as any).whatsappNumber || "";
      const cleanPhone = WhatsAppBusinessService.normalizePhone(rawPhone);
      const studentName = `${studentUser.firstName} ${studentUser.lastName}`.trim();
      const formattedAmount = `₹${(remainingAmount / 100).toLocaleString("en-IN")}`;
      const formattedDueDate = new Date(installment.dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      let emailSent = false;
      let whatsappSent = false;

      // 1. WhatsApp Text Generation
      const waText = [
        `🚨 *URGENT FEE OVERDUE NOTICE — SOFTLAB GLOBAL*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        `Your tuition EMI installment *#${installment.installmentNumber}* for *${course.title}* was due on *${formattedDueDate}* and is currently *OVERDUE* (${daysOverdue} days).`,
        ``,
        `💰 *Overdue Amount Due:* *${formattedAmount}*`,
        ``,
        `💳 *Pay Instantly Online via UPI / Card / NetBanking:*`,
        `👉 https://lms.softlabglobal.com/pay`,
        ``,
        `⚠️ *IMPORTANT NOTICE:*`,
        `As per institutional guidelines, recurring *late fee penalty charges* will be applicable if payment is not recorded immediately. Continued non-payment may restrict LMS access and live batches.`,
        input.customNote ? `\n📝 *Accounts Note:* ${input.customNote}` : "",
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `SoftLab Global Directorate of Accounts & Finance`,
        `📞 Helpline: +91 99363 43015 / +91 91703 14785`,
        `📧 Email: accounts@softlabglobal.com`,
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

      // 2. Dispatch Email
      if (input.channel === "EMAIL" || input.channel === "BOTH") {
        if (studentUser.email) {
          try {
            const emailRes = await EmailService.sendOverdueReminderNotice({
              to: studentUser.email,
              studentName,
              studentId: student.studentId,
              installmentNumber: installment.installmentNumber,
              amountPaise: remainingAmount,
              dueDate: installment.dueDate,
              courseName: course.title,
              daysOverdue,
              customNote: input.customNote,
            });
            emailSent = emailRes.sent;
          } catch (err: any) {
            console.error("Failed to send overdue email notice:", err);
          }
        }
      }

      // 3. Dispatch WhatsApp via Cloud API if active
      if (input.channel === "WHATSAPP" || input.channel === "BOTH") {
        if (cleanPhone) {
          try {
            const waRes = await WhatsAppBusinessService.sendMessage({
              toPhone: cleanPhone,
              text: waText,
            });
            whatsappSent = waRes.success;
          } catch (e) {
            console.warn("WhatsApp automated API dispatch skipped:", e);
          }
        }
      }

      // 4. Audit Log
      await AuditService.log({
        actorId: user.id,
        action: "OVERDUE_FEE_REMINDER_SENT",
        resourceType: "FeeInstallment",
        resourceId: installment.id,
        newData: {
          studentName,
          studentEmail: studentUser.email,
          studentPhone: cleanPhone,
          overdueAmount: remainingAmount,
          daysOverdue,
          channel: input.channel,
          emailSent,
          whatsappSent,
        },
      });

      return {
        success: true,
        emailSent,
        whatsappSent,
        whatsappUrl,
        whatsappText: waText,
        studentName,
        studentEmail: studentUser.email,
        studentPhone: cleanPhone,
        formattedAmount,
      };
    }),

  // ==========================================
  // PAYMENTS
  // ==========================================
  recordOfflinePayment: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string(),
        installmentId: z.string().optional(),
        amount: z.number().min(1), // In Paise
        paymentMethod: z.nativeEnum(PaymentMethod),
        providerReference: z.string().optional(),
        remarks: z.string().optional(),
        paymentDate: z.coerce.date().optional(),
        receiptNumber: z.string().optional(),
        isHistorical: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PaymentService.recordOfflinePayment(asAuthUser(ctx.user), input);
    }),

  listPayments: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string().optional(),
        studentId: z.string().optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return PaymentService.listPayments(asAuthUser(ctx.user), input);
    }),

  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return PaymentService.getPaymentDetails(asAuthUser(ctx.user), input.paymentId);
    }),

  getPaymentReceipt: protectedProcedure
    .input(z.object({ identifier: z.string() }))
    .query(async ({ input }) => {
      return ReceiptService.getReceiptData(input.identifier);
    }),

  updatePayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        amount: z.number().min(1).optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        providerReference: z.string().optional(),
        remarks: z.string().optional(),
        receiptNumber: z.string().optional(),
        paymentDate: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT", "COUNSELOR", "MANAGER"];
      if (!allowedRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to edit payment records." });
      }
      return PaymentService.updatePayment(asAuthUser(ctx.user), input);
    }),

  deletePayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT", "COUNSELOR", "MANAGER"];
      if (!allowedRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You lack permission to delete payment transactions.",
        });
      }
      return PaymentService.deletePayment(asAuthUser(ctx.user), input.paymentId);
    }),

  // ==========================================
  // STUDENT SELF-SERVICE
  // ==========================================
  getMyFeeOverview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.roleCode !== "STUDENT" && ctx.user.roleCode !== "SUPER_ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only enrolled students can view their fee overview." });
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!studentProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }

    const feeStructures = await db.feeStructure.findMany({
      where: { studentId: studentProfile.id, status: "ACTIVE" },
      include: {
        course: { select: { id: true, title: true, providerType: true, providerName: true, universityName: true } },
        batch: { select: { id: true, code: true, name: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    return {
      studentId: studentProfile.studentId,
      studentName: `${studentProfile.user.firstName} ${studentProfile.user.lastName}`.trim(),
      studentEmail: studentProfile.user.email,
      studentPhone: studentProfile.user.phone,
      center: studentProfile.center,
      feeStructures,
    };
  }),

  // ==========================================
  // GST SALES INVOICES
  // ==========================================
  calculateGstBreakup: protectedProcedure
    .input(
      z.object({
        placeOfSupplyStateCode: z.string(),
        companyStateCode: z.string().optional(),
        items: z.array(
          z.object({
            itemType: z.nativeEnum(InvoiceItemType),
            description: z.string().min(1),
            hsnSacCode: z.string().min(1),
            quantity: z.number().min(0.01),
            unit: z.string().optional(),
            ratePaise: z.number().min(0),
            discountPaise: z.number().min(0).optional(),
            gstRate: z.number().min(0).max(28),
            taxCategory: z.nativeEnum(GstTaxCategory).optional(),
            isTaxInclusive: z.boolean().optional(),
            exemptionReason: z.string().optional(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      return GstBillingService.calculateGstBreakup(input);
    }),

  createGstInvoice: protectedProcedure
    .input(
      z.object({
        customerType: z.nativeEnum(GstCustomerType),
        customerName: z.string().min(2),
        customerEmail: z.string().email().optional().or(z.literal("")),
        customerPhone: z.string().optional(),
        customerGstin: z.string().optional(),
        customerAddress: z.string().optional(),
        customerCity: z.string().optional(),
        customerState: z.string().optional(),
        customerStateCode: z.string().optional(),
        placeOfSupply: z.string().optional(),
        invoiceDate: z.coerce.date().optional(),
        dueDate: z.coerce.date(),
        studentId: z.string().optional(),
        admissionId: z.string().optional(),
        feeStructureId: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        termsAndConditions: z.string().optional(),
        issueImmediately: z.boolean().optional(),
        items: z.array(
          z.object({
            itemType: z.nativeEnum(InvoiceItemType),
            description: z.string().min(1),
            hsnSacCode: z.string().min(1),
            quantity: z.number().min(0.01),
            unit: z.string().optional(),
            ratePaise: z.number().min(0),
            discountPaise: z.number().min(0).optional(),
            gstRate: z.number().min(0).max(28),
            taxCategory: z.nativeEnum(GstTaxCategory).optional(),
            isTaxInclusive: z.boolean().optional(),
            exemptionReason: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return GstBillingService.createInvoice(asAuthUser(ctx.user), input);
    }),

  issueDraftInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return GstBillingService.issueDraftInvoice(asAuthUser(ctx.user), input.invoiceId);
    }),

  recordInvoicePayment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        amountPaise: z.number().min(1),
        paymentMethod: z.nativeEnum(PaymentMethod),
        paymentReference: z.string().optional(),
        paymentDate: z.coerce.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return GstBillingService.recordInvoicePayment(asAuthUser(ctx.user), input);
    }),

  cancelGstInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        cancelReason: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return GstBillingService.cancelInvoice(asAuthUser(ctx.user), input.invoiceId, input.cancelReason);
    }),

  listGstInvoices: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(GstInvoiceStatus).optional(),
        customerType: z.nativeEnum(GstCustomerType).optional(),
        search: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return GstBillingService.listInvoices(asAuthUser(ctx.user), input);
    }),

  getGstInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return GstBillingService.getInvoice(asAuthUser(ctx.user), input.invoiceId);
    }),

  // ==========================================
  // VENDOR BILLS & PURCHASES
  // ==========================================
  registerVendor: protectedProcedure
    .input(
      z.object({
        vendorId: z.string().optional(),
        name: z.string().min(2),
        tradeName: z.string().optional(),
        gstin: z.string().optional(),
        pan: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        stateCode: z.string().optional(),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifscCode: z.string().optional(),
        category: z.string().min(2),
        paymentTermsDays: z.number().min(0).default(30),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { vendorId, ...data } = input;
      return VendorBillingService.registerVendor(asAuthUser(ctx.user), data, vendorId);
    }),

  listVendors: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return VendorBillingService.listVendors(asAuthUser(ctx.user), input);
    }),

  submitVendorBill: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        vendorInvoiceNumber: z.string().min(1),
        invoiceDate: z.coerce.date(),
        dueDate: z.coerce.date(),
        costCenter: z.string().optional(),
        department: z.string().optional(),
        taxableAmountPaise: z.number().min(1),
        cgstAmountPaise: z.number().min(0).optional(),
        sgstAmountPaise: z.number().min(0).optional(),
        igstAmountPaise: z.number().min(0).optional(),
        isItcEligible: z.boolean().optional(),
        attachmentUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return VendorBillingService.submitVendorBill(asAuthUser(ctx.user), input);
    }),

  approveVendorBill: protectedProcedure
    .input(
      z.object({
        billId: z.string(),
        decision: z.enum(["APPROVE", "REJECT"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return VendorBillingService.approveVendorBill(asAuthUser(ctx.user), input);
    }),

  recordBillPayment: protectedProcedure
    .input(
      z.object({
        billId: z.string(),
        amountPaise: z.number().min(1),
        paymentDate: z.coerce.date().optional(),
        paymentReference: z.string().min(2),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return VendorBillingService.recordBillPayment(asAuthUser(ctx.user), input);
    }),

  listVendorBills: protectedProcedure
    .input(
      z.object({
        vendorId: z.string().optional(),
        status: z.nativeEnum(VendorBillStatus).optional(),
        department: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return VendorBillingService.listVendorBills(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // EXPENSES & CLAIMS
  // ==========================================
  createExpense: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3),
        category: z.nativeEnum(ExpenseCategory),
        amountPaise: z.number().min(1),
        expenseDate: z.coerce.date().optional(),
        department: z.string().optional(),
        costCenter: z.string().optional(),
        paymentMethod: z.nativeEnum(PaymentMethod),
        paidTo: z.string().min(2),
        isClaim: z.boolean().optional(),
        vendorBillId: z.string().optional(),
        receiptUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ExpenseManagementService.createExpense(asAuthUser(ctx.user), input);
    }),

  approveExpense: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        decision: z.enum(["APPROVE", "REJECT"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ExpenseManagementService.approveExpense(asAuthUser(ctx.user), input);
    }),

  listExpenses: protectedProcedure
    .input(
      z.object({
        category: z.nativeEnum(ExpenseCategory).optional(),
        status: z.nativeEnum(ExpenseApprovalStatus).optional(),
        department: z.string().optional(),
        costCenter: z.string().optional(),
        search: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ExpenseManagementService.listExpenses(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // CREDIT & DEBIT NOTES
  // ==========================================
  createCreditDebitNote: protectedProcedure
    .input(
      z.object({
        noteType: z.nativeEnum(NoteType),
        partyType: z.nativeEnum(NotePartyType),
        gstInvoiceId: z.string().optional(),
        vendorBillId: z.string().optional(),
        noteDate: z.coerce.date().optional(),
        reason: z.string().min(5),
        taxableAmountPaise: z.number().min(1),
        cgstAmountPaise: z.number().min(0).optional(),
        sgstAmountPaise: z.number().min(0).optional(),
        igstAmountPaise: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CreditDebitNoteService.createNote(asAuthUser(ctx.user), input);
    }),

  listCreditDebitNotes: protectedProcedure
    .input(
      z.object({
        noteType: z.nativeEnum(NoteType).optional(),
        partyType: z.nativeEnum(NotePartyType).optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return CreditDebitNoteService.listNotes(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // FINANCIAL ACCOUNTING & REPORTS
  // ==========================================
  getProfitAndLoss: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        department: z.string().optional(),
        costCenter: z.string().optional(),
        reportingBasis: z.enum(["ACCRUAL", "CASH_PROVISIONAL"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return FinancialAccountingService.getProfitAndLoss(asAuthUser(ctx.user), input);
    }),

  getCashFlow: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return FinancialAccountingService.getCashFlow(asAuthUser(ctx.user), input);
    }),

  getOutstandingReceivables: protectedProcedure.query(async ({ ctx }) => {
    return FinancialAccountingService.getOutstandingReceivables(asAuthUser(ctx.user));
  }),

  getVendorPayables: protectedProcedure.query(async ({ ctx }) => {
    return FinancialAccountingService.getVendorPayables(asAuthUser(ctx.user));
  }),

  getGstSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return FinancialAccountingService.getGstSummary(asAuthUser(ctx.user), input);
    }),

  getGeneralLedger: protectedProcedure
    .input(
      z.object({
        accountCode: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return FinancialAccountingService.getGeneralLedger(asAuthUser(ctx.user), input);
    }),

  getExecutiveDashboardMetrics: protectedProcedure
    .input(
      z
        .object({
          month: z.number().int().min(1).max(12).optional(),
          year: z.number().int().min(2020).max(2035).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return FinancialAccountingService.getDashboardMetrics(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // SETTINGS, BUDGETS, APPROVALS & AUDIT
  // ==========================================
  getFinanceSettings: protectedProcedure.query(async ({ ctx }) => {
    return FinancialSettingsService.getSettings(asAuthUser(ctx.user));
  }),

  updateFinanceSettings: protectedProcedure
    .input(z.record(z.any()))
    .mutation(async ({ ctx, input }) => {
      return FinancialSettingsService.updateSettings(asAuthUser(ctx.user), input);
    }),

  listCostCentreBudgets: protectedProcedure
    .input(z.object({ financialYear: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return FinancialSettingsService.listBudgets(asAuthUser(ctx.user), input.financialYear);
    }),

  upsertCostCentreBudget: protectedProcedure
    .input(
      z.object({
        costCentreCode: z.string().min(2),
        costCentreName: z.string().min(2),
        department: z.string().min(2),
        financialYear: z.string().optional(),
        quarter: z.string().optional(),
        allocatedAmountPaise: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FinancialSettingsService.upsertBudget(asAuthUser(ctx.user), input);
    }),

  listPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    return FinancialSettingsService.listPendingApprovals(asAuthUser(ctx.user));
  }),

  listNotificationRules: protectedProcedure.query(async () => {
    return FinancialSettingsService.listNotificationRules();
  }),

  updateNotificationRule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        senderEmail: z.string().email(),
        senderName: z.string(),
        notifyConvertingCounselor: z.boolean(),
        notifyDepartmentManager: z.boolean(),
        notifyFinance: z.boolean(),
        notifyHigherManagement: z.boolean(),
        escalationThresholdPaise: z.number().nullable().optional(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return FinancialSettingsService.updateNotificationRule(asAuthUser(ctx.user), id, data);
    }),

  listFinancialAuditLogs: protectedProcedure
    .input(
      z.object({
        action: z.string().optional(),
        entityType: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return FinancialSettingsService.listAuditLogs(asAuthUser(ctx.user), input);
    }),
});
