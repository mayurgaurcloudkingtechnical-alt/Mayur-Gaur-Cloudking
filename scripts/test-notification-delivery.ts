/**
 * Live notification delivery test (Email + WhatsApp).
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/test-notification-delivery.ts <email> <phone>
 * Prints the REAL provider result — nothing is simulated.
 */
import { db } from "../src/server/db/client";
import { EmailService } from "../src/server/services/email.service";
import { WhatsAppBusinessService } from "../src/server/services/whatsapp-business.service";
import { WhatsAppBusinessConfigService } from "../src/server/services/whatsapp-business-config.service";

async function main() {
  const [email, phone] = process.argv.slice(2);
  if (!email || !phone) {
    console.error("Usage: test-notification-delivery.ts <email> <phone>");
    process.exit(1);
  }

  console.log("Email providers -> RESEND_API_KEY:", !!process.env.RESEND_API_KEY, "| SMTP configured:", EmailService.isConfigured());
  const emailRes = await EmailService.sendEmail({
    to: email,
    subject: "SOFTLAB GLOBAL — Notification delivery test",
    html: "<p>This is a live delivery test from SOFTLAB GLOBAL LMS. If you received this, email is working.</p>",
    text: "Live delivery test from SOFTLAB GLOBAL LMS.",
  });
  console.log("EMAIL RESULT:", emailRes);

  const cfg = await WhatsAppBusinessConfigService.getConfig();
  console.log("WhatsApp config -> phoneNumberId:", cfg.phoneNumberId || "(empty)", "| token set:", !!cfg.accessToken, "| fallback template:", process.env.WHATSAPP_NOTIFICATION_TEMPLATE || "(none)");
  if (cfg.accessToken && cfg.phoneNumberId) {
    console.log("Meta phone verification:", await WhatsAppBusinessConfigService.verifyMetaConnection());
  }
  const waRes = await WhatsAppBusinessService.sendMessage({
    toPhone: phone,
    text: "SOFTLAB GLOBAL LMS — live WhatsApp delivery test. If you received this, WhatsApp is working.",
  });
  console.log("WHATSAPP RESULT:", waRes);

  await db.$disconnect();
  process.exit(emailRes.sent && waRes.success ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
