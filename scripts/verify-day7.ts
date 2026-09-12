/**
 * Day 7 Automated Verification Suite: Admissions CRM & Application Workflow
 * Validates:
 * 1. Public enquiry capture, spam honeypot filtering, and IP rate limiting
 * 2. Role-based lead visibility and counselor isolation
 * 3. Telecaller permission boundaries (cannot create admission applications)
 * 4. Duplicate phone/email detection
 * 5. Application stage lifecycle & mandatory rejection reason enforcement
 * 6. Explicit student conversion, StudentProfile/Enrollment creation, and audit logging
 */

import { db } from "../src/server/db/client";
import { CrmLeadService, normalizeEmail, normalizePhone } from "../src/server/services/crm-lead.service";
import { CrmApplicationService } from "../src/server/services/crm-application.service";
import { UserRoleCode, LeadStatus, FollowUpType, ApplicationStage } from "@prisma/client";
import { AuthenticatedUser } from "../src/server/auth/rbac";
import * as bcrypt from "bcryptjs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runVerification() {
  console.log("===============================================================");
  console.log("  SOFTLAB GLOBAL — DAY 7 ADMISSIONS CRM VERIFICATION SUITE");
  console.log("===============================================================\n");

  const course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!course) throw new Error("A published course is required for testing.");

  // 1. Phone and Email Normalization
  console.log("--- 1. Testing Input Normalization ---");
  const normPhone1 = normalizePhone("+91 98765-43210");
  const normPhone2 = normalizePhone("09876543210");
  const normEmail = normalizeEmail("  Candidate.Test@SoftLabGlobal.COM  ");
  assert(normPhone1 === "9876543210", "Strips +91 country prefix and non-digits");
  assert(normPhone2 === "9876543210", "Strips leading 0 from 11-digit mobile");
  assert(normEmail === "candidate.test@softlabglobal.com", "Trims and lowercases email address");

  // 2. Public Enquiry Submission & Honeypot Spam Protection
  console.log("\n--- 2. Testing Public Enquiry Capture & Anti-Spam Honeypot ---");
  const honeypotResult = await CrmLeadService.submitPublicEnquiry(
    {
      fullName: "Spam Bot",
      email: "bot@spam.com",
      phone: "1112223334",
      honeypot: "http://spam-link.com",
    },
    "127.0.0.99"
  );
  assert(honeypotResult.leadId === "spam-filtered", "Honeypot caught spam submission and discarded it");

  const legitResult = await CrmLeadService.submitPublicEnquiry(
    {
      fullName: "Pooja Test Candidate",
      email: "pooja.test@example.com",
      phone: "+91 98765 11223",
      city: "Prayagraj",
      interestedCourseId: course.id,
      notes: "Testing legitimate website enquiry capture",
    },
    "127.0.0.101"
  );
  assert(legitResult.success && legitResult.leadId !== "spam-filtered", "Legitimate enquiry saved successfully");

  const savedLead = await db.lead.findUnique({ where: { id: legitResult.leadId } });
  assert(savedLead?.status === LeadStatus.NEW, "Initial lead status is set to NEW");
  assert(savedLead?.phone === "9876511223", "Lead phone is normalized in database");

  // Check that NO student profile was prematurely created
  const prematureStudent = await db.studentProfile.findFirst({
    where: { user: { email: "pooja.test@example.com" } },
  });
  assert(!prematureStudent, "No StudentProfile created prematurely on enquiry capture");

  // Rate Limiting Verification: 5 submissions allowed in window, 6th must fail
  console.log("\n--- 3. Testing IP Rate Limiting ---");
  let rateLimitCaught = false;
  const testIp = "192.168.10.50";
  try {
    for (let i = 0; i < 6; i++) {
      await CrmLeadService.submitPublicEnquiry(
        {
          fullName: `Candidate ${i}`,
          email: `cand${i}@example.com`,
          phone: `987000000${i}`,
        },
        testIp
      );
    }
  } catch (err: any) {
    if (err.code === "TOO_MANY_REQUESTS") {
      rateLimitCaught = true;
    }
  }
  assert(rateLimitCaught, "Rate limiter correctly blocked 6th rapid enquiry from same IP");

  // 4. Setup Test Users: Counselor A, Counselor B, and Telecaller
  console.log("\n--- 4. Setting Up Role Users for Isolation Testing ---");
  const tempHash = await bcrypt.hash("TestPass#123", 10);

  const counselorAUser = await db.user.upsert({
    where: { email: "counselor.a@softlabglobal.com" },
    update: {},
    create: {
      email: "counselor.a@softlabglobal.com",
      firstName: "Counselor",
      lastName: "Alpha",
      passwordHash: tempHash,
      roleCode: UserRoleCode.COUNSELOR,
    },
  });

  const counselorBUser = await db.user.upsert({
    where: { email: "counselor.b@softlabglobal.com" },
    update: {},
    create: {
      email: "counselor.b@softlabglobal.com",
      firstName: "Counselor",
      lastName: "Beta",
      passwordHash: tempHash,
      roleCode: UserRoleCode.COUNSELOR,
    },
  });

  const telecallerUser = await db.user.upsert({
    where: { email: "telecaller.test@softlabglobal.com" },
    update: {},
    create: {
      email: "telecaller.test@softlabglobal.com",
      firstName: "Telecaller",
      lastName: "User",
      passwordHash: tempHash,
      roleCode: UserRoleCode.TELECALLER,
    },
  });

  const counselorA: AuthenticatedUser = {
    id: counselorAUser.id,
    email: counselorAUser.email,
    roleCode: UserRoleCode.COUNSELOR,
    permissions: ["courses:read", "leads:create", "leads:read_own", "leads:update", "admissions:create", "admissions:read"],
    firstName: "Counselor",
    lastName: "Alpha",
  };

  const counselorB: AuthenticatedUser = {
    id: counselorBUser.id,
    email: counselorBUser.email,
    roleCode: UserRoleCode.COUNSELOR,
    permissions: ["courses:read", "leads:create", "leads:read_own", "leads:update", "admissions:create", "admissions:read"],
    firstName: "Counselor",
    lastName: "Beta",
  };

  const telecaller: AuthenticatedUser = {
    id: telecallerUser.id,
    email: telecallerUser.email,
    roleCode: UserRoleCode.TELECALLER,
    permissions: ["courses:read", "leads:create", "leads:read_own", "leads:update"],
    firstName: "Telecaller",
    lastName: "User",
  };

  // Create lead assigned strictly to Counselor B
  const leadForB = await db.lead.create({
    data: {
      fullName: "Prospect Exclusive to Beta",
      email: "exclusive.beta@example.com",
      phone: "9876540001",
      source: "WEBSITE",
      status: "NEW",
      assignedToId: counselorB.id,
    },
  });

  // 5. Verify Counselor Isolation
  console.log("\n--- 5. Testing Counselor Lead Isolation ---");
  let counselorAForbidden = false;
  try {
    await CrmLeadService.getLeadDetails(counselorA, leadForB.id);
  } catch (err: any) {
    if (err.code === "FORBIDDEN") counselorAForbidden = true;
  }
  assert(counselorAForbidden, "Counselor A is forbidden from viewing Counselor B's assigned lead");

  const counselorBView = await CrmLeadService.getLeadDetails(counselorB, leadForB.id);
  assert(counselorBView.lead.id === leadForB.id, "Counselor B successfully views their assigned lead");

  // 6. Verify Telecaller Permission Boundary
  console.log("\n--- 6. Testing Telecaller Permission Boundaries ---");
  // Assign lead to telecaller
  await db.lead.update({ where: { id: leadForB.id }, data: { assignedToId: telecaller.id } });
  const fuLog = await CrmLeadService.logFollowUp(telecaller, {
    leadId: leadForB.id,
    type: FollowUpType.CALL,
    notes: "Outbound call: Prospect confirmed interest in weekend cohort",
    newStatus: LeadStatus.CONTACTED,
  });
  assert(fuLog.lead.status === LeadStatus.CONTACTED, "Telecaller successfully logs interaction and updates lead status");

  let telecallerAppForbidden = false;
  try {
    await CrmApplicationService.createApplication(telecaller, {
      leadId: leadForB.id,
      courseId: course.id,
      applicantName: leadForB.fullName,
      applicantEmail: leadForB.email,
      applicantPhone: leadForB.phone,
    });
  } catch (err: any) {
    if (err.code === "FORBIDDEN") telecallerAppForbidden = true;
  }
  assert(telecallerAppForbidden, "Telecaller correctly blocked from creating admission applications");

  // 7. Duplicate Detection Verification
  console.log("\n--- 7. Testing Duplicate Phone & Email Detection ---");
  const dupLead = await db.lead.create({
    data: {
      fullName: "Duplicate Prospect",
      email: "exclusive.beta@example.com", // identical email
      phone: "9876540001", // identical phone
      source: "WALK_IN",
      status: "NEW",
    },
  });

  const leadDetailsWithDup = await CrmLeadService.getLeadDetails(
    { ...counselorB, permissions: ["leads:read_all"] },
    leadForB.id
  );
  assert(
    leadDetailsWithDup.potentialDuplicates.some((d) => d.id === dupLead.id),
    "Duplicate detection identifies matching phone/email records"
  );

  // 8. Admission Application Stage Lifecycle & Mandatory Reason
  console.log("\n--- 8. Testing Admission Application Lifecycle & Rejection Reason ---");
  // Reassign lead to Counselor A
  await db.lead.update({ where: { id: leadForB.id }, data: { assignedToId: counselorA.id } });

  const app = await CrmApplicationService.createApplication(counselorA, {
    leadId: leadForB.id,
    courseId: course.id,
    applicantName: leadForB.fullName,
    applicantEmail: leadForB.email,
    applicantPhone: leadForB.phone,
    highestQualification: "BCA Graduate",
  });
  assert(app.stage === ApplicationStage.SUBMITTED, "Application created with stage SUBMITTED");
  assert(app.applicationNumber.startsWith("APP-"), "Generated unique application number");

  const updatedLeadAfterApp = await db.lead.findUnique({ where: { id: leadForB.id } });
  assert(updatedLeadAfterApp?.status === LeadStatus.INTERESTED, "Lead status transitioned to INTERESTED");

  // Rejection without reason must fail
  let rejectionWithoutReasonFailed = false;
  try {
    await CrmApplicationService.updateApplicationStage(counselorA, {
      applicationId: app.id,
      stage: ApplicationStage.REJECTED,
      decisionReason: "", // Empty reason
    });
  } catch (err: any) {
    if (err.code === "BAD_REQUEST") rejectionWithoutReasonFailed = true;
  }
  assert(rejectionWithoutReasonFailed, "Rejection without mandatory reason was correctly rejected with BAD_REQUEST");

  // Approve application
  const approvedApp = await CrmApplicationService.updateApplicationStage(counselorA, {
    applicationId: app.id,
    stage: ApplicationStage.APPROVED,
    decisionReason: "Prerequisites verified; approved for enrollment.",
  });
  assert(approvedApp.stage === ApplicationStage.APPROVED, "Application successfully approved with reason");

  // 9. Explicit Student Conversion & Enrollment
  console.log("\n--- 9. Testing Explicit Student Conversion & Enrollment ---");
  const conversionResult = await CrmApplicationService.convertApplicationToStudent(counselorA, app.id);
  assert(conversionResult.application.stage === ApplicationStage.CONVERTED, "Application stage set to CONVERTED");
  assert(conversionResult.studentProfile.studentId.startsWith("SLG-"), "Generated official Student ID");
  assert(conversionResult.enrollment.status === "ACTIVE", "Created active course enrollment");

  const finalLead = await db.lead.findUnique({ where: { id: leadForB.id } });
  assert(finalLead?.status === LeadStatus.ADMITTED, "Originating Lead status transitioned to ADMITTED");

  // Second conversion must fail
  let doubleConversionFailed = false;
  try {
    await CrmApplicationService.convertApplicationToStudent(counselorA, app.id);
  } catch (err: any) {
    if (err.code === "BAD_REQUEST") doubleConversionFailed = true;
  }
  assert(doubleConversionFailed, "Second conversion attempt correctly rejected with BAD_REQUEST");

  // 10. Audit Log Trail Verification
  console.log("\n--- 10. Testing Security Audit Log Trail ---");
  const auditLogs = await db.auditLog.findMany({
    where: {
      OR: [
        { resourceType: "Lead", resourceId: leadForB.id },
        { resourceType: "AdmissionApplication", resourceId: app.id },
      ],
    },
  });
  assert(auditLogs.length >= 3, `Audit logs correctly recorded for CRM actions (found ${auditLogs.length} events)`);

  // Cleanup test artifacts
  console.log("\n--- 11. Cleaning Up Ephemeral Test Data ---");
  await db.enrollment.deleteMany({ where: { id: conversionResult.enrollment.id } });
  await db.studentProfile.deleteMany({ where: { id: conversionResult.studentProfile.id } });
  await db.admissionApplication.deleteMany({ where: { id: app.id } });
  await db.followUpHistory.deleteMany({ where: { leadId: { in: [leadForB.id, dupLead.id] } } });
  await db.lead.deleteMany({ where: { id: { in: [leadForB.id, dupLead.id, legitResult.leadId] } } });
  await db.user.deleteMany({
    where: {
      email: {
        in: [
          "counselor.a@softlabglobal.com",
          "counselor.b@softlabglobal.com",
          "telecaller.test@softlabglobal.com",
          "exclusive.beta@example.com",
        ],
      },
    },
  });
  console.log("✓ Ephemeral test records cleaned up cleanly.");

  console.log("\n===============================================================");
  console.log("  ALL DAY 7 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  console.log("===============================================================\n");
}

runVerification()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
