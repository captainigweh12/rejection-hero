#!/usr/bin/env bun
/**
 * Verify Sign-Up Data Script
 * 
 * This script checks if user data is being properly saved to Neon
 * after sign-up. It verifies:
 * - User record exists
 * - Account record exists (Better Auth)
 * - Session record exists (if user is logged in)
 * - Profile record exists (auto-created on first profile fetch)
 * - user_stats record exists (auto-created on first stats fetch)
 */

import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function verifySignupData(userEmail?: string) {
  console.log("🔍 Verifying sign-up data in Neon database...\n");

  try {
    if (userEmail) {
      // Verify specific user
      console.log(`📧 Verifying user: ${userEmail}\n`);
      
      const user = await db.user.findUnique({
        where: { email: userEmail },
        include: {
          account: true,
          session: true,
          profile: true,
          user_stats: true,
        },
      });

      if (!user) {
        console.log(`❌ User not found: ${userEmail}`);
        console.log("\n⚠️  This means the user was not created in the database.");
        console.log("   Possible causes:");
        console.log("   1. Sign-up failed before user creation");
        console.log("   2. Database connection issue during sign-up");
        console.log("   3. Better Auth configuration issue");
        return;
      }

      console.log(`✅ User found: ${user.email} (${user.id})`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Name: ${user.name || "Not set"}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log("");

      // Check account (Better Auth)
      if (user.account && user.account.length > 0) {
        console.log(`✅ Account records: ${user.account.length}`);
        user.account.forEach((acc) => {
          console.log(`   - Provider: ${acc.providerId} (Account ID: ${acc.accountId})`);
          console.log(`     Created: ${acc.createdAt}`);
        });
      } else {
        console.log(`⚠️  No account records found`);
        console.log("   This is required for Better Auth authentication!");
      }
      console.log("");

      // Check sessions
      if (user.session && user.session.length > 0) {
        console.log(`✅ Active sessions: ${user.session.length}`);
        user.session.forEach((sess) => {
          console.log(`   - Token: ${sess.token.substring(0, 20)}...`);
          console.log(`     Expires: ${sess.expiresAt}`);
          console.log(`     Created: ${sess.createdAt}`);
        });
      } else {
        console.log(`⚠️  No active sessions found`);
        console.log("   User may not be logged in currently");
      }
      console.log("");

      // Check profile
      if (user.profile) {
        console.log(`✅ Profile exists`);
        console.log(`   Display Name: ${user.profile.displayName}`);
        console.log(`   Username: ${user.profile.username || "Not set"}`);
        console.log(`   Onboarding Completed: ${user.profile.onboardingCompleted}`);
        console.log(`   Created: ${user.profile.createdAt}`);
      } else {
        console.log(`⚠️  No profile found`);
        console.log("   Profile should be auto-created on first /api/profile fetch");
        console.log("   Try accessing the profile endpoint to trigger auto-creation");
      }
      console.log("");

      // Check user_stats
      if (user.user_stats) {
        console.log(`✅ User stats exist`);
        console.log(`   Total XP: ${user.user_stats.totalXP}`);
        console.log(`   Total Points: ${user.user_stats.totalPoints}`);
        console.log(`   Current Streak: ${user.user_stats.currentStreak}`);
        console.log(`   Created: ${user.user_stats.createdAt}`);
      } else {
        console.log(`⚠️  No user_stats found`);
        console.log("   Stats should be auto-created on first /api/stats fetch");
        console.log("   Try accessing the stats endpoint to trigger auto-creation");
      }

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📊 Summary:");
      
      const issues: string[] = [];
      if (!user.account || user.account.length === 0) {
        issues.push("Missing account record (Better Auth)");
      }
      if (!user.profile) {
        issues.push("Missing profile (will be auto-created)");
      }
      if (!user.user_stats) {
        issues.push("Missing user_stats (will be auto-created)");
      }

      if (issues.length === 0) {
        console.log("✅ All required data exists!");
      } else {
        console.log("⚠️  Issues found:");
        issues.forEach((issue) => console.log(`   - ${issue}`));
      }

    } else {
      // List all users
      console.log("📊 Listing all users in database...\n");
      
      const users = await db.user.findMany({
        include: {
          account: true,
          session: true,
          profile: true,
          user_stats: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Show last 10 users
      });

      console.log(`Found ${users.length} users (showing last 10)\n`);

      for (const user of users) {
        console.log(`📧 ${user.email} (${user.id})`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Account: ${user.account.length > 0 ? "✅" : "❌"}`);
        console.log(`   Profile: ${user.profile ? "✅" : "⚠️ "}`);
        console.log(`   Stats: ${user.user_stats ? "✅" : "⚠️ "}`);
        console.log(`   Sessions: ${user.session.length}`);
        console.log("");
      }

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💡 To verify a specific user, run:");
      console.log('   bun run verify-signup-data.ts "user@example.com"');
    }

  } catch (error: any) {
    console.error("❌ Error verifying sign-up data:", error);
    
    if (error?.code === "P2021") {
      console.error("\n❌ Table does not exist in database!");
      console.error("   Run: bun run db:push");
    } else if (error?.code === "P1001") {
      console.error("\n❌ Cannot reach database server!");
      console.error("   Check DATABASE_URL in Railway environment variables");
    } else {
      console.error("\n❌ Unexpected error:", error.message);
    }
    
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

verifySignupData(userEmail).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

