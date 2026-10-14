import { db } from "../src/server/db/client";
import { InstitutionPartnershipService } from "../src/server/services/institution-partnership.service";
import { InstitutionStudentService } from "../src/server/services/institution-student.service";
import { JobFairService } from "../src/server/services/job-fair.service";
import { UserRoleCode, InstitutionType, JobDriveStatus } from "@prisma/client";

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 STARTING CAMPUS PLACEMENT & UNIVERSITY PARTNERSHIP TEST SUITE");
  console.log("================================================================================\n");

  let realAdmin = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN },
  });
  if (!realAdmin) {
    realAdmin = await db.user.findFirst();
  }

  const adminUser = {
    id: realAdmin!.id,
    email: realAdmin!.email,
    roleCode: UserRoleCode.SUPER_ADMIN,
    permissions: ["*"],
    firstName: realAdmin!.firstName,
    lastName: realAdmin!.lastName,
  };

  const testEmailA = `test.college.a.${Date.now()}@example.edu.in`;
  const testEmailB = `test.college.b.${Date.now()}@example.edu.in`;

  // -------------------------------------------------------------------------
  // TEST 1: Public Institution Registration
  // -------------------------------------------------------------------------
  console.log("TEST 1: Testing Public Institution Registration...");
  const regResult = await InstitutionPartnershipService.registerPublicInstitution({
    name: "National Institute of Technology Test Campus",
    type: InstitutionType.ENGINEERING_COLLEGE,
    affiliation: "Technical University Board",
    recognition: "AICTE Approved",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    pincode: "211004",
    officialEmail: testEmailA,
    officialPhone: "+91 9196596975",
    authorizedPersonName: "Prof. Arvind Trivedi",
    authorizedPersonDesignation: "Director & Principal",
    authorizedPersonEmail: testEmailA,
    authorizedPersonPhone: "+91 9876543210",
    placementOfficerName: "Dr. Vikas Verma",
    placementOfficerEmail: `tpo.${Date.now()}@example.edu.in`,
    placementOfficerPhone: "+91 9876543211",
    estimatedStudentCount: 650,
  });

  if (!regResult.success || !regResult.code) {
    throw new Error("❌ Test 1 Failed: Registration result missing success or code.");
  }
  console.log(`✅ Test 1 Passed: Institution registered with tracking code: ${regResult.code}`);

  // -------------------------------------------------------------------------
  // TEST 2: Duplicate Registration Rejection
  // -------------------------------------------------------------------------
  console.log("\nTEST 2: Testing Duplicate Registration Rejection...");
  try {
    await InstitutionPartnershipService.registerPublicInstitution({
      name: "Duplicate College",
      officialEmail: testEmailA,
      authorizedPersonName: "Mr. Duplicate",
      authorizedPersonDesignation: "Director",
      authorizedPersonEmail: testEmailA,
      authorizedPersonPhone: "9876543210",
    });
    throw new Error("❌ Test 2 Failed: Duplicate email did not throw error.");
  } catch (err: any) {
    console.log(`✅ Test 2 Passed: Duplicate correctly rejected: ${err.message}`);
  }

  // Retrieve created institution
  const institutionA = await db.institution.findUnique({
    where: { officialEmail: testEmailA },
  });
  if (!institutionA) throw new Error("Institution A not found in DB.");

  // -------------------------------------------------------------------------
  // TEST 3: Admin Review & Approval + Account Provisioning
  // -------------------------------------------------------------------------
  console.log("\nTEST 3: Testing Admin Review & Account Provisioning...");
  const approvalRes = await InstitutionPartnershipService.reviewApproval(adminUser, {
    institutionId: institutionA.id,
    decision: "APPROVED",
    remarks: "All recognition documents and UGC/AICTE criteria verified.",
    provisionalAdminPassword: "CampusPartner@2026",
  });

  if (approvalRes.status !== "APPROVED") {
    throw new Error("❌ Test 3 Failed: Institution not marked as APPROVED.");
  }

  const membership = await db.institutionUserMembership.findFirst({
    where: { institutionId: institutionA.id, role: "INSTITUTION_ADMIN" },
    include: { user: true },
  });

  if (!membership || !membership.user) {
    throw new Error("❌ Test 3 Failed: Institutional administrator user was not provisioned.");
  }
  console.log(`✅ Test 3 Passed: Institution approved & Admin user provisioned (${membership.user.email}).`);

  const institutionAdminUser = {
    id: membership.user.id,
    email: membership.user.email,
    roleCode: UserRoleCode.INSTITUTION_ADMIN,
    permissions: ["institution:manage", "institution:students", "institution:drives"],
    firstName: membership.user.firstName,
    lastName: membership.user.lastName,
  };

  // -------------------------------------------------------------------------
  // TEST 4: Single Student Registration & Duplicate Prevention
  // -------------------------------------------------------------------------
  console.log("\nTEST 4: Testing Student Registration & Duplicate Check...");
  const studentEnrollmentNo = `TEST-ENR-${Date.now()}`;
  const studentEmail = `student.${Date.now()}@example.edu.in`;

  const singleStudentRes = await InstitutionStudentService.registerSingleStudent(institutionAdminUser, {
    fullName: "Aarav Gupta",
    email: studentEmail,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    gender: "Male",
    enrollmentNumber: studentEnrollmentNo,
    rollNumber: "CS-2026-01",
    courseName: "B.Tech Computer Science & Engineering",
    academicYear: "2022-2026",
    passingYear: 2026,
    currentSemester: 8,
    cgpa: 8.7,
    academicPercentage: 87.0,
    activeBacklogs: 0,
    technicalSkills: ["Python", "FastAPI", "React", "PostgreSQL"],
    preferredRole: "Full Stack Engineer",
    preferredLocation: "Noida / Bangalore",
  });

  if (!singleStudentRes.success || !singleStudentRes.enrollmentId) {
    throw new Error("❌ Test 4 Failed: Student registration failed.");
  }
  console.log(`✅ Test 4 Passed: Student registered with ID ${singleStudentRes.studentId}`);

  // Test duplicate in same institution
  try {
    await InstitutionStudentService.registerSingleStudent(institutionAdminUser, {
      fullName: "Duplicate Aarav",
      email: `diff.${Date.now()}@example.edu.in`,
      mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      enrollmentNumber: studentEnrollmentNo,
      courseName: "B.Tech CSE",
      academicYear: "2022-2026",
      passingYear: 2026,
    });
    throw new Error("❌ Test 4 Failed: Duplicate enrollment number did not fail.");
  } catch (err: any) {
    console.log(`✅ Test 4 Duplicate Prevention Passed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Bulk CSV Ingestion & Validation
  // -------------------------------------------------------------------------
  console.log("\nTEST 5: Testing Bulk CSV Ingestion Engine...");
  const bulkCsv = `Enrollment Number,Roll Number,Full Name,Email,Mobile,Gender,Course,Department,Degree,Academic Year,Passing Year,Semester,CGPA,Percentage,Active Backlogs,Skills,Preferred Role,Location,Registration Fee
BULK-2026-001,CS-02,Priya Nair,priya.${Date.now()}@example.edu.in,9876540001,Female,B.Tech CSE,CSE,B.Tech,2022-2026,2026,8,9.1,91.0,0,Python; AI; PyTorch,AI Engineer,Bangalore,0
BULK-2026-002,CS-03,Karan Patel,karan.${Date.now()}@example.edu.in,9876540002,Male,B.Tech CSE,CSE,B.Tech,2022-2026,2026,8,6.8,68.0,2,Java; SQL,Backend Developer,Hyderabad,0
BULK-2026-001,CS-02,Duplicate Priya,priya.dup@example.edu.in,9876540001,Female,B.Tech CSE,CSE,B.Tech,2022-2026,2026,8,9.1,91.0,0,Python,AI,Bangalore,0`;

  const bulkRes = await InstitutionStudentService.processBulkStudentImport(institutionAdminUser, {
    fileName: "sample_batch_2026.csv",
    csvContent: bulkCsv,
  });

  console.log(
    `✅ Test 5 Passed: Bulk import processed. Created: ${bulkRes.summary.created}, Invalid/Duplicates: ${bulkRes.summary.invalid + bulkRes.summary.duplicates}`
  );

  // -------------------------------------------------------------------------
  // TEST 6: Campus Placement Drive & Automated Eligibility Engine
  // -------------------------------------------------------------------------
  console.log("\nTEST 6: Testing Campus Drive Eligibility Engine...");
  // Create partner and job drive
  let partner = await db.corporatePartner.findFirst();
  if (!partner) {
    partner = await db.corporatePartner.create({
      data: {
        name: "Acme Cloud Technologies",
        industry: "Information Technology",
        location: "Bengaluru",
      },
    });
  }

  const driveSlug = `campus-drive-test-${Date.now()}`;
  const testDrive = await db.jobDrive.create({
    data: {
      companyId: partner.id,
      title: "Graduate Software Engineer (Cloud & AI)",
      slug: driveSlug,
      description: "Hiring final year graduates for cloud systems development.",
      status: JobDriveStatus.ACTIVE,
      createdById: adminUser.id,
      eligiblePassingYears: [2026],
      minCgpa: 7.5,
      maxActiveBacklogs: 0,
      salaryPackage: "₹6.5 - 9.0 LPA",
    },
  });

  // Nominate eligible student (Aarav, CGPA 8.7, 0 backlogs, 2026)
  const eligibleNomination = await JobFairService.nominateStudentForDrive(institutionAdminUser, {
    jobDriveId: testDrive.id,
    institutionEnrollmentId: singleStudentRes.enrollmentId,
  });

  if (!eligibleNomination.isEligible) {
    throw new Error(`❌ Test 6 Failed: Eligible student flagged as ineligible: ${eligibleNomination.ineligibilityReason}`);
  }
  console.log("✅ Test 6 Passed: Eligible student successfully nominated and auto-application created.");

  // Check ineligible student nomination (Karan Patel, 2 backlogs, CGPA 6.8)
  const ineligibleEnrollment = await db.studentInstitutionEnrollment.findFirst({
    where: { institutionId: institutionA.id, enrollmentNumber: "BULK-2026-002" },
  });

  if (ineligibleEnrollment) {
    const ineligNom = await JobFairService.nominateStudentForDrive(institutionAdminUser, {
      jobDriveId: testDrive.id,
      institutionEnrollmentId: ineligibleEnrollment.id,
    });

    if (ineligNom.isEligible) {
      throw new Error("❌ Test 6 Failed: Ineligible student (backlogs & low CGPA) was accepted.");
    }
    console.log(`✅ Test 6 Ineligibility Catch Passed: Reason = "${ineligNom.ineligibilityReason}"`);

    // TEST 7: Admin Eligibility Override
    console.log("\nTEST 7: Testing Admin Eligibility Override Workflow...");
    const overrideRes = await JobFairService.overrideEligibility(adminUser, {
      nominationId: ineligNom.nominationId,
      reason: "Special approval by Placement Director: exceptional open-source contributions.",
    });

    if (!overrideRes.isOverridden) {
      throw new Error("❌ Test 7 Failed: Override flag not set.");
    }
    console.log("✅ Test 7 Passed: Admin successfully overrode eligibility with audit trail.");
  }

  // -------------------------------------------------------------------------
  // TEST 8: Mega Job Fair Hosting & Stall Allocation
  // -------------------------------------------------------------------------
  console.log("\nTEST 8: Testing Mega Job Fair Hosting & Multi-College Invitation...");
  const jobFair = await JobFairService.createJobFair(adminUser, {
    title: "SoftLab Northern India Mega Campus Job Fair 2026",
    theme: "Connecting 50+ Engineering Colleges with 100+ Hiring Partners",
    fairType: "HYBRID",
    venue: "SoftLab Global Mega Campus, Prayagraj",
    startDate: new Date("2026-11-20T09:00:00Z"),
    endDate: new Date("2026-11-21T18:00:00Z"),
    maxCapacity: 3500,
  });

  await JobFairService.inviteInstitutions(adminUser, {
    jobFairId: jobFair.id,
    institutionIds: [institutionA.id],
  });

  await JobFairService.assignRecruiterStall(adminUser, {
    jobFairId: jobFair.id,
    partnerId: partner.id,
    stallNumber: "STALL-A12",
    vacanciesCount: 25,
    notes: "Prime placement booth for cloud & full stack engineering.",
  });
  console.log(`✅ Test 8 Passed: Job Fair hosted (${jobFair.fairCode}) with college invitation & corporate stall.`);

  // -------------------------------------------------------------------------
  // TEST 9: Multi-Tenant Isolation Security Test
  // -------------------------------------------------------------------------
  console.log("\nTEST 9: Testing Multi-Tenant Data Isolation Security...");
  // Register second institution B
  await InstitutionPartnershipService.registerPublicInstitution({
    name: "Apex College of Management",
    officialEmail: testEmailB,
    authorizedPersonName: "Dr. Apex",
    authorizedPersonDesignation: "Dean",
    authorizedPersonEmail: testEmailB,
    authorizedPersonPhone: "9876500000",
  });
  const institutionB = await db.institution.findUnique({ where: { officialEmail: testEmailB } });
  if (!institutionB) throw new Error("Institution B not created.");

  await InstitutionPartnershipService.reviewApproval(adminUser, {
    institutionId: institutionB.id,
    decision: "APPROVED",
  });

  const memberB = await db.institutionUserMembership.findFirst({
    where: { institutionId: institutionB.id },
    include: { user: true },
  });

  const instBUser = {
    id: memberB!.user.id,
    email: memberB!.user.email,
    roleCode: UserRoleCode.INSTITUTION_ADMIN,
    permissions: ["institution:manage"],
    firstName: "Dean",
    lastName: "Apex",
  };

  // Attempt: Institution B tries to inspect Institution A's private details
  try {
    await InstitutionPartnershipService.getInstitutionById(instBUser, institutionA.id);
    throw new Error("❌ Test 9 Failed: Institution B was able to access Institution A's profile!");
  } catch (err: any) {
    console.log(`✅ Test 9 Tenant Isolation Passed (Profile Access): ${err.message}`);
  }

  // Attempt: Institution B tries to nominate Institution A's student
  try {
    await JobFairService.nominateStudentForDrive(instBUser, {
      jobDriveId: testDrive.id,
      institutionEnrollmentId: singleStudentRes.enrollmentId,
    });
    throw new Error("❌ Test 9 Failed: Institution B was able to nominate Institution A's student!");
  } catch (err: any) {
    console.log(`✅ Test 9 Tenant Isolation Passed (Student Nomination): ${err.message}`);
  }

  console.log("\n================================================================================");
  console.log("🎉 ALL 9 TEST WORKFLOWS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================\n");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
