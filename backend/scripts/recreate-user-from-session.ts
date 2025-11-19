import { db } from "../src/db";

/**
 * Recreate missing user from session data
 * This fixes the issue where the user session exists but the user record is missing
 */
async function recreateUser() {
  console.log("🔧 Recreating missing user from session...");

  const userId = "0CpNEWD3oxiJzmebIkPrQPniUXGiX2OC";
  const email = "captainigweh12@gmail.com";

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      console.log(`✅ User already exists: ${existingUser.email}`);
      return;
    }

    // Create the user
    const user = await db.user.create({
      data: {
        id: userId,
        email: email,
        name: email.split("@")[0],
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Successfully recreated user: ${user.email} (${user.id})`);

    // Verify the user was created
    const verifyUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (verifyUser) {
      console.log(`✅ Verification successful! User exists in database.`);
    } else {
      console.error(`❌ Verification failed! User not found after creation.`);
    }
  } catch (error: any) {
    console.error("❌ Error recreating user:", error.message);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

recreateUser().catch(console.error);
