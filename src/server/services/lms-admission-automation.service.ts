import { db } from "@/server/db/client";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { OmnichannelInboxService } from "./omnichannel-inbox.service";
import crypto from "crypto";

export interface CompleteAdmissionParams {
  leadId: string;
  applicationId?: string;
  courseId?: string;
  batchId?: string;
  amountPaise: number;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  transactionReference?: string;
}

export class LmsAdmissionAutomationService {
  /**
   * Generates a unique Student ID (e.g. SLG-2026-0042)
   */
  public static async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.studentProfile.count();
    const sequence = String(count + 1).padStart(4, "0");
    return `SLG-${year}-${sequence}`;
  }

  /**
   * Automates the complete conversion: Payment -> Admission -> Student Profile -> LMS Enrollment -> Welcome Message
   */
  public static async processAdmissionAndEnrollment(params: CompleteAdmissionParams) {
    const { leadId, amountPaise, razorpayPaymentId, paymentMethod = "RAZORPAY_ONLINE" } = params;

    // 1. Fetch Lead
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        course: true,
        batch: true,
        applications: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!lead) {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }

    const courseId = params.courseId || lead.interestedCourseId || lead.applications[0]?.courseId;
    if (!courseId) {
      throw new Error("No course specified for admission conversion.");
    }

    const batchId = params.batchId || lead.interestedBatchId || lead.applications[0]?.batchId;

    // 2. Fetch Course Details
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    // 3. Find or Create AdmissionApplication
    let application = lead.applications[0];
    if (!application) {
      const appCount = await db.admissionApplication.count();
      const appNumber = `APP-${new Date().getFullYear()}-${String(appCount + 1).padStart(4, "0")}`;

      application = await db.admissionApplication.create({
        data: {
          applicationNumber: appNumber,
          leadId: lead.id,
          courseId,
          batchId: batchId || null,
          applicantName: lead.fullName,
          applicantEmail: lead.email,
          applicantPhone: lead.phone,
          stage: "CONVERTED",
          deliveryMode: "OFFLINE",
          center: "SOFTLAB GLOBAL Main Campus, Prayagraj",
        },
      });
    } else {
      application = await db.admissionApplication.update({
        where: { id: application.id },
        data: {
          stage: "CONVERTED",
          courseId,
          batchId: batchId || application.batchId,
        },
      });
    }

    // 4. Find or Create User Account for LMS
    let user = await db.user.findFirst({
      where: {
        OR: [{ email: lead.email }, { phone: lead.phone }],
      },
    });

    if (!user) {
      const nameParts = (lead.fullName || "Student Learner").trim().split(/\s+/);
      const firstName = nameParts[0] || "Student";
      const lastName = nameParts.slice(1).join(" ") || "Learner";
      // Temporary password hash for new student
      const tempPasswordHash = crypto.createHash("sha256").update(`${lead.phone}@SLG2026`).digest("hex");
      user = await db.user.create({
        data: {
          email: lead.email,
          phone: lead.phone,
          firstName,
          lastName,
          roleCode: "STUDENT",
          passwordHash: tempPasswordHash,
          status: "ACTIVE",
        },
      });
    }

    // 5. Find or Create Student Profile
    let studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      const studentId = await this.generateStudentId();
      studentProfile = await db.studentProfile.create({
        data: {
          userId: user.id,
          studentId,
          highestDegree: lead.qualification || "Graduate",
          city: lead.city || "Prayagraj",
          whatsappNumber: lead.phone,
          center: "SOFTLAB GLOBAL Main Campus, Prayagraj",
        },
      });
    }

    // Link application to student profile
    await db.admissionApplication.update({
      where: { id: application.id },
      data: { convertedStudentProfileId: studentProfile.id },
    });

    // 6. Create Course Enrollment if not exists
    let enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        courseId,
      },
    });

    if (!enrollment) {
      enrollment = await db.enrollment.create({
        data: {
          studentId: studentProfile.id,
          courseId,
          batchId: batchId || null,
          status: "ACTIVE",
        },
      });
    }

    // 7. Record Payment Transaction
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const txRef = params.transactionReference || razorpayPaymentId || `TXN-${Date.now()}`;
    const payment = await db.paymentTransaction.create({
      data: {
        admissionId: application.id,
        studentId: studentProfile.id,
        enrollmentId: enrollment.id,
        amount: amountPaise,
        paymentMethod: "RAZORPAY" as any,
        transactionReference: txRef,
        status: "SUCCESS" as any,
        receiptNumber,
        paidAt: new Date(),
        gateway: "RAZORPAY",
        remarks: "Online admission fee payment processed via unified system",
      },
    });

    // 8. Update Lead Status
    await db.lead.update({
      where: { id: lead.id },
      data: {
        status: "ADMITTED",
        paymentStatus: "COMPLETED",
        lmsStatus: "ENROLLED",
        admissionStatus: "ENROLLED",
      },
    });

    // 9. Record Unified Chronological Timeline Events
    await OmnichannelInboxService.recordTimelineEvent({
      leadId: lead.id,
      eventType: "PAYMENT_RECEIVED",
      source: "RAZORPAY",
      title: "Fee Payment Verified & Receipt Generated",
      summary: `Received payment of ₹${(amountPaise / 100).toLocaleString("en-IN")}. Official Receipt: ${receiptNumber}`,
      metadata: {
        paymentId: payment.id,
        receiptNumber,
        amountPaise,
        transactionRef: payment.transactionReference,
      },
    });

    await OmnichannelInboxService.recordTimelineEvent({
      leadId: lead.id,
      eventType: "LMS_ENROLLED",
      source: "LMS",
      title: "Student Portal & LMS Account Activated",
      summary: `Generated Student ID ${studentProfile.studentId}. Enrolled in course ${course.title}.`,
      metadata: {
        studentProfileId: studentProfile.id,
        studentId: studentProfile.id,
        enrollmentId: enrollment.id,
        courseId: course.id,
      },
    });

    // 10. Send WhatsApp Onboarding & Welcome Message
    const welcomeMsg = `🎉 Welcome to SoftLab Global, ${lead.fullName}!\n\nYour admission for *${course.title}* has been officially confirmed!\n\n📋 *Admission & LMS Details*:\n• Student ID: *${studentProfile.studentId}*\n• Fee Receipt: *${receiptNumber}*\n• Payment Paid: ₹${(amountPaise / 100).toLocaleString("en-IN")}\n• Campus: Civil Lines, Prayagraj\n\n🔑 *LMS Student Portal Login*:\n🔗 Portal: https://www.softlabglobal.com/login\n📧 Username: ${lead.email}\n📱 Registered Mobile: ${lead.phone}\n\nOur Academic Coordinator will connect with you regarding your batch orientation schedule. We wish you an incredible learning journey!`;

    await WhatsAppBusinessService.sendMessage({
      toPhone: lead.phone,
      text: welcomeMsg,
      leadId: lead.id,
    });

    return {
      success: true,
      leadId: lead.id,
      applicationId: application.id,
      studentId: studentProfile.studentId,
      receiptNumber,
      enrollmentId: enrollment.id,
    };
  }
}
