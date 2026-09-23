import { db } from "../src/server/db/client";
import { CrmLeadService } from "../src/server/services/crm-lead.service";
import { LeadSource } from "@prisma/client";

async function main() {
  console.log("=== TESTING EXACT FORM SUBMISSION FROM USER SCREENSHOT ===");

  // Find Shikha Verma or active Counselor
  const counselor = await db.user.findFirst({
    where: {
      OR: [
        { email: "shikha.verma@softlabglobal.com" },
        { roleCode: "COUNSELOR" },
      ],
      status: "ACTIVE",
    },
    include: { role: true },
  });

  if (!counselor) throw new Error("Counselor user not found!");

  const authUser = {
    id: counselor.id,
    email: counselor.email,
    roleCode: counselor.roleCode,
    permissions: counselor.role?.permissions || ["leads:create", "leads:read", "leads:update"],
    firstName: counselor.firstName,
    lastName: counselor.lastName,
  };

  // Find Technical Support Engineer course
  const course = await db.course.findFirst({
    where: {
      title: { contains: "Technical Support Engineer", mode: "insensitive" },
    },
  });

  console.log(`Counselor: ${counselor.firstName} ${counselor.lastName} (${counselor.id})`);
  console.log(`Target Course: ${course?.title || "Not found (optional)"} (${course?.id})`);

  console.log("\nAttempting CrmLeadService.createLead with screenshot data...");
  const result = await CrmLeadService.createLead(authUser, {
    fullName: "Vishu Sahu",
    phone: "6386922151",
    email: "vishusahu600@gmail.com",
    city: "Prayagraj",
    qualification: "Undergraduate",
    interestedCourseId: course?.id || undefined,
    source: LeadSource.WALK_IN,
    qualityScore: "HOT",
    assignedToId: counselor.id,
    assignedCounselorId: counselor.id,
    nextFollowUp: new Date("2026-09-20"),
    notes: "he is ready to enrollment",
  });

  console.log("✓ SUCCESS! Lead created without any error:", {
    id: result.lead.id,
    fullName: result.lead.fullName,
    phone: result.lead.phone,
    email: result.lead.email,
    city: result.lead.city,
    status: result.lead.status,
    notes: result.lead.notes,
    assignedTo: result.lead.assignedTo?.firstName,
    course: result.lead.course?.title,
  });

  // Verify persistence in database
  const verify = await db.lead.findUnique({
    where: { id: result.lead.id },
    include: { course: true, assignedTo: true },
  });

  console.log("✓ Verified in database after fetch:", {
    id: verify?.id,
    fullName: verify?.fullName,
    course: verify?.course?.title,
    assignedTo: verify?.assignedTo?.firstName,
  });

  // Keep or clean up? Note: This is real lead "Vishu Sahu" from user's screenshot!
  console.log("✓ Real lead 'Vishu Sahu' successfully added to CRM pipeline!");
}

main()
  .catch((err) => {
    console.error("✗ Failed to submit form:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
