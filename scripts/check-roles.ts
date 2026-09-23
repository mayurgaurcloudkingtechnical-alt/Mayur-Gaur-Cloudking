import { db } from "../src/server/db/client";

async function main() {
  const roles = await db.role.findMany();
  console.log("ROLES AND PERMISSIONS IN DB:");
  roles.forEach((r) => {
    console.log(`[${r.code}] ${r.name}: ${JSON.stringify(r.permissions)}`);
  });
}

main().finally(() => db.$disconnect());
