import { db } from "../src/db";

/**
 * Repair script to recreate missing user records from existing accounts
 * This fixes the issue where prisma db push --accept-data-loss deleted user data
 */
async function repairUsers() {
  console.log("🔧 Starting user repair...");

  try {
    // Find all accounts
    const accounts = await db.account.findMany();

    console.log(`📊 Found ${accounts.length} accounts`);

    for (const account of accounts) {
      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id: account.userId },
      });

      if (!existingUser) {
        console.log(`❌ User missing for account: ${account.userId}`);

        // Recreate the user
        const email = account.accountId; // In Better Auth, accountId is the email for email/password

        try {
          const user = await db.user.create({
            data: {
              id: account.userId,
              email: email,
              name: email.split("@")[0],
              emailVerified: true,
              createdAt: account.createdAt,
              updatedAt: new Date(),
            },
          });

          console.log(`✅ Recreated user: ${user.email} (${user.id})`);
        } catch (error: any) {
          console.error(`❌ Failed to create user ${account.userId}:`, error.message);
        }
      } else {
        console.log(`✅ User exists: ${existingUser.email} (${existingUser.id})`);
      }
    }

    console.log("✅ User repair completed!");
  } catch (error) {
    console.error("❌ Error during repair:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

repairUsers().catch(console.error);
