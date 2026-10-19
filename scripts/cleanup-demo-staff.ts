import { db } from "../src/server/db/client";
import { StaffProfileService } from "../src/server/services/staff-profile.service";
import { UserStatus } from "@prisma/client";

async function cleanup() {
  console.log("--- Cleaning up Demo / Deleted accounts ---");

  // 1. Find an active Super Admin or Director to reassign any foreign key references
  const superAdmin =
    (await db.user.findFirst({
      where: { email: "mayur.gaur@softlabglobal.com", status: UserStatus.ACTIVE },
    })) ||
    (await db.user.findFirst({
      where: { roleCode: "SUPER_ADMIN", status: UserStatus.ACTIVE },
    }));

  if (!superAdmin) {
    throw new Error("No active Super Admin found for reassignment");
  }

  console.log(`Reassigning references to SuperAdmin: ${superAdmin.email} (${superAdmin.id})`);

  // 2. Find all deleted or test users
  const deletedUsers = await db.user.findMany({
    where: { status: UserStatus.DELETED },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(`Found ${deletedUsers.length} deleted users:`, deletedUsers.map((u) => u.email));

  for (const u of deletedUsers) {
    // Reassign attendance records marked by this user
    await db.attendanceRecord.updateMany({
      where: { markedById: u.id },
      data: { markedById: superAdmin.id },
    });

    // Unassign leads
    await db.lead.updateMany({
      where: { assignedCounselorId: u.id },
      data: { assignedCounselorId: null },
    });

    await db.lead.updateMany({
      where: { assignedTelecallerId: u.id },
      data: { assignedTelecallerId: null },
    });

    await db.lead.updateMany({
      where: { assignedToId: u.id },
      data: { assignedToId: null },
    });

    await db.lead.updateMany({
      where: { createdById: u.id },
      data: { createdById: superAdmin.id },
    });

    // Delete trainer profile
    await db.trainerProfile.deleteMany({
      where: { userId: u.id },
    });

    // Delete staff profile
    await db.staffProfile.deleteMany({
      where: { userId: u.id },
    });
  }

  // 3. Remove any dangling staff profiles belonging to non-active users
  await StaffProfileService.ensureStaffProfilesExist();

  // 4. Verify remaining active staff
  const activeStaff = await db.staffProfile.findMany({
    where: { user: { status: UserStatus.ACTIVE } },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          roleCode: true,
        },
      },
    },
  });

  console.log("\n✓ Real Active Staff Count in HRMS:", activeStaff.length);
  for (const s of activeStaff) {
    console.log(`  - [${s.employeeId}] ${s.user.firstName} ${s.user.lastName} (${s.designation}) - ${s.user.email} [${s.user.roleCode}]`);
  }
}

cleanup()
  .then(() => {
    console.log("\nCleanup completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  });
