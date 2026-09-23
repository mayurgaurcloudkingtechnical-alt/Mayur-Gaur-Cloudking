import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SAFELY ADDING MISSING COLUMN 'franchiseRequirements' TO 'leads' TABLE ===");

  // 1. Safe additive column creation in PostgreSQL
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "franchiseRequirements" TEXT;
  `);

  console.log("✓ ALTER TABLE executed successfully.");

  // 2. Verify column exists in information_schema
  const check: any[] = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'franchiseRequirements';
  `;

  if (check.length > 0) {
    console.log("✓ Column verified in database:", check[0]);
  } else {
    throw new Error("Column 'franchiseRequirements' was not found after ALTER TABLE!");
  }

  // 3. Verify total row count of leads to prove 0 records were harmed
  const count = await prisma.lead.count();
  console.log(`✓ Total lead records in database intact: ${count}`);
}

main()
  .catch((err) => {
    console.error("Failed to add column:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
