/**
 * SoftLab Global — Verification Suite for Unified Multi-Platform Live Tracking
 */

import { LiveTrackingService } from "../src/server/services/live-tracking.service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function main() {
  console.log("==================================================================");
  console.log(" SOFTLAB GLOBAL — MULTI-PLATFORM LIVE TRACKING VERIFICATION SUITE");
  console.log("==================================================================\n");

  // Step 1: Verify Platform Health Matrix
  console.log("[1] Testing getPlatformHealthMatrix across all institutional platforms...");
  const matrix = await LiveTrackingService.getPlatformHealthMatrix();

  assert(Array.isArray(matrix), "Platform health matrix is an array");
  assert(matrix.length === 14, `Expected exactly 14 platforms connected, received ${matrix.length}`);

  const requiredPlatformIds = [
    "meta_ads",
    "instagram",
    "google_ads",
    "justdial",
    "website",
    "whatsapp_bot",
    "razorpay",
    "finance_ledger",
    "student_lms",
    "examination",
    "faculty_attendance",
    "placements",
    "staff_hrms",
    "system_sre",
  ];

  for (const expectedId of requiredPlatformIds) {
    const item = matrix.find((p) => p.id === expectedId);
    assert(!!item, `Platform [${expectedId}] is present in live health matrix`);
    assert(!!item?.status, `Platform [${expectedId}] status is defined: ${item?.status}`);
    assert(item?.metricValue !== undefined, `Platform [${expectedId}] metricValue is computed: ${item?.metricValue}`);
    assert(!!item?.internalPath, `Platform [${expectedId}] internal navigation path is set: ${item?.internalPath}`);
  }

  // Step 2: Verify Chronological Live Event Feed
  console.log("\n[2] Testing getLiveEventFeed aggregation...");
  const initialEvents = await LiveTrackingService.getLiveEventFeed(20);
  assert(Array.isArray(initialEvents), "Live event stream returns an array");
  console.log(`Found ${initialEvents.length} initial events in live stream.`);

  if (initialEvents.length > 0) {
    const first = initialEvents[0];
    assert(!!first.id, "Event has a unique ID");
    assert(!!first.platform, `Event has platform tag: ${first.platform}`);
    assert(!!first.title, `Event has title: ${first.title}`);
    assert(!!first.timestamp, "Event has a valid timestamp");
  }

  // Step 3: Test Real-time Ingestion Simulators
  console.log("\n[3] Testing Live Ingestion Simulator for Meta Facebook Boost...");
  const metaSim = await LiveTrackingService.simulatePlatformEvent("meta");
  assert(metaSim.success === true, "Meta FB Lead simulation executed successfully");
  assert(!!metaSim.recordId, `Meta Lead created with ID: ${metaSim.recordId}`);

  console.log("\n[4] Testing Live Ingestion Simulator for Google Search Ads...");
  const googleSim = await LiveTrackingService.simulatePlatformEvent("google");
  assert(googleSim.success === true, "Google Search Lead simulation executed successfully");
  assert(!!googleSim.recordId, `Google Lead created with ID: ${googleSim.recordId}`);

  console.log("\n[5] Testing Live Ingestion Simulator for JustDial Inbound...");
  const jdSim = await LiveTrackingService.simulatePlatformEvent("justdial");
  assert(jdSim.success === true, "JustDial Lead simulation executed successfully");
  assert(!!jdSim.recordId, `JustDial Lead created with ID: ${jdSim.recordId}`);

  console.log("\n[6] Testing Live Ingestion Simulator for WhatsApp AI Bot...");
  const waSim = await LiveTrackingService.simulatePlatformEvent("whatsapp");
  assert(waSim.success === true, "WhatsApp Bot Reply simulation executed successfully");

  console.log("\n[7] Testing Live Ingestion Simulator for Razorpay Settlement...");
  const rzpSim = await LiveTrackingService.simulatePlatformEvent("razorpay");
  assert(rzpSim.success === true, "Razorpay Settlement simulation executed successfully");

  // Step 8: Verify simulated events immediately reflect in the Live Event Feed
  console.log("\n[8] Verifying immediate reflection in the Live Event Feed...");
  const updatedEvents = await LiveTrackingService.getLiveEventFeed(10);
  assert(updatedEvents.length > 0, "Updated event feed contains events");

  const latestEvent = updatedEvents[0];
  console.log(`Latest event after simulations: [${latestEvent.platform}] ${latestEvent.title}`);
  assert(
    ["META", "GOOGLE", "JUSTDIAL", "WHATSAPP", "RAZORPAY", "FINANCE"].includes(latestEvent.platform),
    `Latest event belongs to a simulated platform: ${latestEvent.platform}`
  );

  console.log("\n==================================================================");
  console.log(" 🎉 ALL MULTI-PLATFORM LIVE TRACKING TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

main()
  .catch((err) => {
    console.error("FATAL ERROR in verification suite:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
