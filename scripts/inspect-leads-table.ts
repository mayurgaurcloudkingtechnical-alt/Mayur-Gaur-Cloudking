import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const columns: any[] = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'leads'
    ORDER BY ordinal_position;
  `;

  console.log("COLUMNS IN 'leads' TABLE:");
  columns.forEach((c) => {
    console.log(`- ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
