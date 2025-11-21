#!/usr/bin/env bun
/**
 * Verify Better Auth tables exist in Neon database
 * 
 * This script checks if all required Better Auth tables exist:
 * - user
 * - session
 * - account
 * - verification
 */

import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function verifyBetterAuthTables() {
  console.log("🔍 Verifying Better Auth tables in Neon database...\n");

  const requiredTables = ["user", "session", "account", "verification"];
  const missingTables: string[] = [];
  const existingTables: string[] = [];

  for (const tableName of requiredTables) {
    try {
      // Try to query the table to verify it exists
      const result = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`
      );
      
      existingTables.push(tableName);
      console.log(`✅ Table "${tableName}" exists`);
      
      // Get row count
      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM ${tableName}`
      ) as Array<{ count: bigint }>;
      const count = Number(countResult[0]?.count || 0);
      console.log(`   └─ Row count: ${count}`);
    } catch (error: any) {
      // Check if error is "table does not exist"
      if (
        error?.code === "P2021" ||
        error?.message?.includes("does not exist") ||
        error?.message?.includes("relation") ||
        error?.message?.includes("table")
      ) {
        missingTables.push(tableName);
        console.log(`❌ Table "${tableName}" does not exist`);
      } else {
        console.error(`⚠️  Error checking table "${tableName}":`, error?.message || error);
      }
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (missingTables.length === 0) {
    console.log("✅ All Better Auth tables exist!");
    console.log("\n📋 Summary:");
    console.log(`   - Existing tables: ${existingTables.length}`);
    console.log(`   - Missing tables: ${missingTables.length}`);
    console.log("\n✅ Better Auth is properly set up in Neon!");
  } else {
    console.log("❌ Missing Better Auth tables!");
    console.log("\n📋 Summary:");
    console.log(`   - Existing tables: ${existingTables.length}`);
    console.log(`   - Missing tables: ${missingTables.length}`);
    console.log(`   - Missing: ${missingTables.join(", ")}`);
    console.log("\n⚠️  ACTION REQUIRED:");
    console.log("   1. Run: bun run db:push");
    console.log("   2. Or: bun run db:migrate");
    console.log("   3. This will create the missing tables in Neon");
    process.exit(1);
  }

  // Verify schema structure
  console.log("\n🔍 Verifying table structure...");
  
  try {
    // Check user table structure
    const userColumns = await db.$queryRawUnsafe(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'user'
       ORDER BY ordinal_position`
    ) as Array<{ column_name: string; data_type: string }>;
    
    const requiredUserColumns = ["id", "email", "name", "emailVerified", "createdAt"];
    const userColumnNames = userColumns.map((c) => c.column_name);
    const missingUserColumns = requiredUserColumns.filter(
      (col) => !userColumnNames.includes(col)
    );
    
    if (missingUserColumns.length === 0) {
      console.log("✅ User table structure is correct");
    } else {
      console.log(`⚠️  User table missing columns: ${missingUserColumns.join(", ")}`);
    }
  } catch (error: any) {
    console.error("⚠️  Error verifying user table structure:", error?.message);
  }

  await db.$disconnect();
}

verifyBetterAuthTables().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

