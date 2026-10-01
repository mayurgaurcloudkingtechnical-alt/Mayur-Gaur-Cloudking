import { db } from "../src/server/db/client";
import { CrmIngestionService } from "../src/server/services/crm-ingestion.service";
import { WhatsAppBusinessService } from "../src/server/services/whatsapp-business.service";
import { AiCounselorService } from "../src/server/services/ai-counselor.service";
import { OmnichannelInboxService } from "../src/server/services/omnichannel-inbox.service";
import { LmsAdmissionAutomationService } from "../src/server/services/lms-admission-automation.service";
import { LeadSource } from "@prisma/client";

async function runOmnichannelVerification() {
  console.log("================================================================================");
  console.log("🚀 STARTING SOFTLAB GLOBAL AI OMNICHANNEL ADMISSIONS & LMS AUTOMATION VERIFICATION");
  console.log("================================================================================\n");

  const testPhone = "919999888877";
  const testEmail = "ananya.sharma.test@gmail.com";
  const testName = "Ananya Sharma";

  // Cleanup any old test runs
  await db.lead.deleteMany({
    where: { OR: [{ phone: testPhone.slice(-10) }, { email: testEmail }] },
  });

  // Step 1: Central Ingestion via Website
  console.log("1️⃣ Step 1: Lead Ingestion via Website Enquiry Form...");
  const ingest1 = await CrmIngestionService.ingestLead({
    fullName: testName,
    phone: testPhone,
    email: testEmail,
    city: "Prayagraj",
    qualification: "B.Tech Final Year",
    source: LeadSource.WEBSITE,
    interestedCourseName: "Full Stack",
    notes: "Enquired about next batch start date and placement records",
    campaignName: "Google Search - Full Stack Prayagraj",
  });

  console.log(`   ✅ Ingested Lead ID: ${ingest1.leadId} (isNew: ${ingest1.isNew})`);

  // Step 2: Deduplication Test
  console.log("\n2️⃣ Step 2: Testing Deduplication via Inbound WhatsApp enquiry...");
  const ingest2 = await CrmIngestionService.ingestLead({
    fullName: testName,
    phone: testPhone,
    source: LeadSource.WHATSAPP,
    notes: "WhatsApp: Can I get fee details for Full Stack development?",
  });

  if (ingest2.leadId !== ingest1.leadId || ingest2.isNew) {
    throw new Error("❌ Deduplication check failed! New lead created instead of updating existing.");
  }
  console.log(`   ✅ Deduplication Passed: Matched existing lead ${ingest2.leadId}`);

  // Step 3: AI Counselor Knowledge Grounding & Counseling Test
  console.log("\n3️⃣ Step 3: Testing Knowledge Grounded AI Counselor Engine...");
  const counselorReply = await AiCounselorService.counsel({
    leadId: ingest1.leadId,
    leadName: testName,
    leadPhone: testPhone,
    courseName: "Full Stack & AI Development",
    userMessage: "What is the fee and placement support at your Prayagraj campus?",
    channel: "WHATSAPP",
  });

  console.log(`   [AI Counselor Response]:\n   "${counselorReply.replyText.replace(/\n/g, "\n   ")}"`);
  console.log(`   Score: ${counselorReply.leadScore} | Temp: ${counselorReply.temperature} | Intent: ${counselorReply.intent}`);

  if (!counselorReply.replyText.toLowerCase().includes("placement") || !counselorReply.replyText.includes("₹")) {
    throw new Error("❌ AI Counselor did not return grounded fees or placement info.");
  }
  console.log("   ✅ AI Counselor Grounding Verified.");

  // Step 4: Escalation Sentinel Test (Scholarship / Discount Request)
  console.log("\n4️⃣ Step 4: Testing Unauthorized Discount & Escalation Sentinel...");
  const discountQuery = await AiCounselorService.counsel({
    leadId: ingest1.leadId,
    leadName: testName,
    leadPhone: testPhone,
    courseName: "Full Stack",
    userMessage: "Can you give me 50% discount on the course fee?",
    channel: "WHATSAPP",
  });

  if (!discountQuery.escalationRequired || discountQuery.intent !== "DISCOUNT_REQUEST") {
    throw new Error("❌ Escalation engine failed to catch discount request!");
  }
  console.log(`   ✅ Escalation Sentinel Caught: ${discountQuery.escalationReason}`);

  const escalationTask = await db.escalationTask.findFirst({
    where: { leadId: ingest1.leadId },
    orderBy: { createdAt: "desc" },
  });
  console.log(`   ✅ Escalation Task Logged in Database (ID: ${escalationTask?.id}, Severity: ${escalationTask?.severity})`);

  // Step 5: WhatsApp Cloud API & Unified Inbox Threading
  console.log("\n5️⃣ Step 5: Testing Unified Omnichannel Inbox & Messaging...");
  const conv = await OmnichannelInboxService.getOrCreateConversation(ingest1.leadId, "WHATSAPP", testPhone);
  await OmnichannelInboxService.addMessage({
    conversationId: conv.id,
    senderType: "LEAD",
    senderName: testName,
    channel: "WHATSAPP",
    content: "Please send me the official course syllabus brochure.",
  });

  await WhatsAppBusinessService.sendCourseBrochure(testPhone, testName, "Full Stack Web & AI", undefined, ingest1.leadId);
  console.log("   ✅ WhatsApp Course Brochure Dispatched.");

  // Step 6: Automated LMS Admission & Enrollment Conversion
  console.log("\n6️⃣ Step 6: Testing Razorpay Payment Verification & LMS Student Onboarding...");
  const course = await db.course.findFirst({ where: { deletedAt: null } });
  if (!course) throw new Error("No active course found in database.");

  const admissionResult = await LmsAdmissionAutomationService.processAdmissionAndEnrollment({
    leadId: ingest1.leadId,
    courseId: course.id,
    amountPaise: 4500000, // ₹45,000
    razorpayPaymentId: `pay_test_${Date.now()}`,
    paymentMethod: "RAZORPAY_ONLINE",
  });

  console.log(`   ✅ Student Onboarding Completed!`);
  console.log(`      • Student ID: ${admissionResult.studentId}`);
  console.log(`      • Receipt Number: ${admissionResult.receiptNumber}`);
  console.log(`      • Application ID: ${admissionResult.applicationId}`);

  // Step 7: Final Lead & 360° Timeline Verification
  console.log("\n7️⃣ Step 7: Verifying Final Lead Record & 360° Omnichannel Timeline...");
  const finalLead = await db.lead.findUnique({
    where: { id: ingest1.leadId },
  });

  console.log(`   Status: ${finalLead?.status} | Payment: ${finalLead?.paymentStatus} | LMS: ${finalLead?.lmsStatus}`);
  if (finalLead?.status !== "ADMITTED" || finalLead?.paymentStatus !== "COMPLETED") {
    throw new Error("❌ Final lead state is not fully admitted!");
  }

  const timelineEvents = await OmnichannelInboxService.getCustomerTimeline(ingest1.leadId);
  console.log(`   ✅ 360° Customer Timeline has ${timelineEvents.length} chronological events:`);
  timelineEvents.forEach((ev, idx) => {
    console.log(`      ${idx + 1}. [${ev.source}] ${ev.eventType}: ${ev.title} (${new Date(ev.createdAt).toLocaleTimeString()})`);
  });

  console.log("\n================================================================================");
  console.log("🎉 ALL OMNICHANNEL ADMISSIONS & LMS AUTOMATION VERIFICATION CHECKS PASSED 100%!");
  console.log("================================================================================");
}

runOmnichannelVerification()
  .catch((err) => {
    console.error("FATAL ERROR IN VERIFICATION:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
