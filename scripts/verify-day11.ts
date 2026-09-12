import { db } from "../src/server/db/client";
import { CorporatePartnerService } from "../src/server/services/corporate-partner.service";
import { JobDriveService } from "../src/server/services/job-drive.service";
import { PlacementApplicationService } from "../src/server/services/placement-application.service";
import { AuthenticatedUser } from "../src/server/auth/rbac";
import {
  UserRoleCode,
  JobType,
  JobDriveStatus,
  PlacementApplicationStatus,
  InterviewRoundType,
} from "@prisma/client";

const mockAdmin: AuthenticatedUser = {
  id: "test-placement-admin-id",
  email: "placement-admin@softlabglobal.com",
  roleCode: UserRoleCode.ADMIN,
  permissions: ["*"],
  firstName: "Placement",
  lastName: "Admin",
};

async function main() {
  console.log("=== DAY 11 VERIFICATION: PLACEMENT & CAREER ECOSYSTEM ===");

  // 1. Ensure test admin user exists in DB for foreign key
  let adminUser = await db.user.findFirst({
    where: { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN] } },
  });

  if (!adminUser) {
    console.log("Creating baseline admin user for test...");
    adminUser = await db.user.create({
      data: {
        email: `placement-admin-${Date.now()}@softlabglobal.com`,
        passwordHash: "dummy-hash",
        firstName: "Placement",
        lastName: "Officer",
        roleCode: UserRoleCode.ADMIN,
      },
    });
  }

  const activeAdmin: AuthenticatedUser = {
    id: adminUser.id,
    email: adminUser.email,
    roleCode: adminUser.roleCode,
    permissions: ["*"],
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
  };

  // 2. Ensure test course exists
  let testCourse = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!testCourse) {
    testCourse = await db.course.create({
      data: {
        title: "Full Stack Placement Track",
        slug: `fs-track-${Date.now()}`,
        summary: "Track summary",
        description: "Track description",
        baseFee: 5000000,
        status: "PUBLISHED",
      },
    });
  }

  // 3. Test Corporate Partner Creation
  console.log("\n[TEST 1] Corporate Partner Management");
  const partner = await CorporatePartnerService.createPartner(activeAdmin, {
    name: `Global TechCorp ${Date.now()}`,
    industry: "Information Technology",
    website: "https://globaltechcorp.example.com",
    contactPerson: "Jane Recruiter",
    contactEmail: "recruiter@globaltechcorp.example.com",
    location: "Bangalore, India",
  });
  console.log(`✓ Corporate Partner created: ${partner.name} (ID: ${partner.id})`);

  const updatedPartner = await CorporatePartnerService.updatePartner(activeAdmin, {
    id: partner.id,
    location: "Hyderabad & Bangalore",
  });
  console.log(`✓ Corporate Partner updated: location=${updatedPartner.location}`);

  // 4. Test Job Drive Creation with Criteria
  console.log("\n[TEST 2] Job Drive Creation & Gating Criteria");
  const drive = await JobDriveService.createJobDrive(activeAdmin, {
    companyId: partner.id,
    title: "Associate Software Engineer - 2026",
    jobType: JobType.FULL_TIME,
    description: "Full Stack Engineer needed for core engineering group.",
    targetCourseId: testCourse.id,
    minPassingPercentage: 70,
    requireCertification: true,
    salaryPackage: "₹6.5 - 8.5 LPA",
    location: "Hyderabad, India",
    status: JobDriveStatus.ACTIVE,
  });
  console.log(`✓ Job Drive created: ${drive.title} (Slug: ${drive.slug})`);
  console.log(`  Gating: Min Score=70%, RequireCert=true, Course=${testCourse.title}`);

  // 5. Test Student Profile & Eligibility Evaluation
  console.log("\n[TEST 3] Student Placement Profile & Eligibility Check");
  const studentEmail = `student.placement.${Date.now()}@example.com`;
  const studentUser = await db.user.create({
    data: {
      email: studentEmail,
      passwordHash: "dummy-hash",
      firstName: "Aarav",
      lastName: "Patel",
      roleCode: UserRoleCode.STUDENT,
    },
  });

  const studentProfile = await db.studentProfile.create({
    data: {
      userId: studentUser.id,
      studentId: `SLG-PLC-${Date.now().toString().slice(-4)}`,
    },
  });

  // Check initial eligibility (should fail: not enrolled, no score, no cert)
  let eligibility = await JobDriveService.evaluateStudentEligibility(studentProfile.id, drive.id);
  console.log(`✓ Initial student eligibility: isEligible=${eligibility.isEligible} (Expected: false)`);
  console.log(`  Failure reasons: ${eligibility.reasons.join(" | ")}`);

  if (eligibility.isEligible) {
    throw new Error("Student should NOT be eligible initially!");
  }

  // Attempt apply without eligibility -> should throw
  let blocked = false;
  try {
    await PlacementApplicationService.applyForJobDrive(studentUser.id, {
      studentProfileId: studentProfile.id,
      jobDriveId: drive.id,
    });
  } catch (err: any) {
    blocked = true;
    console.log(`✓ Gatekeeper successfully blocked ineligible application: "${err.message}"`);
  }
  if (!blocked) throw new Error("Ineligible application was not blocked!");

  // 6. Satisfy Eligibility Criteria
  console.log("\n[TEST 4] Fulfilling Eligibility Criteria");

  // Create Batch and Enrollment
  const batch = await db.batch.create({
    data: {
      courseId: testCourse.id,
      name: `PLC-Batch-${Date.now()}`,
      code: `BATCH-${Date.now().toString().slice(-6)}`,
      startDate: new Date(),
      status: "ONGOING",
    },
  });


  const enrollment = await db.enrollment.create({
    data: {
      studentId: studentProfile.id,
      batchId: batch.id,
      courseId: testCourse.id,
      status: "ACTIVE",
    },
  });

  // Create Exam & Passed Attempt with 85%
  const exam = await db.exam.create({
    data: {
      courseId: testCourse.id,
      title: "Full Stack Qualifying Exam",
      totalMarks: 100,
      passingPercentage: 50,
      durationMinutes: 60,
      createdById: activeAdmin.id,
      status: "PUBLISHED",
    },
  });


  await db.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: studentProfile.id,
      enrollmentId: enrollment.id,
      status: "SUBMITTED",
      percentage: 85,
      isPassed: true,
    },
  });

  // Issue Certificate
  await db.certificate.create({
    data: {
      certificateNo: `CERT-PLC-${Date.now()}`,
      studentId: studentProfile.id,
      courseId: testCourse.id,
      verificationToken: `TOK-PLC-${Date.now()}`,
      completionDate: new Date(),
      status: "VALID",
    },
  });


  eligibility = await JobDriveService.evaluateStudentEligibility(studentProfile.id, drive.id);
  console.log(`✓ Re-evaluated eligibility: isEligible=${eligibility.isEligible} (Expected: true)`);
  if (!eligibility.isEligible) {
    throw new Error(`Student should be eligible now! Reasons: ${eligibility.reasons.join(", ")}`);
  }

  // 7. Test Student Profile Setup & Application Submission
  console.log("\n[TEST 5] Student Profile Upsert & Application Submission");
  const updatedPlacementProfile = await PlacementApplicationService.upsertPlacementProfile(studentUser.id, {
    studentProfileId: studentProfile.id,
    headline: "Junior Full Stack Developer",
    bio: "Passionate engineer with Next.js and PostgreSQL focus.",
    skills: ["TypeScript", "Next.js", "PostgreSQL", "Node.js"],
  });
  console.log(`✓ Placement profile saved for ${studentUser.firstName}: ${updatedPlacementProfile.headline}`);

  const application = await PlacementApplicationService.applyForJobDrive(studentUser.id, {
    studentProfileId: studentProfile.id,
    jobDriveId: drive.id,
    coverNote: "Excited to contribute to high performance systems.",
  });
  console.log(`✓ Application submitted successfully: ID=${application.id}, Status=${application.status}`);

  // Test duplicate prevention
  let dupBlocked = false;
  try {
    await PlacementApplicationService.applyForJobDrive(studentUser.id, {
      studentProfileId: studentProfile.id,
      jobDriveId: drive.id,
    });
  } catch (err: any) {
    dupBlocked = true;
    console.log(`✓ Duplicate application blocked: "${err.message}"`);
  }
  if (!dupBlocked) throw new Error("Duplicate application was not prevented!");

  // 8. Test Recruitment Pipeline Progression & Interview Scheduling
  console.log("\n[TEST 6] Recruitment Pipeline & Interview Rounds");

  // Shortlist
  const shortlisted = await PlacementApplicationService.updateApplicationStatus(activeAdmin, {
    applicationId: application.id,
    status: PlacementApplicationStatus.SHORTLISTED,
  });
  console.log(`✓ Stage updated: ${shortlisted.status}`);

  // Schedule Interview Round 1 (Technical)
  const round1 = await PlacementApplicationService.scheduleInterviewRound(activeAdmin, {
    applicationId: application.id,
    roundNumber: 1,
    roundType: InterviewRoundType.TECHNICAL,
    scheduledAt: new Date(Date.now() + 86400000),
    meetingLink: "https://meet.google.com/xyz-placement-mock",
  });
  console.log(`✓ Round 1 scheduled: Type=${round1.roundType}, Meeting=${round1.meetingLink}`);

  // Record feedback
  await PlacementApplicationService.recordInterviewFeedback(
    activeAdmin,
    round1.id,
    "Strong understanding of relational data and TypeScript.",
    true
  );
  console.log("✓ Round 1 feedback recorded: Passed=true");

  // Offer & Mark PLACED
  const placedApp = await PlacementApplicationService.updateApplicationStatus(activeAdmin, {
    applicationId: application.id,
    status: PlacementApplicationStatus.PLACED,
    offeredPackage: "₹7.5 LPA",
  });
  console.log(`✓ Candidate marked PLACED: Offered=${placedApp.offeredPackage}`);

  // Verify Student Placement Profile Auto-Update
  const finalProfile = await db.studentPlacementProfile.findUnique({
    where: { studentId: studentProfile.id },
  });
  console.log(
    `✓ Verified Student Profile sync: isPlaced=${finalProfile?.isPlaced}, Company=${finalProfile?.placedCompany}, Package=${finalProfile?.placedPackage}`
  );

  if (!finalProfile?.isPlaced || finalProfile.placedCompany !== partner.name) {
    throw new Error("Student placement profile did not automatically sync placed status!");
  }

  console.log("\n=======================================================");
  console.log("🎉 DAY 11 VERIFICATION SUITE PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Verification Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
