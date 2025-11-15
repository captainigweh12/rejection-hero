/**
 * GoHighLevel Integration Service
 * Handles syncing user data to GoHighLevel CRM and sending emails
 */

const GOHIGHLEVEL_API_KEY = process.env.GOHIGHLEVEL_API_KEY || "pit-ca134c24-5db3-47a0-9ea7-7292fdf2e7e6";
const GOHIGHLEVEL_BASE_URL = "https://rest.gohighlevel.com/v1";

interface GoHighLevelContact {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
}

/**
 * Create or update a contact in GoHighLevel
 */
export async function createOrUpdateContact(contact: GoHighLevelContact) {
  try {
    console.log("📧 [GoHighLevel] Creating/updating contact:", contact.email);

    const response = await fetch(`${GOHIGHLEVEL_BASE_URL}/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ [GoHighLevel] API Error:", error);
      throw new Error(`GoHighLevel API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [GoHighLevel] Contact created/updated successfully");
    return data;
  } catch (error) {
    console.error("❌ [GoHighLevel] Error creating/updating contact:", error);
    throw error;
  }
}

/**
 * Send email via GoHighLevel
 */
export async function sendEmail(
  contactId: string,
  subject: string,
  htmlBody: string
) {
  try {
    console.log("📧 [GoHighLevel] Sending email to contact:", contactId);

    const response = await fetch(`${GOHIGHLEVEL_BASE_URL}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "Email",
        contactId: contactId,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ [GoHighLevel] Email API Error:", error);
      throw new Error(`GoHighLevel Email API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [GoHighLevel] Email sent successfully");
    return data;
  } catch (error) {
    console.error("❌ [GoHighLevel] Error sending email:", error);
    throw error;
  }
}

/**
 * Generate welcome email HTML
 */
export function getWelcomeEmailHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #7E3FE4 0%, #FF6B35 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          margin-bottom: 30px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7E3FE4 0%, #FF6B35 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Go for No! 🎯</h1>
      </div>
      <div class="content">
        <p>Hey ${userName}!</p>

        <p>Welcome to the <strong>Go for No</strong> community! We're excited to have you join us on this journey to overcome fear of rejection and build unshakeable confidence.</p>

        <p>Here's what you can do right now:</p>
        <ul>
          <li>🎯 <strong>Start Your First Quest</strong> - Create AI-powered rejection challenges</li>
          <li>🔥 <strong>Build Your Streak</strong> - Complete daily quests to level up</li>
          <li>👥 <strong>Join the Community</strong> - Connect with fellow warriors</li>
          <li>📹 <strong>Go Live</strong> - Stream your challenges and inspire others</li>
        </ul>

        <p style="text-align: center;">
          <a href="vibecode://home" class="button">Open the App</a>
        </p>

        <p><strong>Remember:</strong> Every NO you get is a step closer to your goals. The only way to fail is to stop trying!</p>

        <p>Let's go get some NOs! 💪</p>

        <p>
          Best regards,<br>
          The Go for No Team
        </p>
      </div>
      <div class="footer">
        <p>You're receiving this email because you signed up for Go for No.</p>
        <p>© ${new Date().getFullYear()} Go for No. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sync user to GoHighLevel and send welcome email
 * Called automatically when a new user signs up
 */
export async function syncNewUserToGoHighLevel(
  email: string,
  name: string,
  userId: string,
  username?: string
) {
  try {
    console.log("🎉 [GoHighLevel] Syncing new user:", email);

    // Extract name parts
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create contact in GoHighLevel
    const contact: GoHighLevelContact = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      tags: ["Go for No User", "New User", "App User"],
      customFields: {
        username: username || "",
        userId: userId,
        signupDate: new Date().toISOString(),
      },
    };

    const ghlContact = await createOrUpdateContact(contact);
    const contactId = ghlContact.contact?.id;

    if (!contactId) {
      console.error("❌ [GoHighLevel] Failed to get contact ID");
      return { success: false };
    }

    // Send welcome email
    const emailHTML = getWelcomeEmailHTML(firstName);
    await sendEmail(
      contactId,
      "Welcome to Go for No! 🎯",
      emailHTML
    );

    console.log("✅ [GoHighLevel] User synced and welcome email sent!");
    return { success: true, contactId };
  } catch (error) {
    console.error("❌ [GoHighLevel] Error syncing new user:", error);
    // Don't throw - we don't want to block user signup if GoHighLevel fails
    return { success: false, error };
  }
}

/**
 * Update user stats in GoHighLevel
 * Call this when user achieves milestones or completes quests
 */
export async function updateUserStatsInGoHighLevel(
  email: string,
  name: string,
  stats: {
    totalXP: number;
    currentStreak: number;
    totalPoints: number;
    level: number;
  }
) {
  try {
    console.log("📊 [GoHighLevel] Updating user stats:", email);

    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const contact: GoHighLevelContact = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      tags: ["Go for No User", "Active User"],
      customFields: {
        totalXP: stats.totalXP.toString(),
        currentStreak: stats.currentStreak.toString(),
        totalPoints: stats.totalPoints.toString(),
        level: stats.level.toString(),
        lastUpdated: new Date().toISOString(),
      },
    };

    await createOrUpdateContact(contact);
    console.log("✅ [GoHighLevel] User stats updated!");
    return { success: true };
  } catch (error) {
    console.error("❌ [GoHighLevel] Error updating user stats:", error);
    return { success: false, error };
  }
}
