import { db } from "../src/db";

/**
 * Verify the user and related data exists
 */
async function verifyUser() {
  console.log("🔍 Verifying user and related data...");

  const userId = "0CpNEWD3oxiJzmebIkPrQPniUXGiX2OC";

  try {
    // Check user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        Profile: true,
        UserStats: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);
    console.log(`   - Profile: ${user.Profile ? "✅ Exists" : "❌ Missing"}`);
    console.log(`   - UserStats: ${user.UserStats ? "✅ Exists" : "❌ Missing"}`);

    // Check sessions
    const sessions = await db.session.findMany({
      where: { userId: userId },
    });

    console.log(`   - Sessions: ${sessions.length} found`);

    // Check accounts
    const accounts = await db.account.findMany({
      where: { userId: userId },
    });

    console.log(`   - Accounts: ${accounts.length} found`);

    console.log("\n✅ Verification complete!");
  } catch (error: any) {
    console.error("❌ Error during verification:", error.message);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

verifyUser().catch(console.error);
