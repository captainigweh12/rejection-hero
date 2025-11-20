import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

async function verifyNeonTables() {
  console.log("🔍 Verifying Neon database tables...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Check key tables
    const tables = [
      "user",
      "user_quest",
      "user_stats",
      "account",
      "session",
      "quest",
      "profile",
    ];

    console.log("");
    console.log("📋 Checking tables...");
    let foundCount = 0;

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ ${table} table exists`);
        foundCount++;
      } catch (error: any) {
        if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
          console.log(`   ❌ ${table} table does not exist`);
        } else {
          console.log(`   ⚠️  ${table} table check failed: ${error.message?.substring(0, 60)}`);
        }
      }
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Summary: ${foundCount}/${tables.length} tables found`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (foundCount === tables.length) {
      console.log("✅ All critical tables exist!");
      console.log("✅ Neon database is fully set up!");
      process.exit(0);
    } else {
      console.log("⚠️  Some tables are missing. Schema may need to be synced.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message?.substring(0, 200) || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeonTables().catch(console.error);

