import { db } from "../src/db";

async function verifyMigration() {
  try {
    console.log("🔍 Verifying database migration...\n");

    // Check admin user
    const adminUser = await db.user.findUnique({
      where: { email: "captainigweh12@gmail.com" },
      select: { email: true, isAdmin: true },
    });

    if (adminUser) {
      console.log(`✅ Admin user found: ${adminUser.email}`);
      console.log(`   isAdmin: ${adminUser.isAdmin ? "✅ Yes" : "❌ No"}`);
    } else {
      console.log("⚠️  Admin user not found (they will become admin on signup)");
    }

    // Check schema columns
    console.log("\n📊 Checking schema columns...");
    
    // Try to query new columns to verify they exist
    try {
      const testProfile = await db.profile.findFirst({
        select: {
          challengeDuration: true,
          questMode: true,
          notificationPreferences: true,
        },
      });
      console.log("✅ Profile columns: challengeDuration, questMode, notificationPreferences");
    } catch (error) {
      console.log("❌ Profile columns check failed:", error);
    }

    try {
      const testStats = await db.userStats.findFirst({
        select: {
          dailyConfidenceMeter: true,
          lastConfidenceDecayAt: true,
        },
      });
      console.log("✅ UserStats columns: dailyConfidenceMeter, lastConfidenceDecayAt");
    } catch (error) {
      console.log("❌ UserStats columns check failed:", error);
    }

    try {
      const testUserQuest = await db.userQuest.findFirst({
        select: {
          seriesId: true,
          seriesIndex: true,
          isSeriesQuest: true,
        },
      });
      console.log("✅ UserQuest columns: seriesId, seriesIndex, isSeriesQuest");
    } catch (error) {
      console.log("❌ UserQuest columns check failed:", error);
    }

    console.log("\n✅ Migration verification complete!");
  } catch (error) {
    console.error("❌ Verification error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

verifyMigration();

