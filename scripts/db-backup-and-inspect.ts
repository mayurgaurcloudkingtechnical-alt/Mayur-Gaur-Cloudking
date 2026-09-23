import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SOFTLAB GLOBAL DATABASE INSPECTION & BACKUP ===");
  
  const backupDir = "C:/Users/softl/.gemini/antigravity/brain/4e89cd39-94ac-4cf3-ae90-b71f64636f6a/backups";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `db-backup-${timestamp}.json`);

  console.log("Querying all tables...");

  const users = await prisma.user.findMany({
    include: {
      role: true,
      studentProfile: true,
      trainerProfile: true,
      staffProfile: true,
    },
  });

  const roles = await prisma.role.findMany();
  const courses = await prisma.course.findMany();
  const batches = await prisma.batch.findMany();
  
  const studentProfiles = await prisma.studentProfile.findMany({
    include: {
      user: true,
      enrollments: true,
      feeStructures: true,
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: true,
      course: true,
      batch: true,
    },
  });

  const admissions = await prisma.admissionApplication.findMany({
    include: {
      course: true,
      batch: true,
      counselor: true,
      lead: true,
    },
  });

  const leads = await prisma.lead.findMany();
  const followUps = await prisma.followUpHistory.findMany();
  const feeStructures = await prisma.feeStructure.findMany();
  const feeInstallments = await prisma.feeInstallment.findMany();
  const paymentTransactions = await prisma.paymentTransaction.findMany();
  const scheduledClasses = await prisma.scheduledClass.findMany();
  const attendanceRecords = await prisma.attendanceRecord.findMany();
  const attendanceEntries = await prisma.attendanceEntry.findMany();
  const auditLogs = await prisma.auditLog.findMany();

  const backupData = {
    metadata: {
      createdAt: new Date().toISOString(),
      counts: {
        users: users.length,
        roles: roles.length,
        courses: courses.length,
        batches: batches.length,
        studentProfiles: studentProfiles.length,
        enrollments: enrollments.length,
        admissions: admissions.length,
        leads: leads.length,
        followUps: followUps.length,
        feeStructures: feeStructures.length,
        feeInstallments: feeInstallments.length,
        paymentTransactions: paymentTransactions.length,
        scheduledClasses: scheduledClasses.length,
        attendanceRecords: attendanceRecords.length,
        attendanceEntries: attendanceEntries.length,
        auditLogs: auditLogs.length,
      },
    },
    users,
    roles,
    courses,
    batches,
    studentProfiles,
    enrollments,
    admissions,
    leads,
    followUps,
    feeStructures,
    feeInstallments,
    paymentTransactions,
    scheduledClasses,
    attendanceRecords,
    attendanceEntries,
    auditLogs,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`✓ COMPLETE DATABASE BACKUP SAVED TO: ${backupFile}`);
  console.log("Counts Summary:", JSON.stringify(backupData.metadata.counts, null, 2));

  console.log("\n--- DETAILED ADMISSIONS IN DATABASE ---");
  admissions.forEach((a, idx) => {
    console.log(`[Admission #${idx + 1}] ID: ${a.id} | AppNo: ${a.applicationNumber} | Name: ${a.applicantName} | Email: ${a.applicantEmail} | Phone: ${a.applicantPhone} | Stage: ${a.stage} | CreatedAt: ${a.createdAt}`);
  });

  console.log("\n--- DETAILED USERS IN DATABASE ---");
  users.forEach((u, idx) => {
    console.log(`[User #${idx + 1}] ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName} ${u.lastName} | Role: ${u.role?.name || u.roleCode} | CreatedAt: ${u.createdAt}`);
  });

  console.log("\n--- DETAILED STUDENTS IN DATABASE ---");
  studentProfiles.forEach((s, idx) => {
    console.log(`[Student #${idx + 1}] ID: ${s.id} | RegNo: ${s.studentId} | Name: ${s.user?.firstName} ${s.user?.lastName} | Email: ${s.user?.email} | CreatedAt: ${s.createdAt}`);
  });
}

main()
  .catch((e) => {
    console.error("Backup & inspection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
