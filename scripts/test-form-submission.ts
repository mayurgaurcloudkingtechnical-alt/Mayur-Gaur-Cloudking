import { db } from "../src/server/db/client";

async function test() {
  console.log("Testing db.lead.findFirst()...");
  try {
    const lead = await db.lead.findFirst({
      where: { phone: "9999999999" },
    });
    console.log("findFirst succeeded, result:", lead);
  } catch (err: any) {
    console.error("findFirst failed with error:", err.message);
  }
}

test()
  .catch(console.error)
  .finally(() => db.$disconnect());
