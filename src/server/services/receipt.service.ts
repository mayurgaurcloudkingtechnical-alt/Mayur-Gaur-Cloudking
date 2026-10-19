import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

export interface FormattedReceiptData {
  company: {
    name: string;
    tagline: string;
    address: string;
    gstin: string;
    email: string;
    phone: string;
    website: string;
  };
  receiptNumber: string;
  receiptDate: Date;
  student: {
    name: string;
    email: string;
    phone: string;
    studentId?: string;
  };
  admission?: {
    applicationNumber: string;
    admissionId: string;
  };
  course: {
    title: string;
    durationWeeks?: number;
  };
  financials: {
    totalCourseFeePaise: number;
    discountPaise: number;
    netPayablePaise: number;
    amountPaidPaise: number;
    previousCollectionsPaise: number;
    totalPaidSoFarPaise: number;
    pendingAmountPaise: number;
    amountInWords: string;
  };
  payment: {
    id?: string;
    feeStructureId?: string;
    gateway: string;
    transactionReference: string;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    paymentMethod: string;
    status: string;
    paidAt?: Date;
  };
}

export class ReceiptService {
  static readonly COMPANY_INFO = {
    name: "SOFTLAB GLOBAL",
    tagline: "Center for Excellence • Software Development, Cloud & AI",
    address: "SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011",
    gstin: "09AFYFS5388G1ZX",
    email: "info@softlabglobal.com",
    phone: "+91 9196596975 / +91 9196596979",
    website: "https://softlabglobal.com",
  };

  /**
   * Generates a unique sequential/random receipt number: SLG-YYYY-XXXXXX.
   */
  static async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const code = `SLG-${year}-${rand}`;
      const existing = await db.paymentTransaction.findUnique({
        where: { receiptNumber: code },
      });
      if (!existing) {
        return code;
      }
    }
    return `SLG-${year}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Helper to convert integer Paise to Rupee words.
   */
  static amountInWords(paise: number): string {
    const rupees = Math.floor(paise / 100);
    if (rupees <= 0) return "Zero Rupees Only";

    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    function numToWords(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000)
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
      if (n < 100000)
        return (
          numToWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + numToWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          numToWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + numToWords(n % 100000) : "")
        );
      return (
        numToWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + numToWords(n % 10000000) : "")
      );
    }

    return `${numToWords(rupees)} Rupees Only`;
  }

  /**
   * Generates formatted receipt data from a payment transaction.
   */
  static async getReceiptData(paymentIdOrRef: string): Promise<FormattedReceiptData> {
    const payment = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { id: paymentIdOrRef },
          { transactionReference: paymentIdOrRef },
          { receiptNumber: paymentIdOrRef },
          { gatewayOrderId: paymentIdOrRef },
          { gatewayPaymentId: paymentIdOrRef },
        ],
      },
      include: {
        admission: { include: { course: true } },
        feeStructure: { include: { course: true } },
        student: { include: { user: true } },
        enrollment: { include: { course: true } },
      },
    });

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Payment record '${paymentIdOrRef}' not found.`,
      });
    }

    // 1. Resolve feeStructure if not directly loaded on payment
    let feeStructure = payment.feeStructure;
    if (!feeStructure) {
      if (payment.enrollmentId) {
        feeStructure = await db.feeStructure.findUnique({
          where: { enrollmentId: payment.enrollmentId },
          include: { course: true },
        });
      } else if (payment.studentId) {
        feeStructure = await db.feeStructure.findFirst({
          where: { studentId: payment.studentId },
          include: { course: true },
        });
      } else if (payment.admissionId) {
        const admission = await db.admissionApplication.findUnique({
          where: { id: payment.admissionId },
          select: { convertedStudentProfileId: true },
        });
        if (admission?.convertedStudentProfileId) {
          feeStructure = await db.feeStructure.findFirst({
            where: { studentId: admission.convertedStudentProfileId },
            include: { course: true },
          });
        }
      }
    }

    // 2. Query all successful collections for this student / fee structure / admission to compute previous collections
    const historyConditions: any[] = [];
    if (feeStructure?.id) {
      historyConditions.push({ feeStructureId: feeStructure.id });
    }
    if (payment.feeStructureId && payment.feeStructureId !== feeStructure?.id) {
      historyConditions.push({ feeStructureId: payment.feeStructureId });
    }
    if (payment.enrollmentId) {
      historyConditions.push({ enrollmentId: payment.enrollmentId });
    }
    if (payment.studentId) {
      historyConditions.push({ studentId: payment.studentId });
    }
    if (payment.admissionId) {
      historyConditions.push({ admissionId: payment.admissionId });
    }

    let allPayments: Array<{
      id: string;
      amount: number;
      paymentDate: Date;
      createdAt: Date;
    }> = [];

    if (historyConditions.length > 0) {
      allPayments = await db.paymentTransaction.findMany({
        where: {
          status: "SUCCESS",
          OR: historyConditions,
        },
        orderBy: [
          { paymentDate: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          createdAt: true,
        },
      });
    }

    // Include current payment in collections if it's SUCCESS and wasn't returned
    if (payment.status === "SUCCESS" && !allPayments.some((p) => p.id === payment.id)) {
      allPayments.push({
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
      });
      allPayments.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime() || a.createdAt.getTime() - b.createdAt.getTime());
    }

    // Filter previous collections strictly before this payment transaction
    const paymentDateVal = (payment.paidAt || payment.paymentDate).getTime();
    const paymentCreatedVal = payment.createdAt.getTime();

    const previousPayments = allPayments.filter((p) => {
      if (p.id === payment.id) return false;
      const pTime = p.paymentDate.getTime();
      if (pTime < paymentDateVal) return true;
      if (pTime === paymentDateVal) {
        return p.createdAt.getTime() < paymentCreatedVal;
      }
      return false;
    });

    const previousCollectionsPaise = previousPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalPaidSoFarPaise = previousCollectionsPaise + payment.amount;

    const course =
      payment.admission?.course ||
      feeStructure?.course ||
      payment.enrollment?.course;

    const studentName =
      payment.student?.user
        ? `${payment.student.user.firstName} ${payment.student.user.lastName}`.trim()
        : payment.admission?.applicantName || "Student";

    const studentEmail =
      payment.student?.user?.email || payment.admission?.applicantEmail || "";

    const studentPhone =
      payment.student?.user?.phone || payment.admission?.applicantPhone || "";

    const totalCourseFee =
      feeStructure?.totalCourseFee ||
      course?.baseFee ||
      payment.amount;

    const discount = feeStructure?.discountAmount || 0;
    const netPayable = feeStructure?.netPayableAmount || Math.max(0, totalCourseFee - discount);

    // Remaining outstanding fee properly subtracting all previous collections plus this payment
    const pendingAmountPaise = Math.max(0, netPayable - totalPaidSoFarPaise);

    return {
      company: this.COMPANY_INFO,
      receiptNumber: payment.receiptNumber || payment.transactionReference,
      receiptDate: payment.paidAt || payment.paymentDate,
      student: {
        name: studentName,
        email: studentEmail,
        phone: studentPhone,
        studentId: payment.student?.studentId,
      },
      admission: payment.admission
        ? {
            applicationNumber: payment.admission.applicationNumber,
            admissionId: payment.admission.id,
          }
        : undefined,
      course: {
        title: course?.title || "Professional Training Course",
        durationWeeks: course?.durationWeeks,
      },
      financials: {
        totalCourseFeePaise: totalCourseFee,
        discountPaise: discount,
        netPayablePaise: netPayable,
        amountPaidPaise: payment.amount,
        previousCollectionsPaise,
        totalPaidSoFarPaise,
        pendingAmountPaise,
        amountInWords: this.amountInWords(payment.amount),
      },
      payment: {
        id: payment.id,
        feeStructureId: payment.feeStructureId || feeStructure?.id || undefined,
        gateway: payment.gateway || "RAZORPAY",
        transactionReference: payment.transactionReference,
        gatewayOrderId: payment.gatewayOrderId || undefined,
        gatewayPaymentId: payment.gatewayPaymentId || undefined,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        paidAt: payment.paidAt || payment.paymentDate,
      },
    };
  }
}
