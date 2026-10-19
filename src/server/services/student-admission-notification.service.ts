import { db } from "@/server/db/client";
import { EmailService } from "./email.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import * as bcrypt from "bcryptjs";

export interface StudentAdmissionNotificationInput {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentId: string;
  admissionNumber: string;
  courseTitle: string;
  specialization?: string | null;
  providerName?: string | null;
  temporaryPassword?: string;
  loginEmail?: string;
  counselorName?: string | null;
  counselorPhone?: string | null;
  leadId?: string | null;
}

export class StudentAdmissionNotificationService {
  /**
   * Dispatches Admission Confirmation + Course Details + Student LMS Credentials
   * directly to the Student's Email (with BCC to softlabglobal9@gmail.com) and Student's WhatsApp.
   */
  public static async sendStudentAdmissionAndCredentialsNotification(
    input: StudentAdmissionNotificationInput
  ): Promise<{
    emailSent: boolean;
    whatsappSent: boolean;
    managementBcc: string;
  }> {
    const loginEmail = input.loginEmail || input.studentEmail;
    const tempPassword = input.temporaryPassword || `SoftLab@2026!${input.studentId.replace(/\D/g, "").slice(-4) || "8888"}`;
    const cleanPhone = WhatsAppBusinessService.normalizePhone(input.studentPhone);

    let emailSent = false;
    let whatsappSent = false;

    // 1. Send Consolidated Email to Student + BCC to softlabglobal9@gmail.com
    try {
      const emailResult = await EmailService.sendConsolidatedAdmissionWelcomeEmail({
        to: input.studentEmail,
        studentName: input.studentName,
        studentId: input.studentId,
        admissionNumber: input.admissionNumber,
        courseName: input.courseTitle,
        specialization: input.specialization,
        providerName: input.providerName,
        loginEmail,
        temporaryPassword: tempPassword,
        counselorName: input.counselorName,
        counselorPhone: input.counselorPhone,
      });
      emailSent = emailResult.sent;
    } catch (err: any) {
      console.error(`[StudentAdmissionNotificationService] Email error for ${input.studentEmail}:`, err.message);
    }

    // 2. Send Official Admission & Credentials Message to Student's WhatsApp
    try {
      const waMessage = [
        `🎓 *OFFICIAL ADMISSION CONFIRMED — SOFTLAB GLOBAL* 🚀`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${input.studentName}*, congratulations on your admission!`,
        ``,
        `📚 *COURSE & PROGRAM DETAILS*:`,
        `• Enrolled Program: *${input.courseTitle}*`,
        ...(input.specialization ? [`• Specialization: *${input.specialization}*`] : []),
        `• Academic Provider: ${input.providerName || "SOFTLAB GLOBAL Main Campus"}`,
        `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
        ``,
        `📋 *OFFICIAL ADMISSION RECORD*:`,
        `• Student ID: *${input.studentId}*`,
        `• Admission No: *${input.admissionNumber}*`,
        ``,
        `🔑 *STUDENT LMS PORTAL LOGIN CREDENTIALS*:`,
        `• Portal Link: https://softlabglobal.com/login`,
        `• Login Username / Email: *${loginEmail}*`,
        `• Temporary Password: *${tempPassword}*`,
        `_(Please sign in and change your password upon first login)_`,
        ``,
        `📞 *DEDICATED ADMISSIONS HELPLINE*:`,
        `• Dedicated Calling Line: +91 9196596979`,
        `• Official WhatsApp Helpline: +91 9196596975`,
        ...(input.counselorName ? [`• Enrolling Counselor: *${input.counselorName}*`] : []),
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `✨ We wish you an exceptional learning journey at SoftLab Global! 🌟`,
      ].join("\n");

      const waResult = await WhatsAppBusinessService.sendMessage({
        toPhone: cleanPhone,
        text: waMessage,
        leadId: input.leadId || undefined,
      });

      whatsappSent = waResult.success;
    } catch (err: any) {
      console.error(`[StudentAdmissionNotificationService] WhatsApp error for ${cleanPhone}:`, err.message);
    }

    // 3. Record timeline event
    if (input.leadId) {
      try {
        await db.customerTimelineEvent.create({
          data: {
            leadId: input.leadId,
            eventType: "ADMISSION_CREDENTIALS_DISPATCHED",
            source: "LMS",
            title: "Admission Confirmation & LMS Credentials Delivered to Student",
            summary: `Credentials sent to ${input.studentEmail} (BCC: softlabglobal9@gmail.com) and WhatsApp +91 ${cleanPhone.slice(-10)}.`,
            metadata: {
              studentId: input.studentId,
              admissionNumber: input.admissionNumber,
              emailSent,
              whatsappSent,
              managementEmail: EmailService.DEFAULT_MANAGEMENT_EMAIL,
            },
          },
        });
      } catch (logErr) {
        // non-blocking
      }
    }

    return {
      emailSent,
      whatsappSent,
      managementBcc: EmailService.DEFAULT_MANAGEMENT_EMAIL,
    };
  }

  /**
   * Batch sends Admission Confirmation + Course Details + LMS Credentials to ALL previously admitted students
   * in the database, copying softlabglobal9@gmail.com on every dispatch.
   */
  public static async batchSendToExistingAdmittedStudents(): Promise<{
    totalFound: number;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      studentId: string;
      admissionNumber: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      emailSent: boolean;
      whatsappSent: boolean;
    }>;
  }> {
    const applications = await db.admissionApplication.findMany({
      include: {
        course: true,
        convertedStudentProfile: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const results: Array<{
      studentId: string;
      admissionNumber: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      emailSent: boolean;
      whatsappSent: boolean;
    }> = [];

    const year = new Date().getFullYear();

    for (const app of applications) {
      const studentProfile = app.convertedStudentProfile;
      const user = studentProfile?.user;
      const studentEmail = app.applicantEmail || user?.email;
      const studentPhone = app.applicantPhone || user?.phone;

      if (!studentEmail || !studentPhone) continue;

      const studentId = studentProfile?.studentId || `SLG-${year}-${app.applicationNumber.slice(-4)}`;
      const admissionNumber = app.applicationNumber;
      const studentName = app.applicantName || `${user?.firstName || "Student"} ${user?.lastName || ""}`.trim();
      const courseTitle = app.course?.title || "Professional Technology Training Program";
      const specialization = app.course?.specialization || app.universitySpecialization || null;
      const providerName = app.providerName || (app.providerType === "UNIVERSITY" ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL Main Campus");

      // Set or update a standardized temporary password for existing accounts if needed
      const tempPassword = `SoftLab@${year}!${studentId.replace(/\D/g, "").slice(-4) || "2026"}`;
      if (user) {
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }

      const dispatchResult = await this.sendStudentAdmissionAndCredentialsNotification({
        studentName,
        studentEmail,
        studentPhone,
        studentId,
        admissionNumber,
        courseTitle,
        specialization,
        providerName,
        temporaryPassword: tempPassword,
        loginEmail: studentEmail,
        counselorName: "SOFTLAB GLOBAL Admissions Directorate",
        counselorPhone: "9196596979",
        leadId: app.leadId,
      });

      results.push({
        studentId,
        admissionNumber,
        studentName,
        studentEmail,
        studentPhone,
        emailSent: dispatchResult.emailSent,
        whatsappSent: dispatchResult.whatsappSent,
      });
    }

    const successful = results.filter((r) => r.emailSent || r.whatsappSent).length;
    const failed = results.length - successful;

    return {
      totalFound: applications.length,
      processed: results.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Connect with an individual student via LMS WhatsApp integration according to credentials
   */
  public static async sendStudentLmsWhatsAppMessage(params: {
    studentProfileId: string;
    messageType: "CREDENTIALS" | "CLASS_ALERT" | "ATTENDANCE_WARNING" | "CUSTOM";
    customText?: string;
    batchTitle?: string;
    sessionTime?: string;
    attendancePercentage?: number;
    senderName?: string;
    senderPhone?: string;
  }): Promise<{
    success: boolean;
    phone: string;
    whatsappUrl: string;
    message: string;
    messageId?: string;
  }> {
    const student = await db.studentProfile.findUnique({
      where: { id: params.studentProfileId },
      include: {
        user: true,
        enrollments: {
          include: {
            course: true,
            batch: true,
          },
          take: 1,
        },
      },
    });

    if (!student || !student.user) {
      throw new Error("Student profile record not found.");
    }

    const studentName = `${student.user.firstName} ${student.user.lastName}`.trim();
    const rawPhone = student.user.phone || (student as any).whatsappNumber || "";
    const cleanPhone = WhatsAppBusinessService.normalizePhone(rawPhone);
    const primaryEnrollment = student.enrollments[0];
    const courseTitle = primaryEnrollment?.course?.title || "Enrolled IT Program";
    const batchName = params.batchTitle || primaryEnrollment?.batch?.name || "Regular Batch";
    const senderName = params.senderName || "SoftLab Global Student Directorate";
    const senderPhone = params.senderPhone || "9196596979";

    let messageText = "";

    if (params.messageType === "CREDENTIALS") {
      messageText = [
        `🎓 *SOFTLAB GLOBAL — STUDENT LMS PORTAL ACCESS*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}*,`,
        `Here are your official LMS login credentials and portal access details:`,
        ``,
        `🌐 *Student Portal*: https://softlabglobal.com/login`,
        `🆔 *Student ID*: *${student.studentId}*`,
        `📧 *Username / Email*: *${student.user.email}*`,
        `📚 *Program*: *${courseTitle}*`,
        `🏛️ *Cohort*: *${batchName}*`,
        ``,
        `🔑 *How to Access*:`,
        `1. Visit https://softlabglobal.com/login`,
        `2. Log in using your email and password`,
        `3. Access live lectures, lecture notes, assessments, and digital ID card`,
        ``,
        `📞 *Academic Helpline*: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `📍 *Main Campus*: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else if (params.messageType === "CLASS_ALERT") {
      messageText = [
        `📢 *CLASS SCHEDULE UPDATE — SOFTLAB GLOBAL LMS*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        `Your upcoming session for *${courseTitle}* (${batchName}) is scheduled as follows:`,
        `🕒 *Timing / Schedule*: ${params.sessionTime || "Today as per batch timetable"}`,
        `🏛️ *Campus / Lab*: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`,
        `💻 *Online Access*: https://softlabglobal.com/login`,
        ``,
        `Please ensure punctual attendance and bring your practical assignments.`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else if (params.messageType === "ATTENDANCE_WARNING") {
      const pct = params.attendancePercentage !== undefined ? `${params.attendancePercentage}%` : "below required threshold";
      messageText = [
        `⚠️ *ATTENDANCE COMPLIANCE ALERT — SOFTLAB GLOBAL*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        `Your current attendance for *${courseTitle}* is recorded at *${pct}*.`,
        `Institutional policy requires a minimum of *75% attendance* for corporate placement eligibility and certificate issuance.`,
        ``,
        `Please meet your academic mentor or counselor immediately:`,
        `• Coordinator: *${senderName}*`,
        `• Helpline: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else {
      messageText = [
        `📌 *SOFTLAB GLOBAL ACADEMIC UPDATE*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        params.customText || `We have an important academic update regarding your enrollment in ${courseTitle}.`,
        ``,
        `Portal: https://softlabglobal.com/login`,
        `Helpline: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    let waResult: any = { success: false };
    if (cleanPhone) {
      try {
        waResult = await WhatsAppBusinessService.sendMessage({
          toPhone: cleanPhone,
          text: messageText,
        });
      } catch (err: any) {
        console.error(`[StudentAdmissionNotificationService] Direct student WhatsApp error:`, err.message);
      }
    }

    return {
      success: waResult.success || false,
      phone: cleanPhone,
      whatsappUrl,
      message: messageText,
      messageId: waResult.messageId,
    };
  }

  /**
   * Broadcast WhatsApp notice to all active students in a cohort/batch
   */
  public static async broadcastWhatsAppToBatchStudents(params: {
    batchId: string;
    messageType: "CLASS_ALERT" | "ATTENDANCE_WARNING" | "CUSTOM";
    customText?: string;
    sessionTime?: string;
    senderName?: string;
    senderPhone?: string;
  }): Promise<{
    batchName: string;
    totalStudents: number;
    sentCount: number;
    failedCount: number;
  }> {
    const batch = await db.batch.findUnique({
      where: { id: params.batchId },
      include: {
        course: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Cohort / Batch not found.");
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const enr of batch.enrollments) {
      try {
        const res = await this.sendStudentLmsWhatsAppMessage({
          studentProfileId: enr.student.id,
          messageType: params.messageType,
          customText: params.customText,
          batchTitle: batch.name,
          sessionTime: params.sessionTime,
          senderName: params.senderName,
          senderPhone: params.senderPhone,
        });

        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    return {
      batchName: batch.name,
      totalStudents: batch.enrollments.length,
      sentCount,
      failedCount,
    };
  }
}

