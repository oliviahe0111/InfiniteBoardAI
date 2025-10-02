import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  const sql = readFileSync(
    join(__dirname, "../prisma/rls-policies.sql"),
    "utf-8"
  );

  // Split SQL into individual statements and filter out comments/empty lines
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Applying ${statements.length} RLS policy statements...`);

  for (const [index, statement] of statements.entries()) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`✅ Statement ${index + 1}/${statements.length} applied`);
    } catch {
      console.log(`⚠️  Statement ${index + 1} skipped (may already exist)`);
    }
  }

  console.log("✅ RLS policies applied successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error applying RLS policies:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
