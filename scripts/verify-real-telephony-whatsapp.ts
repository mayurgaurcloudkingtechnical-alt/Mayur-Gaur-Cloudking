import { TelephonyService } from "../src/server/services/telephony/telephony.service";
import { WhatsAppBusinessService } from "../src/server/services/whatsapp-business.service";

async function runVerification() {
  console.log("=================================================");
  console.log("SOFTLAB GLOBAL CRM - REAL TELEPHONY & WHATSAPP E2E VERIFICATION");
  console.log("=================================================\n");

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passes++;
    } else {
      console.error(`[FAIL] ${testName}: ${detail || "Assertion failed"}`);
      fails++;
    }
  }

  // 1. Phone normalization
  const norm1 = TelephonyService.normalizePhone("9876543210");
  const norm2 = TelephonyService.normalizePhone("+91-98765-43210");
  const norm3 = TelephonyService.normalizePhone("09876543210");
  assert(norm1 === "919876543210", "Telephony phone normalization 10-digit", norm1);
  assert(norm2 === "919876543210", "Telephony phone normalization with country code & symbols", norm2);
  assert(norm3 === "919876543210", "Telephony phone normalization with leading zero", norm3);

  // 2. Calling Hours Check (IST 10:00 - 19:00)
  const isNowAllowed = TelephonyService.isWithinCallingHours();
  const isForcedAllowed = TelephonyService.isWithinCallingHours(true);
  assert(isForcedAllowed === true, "Calling hours forceOverride returns true");
  console.log(`[INFO] Current IST calling window active: ${isNowAllowed}`);

  // 3. Provider Configuration Resolution
  const telephonyConfig = await TelephonyService.getActiveProviderConfig();
  assert(
    typeof telephonyConfig.isConfigured === "boolean",
    "Telephony config resolves valid boolean status",
    JSON.stringify(telephonyConfig)
  );
  assert(
    Array.isArray(telephonyConfig.missingVars),
    "Telephony config returns array of missing variable names",
    JSON.stringify(telephonyConfig.missingVars)
  );
  console.log(`[INFO] Active Telephony Provider: ${telephonyConfig.provider} (Configured: ${telephonyConfig.isConfigured})`);
  if (!telephonyConfig.isConfigured) {
    console.log(`[INFO] Telephony Missing Vars (Safe names only): ${telephonyConfig.missingVars.join(", ")}`);
  }

  // 4. Genuine Call Initiation (No Carrier Credentials -> Must NOT fake success)
  const invalidCall = await TelephonyService.initiateCall({
    leadPhone: "1234",
    userId: "test-user-id",
    forceCallingHours: true,
  });
  assert(
    invalidCall.success === false && invalidCall.providerCallId === "INVALID_NUMBER",
    "Invalid number is rejected with INVALID_NUMBER status (no fake COMPLETED)",
    JSON.stringify(invalidCall)
  );

  if (!telephonyConfig.isConfigured) {
    const unconfiguredCall = await TelephonyService.initiateCall({
      leadPhone: "9876543210",
      userId: "test-user-id",
      forceCallingHours: true,
    });
    assert(
      unconfiguredCall.success === false && unconfiguredCall.providerCallId === "CARRIER_NOT_CONFIGURED",
      "Unconfigured carrier returns CARRIER_NOT_CONFIGURED error without faking success",
      JSON.stringify(unconfiguredCall)
    );
  }

  // 5. WhatsApp Normalization and Opt-Out Check
  const waNorm = WhatsAppBusinessService.normalizePhone("9659697975");
  assert(waNorm === "919659697975", "WhatsApp phone normalization", waNorm);

  // 6. WhatsApp Dispatch without token -> Must NOT fake success
  const waResult = await WhatsAppBusinessService.sendMessage({
    toPhone: "9876543210",
    text: "Test verification message",
  });
  assert(
    typeof waResult.success === "boolean",
    "WhatsApp sendMessage returns typed result",
    JSON.stringify(waResult)
  );
  if (!process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && !process.env.WHATSAPP_ACCESS_TOKEN) {
    assert(
      waResult.success === false && (waResult.messageId === "NOT_CONFIGURED" || waResult.messageId === "FAILED"),
      "Unconfigured WhatsApp returns NOT_CONFIGURED without claiming message was sent",
      JSON.stringify(waResult)
    );
  }

  // 7. System Integrations Health Diagnostic
  const health = await WhatsAppBusinessService.getSystemIntegrationsHealth();
  assert(!!health.whatsapp, "Integrations health contains WhatsApp diagnostics");
  assert(!!health.telephony, "Integrations health contains Telephony diagnostics");
  assert(typeof health.telephony.isConfigured === "boolean", "Telephony diagnostics reports isConfigured");
  assert(health.telephony.webhookUrlTwilio.includes("/api/webhooks/telephony/twilio"), "Twilio webhook URL endpoint correct");
  assert(health.telephony.webhookUrlExotel.includes("/api/webhooks/telephony/exotel"), "Exotel webhook URL endpoint correct");

  console.log("\n=================================================");
  console.log(`VERIFICATION SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log("=================================================");

  if (fails > 0) {
    process.exit(1);
  }
}

runVerification().catch((e) => {
  console.error("Unhandled verification error:", e);
  process.exit(1);
});
