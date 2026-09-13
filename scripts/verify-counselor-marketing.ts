import { db } from "../src/server/db/client";
import { authConfig } from "../src/server/auth/config";
import { CrmLeadService } from "../src/server/services/crm-lead.service";
import { CrmApplicationService } from "../src/server/services/crm-application.service";
import { CrmIngestionService } from "../src/server/services/crm-ingestion.service";
import { LeadSource, LeadStatus, UserRoleCode } from "@prisma/client";

async function runVerification() {
  console.log("==================================================================");
  console.log("   SOFTLAB GLOBAL — End-to-End System Verification Suite");
  console.log("   (Auth Credentials, Counselor Admissions, Multi-Channel Webhooks)");
  console.log("==================================================================\n");

  const provider = authConfig.providers[0] as any;
  const authorizeFn = provider.options?.authorize || provider.authorize;

  // -------------------------------------------------------------
  // Test 1: Authentication with Counselor, Telecaller, Admin, Student ID
  // -------------------------------------------------------------
  console.log("--> [1/5] Testing Multi-Identifier & Password Authentication...");

  const testAuthLogins = [
    { label: "Counselor via Email", identifier: "counselor@softlabglobal.com", password: "CounselorSecure2026!", expectedRole: UserRoleCode.COUNSELOR },
    { label: "Telecaller via Email", identifier: "telecaller@softlabglobal.com", password: "TelecallerSecure2026!", expectedRole: UserRoleCode.TELECALLER },
    { label: "Super Admin via Email", identifier: "admin@softlabglobal.com", password: "SuperAdminSecure2026!", expectedRole: UserRoleCode.SUPER_ADMIN },
    { label: "Student via Enrollment ID", identifier: "SLG-2026-0001", password: "StudentSecure2026!", expectedRole: UserRoleCode.STUDENT },
    { label: "Fallback Password Check", identifier: "counselor@softlabglobal.com", password: "SoftLab@2026!", expectedRole: UserRoleCode.COUNSELOR },
  ];

  for (const test of testAuthLogins) {
    const user = await authorizeFn(
      { identifier: test.identifier, password: test.password },
      {} as any
    );
    if (!user) {
      throw new Error(`Authentication FAILED for ${test.label} (${test.identifier})`);
    }
    if (user.roleCode !== test.expectedRole) {
      throw new Error(`Role mismatch for ${test.label}: expected ${test.expectedRole}, got ${user.roleCode}`);
    }
    console.log(`  ✓ ${test.label} (${test.identifier}): Authenticated successfully as ${user.roleCode}`);
  }

  // -------------------------------------------------------------
  // Test 2: Counselor Manual Lead Creation
  // -------------------------------------------------------------
  console.log("\n--> [2/5] Testing Counselor Lead Creation (`crm.createLead`)...");

  const counselorUser = await db.user.findUniqueOrThrow({
    where: { email: "counselor@softlabglobal.com" },
    include: { role: true },
  });

  const counselorActor = {
    id: counselorUser.id,
    email: counselorUser.email,
    roleCode: counselorUser.roleCode,
    permissions: counselorUser.role.permissions,
    firstName: counselorUser.firstName,
    lastName: counselorUser.lastName,
  };

  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
  });

  const createdLeadResult = await CrmLeadService.createLead(counselorActor, {
    fullName: "Vikas Agrawal",
    phone: "9876599001",
    email: "vikas.agrawal@example.com",
    city: "Prayagraj",
    qualification: "BCA Graduate",
    source: LeadSource.WALK_IN,
    qualityScore: "HOT",
    interestedCourseId: course.id,
    notes: "Walked into Civil Lines campus, interested in Full Stack evening batch.",
    nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  console.log(`  ✓ Lead manually created: ID ${createdLeadResult.lead.id} (${createdLeadResult.lead.fullName})`);

  // -------------------------------------------------------------
  // Test 3: Direct Admission Application Generation
  // -------------------------------------------------------------
  console.log("\n--> [3/5] Testing Direct Admission Generation (`crm.createDirectAdmission`)...");

  const admissionApp = await CrmApplicationService.createDirectAdmission(counselorActor, {
    courseId: course.id,
    applicantName: "Sneha Patel",
    applicantEmail: "sneha.patel@example.com",
    applicantPhone: "9876599002",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    highestQualification: "B.Tech Computer Science",
    source: LeadSource.WALK_IN,
  });

  console.log(`  ✓ Direct Admission Application created: ${admissionApp.applicationNumber} (Applicant: ${admissionApp.applicantName})`);

  // -------------------------------------------------------------
  // Test 4: Pipeline Kanban Stages & Progression
  // -------------------------------------------------------------
  console.log("\n--> [4/5] Testing Pipeline Stages & Kanban Progression...");

  const pipeline = await CrmLeadService.getPipelineOverview(counselorActor);
  console.log(`  ✓ Total pipeline leads: ${pipeline.total}`);
  console.log(`    - NEW: ${pipeline.counts.NEW}`);
  console.log(`    - CONTACTED: ${pipeline.counts.CONTACTED}`);
  console.log(`    - FOLLOW_UP: ${pipeline.counts.FOLLOW_UP}`);
  console.log(`    - INTERESTED: ${pipeline.counts.INTERESTED}`);
  console.log(`    - ADMITTED: ${pipeline.counts.ADMITTED}`);

  // Test stage update
  const updatedStageLead = await CrmLeadService.updateLeadStage(
    counselorActor,
    createdLeadResult.lead.id,
    LeadStatus.INTERESTED
  );
  console.log(`  ✓ Advanced lead ${updatedStageLead.id} to stage: ${updatedStageLead.status}`);

  // -------------------------------------------------------------
  // Test 5: Multi-Platform Ingestion Webhooks
  // -------------------------------------------------------------
  console.log("\n--> [5/5] Testing Marketing Webhook Ingestion (Justdial, Meta, Google, WhatsApp, Universal)...");

  // 5a. Justdial Ingestion
  const jdRes = await CrmIngestionService.ingestLead({
    fullName: "Rohan Verma",
    phone: "9876599003",
    email: "rohan.justdial@example.com",
    city: "Prayagraj",
    source: LeadSource.JUSTDIAL,
    interestedCourseName: course.title,
    notes: "Justdial lead inquiry for Full Stack training.",
    campaignName: "Justdial Civil Lines",
  });
  console.log(`  ✓ [Justdial] Ingested lead ${jdRes.leadId} -> Assigned to: ${jdRes.assignedToId}`);

  // 5b. Meta Ads Ingestion (Facebook & Instagram)
  const metaRes = await CrmIngestionService.ingestLead({
    fullName: "Ananya Dixit",
    phone: "9876599004",
    email: "ananya.meta@example.com",
    city: "Varanasi",
    source: LeadSource.META_ADS_FB,
    interestedCourseName: course.title,
    notes: "Lead submitted via Facebook Instant Form.",
    campaignName: "Meta FB Full Stack Sept 2026",
    adsetName: "Target: Tech Students UP",
  });
  console.log(`  ✓ [Meta Ads] Ingested lead ${metaRes.leadId} -> Assigned to: ${metaRes.assignedToId}`);

  // 5c. Google Ads Ingestion
  const gAdsRes = await CrmIngestionService.ingestLead({
    fullName: "Karan Johar",
    phone: "9876599005",
    email: "karan.google@example.com",
    city: "Lucknow",
    source: LeadSource.GOOGLE_ADS,
    interestedCourseName: course.title,
    notes: "Google Search Ads lead form extension submission.",
    campaignName: "Google Search - Coding Bootcamp",
  });
  console.log(`  ✓ [Google Ads] Ingested lead ${gAdsRes.leadId} -> Assigned to: ${gAdsRes.assignedToId}`);

  // 5d. WhatsApp Inbound Ingestion
  const waRes = await CrmIngestionService.ingestLead({
    fullName: "Deepak Yadav",
    phone: "9876599006",
    source: LeadSource.WHATSAPP,
    notes: "WhatsApp message: 'I want information regarding data science batches and weekend timings.'",
    campaignName: "WhatsApp Inbound",
  });
  console.log(`  ✓ [WhatsApp] Ingested lead ${waRes.leadId} -> Assigned to: ${waRes.assignedToId}`);

  // 5e. Universal Webhook Ingestion
  const uniRes = await CrmIngestionService.ingestLead({
    fullName: "Divya Mishra",
    phone: "9876599007",
    email: "divya.webhook@example.com",
    city: "Kanpur",
    source: LeadSource.WEBSITE,
    interestedCourseName: course.title,
    notes: "Ingested via Zapier landing page webhook.",
    campaignName: "Landing Page Popup",
  });
  console.log(`  ✓ [Universal Webhook] Ingested lead ${uniRes.leadId} -> Assigned to: ${uniRes.assignedToId}`);

  // Verify in-app notifications
  const recentNotifs = await db.notification.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log(`\n  ✓ Verified in-app notifications triggered: ${recentNotifs.length} recent notifications.`);
  for (const n of recentNotifs) {
    console.log(`    - [${n.priority}] ${n.title}: ${n.message}`);
  }

  console.log("\n==================================================================");
  console.log("   ✓ ALL 5 VERIFICATION SUITES PASSED SUCCESSFULLY!");
  console.log("==================================================================\n");
}

runVerification()
  .catch((e) => {
    console.error("\n❌ Verification Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
