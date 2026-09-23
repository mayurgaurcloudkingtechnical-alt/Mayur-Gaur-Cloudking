import { db } from "../src/server/db/client";

async function main() {
  const targetId = "cmuckjv6z0006olyhfd213prb";
  const student = await db.studentProfile.findUnique({
    where: { id: targetId },
    include: {
      user: true,
      feeStructures: {
        include: {
          installments: true,
          payments: true,
          course: true,
        },
      },
      convertedApplication: {
        include: { payments: true, course: true },
      },
      enrollments: {
        include: { course: true },
      },
    },
  });
  console.log("=== TARGET STUDENT ===");
  console.log("Student:", student?.id, student?.studentId, student?.user?.firstName, student?.user?.lastName, student?.user?.email);
  console.log("FeeStructures:", JSON.stringify(student?.feeStructures, null, 2));
  console.log("ConvertedApplication:", JSON.stringify(student?.convertedApplication, null, 2));

  console.log("\n=== ALL STUDENTS ===");
  const allStudents = await db.studentProfile.findMany({
    include: { user: true, convertedApplication: true },
  });
  console.log(`Total students: ${allStudents.length}`);
  for (const s of allStudents) {
    console.log(`[STUDENT] ID: ${s.id} | Code: ${s.studentId} | Name: ${s.user?.firstName} ${s.user?.lastName} | Email: ${s.user?.email}`);
  }

  console.log("\n=== ALL APPLICATIONS ===");
  const allApps = await db.admissionApplication.findMany({
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Total applications: ${allApps.length}`);
  for (const a of allApps) {
    console.log(`[APP] ID: ${a.id} | Num: ${a.applicationNumber} | Name: ${a.applicantName} | Email: ${a.applicantEmail} | Course: ${a.course.title} | Stage: ${a.stage}`);
  }
}

main().finally(() => db.$disconnect());
