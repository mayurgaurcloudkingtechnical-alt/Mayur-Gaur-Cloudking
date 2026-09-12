import { db } from "../src/server/db/client";
import * as bcrypt from "bcryptjs";

function validatePasswordComplexity(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one digit." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character." };
  }
  return { valid: true };
}

async function main() {
  const args = process.argv.slice(2);
  let emailArg: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--email=")) {
      emailArg = arg.split("=")[1]?.trim();
    } else if (!arg.startsWith("--") && !emailArg) {
      emailArg = arg.trim();
    }
  }

  if (!emailArg) {
    console.error("\n[SECURITY ERROR] Missing target user email address.");
    console.log("\nUsage:");
    console.log('  NEW_SEED_USER_PASSWORD="<your-secret>" npx tsx scripts/reset-seed-credentials.ts --email="<user-email>"');
    process.exit(1);
  }

  const newPassword =
    process.env.NEW_SEED_USER_PASSWORD ||
    process.env.NEW_SEED_STUDENT_PASSWORD ||
    process.env.NEW_SEED_TRAINER_PASSWORD ||
    process.env.NEW_SEED_SUPER_ADMIN_PASSWORD ||
    process.env.NEW_PASSWORD;

  if (!newPassword || newPassword.trim().length === 0) {
    console.error("\n[SECURITY ERROR] Missing new password environment variable.");
    console.error("The new password must be supplied via the NEW_SEED_USER_PASSWORD environment variable.");
    console.log("\nCommand Format:");
    console.log('  NEW_SEED_USER_PASSWORD="<your-secret>" npx tsx scripts/reset-seed-credentials.ts --email="<user-email>"');
    process.exit(1);
  }

  const validation = validatePasswordComplexity(newPassword);
  if (!validation.valid) {
    console.error(`\n[SECURITY ERROR] Password does not meet security criteria: ${validation.reason}`);
    process.exit(1);
  }

  const user = await db.user.findUnique({
    where: { email: emailArg.toLowerCase() },
  });

  if (!user) {
    console.error(`\n[ERROR] User account with email '${emailArg}' not found in database.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword.trim(), 12);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "AUTH_CREDENTIAL_RESET_CLI",
      resourceType: "User",
      resourceId: user.id,
      newData: { email: user.email, updatedVia: "CLI_RESET_TOOL" },
    },
  });

  console.log(`\n✓ Password successfully updated and audited for user: ${user.email} (Role: ${user.roleCode})`);
  console.log("✓ Bcrypt work factor 12 rounds applied.");
  console.log("✓ No secrets or credentials were logged or echoed.\n");
}

main()
  .catch((err) => {
    console.error("\n[FATAL ERROR]:", err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
