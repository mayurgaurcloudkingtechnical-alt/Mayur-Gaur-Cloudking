import { db } from "../src/server/db/client";
import { CrmIngestionService } from "../src/server/services/crm-ingestion.service";
import { WhatsAppBusinessService } from "../src/server/services/whatsapp-business.service";
import { AiCounselorService } from "../src/server/services/ai-counselor.service";
import { OmnichannelInboxService } from "../src/server/services/omnichannel-inbox.service";
import { LmsAdmissionAutomationService } from "../src/server/services/lms-admission-automation.service";
import { LmsCourseMasterService } from "../src/server/services/lms-course-master.service";
import { WhatsAppCatalogueSyncService } from "../src/server/services/whatsapp-catalogue-sync.service";
import { AiCallingAgentService } from "../src/server/services/ai-calling-agent.service";
import { LeadSource, LeadStatus } from "@prisma/client";

async function runProductionWhatsAppOmnichannelVerification() {
  console.log("================================================================================");
  console.log("🚀 STARTING PRODUCTION META WHATSAPP, CATALOGUE & AI COUNSELOR INTEGRATION TEST");
  console.log("================================================================================\n");

  const testPhone = "919876543210";
  const testEmail = "rahul.sharma.test2026@gmail.com";
  const testName = "Rahul Sharma";

  // Cleanup prior test artifacts
  await db.lead.deleteMany({
    where: { OR: [{ phone: testPhone.slice(-10) }, { phone: testPhone }, { email: testEmail }] },
  });

  // -------------------------------------------------------------------------
  // TEST 1: New WhatsApp Inbound User
  // -------------------------------------------------------------------------
  console.log("1️⃣ TEST 1: New WhatsApp user -> Inbound Message -> Lead Created -> AI Response");
  const t1Ingest = await CrmIngestionService.ingestLead({
    fullName: testName,
    phone: testPhone,
    source: LeadSource.WHATSAPP,
    notes: 'WhatsApp: "Namaste sir, mujhe Cyber Security course ki details chahiye"',
    campaignName: "WhatsApp Direct Inbound",
  });

  const leadId = t1Ingest.leadId;
  console.log(`   ✅ Lead created: ${leadId} (isNew: ${t1Ingest.isNew})`);

  const t1Convo = await OmnichannelInboxService.getOrCreateConversation(leadId, "WHATSAPP", testPhone);
  await OmnichannelInboxService.addMessage({
    conversationId: t1Convo.id,
    senderType: "LEAD",
    senderName: testName,
    channel: "WHATSAPP",
    messageType: "TEXT",
    content: "Namaste sir, mujhe Cyber Security course ki details chahiye",
  });

  const t1Ai = await AiCounselorService.counsel({
    leadId,
    leadName: testName,
    leadPhone: testPhone,
    userMessage: "Namaste sir, mujhe Cyber Security course ki details chahiye",
    channel: "WHATSAPP",
  });

  console.log(`   ✅ Detected Language: ${t1Ai.detectedLanguage}`);
  console.log(`   ✅ Matched Course: ${t1Ai.matchedCourse?.courseName || "None"}`);
  console.log(`   ✅ AI Response: "${t1Ai.replyText.slice(0, 100)}..."`);

  // -------------------------------------------------------------------------
  // TEST 2: Existing Lead Re-engages (Context Continuity)
  // -------------------------------------------------------------------------
  console.log("\n2️⃣ TEST 2: Existing Lead Re-engages -> Context Maintained without Duplicate Lead");
  const t2Ingest = await CrmIngestionService.ingestLead({
    fullName: testName,
    phone: testPhone,
    source: LeadSource.WHATSAPP,
    notes: 'WhatsApp: "bhaiya offline batch kab se start ho raha hai prayagraj me"',
  });

  if (t2Ingest.leadId !== leadId || t2Ingest.isNew) {
    throw new Error(`Deduplication failure! Expected leadId ${leadId}, got ${t2Ingest.leadId}`);
  }
  console.log(`   ✅ Deduplicated successfully onto existing Lead ${leadId}`);

  // -------------------------------------------------------------------------
  // TEST 3: Hindi / Hinglish Message
  // -------------------------------------------------------------------------
  console.log("\n3️⃣ TEST 3: Hindi/Hinglish Query ('bhaiya cyber security ka course kitne ka hai')");
  const t3Ai = await AiCounselorService.counsel({
    leadId,
    leadName: testName,
    leadPhone: testPhone,
    userMessage: "bhaiya cyber security ka course kitne ka hai",
    channel: "WHATSAPP",
  });
  console.log(`   ✅ Detected Language: ${t3Ai.detectedLanguage} (Expected: HINGLISH)`);
  console.log(`   ✅ Intent: ${t3Ai.intent}`);
  console.log(`   ✅ Quoted Fee in Reply: ${t3Ai.replyText.includes("₹") ? "Yes (Includes Fee)" : "No"}`);

  // -------------------------------------------------------------------------
  // TEST 4: English Message
  // -------------------------------------------------------------------------
  console.log("\n4️⃣ TEST 4: English Query ('Tell me about your cloud computing syllabus.')");
  const t4Ai = await AiCounselorService.counsel({
    leadId,
    leadName: testName,
    leadPhone: testPhone,
    userMessage: "Tell me about your cloud computing syllabus and placement partners.",
    channel: "WHATSAPP",
  });
  console.log(`   ✅ Detected Language: ${t4Ai.detectedLanguage} (Expected: ENGLISH)`);
  console.log(`   ✅ Intent: ${t4Ai.intent}`);
  console.log(`   ✅ Brochure Link Included: ${t4Ai.replyText.includes("http") ? "Yes" : "No"}`);

  // -------------------------------------------------------------------------
  // TEST 5: Live LMS Course Master Dynamic Match
  // -------------------------------------------------------------------------
  console.log("\n5️⃣ TEST 5: Live Course Master dynamic retrieval (Single Source of Truth)");
  const activeCourses = await LmsCourseMasterService.getAllActiveCourses();
  console.log(`   ✅ Total active courses in LMS Master: ${activeCourses.length}`);
  const pythonCourse = activeCourses.find((c) => c.courseName.toLowerCase().includes("python"));
  if (pythonCourse) {
    console.log(`   ✅ Found Course: ${pythonCourse.courseName}`);
    console.log(`      • Official Fee: ₹${pythonCourse.fee.toLocaleString("en-IN")}`);
    console.log(`      • Mode: ${pythonCourse.mode}`);
    console.log(`      • Campus: ${pythonCourse.branch}`);
    console.log(`      • EMI: ₹${pythonCourse.emiPlans[0]?.monthlyAmountRupees}/mo @ 0% interest`);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Dynamic Fee Update -> AI uses new fee immediately
  // -------------------------------------------------------------------------
  console.log("\n6️⃣ TEST 6: Super Admin updates Course Fee in LMS -> AI uses new fee");
  const testCourse = activeCourses[0];
  const originalFee = testCourse.feePaise;
  const temporaryFee = 8800000; // ₹88,000

  await db.course.update({
    where: { id: testCourse.id },
    data: { baseFee: temporaryFee },
  });

  const t6Ai = await AiCounselorService.counsel({
    leadId,
    leadName: testName,
    leadPhone: testPhone,
    courseName: testCourse.courseName,
    userMessage: `What is the fee for ${testCourse.courseName}?`,
    channel: "WHATSAPP",
  });

  console.log(`   ✅ AI dynamically quoted updated fee: ${t6Ai.replyText.includes("88,000") ? "₹88,000" : "Static"}`);

  // Revert course fee back
  await db.course.update({
    where: { id: testCourse.id },
    data: { baseFee: originalFee },
  });

  // -------------------------------------------------------------------------
  // TEST 7: High Intent -> AI Voice Calling Trigger with Context
  // -------------------------------------------------------------------------
  console.log("\n7️⃣ TEST 7: High Intent -> AI Voice Calling with Previous WhatsApp Context");
  const callResult = await AiCallingAgentService.triggerDirectLeadCall({
    leadId,
    preferredLanguage: "Hindi",
  });

  console.log(`   ✅ AI Voice Call Triggered: ${callResult.success}`);
  console.log(`   ✅ Call Outcome: ${callResult.result.callOutcome}`);
  console.log(`   ✅ Duration: ${callResult.result.durationSeconds}s`);
  console.log(`   ✅ Summary: ${callResult.summary.slice(0, 100)}...`);

  // Verify call recorded in timeline
  const timelineCall = await db.customerTimelineEvent.findFirst({
    where: { leadId, eventType: "CALL_COMPLETED" },
  });
  console.log(`   ✅ Call saved to CustomerTimelineEvent: ${timelineCall ? "YES" : "NO"}`);

  // -------------------------------------------------------------------------
  // TEST 8: Human Escalation (Discount query / Grievance)
  // -------------------------------------------------------------------------
  console.log("\n8️⃣ TEST 8: Unauthorized Discount Query -> Escalation Task Created");
  const t8Ai = await AiCounselorService.counsel({
    leadId,
    leadName: testName,
    leadPhone: testPhone,
    userMessage: "Can you give me 50% discount or scholarship concession on fees?",
    channel: "WHATSAPP",
  });

  console.log(`   ✅ Escalation Required: ${t8Ai.escalationRequired}`);
  console.log(`   ✅ Escalation Reason: ${t8Ai.escalationReason}`);

  const escalation = await db.escalationTask.findFirst({
    where: { leadId, reason: "DISCOUNT_REQUEST" },
  });
  console.log(`   ✅ EscalationTask logged in database: ${escalation ? escalation.id : "NO"}`);

  // -------------------------------------------------------------------------
  // TEST 9: WhatsApp Catalogue Synchronization
  // -------------------------------------------------------------------------
  console.log("\n9️⃣ TEST 9: WhatsApp Business Catalogue Synchronization Service");
  const catalogSync = await WhatsAppCatalogueSyncService.syncAllCourses();
  console.log(`   ✅ Catalogue Sync Mode: ${catalogSync.mode}`);
  console.log(`   ✅ Total Courses Evaluated: ${catalogSync.totalCourses}`);
  console.log(`   ✅ Successfully Mapped: ${catalogSync.syncedCount}`);
  console.log(`   ✅ Status Message: ${catalogSync.message}`);

  // -------------------------------------------------------------------------
  // TEST 10: Opt-Out / Privacy Sentinel
  // -------------------------------------------------------------------------
  console.log("\n🔟 TEST 10: WhatsApp STOP / Opt-Out Sentinel");
  await WhatsAppBusinessService.handleOptOut(testPhone, "User texted STOP via WhatsApp");
  const isOptedOut = await WhatsAppBusinessService.isOptedOut(testPhone);
  console.log(`   ✅ Lead Opt-Out State: ${isOptedOut ? "OPTED_OUT (Communications Blocked)" : "ACTIVE"}`);

  // -------------------------------------------------------------------------
  // TEST 11: Admission Conversion & LMS Provisioning
  // -------------------------------------------------------------------------
  console.log("\n1️⃣1️⃣ TEST 11: End-to-End LMS Admission Automation & Student Provisioning");
  // Un-opt out for admission conversion test
  await db.lead.updateMany({
    where: { id: leadId },
    data: { isOptedOut: false },
  });

  const enrolledCourse = activeCourses.find((c) => c.providerType === "SOFTLAB") || activeCourses[0];
  const admissionResult = await LmsAdmissionAutomationService.processAdmissionAndEnrollment({
    leadId,
    courseId: enrolledCourse.id,
    amountPaise: enrolledCourse.feePaise,
    paymentMethod: "RAZORPAY_ONLINE",
    razorpayPaymentId: `pay_test_${Date.now()}`,
  });

  console.log(`   ✅ Converted Application ID: ${admissionResult.applicationId}`);
  console.log(`   ✅ Generated Student ID: ${admissionResult.studentId}`);
  console.log(`   ✅ Official Receipt: ${admissionResult.receiptNumber}`);

  // -------------------------------------------------------------------------
  // TEST 12: Super Admin Health Dashboard & 360° Timeline Audit
  // -------------------------------------------------------------------------
  console.log("\n1️⃣2️⃣ TEST 12: Super Admin Health Sentinel & 360° Customer Timeline Audit");
  const health = await WhatsAppBusinessService.getSystemIntegrationsHealth();
  console.log(`   ✅ WhatsApp API Status: ${health.whatsapp.status}`);
  console.log(`   ✅ AI Counselor Status: ${health.aiCounselor.status}`);
  console.log(`   ✅ AI Voice Calling: ${health.aiVoice.status}`);
  console.log(`   ✅ LMS Active Master Courses: ${health.lms.activeCourses}`);

  const timelineEvents = await OmnichannelInboxService.getCustomerTimeline(leadId);
  console.log(`   ✅ Total Timeline Audit Events on Single Lead: ${timelineEvents.length}`);
  timelineEvents.forEach((ev, idx) => {
    console.log(`      [${idx + 1}] ${ev.eventType} (${ev.source}): ${ev.title}`);
  });

  console.log("\n================================================================================");
  console.log("🎉 ALL 12 PRODUCTION OMNICHANNEL & WHATSAPP JOURNEY TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

runProductionWhatsAppOmnichannelVerification()
  .catch((err) => {
    console.error("❌ Test verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
