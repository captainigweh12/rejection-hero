/**
 * Script to send welcome emails to existing GoHighLevel contacts
 */

import { sendEmail, getWelcomeEmailHTML } from "../src/services/gohighlevel";

async function sendWelcomeEmailsToExistingContacts() {
  console.log("🚀 Sending welcome emails to existing GoHighLevel contacts...\n");

  // These are the contact IDs we already created
  const existingContacts = [
    {
      contactId: "WUQkvpA4cSjY2cy0DmM2",
      firstName: "Emmanuel",
      email: "captainigweh12@gmail.com",
    },
    {
      contactId: "0a7iDFoBWc3bhKTWA5UI",
      firstName: "Emmanuel",
      email: "rizn.management@gmail.com",
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const contact of existingContacts) {
    try {
      console.log(`📧 Sending welcome email to: ${contact.firstName} (${contact.email})`);
      console.log(`   Contact ID: ${contact.contactId}`);

      const emailHTML = getWelcomeEmailHTML(contact.firstName);
      await sendEmail(
        contact.contactId,
        "Welcome to Go for No! 🎯",
        emailHTML
      );

      console.log(`   ✅ Welcome email sent successfully!\n`);
      successCount++;

      // Add a small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Failed to send email:`, error, "\n");
      errorCount++;
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Summary:");
  console.log(`   Total Contacts: ${existingContacts.length}`);
  console.log(`   ✅ Emails Sent: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (successCount > 0) {
    console.log("🎉 Welcome emails sent successfully!");
  }
}

// Run the script
sendWelcomeEmailsToExistingContacts()
  .then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
