import { db } from "../src/db";

async function runMigration() {
  try {
    console.log("🔄 Running database migration...");

    // Add isAdmin column to user table
    try {
      await db.$executeRaw`ALTER TABLE "user" ADD COLUMN "isAdmin" INTEGER DEFAULT 0`;
      console.log("✅ Added isAdmin column to user table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  isAdmin column already exists");
      } else {
        throw error;
      }
    }

    // Add challengeDuration, questMode, notificationPreferences to profile table
    try {
      await db.$executeRaw`ALTER TABLE "profile" ADD COLUMN "challengeDuration" INTEGER`;
      console.log("✅ Added challengeDuration column to profile table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  challengeDuration column already exists");
      } else {
        throw error;
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "profile" ADD COLUMN "questMode" TEXT DEFAULT 'QUEST_BY_QUEST'`;
      console.log("✅ Added questMode column to profile table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  questMode column already exists");
      } else {
        throw error;
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "profile" ADD COLUMN "notificationPreferences" TEXT`;
      console.log("✅ Added notificationPreferences column to profile table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  notificationPreferences column already exists");
      } else {
        throw error;
      }
    }

    // Add dailyConfidenceMeter and lastConfidenceDecayAt to user_stats table
    try {
      await db.$executeRaw`ALTER TABLE "user_stats" ADD COLUMN "dailyConfidenceMeter" REAL DEFAULT 0`;
      console.log("✅ Added dailyConfidenceMeter column to user_stats table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  dailyConfidenceMeter column already exists");
      } else {
        throw error;
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "user_stats" ADD COLUMN "lastConfidenceDecayAt" DATETIME`;
      // Update existing rows with current timestamp
      await db.$executeRaw`UPDATE "user_stats" SET "lastConfidenceDecayAt" = datetime('now') WHERE "lastConfidenceDecayAt" IS NULL`;
      console.log("✅ Added lastConfidenceDecayAt column to user_stats table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  lastConfidenceDecayAt column already exists");
      } else {
        throw error;
      }
    }

    // Add seriesId, seriesIndex, isSeriesQuest to user_quest table
    try {
      await db.$executeRaw`ALTER TABLE "user_quest" ADD COLUMN "seriesId" TEXT`;
      console.log("✅ Added seriesId column to user_quest table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  seriesId column already exists");
      } else {
        throw error;
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "user_quest" ADD COLUMN "seriesIndex" INTEGER`;
      console.log("✅ Added seriesIndex column to user_quest table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  seriesIndex column already exists");
      } else {
        throw error;
      }
    }

    try {
      await db.$executeRaw`ALTER TABLE "user_quest" ADD COLUMN "isSeriesQuest" INTEGER DEFAULT 0`;
      console.log("✅ Added isSeriesQuest column to user_quest table");
    } catch (error: any) {
      if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
        console.log("ℹ️  seriesId column already exists");
      } else {
        throw error;
      }
    }

    // Add captainigweh12@gmail.com as admin
    const adminEmail = "captainigweh12@gmail.com";
    const user = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (user) {
      await db.user.update({
        where: { email: adminEmail },
        data: { isAdmin: true },
      });
      console.log(`✅ User ${adminEmail} is now an admin`);
    } else {
      console.log(`⚠️  User ${adminEmail} not found. They will become admin when they sign up.`);
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runMigration();

