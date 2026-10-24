import { db } from "../src/server/db/client";
import { WhatsAppBusinessConfigService } from "../src/server/services/whatsapp-business-config.service";

async function audit() {
  console.log("=================================================");
  console.log("🔍 SOFTLAB GLOBAL — WHATSAPP & CALLING PIPELINE AUDIT");
  console.log("=================================================");

  // 1. Audit Environment Variables
  const envKeys = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_CLOUD_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_WABA_ID",
    "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_APP_ID",
    "WHATSAPP_APP_SECRET",
    "META_ACCESS_TOKEN",
    "META_PAGE_ACCESS_TOKEN",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "EXOTEL_SID",
    "EXOTEL_TOKEN",
    "EXOTEL_API_KEY",
    "EXOTEL_SUB_DOMAIN",
    "EXOTEL_CALLER_ID",
    "CALLYZER_ACCESS_TOKEN",
    "CALLYZER_API_KEY",
    "DEEPGRAM_API_KEY",
    "ELEVENLABS_API_KEY",
    "OPENAI_API_KEY",
    "REDIS_URL",
  ];

  console.log("\n1. Environment Variable Presence Check:");
  for (const k of envKeys) {
    const val = process.env[k];
    if (val && val.trim().length > 0) {
      console.log(`   ✅ ${k}: SET (Length: ${val.length})`);
    } else {
      console.log(`   ❌ ${k}: NOT CONFIGURED`);
    }
  }

  // 2. Audit DB Stored System Settings for WhatsApp
  console.log("\n2. Database Stored Settings (SystemSetting / WhatsAppBusinessConfig):");
  try {
    const storedConfig = await WhatsAppBusinessConfigService.getConfig();
    console.log("   Stored Config Status:");
    console.log(`   - phoneNumberId: ${storedConfig.phoneNumberId ? "SET" : "MISSING"}`);
    console.log(`   - accessToken: ${storedConfig.accessToken ? "SET (Length: " + storedConfig.accessToken.length + ")" : "MISSING"}`);
    console.log(`   - wabaId: ${storedConfig.wabaId ? "SET" : "MISSING"}`);
    console.log(`   - displayPhoneNumber: ${storedConfig.displayPhoneNumber || "NOT SET"}`);
    console.log(`   - isVerified: ${(storedConfig as any).isVerified}`);
  } catch (err: any) {
    console.log("   ❌ Error fetching WhatsApp stored config:", err.message);
  }

  // 3. Audit Calling Queue Items & Audits
  console.log("\n3. Calling Queue & Batches in DB:");
  const batchCount = await db.bulkCallingBatch.count();
  const queueItemCount = await db.callingQueueItem.count();
  const queueItemStatuses = await db.callingQueueItem.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log(`   - Total Batches: ${batchCount}`);
  console.log(`   - Total Queue Items: ${queueItemCount}`);
  console.log("   - Queue Status Breakdown:", queueItemStatuses);

  // 4. Audit Lead Activities (Calls and WhatsApp messages recorded)
  console.log("\n4. Recent Lead Activities (Call/WhatsApp):");
  const recentActivities = await db.leadActivity.findMany({
    where: {
      activityType: {
        in: ["AI_VOICE_CALL", "AI_WHATSAPP_FOLLOWUP", "CALL", "WHATSAPP"],
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      activityType: true,
      disposition: true,
      notes: true,
      createdAt: true,
    },
  });
  console.log(`   Found ${recentActivities.length} recent activities:`, recentActivities);
}

audit()
  .catch((e) => console.error("Audit script failed:", e))
  .finally(async () => {
    await db.$disconnect();
  });
