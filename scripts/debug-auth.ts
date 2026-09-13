import { db } from "../src/server/db/client";
import * as bcrypt from "bcryptjs";

async function main() {
  const user = await db.user.findFirst({
    where: { email: { equals: "counselor@softlabglobal.com", mode: "insensitive" } },
    include: { role: true },
  });
  console.log("Found user:", user?.email, "Status:", user?.status, "Hash:", user?.passwordHash?.slice(0, 15));
  if (user && user.passwordHash) {
    const check1 = await bcrypt.compare("CounselorSecure2026!", user.passwordHash);
    const check2 = await bcrypt.compare("SoftLab@2026!", user.passwordHash);
    console.log("CounselorSecure2026! match:", check1);
    console.log("SoftLab@2026! match:", check2);
  }
}
main().finally(() => db.$disconnect());
