import { db } from "@/server/db/client";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";

export interface ClassNotificationParams {
  classId: string;
  type: "SCHEDULED" | "STARTED" | "RESCHEDULED" | "CANCELLED";
  customMessage?: string;
}

export class ClassroomNotificationService {
  /**
   * Dispatches notifications strictly to students enrolled in the assigned batch
   */
  public static async dispatchClassNotification(params: {
    classId: string;
    type: "SCHEDULED" | "STARTED" | "RESCHEDULED" | "CANCELLED";
    customMessage?: string;
  }): Promise<{ dispatchedCount: number; studentCount: number }> {
    const scheduledClass = await db.scheduledClass.findUnique({
      where: { id: params.classId },
      include: {
        batch: {
          include: {
            course: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
                  include: { user: true },
                },
              },
            },
          },
        },
        trainer: {
          include: { user: true },
        },
      },
    });

    if (!scheduledClass) return { dispatchedCount: 0, studentCount: 0 };

    const { batch } = scheduledClass;
    const course = batch.course;
    const eligibleStudents = batch.enrollments.map((e) => e.student);
    const trainerName = scheduledClass.trainer
      ? `${scheduledClass.trainer.user.firstName} ${scheduledClass.trainer.user.lastName}`
      : "Assigned Faculty";

    const classTimeStr = new Date(scheduledClass.scheduledAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    let title = "";
    let inAppBody = "";
    let waMessage = "";

    switch (params.type) {
      case "SCHEDULED":
        title = `📅 New Live Class Scheduled: ${scheduledClass.title}`;
        inAppBody = `Batch ${batch.code} | Course: ${course.title} | Time: ${classTimeStr} IST | Faculty: ${trainerName}`;
        waMessage = [
          `🎓 *SoftLab Global — Live Class Scheduled*`,
          ``,
          `Batch: *${batch.code}* (${batch.name})`,
          `Course: *${course.title}*`,
          `Lecture Topic: *${scheduledClass.title}*`,
          `Faculty: *${trainerName}*`,
          `Date & Time: *${classTimeStr} IST*`,
          ``,
          `Please log in to your LMS dashboard 10 minutes before class to join the session.`,
          `🔗 https://lms.softlabglobal.com/student/learning`,
        ].join("\n");
        break;

      case "STARTED":
        title = `🔴 LIVE NOW: ${scheduledClass.title}`;
        inAppBody = `Your lecture is live! Click to enter the virtual classroom.`;
        waMessage = [
          `🔴 *SoftLab Global — Lecture is LIVE NOW!*`,
          ``,
          `*${scheduledClass.title}* has commenced.`,
          `Batch: *${batch.code}* | Faculty: *${trainerName}*`,
          ``,
          `Click below to join your classroom immediately:`,
          `🔗 https://lms.softlabglobal.com/student/learning?join=${scheduledClass.id}`,
        ].join("\n");
        break;

      case "RESCHEDULED":
        title = `🔄 Lecture Rescheduled: ${scheduledClass.title}`;
        inAppBody = `New Time: ${classTimeStr} IST | Batch ${batch.code}`;
        waMessage = [
          `🔄 *SoftLab Global — Lecture Rescheduled*`,
          ``,
          `Topic: *${scheduledClass.title}*`,
          `Batch: *${batch.code}*`,
          `Updated Time: *${classTimeStr} IST*`,
          `Reason: ${scheduledClass.statusReason || "Academic rescheduling"}`,
          ``,
          `Updated timetable is available on your student portal.`,
        ].join("\n");
        break;

      case "CANCELLED":
        title = `⚠️ Lecture Cancelled: ${scheduledClass.title}`;
        inAppBody = `Batch ${batch.code} session has been cancelled. Check announcement.`;
        waMessage = [
          `⚠️ *SoftLab Global — Session Cancellation Notice*`,
          ``,
          `The scheduled lecture *${scheduledClass.title}* for Batch *${batch.code}* has been cancelled.`,
          `Reason: ${scheduledClass.statusReason || "Administrative rescheduling"}`,
          ``,
          `A makeup session will be scheduled shortly.`,
        ].join("\n");
        break;
    }

    let dispatchedCount = 0;

    // Send targeted in-app notifications and WhatsApp alerts ONLY to eligible batch students
    for (const student of eligibleStudents) {
      if (!student.user) continue;

      // 1. In-App Notification
      try {
        await db.notification.create({
          data: {
            userId: student.user.id,
            type: "SYSTEM",
            title,
            message: inAppBody,
            link: "/student/live-classes",
            metadata: {
              classId: scheduledClass.id,
              batchId: batch.id,
              courseId: course.id,
            },
          },
        });
        dispatchedCount++;
      } catch (err: any) {
        console.warn(`[ClassroomNotification] In-app alert failed for user ${student.user.id}:`, err.message);
      }

      // 2. WhatsApp Notification (if student phone available)
      if (student.user.phone) {
        try {
          await WhatsAppBusinessService.sendMessage({
            toPhone: student.user.phone,
            text: waMessage,
          });
        } catch (waErr: any) {
          console.warn(`[ClassroomNotification] WhatsApp alert failed for student ${student.studentId}:`, waErr.message);
        }
      }
    }

    return { dispatchedCount, studentCount: eligibleStudents.length };
  }
}
