import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SAFE DATA CLEANUP SCRIPT ===");

  const testEmails = [
    "audit.learner.1789661061488@softlabglobal.com",
    "audit.learner.1789660849865@softlabglobal.com",
    "student.enrolled.1789315640244@example.com",
    "student.unenrolled.1789315642203@example.com",
    "student@softlabglobal.com",
    "srishti.sharma@softlabglobal.com",
  ];

  console.log("Checking test users to remove:", testEmails);

  const testUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    include: {
      studentProfile: {
        include: {
          enrollments: true,
          feeStructures: {
            include: {
              installments: true,
              payments: true,
            },
          },
          attendanceEntries: true,
        },
      },
    },
  });

  console.log(`Found ${testUsers.length} test users to safely remove.`);

  for (const u of testUsers) {
    console.log(`Cleaning test user: ${u.email} (${u.firstName} ${u.lastName})`);

    if (u.studentProfile) {
      const spId = u.studentProfile.id;

      // Delete payments
      await prisma.paymentTransaction.deleteMany({
        where: { studentId: spId },
      });

      // Delete fee installments
      for (const fs of u.studentProfile.feeStructures) {
        await prisma.feeInstallment.deleteMany({
          where: { feeStructureId: fs.id },
        });
      }

      // Delete fee structures
      await prisma.feeStructure.deleteMany({
        where: { studentId: spId },
      });

      // Delete attendance entries
      await prisma.attendanceEntry.deleteMany({
        where: { studentId: spId },
      });

      // Delete enrollments
      await prisma.enrollment.deleteMany({
        where: { studentId: spId },
      });

      // Delete student profile
      await prisma.studentProfile.delete({
        where: { id: spId },
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: u.id },
    });
    console.log(`✓ Removed test user ${u.email}`);
  }

  // Check Director and Telecaller test student profiles if any
  const staffWithStudentProfile = await prisma.studentProfile.findMany({
    where: {
      user: {
        email: { in: ["director@softlabglobal.com", "telecaller@softlabglobal.com"] },
      },
    },
  });

  for (const sp of staffWithStudentProfile) {
    console.log(`Removing leftover test student profile for staff user: ${sp.userId}`);
    await prisma.studentProfile.delete({ where: { id: sp.id } });
  }

  // Verify remaining students
  const remainingStudents = await prisma.studentProfile.findMany({
    include: { user: true },
  });
  console.log(`\nRemaining REAL Student Profiles in DB (${remainingStudents.length}):`);
  remainingStudents.forEach((s) => {
    console.log(`- ${s.studentId}: ${s.user.firstName} ${s.user.lastName} (${s.user.email})`);
  });

  // Verify remaining admissions
  const remainingAdmissions = await prisma.admissionApplication.findMany();
  console.log(`\nRemaining REAL Admissions in DB (${remainingAdmissions.length}):`);
  remainingAdmissions.forEach((a) => {
    console.log(`- ${a.applicationNumber}: ${a.applicantName} (${a.applicantEmail})`);
  });

  console.log("\n✓ Safe cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
