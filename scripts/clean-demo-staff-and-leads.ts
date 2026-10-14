import { db } from "../src/server/db/client";

async function main() {
  console.log("================================================================================");
  console.log("🧹 CLEANING DEMO / TEST STAFF, TEST USERS, AND TEST LEADS");
  console.log("================================================================================\n");

  // 1. Identify Demo Staff Profiles (all Pooja Sharma test entries or pooja.* / test entries)
  const testStaffUsers = await db.user.findMany({
    where: {
      OR: [
        { email: { startsWith: "pooja." } },
        { email: { contains: ".test." } },
        { email: { contains: "director.test" } },
      ],
    },
    include: {
      staffProfile: true,
    },
  });

  console.log(`Found ${testStaffUsers.length} test users to clean.`);

  const staffProfileIds = testStaffUsers
    .map((u) => u.staffProfile?.id)
    .filter((id): id is string => Boolean(id));
  const userIds = testStaffUsers.map((u) => u.id);

  console.log(`Associated staff profile IDs to clean: ${staffProfileIds.length}`);

  if (staffProfileIds.length > 0) {
    // A. Delete daily report items
    const deletedReportItems = await db.dailyWorkReportItem.deleteMany({
      where: {
        report: {
          staffId: { in: staffProfileIds },
        },
      },
    });
    console.log(`Deleted ${deletedReportItems.count} daily work report items.`);

    // B. Delete daily reports
    const deletedReports = await db.dailyWorkReport.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedReports.count} daily work reports.`);

    // C. Delete task status histories
    const deletedHistories = await db.taskStatusHistory.deleteMany({
      where: {
        task: {
          assignedStaffId: { in: staffProfileIds },
        },
      },
    });
    console.log(`Deleted ${deletedHistories.count} task status histories.`);

    // D. Delete daily work tasks
    const deletedTasks = await db.dailyWorkTask.deleteMany({
      where: {
        assignedStaffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedTasks.count} daily work tasks.`);

    // E. Delete task generation runs
    const deletedRuns = await db.taskGenerationRun.deleteMany({});
    console.log(`Deleted ${deletedRuns.count} task generation runs.`);

    // F. Delete attendance events
    const deletedEvents = await db.attendanceEvent.deleteMany({
      where: {
        OR: [
          { staffId: { in: staffProfileIds } },
          { userId: { in: userIds } },
        ],
      },
    });
    console.log(`Deleted ${deletedEvents.count} attendance events.`);

    // G. Delete regularization requests
    const deletedRegs = await db.attendanceRegularizationRequest.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedRegs.count} regularization requests.`);

    // H. Delete overtime requests
    const deletedOvertimes = await db.overtimeRequest.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedOvertimes.count} overtime requests.`);

    // I. Delete leave balances
    const deletedBalances = await db.leaveBalance.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedBalances.count} leave balances.`);

    // J. Delete staff attendances
    const deletedAttendances = await db.staffAttendance.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedAttendances.count} staff attendances.`);

    // K. Delete staff documents
    const deletedDocs = await db.staffDocument.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedDocs.count} staff documents.`);

    // L. Delete staff onboarding checklists
    const deletedChecklists = await db.staffOnboardingChecklist.deleteMany({
      where: {
        staffId: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedChecklists.count} onboarding checklists.`);

    // M. Delete staff payrolls, tasks, reviews, assets, leaves if any
    await db.payrollRecord.deleteMany({ where: { staffId: { in: staffProfileIds } } });
    await db.staffTask.deleteMany({ where: { assignedStaffId: { in: staffProfileIds } } });
    await db.staffPerformanceReview.deleteMany({ where: { staffId: { in: staffProfileIds } } });
    await db.staffAsset.deleteMany({ where: { assignedStaffId: { in: staffProfileIds } } });
    await db.leaveRequest.deleteMany({ where: { staffId: { in: staffProfileIds } } });
    await db.staffOffboardingRecord.deleteMany({ where: { staffId: { in: staffProfileIds } } });

    // N. Delete staff profiles
    const deletedStaff = await db.staffProfile.deleteMany({
      where: {
        id: { in: staffProfileIds },
      },
    });
    console.log(`Deleted ${deletedStaff.count} staff profiles.`);
  }

  // 2. Delete test users (student test accounts & test college accounts)
  const allTestUserIds = await db.user.findMany({
    where: {
      OR: [
        { email: { startsWith: "pooja." } },
        { email: { contains: ".test." } },
        { email: { startsWith: "test.college." } },
        { email: { startsWith: "student.test." } },
      ],
    },
    select: { id: true, email: true },
  });

  if (allTestUserIds.length > 0) {
    const ids = allTestUserIds.map((u) => u.id);
    const testStudents = await db.studentProfile.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    const studentProfileIds = testStudents.map((s) => s.id);

    if (studentProfileIds.length > 0) {
      await db.driveNomination.deleteMany({ where: { studentProfileId: { in: studentProfileIds } } });
      await db.jobFairRegistration.deleteMany({ where: { studentProfileId: { in: studentProfileIds } } });
      await db.studentInstitutionEnrollment.deleteMany({ where: { studentProfileId: { in: studentProfileIds } } });
      await db.studentProfile.deleteMany({ where: { id: { in: studentProfileIds } } });
    }

    await db.studentImportJob.deleteMany({ where: { uploadedById: { in: ids } } });
    await db.institutionUserMembership.deleteMany({ where: { userId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { actorId: { in: ids } } });
    const deletedUsers = await db.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted ${deletedUsers.count} test users.`);
  }

  // 3. Clean test leads
  const deletedTestLeads = await db.lead.deleteMany({
    where: {
      OR: [
        { email: "aman.gupta.test@gmail.com" },
        { email: "ananya.sharma.test@gmail.com" },
        { email: "test@example.com" },
        { email: { contains: "test@" } },
      ],
    },
  });
  console.log(`Deleted ${deletedTestLeads.count} test leads.`);

  // 4. Verify clean status
  const remainingStaff = await db.staffProfile.count();
  console.log(`\nRemaining staff profiles in database: ${remainingStaff}`);
  console.log("✅ Database cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
