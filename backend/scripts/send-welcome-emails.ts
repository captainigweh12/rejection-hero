/**
 * Script to send welcome emails to all existing users
 * Run with: bun run scripts/send-welcome-emails.ts
 */

import { db } from "../src/db";
import { syncNewUserToGoHighLevel } from "../src/services/gohighlevel";

async function sendWelcomeEmailsToExistingUsers() {
  console.log("🚀 Starting welcome email campaign for existing users...\n");

  try {
    // Get all users with their profiles
    const users = await db.user.findMany({
      include: {
        Profile: true,
      },
    });

    console.log(`📊 Found ${users.length} users in the database\n`);

    let successCount = 0;
    let errorCount = 0;

    // Send welcome email to each user
    for (const user of users) {
      try {
        const profile = user.Profile?.[0]; // Profile is an array relation
        const displayName = profile?.displayName || user.name || "User";
        const username = profile?.username || undefined;

        console.log(`📧 Processing user: ${displayName} (${user.email})`);

        // Sync user and send welcome email
        const result = await syncNewUserToGoHighLevel(
          user.email,
          displayName,
          user.id,
          username
        );

        if (result.success) {
          console.log(`   ✅ Welcome email sent successfully`);
          successCount++;
        } else {
          console.log(`   ⚠️  Failed to send email:`, result.error);
          errorCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ Error processing user:`, error);
        errorCount++;
      }

      console.log(""); // Empty line for readability
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Summary:");
    console.log(`   Total Users: ${users.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (successCount > 0) {
      console.log("🎉 Welcome emails sent successfully!");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.$disconnect();
  }
}

// Run the script
sendWelcomeEmailsToExistingUsers()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
