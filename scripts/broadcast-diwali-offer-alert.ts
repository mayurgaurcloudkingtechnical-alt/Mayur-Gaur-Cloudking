import { db } from "../src/server/db/client";
import { DiwaliCampaignBroadcastService } from "../src/server/services/diwali-campaign-broadcast.service";

async function main() {
  console.log("=================================================================");
  console.log("🪔 SOFTLAB GLOBAL — DIWALI DHAMAKA 2026 BROADCAST ALERT DISPATCH");
  console.log("=================================================================");

  const result = await DiwaliCampaignBroadcastService.broadcastToAllUsers();

  console.log("Broadcast Result:", JSON.stringify(result, null, 2));

  // Query sample notifications to verify database persistence
  const recentNotifications = await db.notification.findMany({
    where: {
      title: {
        contains: "DIWALI DHAMAKA 2026",
      },
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          roleCode: true,
        },
      },
    },
  });

  console.log(`\nVerified ${recentNotifications.length} recent Diwali notifications in database:`);
  recentNotifications.forEach((n, idx) => {
    console.log(`  ${idx + 1}. [${n.user.roleCode}] ${n.user.email} -> "${n.title}" (Priority: ${n.priority})`);
  });

  console.log("\n✅ DIWALI OFFER 2026 NOTIFICATION BROADCAST COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Broadcast failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
