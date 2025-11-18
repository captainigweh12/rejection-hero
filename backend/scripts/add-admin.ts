import { db } from "../src/db";

async function addAdmin() {
  const adminEmail = "captainigweh12@gmail.com";

  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (user) {
      // Update existing user to admin
      await db.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
      });
      console.log(`✅ User ${adminEmail} is now an admin`);
    } else {
      console.log(`⚠️  User ${adminEmail} not found. They will become admin when they sign up.`);
      console.log("   To make them admin on signup, update the user creation logic in auth.ts");
    }
  } catch (error) {
    console.error("❌ Error adding admin:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

addAdmin();

