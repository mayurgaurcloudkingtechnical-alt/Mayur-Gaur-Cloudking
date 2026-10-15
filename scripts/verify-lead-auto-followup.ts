import { db } from "../src/server/db/client";
import { LeadAutoFollowupService } from "../src/server/services/lead-auto-followup.service";
import { LeadStatus } from "@prisma/client";

async function verifyLeadAutoFollowup() {
  console.log("===============================================================================");
  console.log("🧪 VERIFYING LEAD AUTO FOLLOW-UP ENGINE FOR UNTOUCHED & PENDING ENQUIRIES");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (detail) console.error(`   ${detail}`);
    }
  }

  // 1. Test Aggregating Untouched & Pending Stats
  console.log("--- 1. Testing getUntouchedAndPendingStats ---");
  const stats = await LeadAutoFollowupService.getUntouchedAndPendingStats();
  console.log("   Stats retrieved:", stats);
  assert(typeof stats.totalActiveLeads === "number", "Total Active Leads is a number");
  assert(typeof stats.untouchedCount === "number", "Untouched Count is a number");
  assert(typeof stats.pendingFollowupCount === "number", "Pending Follow-up Count is a number");
  assert(typeof stats.hotLeadsCount === "number", "Hot Leads Count is a number");

  // 2. Ensure a test lead exists for execution
  console.log("\n--- 2. Ensuring Test Enquiry / Lead Exists ---");
  let testLead = await db.lead.findFirst({
    where: {
      phone: "9988776655",
    },
  });

  if (!testLead) {
    testLead = await db.lead.create({
      data: {
        fullName: "Aarav Sharma (Test Lead)",
        email: "aarav.test@softlabglobal.com",
        phone: "9988776655",
        city: "Prayagraj",
        status: LeadStatus.NEW,
        notes: "Enquired about AI and Full Stack Course via Web Form",
        temperature: "WARM",
        isOptedOut: false,
      },
    });
  } else {
    // Reset test lead to untouched state
    testLead = await db.lead.update({
      where: { id: testLead.id },
      data: {
        status: LeadStatus.NEW,
        lastInteraction: null,
        isOptedOut: false,
      },
    });
  }
  assert(Boolean(testLead?.id), `Test lead ready (ID: ${testLead.id}, Status: ${testLead.status})`);

  // 3. Test Batch Auto Follow-up in Dual Connect Mode (WhatsApp + AI Call)
  console.log("\n--- 3. Testing executeBatchAutoFollowup (BOTH mode) ---");
  const batchRes = await LeadAutoFollowupService.executeBatchAutoFollowup({
    mode: "BOTH",
    limit: 5,
    actorName: "Priyanka Mishra (Senior Academic Counselor)",
    actorCallingNumber: "9196596979",
    actorWhatsappNumber: "9196596979",
  });

  console.log("   Batch Result:", {
    scanned: batchRes.scanned,
    whatsappSentCount: batchRes.whatsappSentCount,
    aiCallsCompletedCount: batchRes.aiCallsCompletedCount,
    hotLeadsCount: batchRes.hotLeadsCount,
    updatedCount: batchRes.updatedCount,
  });

  assert(batchRes.scanned > 0, `Scanned ${batchRes.scanned} untouched/pending leads successfully`);
  assert(batchRes.results.length > 0, "Batch results array is populated");
  assert(batchRes.aiCallsCompletedCount > 0, `AI Calls completed: ${batchRes.aiCallsCompletedCount}`);

  // 4. Verify Database Persistence for the Touchpoint
  console.log("\n--- 4. Verifying Timeline Event & Lead Activity Persistence ---");
  const updatedLead = await db.lead.findUnique({
    where: { id: testLead.id },
  });

  assert(updatedLead?.lastInteraction !== null, "Lead lastInteraction timestamp updated");
  assert(updatedLead?.status !== LeadStatus.NEW, `Lead status moved out of NEW to: ${updatedLead?.status}`);

  const activities = await db.leadActivity.findMany({
    where: { leadId: testLead.id },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  assert(activities.length > 0, `Lead activities recorded: ${activities.length} records`);

  const timelineEvents = await db.customerTimelineEvent.findMany({
    where: { leadId: testLead.id },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  assert(timelineEvents.length > 0, `Timeline events recorded: ${timelineEvents.length} records`);

  // --- SUMMARY ---
  console.log("\n===============================================================================");
  console.log(`🏁 VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🌟 ALL TESTS PASSED! AI FOLLOW-UP ENGINE IS 100% OPERATIONAL!");
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} tests failed.`);
    process.exit(1);
  }
}

verifyLeadAutoFollowup().catch((e) => {
  console.error("Test crashed:", e);
  process.exit(1);
});
