import { db } from "../src/server/db/client";
import { HiringIngestionService } from "../src/server/services/hiring-ingestion.service";
import { AiHiringExtractionService } from "../src/server/services/ai-hiring-extraction.service";
import { HiringDuplicateDetectionService } from "../src/server/services/hiring-duplicate-detection.service";
import { HiringPublicationService } from "../src/server/services/hiring-publication.service";
import { HiringAutomationConfigService } from "../src/server/services/hiring-automation-config.service";

async function runVerification() {
  console.log("===============================================================================");
  console.log("🧪 SOFTLAB GLOBAL — WHATSAPP HIRING AUTOMATION VERIFICATION SUITE");
  console.log("===============================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // --- SETUP: Find or Create a Test Hiring Source ---
  console.log("--- 1. Testing Authorized Hiring Source Registration ---");
  let testSource = await db.hiringSource.findFirst({
    where: { name: "Test Verified IT Recruiters Hub" },
  });

  if (!testSource) {
    testSource = await db.hiringSource.create({
      data: {
        name: "Test Verified IT Recruiters Hub",
        sourceType: "WHATSAPP_GROUP",
        identifier: "test-recruiter-hub-jid@g.us",
        description: "Authorized tech hiring group for testing",
        consentStatus: "AUTHORIZED",
        isEnabled: true,
        allowedCategories: ["IT", "Full Stack", "Data Science"],
        autoPublishTrust: false,
        minConfidence: 0.85,
      },
    });
  }
  assert(Boolean(testSource?.id), "Authorized Hiring Source Registered Successfully");

  // Clean up any previous test artifacts to ensure idempotent verification runs
  console.log("   Cleaning up previous test data...");
  const prevMessages = await db.incomingHiringMessage.findMany({
    where: { sourceId: testSource.id },
    select: { id: true },
  });
  const prevMsgIds = prevMessages.map((m) => m.id);

  if (prevMsgIds.length > 0) {
    const prevJobs = await db.extractedHiringJob.findMany({
      where: { messageId: { in: prevMsgIds } },
      select: { id: true, jobDriveId: true },
    });
    const prevJobIds = prevJobs.map((j) => j.id);
    const prevDriveIds = prevJobs.map((j) => j.jobDriveId).filter(Boolean) as string[];

    await db.jobChangeProposal.deleteMany({
      where: { OR: [{ extractedJobId: { in: prevJobIds } }, { jobDriveId: { in: prevDriveIds } }] },
    });
    await db.jobSourceReference.deleteMany({
      where: { OR: [{ messageId: { in: prevMsgIds } }, { jobDriveId: { in: prevDriveIds } }, { sourceId: testSource.id }] },
    });
    await db.extractedHiringJob.deleteMany({
      where: { id: { in: prevJobIds } },
    });
    await db.incomingHiringMessage.deleteMany({
      where: { id: { in: prevMsgIds } },
    });
    if (prevDriveIds.length > 0) {
      await db.jobDrive.deleteMany({
        where: { id: { in: prevDriveIds } },
      });
    }
  }

  // Also clean up any leftover CloudNova or TechSpark job drives or partners from previous tests
  await db.jobDrive.deleteMany({
    where: {
      OR: [
        { title: { contains: "React Developer" } },
        { title: { contains: "CloudNova" } },
        { slug: { contains: "cloudnova" } },
      ],
    },
  });

  // --- 2. Ingesting & Extracting a Standard Corporate Job Post ---
  console.log("\n--- 2. Testing AI Extraction of Standard Corporate Post ---");
  const post1 = `Urgent Opening at CloudNova Technologies Pvt Ltd!
Role: Full Stack React Developer
Location: Noida Sector 62 / Hybrid
Experience: 1-3 years
Salary: ₹5.5 LPA - ₹7.2 LPA
Skills: React, Next.js, TypeScript, Node.js, PostgreSQL, Tailwind CSS
Openings: 4
Contact: Sneha Verma (HR Talent Partner)
Email: careers@cloudnovatech.com
Phone: 9811223344
Apply deadline: 30th November 2026. No registration charges.`;

  const res1 = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: post1,
    senderPhone: "9811223344",
    senderName: "Sneha Verma (HR)",
    channel: "WHATSAPP_TEST",
  });

  assert(res1.success === true, "Incoming Corporate Post Ingested Successfully");
  assert(res1.status === "PENDING_VERIFICATION", "Post routed to Pending Verification queue");

  const job1 = await db.extractedHiringJob.findUnique({
    where: { id: (res1 as any).extractedJobId },
  });

  assert(Boolean(job1), "Extracted Job record exists in database");
  assert(Boolean(job1?.companyName?.toLowerCase().includes("cloudnova")), `Company Name extracted (${job1?.companyName})`);
  assert(Boolean(job1?.jobTitle?.toLowerCase().includes("react")), `Job Title extracted (${job1?.jobTitle})`);
  assert(Boolean(job1?.recruiterEmail?.includes("cloudnovatech.com")), `Recruiter Email extracted (${job1?.recruiterEmail})`);
  assert(Boolean(job1?.recruiterPhone?.includes("9811223344")), `Recruiter Phone extracted (${job1?.recruiterPhone})`);
  assert((job1?.requiredSkills.length || 0) >= 3, `Required Skills extracted count (${job1?.requiredSkills.join(", ")})`);
  assert(Boolean(job1?.salaryPackage?.includes("LPA")), `Salary Package extracted (${job1?.salaryPackage})`);
  assert(job1?.confidenceScore! >= 0.75, `Confidence Score is high (${job1?.confidenceScore})`);
  assert(job1?.isSuspicious === false, "Verified non-suspicious corporate post");

  // --- 3. Ingesting an Informal Indian / Hinglish Post ---
  console.log("\n--- 3. Testing Informal Hinglish & Indian Shorthand Post ---");
  const post2 = `Urgnt req in TechSpark Solutions Prayagraj!
Frontend dev chahiye React or HTML CSS ke sath.
Freshers (2024 / 2025 batch) can also apply.
Location: Prayagraj Civil Lines office.
In hand salary: 25000 per month.
Koi bhi registration fees nahi lagegi, direct interview hoga.
Share CV on WhatsApp 9792001122 or hr@techspark.in`;

  const res2 = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: post2,
    senderPhone: "9792001122",
    senderName: "Vikas Dubey (TechSpark HR)",
    channel: "WHATSAPP_TEST",
  });

  assert(res2.success === true, "Hinglish informal post ingested successfully");
  const job2 = await db.extractedHiringJob.findUnique({
    where: { id: (res2 as any).extractedJobId },
  });

  assert(Boolean(job2?.companyName?.toLowerCase().includes("techspark")), `Hinglish Company extracted (${job2?.companyName})`);
  assert(job2?.isFresher === true, "Fresher status identified correctly from Hinglish post");
  assert(Boolean(job2?.salaryPackage?.includes("25,000")), `Monthly salary identified (${job2?.salaryPackage})`);
  assert(Boolean(job2?.recruiterPhone?.includes("9792001122")), `WhatsApp contact number extracted (${job2?.recruiterPhone})`);
  assert(job2?.feesMentioned === false, "Correctly identified 'Koi registration fees nahi' as legitimate free post");

  // --- 4. Testing Non-Job Casual Chit-Chat Filtering ---
  console.log("\n--- 4. Testing Casual Non-Job Filtering ---");
  const postChitChat = "Good morning everyone! Wishing all members and their family a very Happy Diwali and prosperous new year.";
  const resChitChat = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: postChitChat,
    channel: "WHATSAPP_TEST",
  });

  assert(resChitChat.status === "IGNORED_NON_JOB", "Casual chit-chat ignored without wasting AI tokens");

  // --- 5. Testing Duplicate Detection & Cross-Group Linking ---
  console.log("\n--- 5. Testing Duplicate Detection ---");
  const resDuplicate = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: post1, // Exact same text
    channel: "WHATSAPP_ANOTHER_GROUP",
  });

  assert(resDuplicate.status === "DUPLICATE_PREVENTED", "Identical post detected as duplicate & prevented duplicate CRM creation");

  // --- 6. Testing Suspicious / Scam Post Detection (Fee Charged) ---
  console.log("\n--- 6. Testing Suspicious Post & Fee Scam Detection ---");
  const postScam = `URGENT HIRING FOR DATA ENTRY OPERATORS!
Work from Home. Earn ₹50,000 per month without interview.
Mandatory registration fee ₹500 required for background verification.
Pay immediately to GooglePay 9112233445 to receive appointment letter.`;

  const resScam = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: postScam,
    channel: "WHATSAPP_TEST",
  });

  const jobScam = await db.extractedHiringJob.findUnique({
    where: { id: (resScam as any).extractedJobId },
  });

  assert(jobScam?.feesMentioned === true, "Explicit registration fees demand detected");
  assert(jobScam?.isSuspicious === true, "Scam hiring post flagged as suspicious");
  assert(Boolean(jobScam?.suspicionReason?.includes("fee")), `Suspicion reason recorded: ${jobScam?.suspicionReason}`);

  // --- 7. Testing Material Change Proposal on Existing Opening ---
  console.log("\n--- 7. Testing Job Change Proposal (Diff vs Overwrite) ---");
  // First, publish job1 to CRM to create an active JobDrive
  const adminUser = await db.user.findFirst({
    where: { roleCode: { in: ["SUPER_ADMIN", "ADMIN", "DIRECTOR"] } },
  });

  assert(Boolean(adminUser), "Admin/Officer user found for publication test");

  const pubResult = await HiringPublicationService.publishExtractedJobToCrm(
    {
      id: adminUser!.id,
      email: adminUser!.email,
      roleCode: adminUser!.roleCode,
      permissions: [],
      firstName: adminUser!.firstName,
      lastName: adminUser!.lastName,
    },
    job1!.id
  );

  assert(Boolean(pubResult.drive.id), `Job published to Placement CRM as JobDrive (Slug: ${pubResult.drive.slug})`);
  assert(pubResult.drive.status === "ACTIVE", "JobDrive created in ACTIVE status");

  // Now, ingest an updated post from the same company with higher CTC
  const post1Updated = `Urgent Opening at CloudNova Technologies Pvt Ltd!
Role: Full Stack React Developer
Location: Noida Sector 62 / Hybrid
Experience: 1-3 years
Salary: ₹8.0 LPA - ₹10.5 LPA (Updated higher package!)
Skills: React, Next.js, TypeScript, Node.js, PostgreSQL
Contact: Sneha Verma (HR) - 9811223344`;

  const resUpdate = await HiringIngestionService.processIncomingMessage({
    sourceId: testSource.id,
    rawText: post1Updated,
    channel: "WHATSAPP_TEST",
  });

  assert(resUpdate.status === "UPDATE_PROPOSED", "Updated post detected as material change proposal");
  assert(Boolean((resUpdate as any).proposedChanges?.salaryPackage), "Proposed salaryPackage diff recorded");

  // --- 8. Testing WhatsApp Chat Export Parser ---
  console.log("\n--- 8. Testing WhatsApp Group Chat Export Batch Parser ---");
  const batchExport = `[12/10/26, 10:15:20 AM] Rajesh HR: Hiring Node.js backend developer for FinTech startup in Pune. Salary 6-8 LPA. Exp 2 yrs. Contact hr@fintechpune.com
[12/10/26, 10:16:05 AM] User Ravi: Thank you Rajesh sir
[12/10/26, 11:30:10 AM] Priya TA: Urgent requirement for Flutter Developer at MobileCraft. Freshers welcome. Prayagraj. Send resume to 9876541230.`;

  const batchRes = await HiringIngestionService.processBatchChatExport(batchExport, testSource.id);
  assert(batchRes.totalMessagesParsed >= 2, `Parsed ${batchRes.totalMessagesParsed} messages from WhatsApp export format`);
  assert(batchRes.processedCount >= 2, `Processed ${batchRes.processedCount} recruitment items`);

  // --- 9. Testing Integration Diagnostics ---
  console.log("\n--- 9. Testing Real Integration Diagnostics ---");
  const diag = await HiringAutomationConfigService.getIntegrationDiagnostics();
  assert(Boolean(diag.connectionStatus), `Real Cloud API status reported: ${diag.connectionStatus}`);
  assert(diag.metrics.totalMessages >= 4, `Metrics count total messages (${diag.metrics.totalMessages})`);
  assert(diag.metrics.duplicatesCount >= 1, `Metrics count duplicates filtered (${diag.metrics.duplicatesCount})`);
  assert(diag.metrics.suspiciousCount >= 1, `Metrics count suspicious posts flagged (${diag.metrics.suspiciousCount})`);
  assert(diag.supportedIngestionChannels.length === 4, "Compliance breakdown includes all 4 official vs restricted channels");

  // --- SUMMARY ---
  console.log("\n===============================================================================");
  console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("===============================================================================\n");

  if (passedTests === totalTests) {
    console.log("🌟 ALL 9 TEST SUITES PASSED FLAWLESSLY WITH ZERO ERRORS!");
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
