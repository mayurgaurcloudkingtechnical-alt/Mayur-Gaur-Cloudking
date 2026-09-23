import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== COMPARING PRISMA CLIENT DMMF VS LIVE POSTGRESQL DATABASE ===");

  const dmmf = Prisma.dmmf;

  // Query all existing tables and columns in PostgreSQL
  const dbColumns: { table_name: string; column_name: string; data_type: string; is_nullable: string }[] = 
    await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

  const dbTablesMap = new Map<string, Set<string>>();
  for (const col of dbColumns) {
    if (!dbTablesMap.has(col.table_name)) {
      dbTablesMap.set(col.table_name, new Set());
    }
    dbTablesMap.get(col.table_name)!.add(col.column_name);
  }

  console.log(`Total tables found in public schema of database: ${dbTablesMap.size}`);

  const missingColumnsInDb: { model: string; table: string; field: string; type: string }[] = [];
  const missingTablesInDb: { model: string; table: string }[] = [];

  for (const model of dmmf.datamodel.models) {
    const tableName = model.dbName || model.name;
    const matchedTable = dbTablesMap.has(tableName) 
      ? tableName 
      : Array.from(dbTablesMap.keys()).find(t => t.toLowerCase() === tableName.toLowerCase());

    if (!matchedTable) {
      missingTablesInDb.push({ model: model.name, table: tableName });
      continue;
    }

    const tableCols = dbTablesMap.get(matchedTable)!;

    for (const field of model.fields) {
      if (field.kind === "scalar" || field.kind === "enum") {
        const colName = field.dbName || field.name;
        if (!tableCols.has(colName)) {
          missingColumnsInDb.push({
            model: model.name,
            table: matchedTable,
            field: colName,
            type: field.type,
          });
        }
      }
    }
  }

  console.log("\n--- RESULT: MISSING TABLES IN DATABASE ---");
  if (missingTablesInDb.length === 0) {
    console.log("No missing tables! All Prisma models have corresponding database tables.");
  } else {
    missingTablesInDb.forEach((t) => console.log(`[MISSING TABLE] Model: ${t.model} -> Table: ${t.table}`));
  }

  console.log("\n--- RESULT: MISSING COLUMNS IN DATABASE ---");
  if (missingColumnsInDb.length === 0) {
    console.log("No missing columns! All Prisma scalar fields exist in the database.");
  } else {
    missingColumnsInDb.forEach((c) => 
      console.log(`[MISSING COLUMN] Table '${c.table}' (Model '${c.model}') lacks column '${c.field}' (${c.type})`)
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
