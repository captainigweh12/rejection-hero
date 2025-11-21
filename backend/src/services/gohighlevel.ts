/**
 * GoHighLevel Integration Service
 * Handles syncing user data to GoHighLevel CRM and sending emails
 */

const GOHIGHLEVEL_API_KEY = process.env.GOHIGHLEVEL_API_KEY || "pit-ca134c24-5db3-47a0-9ea7-7292fdf2e7e6";
const GOHIGHLEVEL_LOCATION_ID = process.env.GOHIGHLEVEL_LOCATION_ID || "";
const GOHIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const GOHIGHLEVEL_API_VERSION = "2021-07-28";

interface GoHighLevelContact {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Array<{ key: string; field_value: string }>;
  locationId?: string;
}

/**
 * Create or update a contact in GoHighLevel
 */
export async function createOrUpdateContact(contact: GoHighLevelContact) {
  try {
    console.log("📧 [GoHighLevel] Creating/updating contact:", contact.email);
    console.log("📍 [GoHighLevel] Location ID:", GOHIGHLEVEL_LOCATION_ID || "NOT SET");

    // Add location ID to contact
    const contactWithLocation = {
      ...contact,
      locationId: GOHIGHLEVEL_LOCATION_ID,
    };

    const response = await fetch(`${GOHIGHLEVEL_BASE_URL}/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": GOHIGHLEVEL_API_VERSION,
      },
      body: JSON.stringify(contactWithLocation),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [GoHighLevel] API Error:", errorText);

      // Handle duplicate contact error - extract existing contact ID
      if (response.status === 400 && (errorText.includes("duplicated contacts") || errorText.includes("does not allow duplicated contacts"))) {
        try {
          const errorData = JSON.parse(errorText);
          const existingContactId = errorData.meta?.contactId;

          if (existingContactId) {
            console.log("ℹ️ [GoHighLevel] Contact already exists, using existing ID:", existingContactId);
            return {
              success: true,
              contact: { id: existingContactId },
              id: existingContactId,
              isDuplicate: true
            };
          }
        } catch (parseError) {
          console.error("❌ [GoHighLevel] Failed to parse duplicate contact error");
        }
      }

      return {
        success: false,
        error: `GoHighLevel API failed: ${response.status} - ${errorText}`,
        id: null
      };
    }

    const data = await response.json();
    console.log("✅ [GoHighLevel] Contact created/updated successfully");
    console.log("📋 [GoHighLevel] Contact data:", JSON.stringify(data, null, 2));

    // Extract contact ID from response
    const contactId = data.contact?.id || data.id || null;

    return {
      success: true,
      contact: data.contact || { id: contactId },
      id: contactId,
      data
    };
  } catch (error) {
    console.error("❌ [GoHighLevel] Error creating/updating contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      id: null
    };
  }
}

/**
 * Send email via GoHighLevel
 */
export async function sendEmail(
  contactId: string,
  subject: string,
  htmlBody: string,
  fromEmail?: string
) {
  try {
    console.log("📧 [GoHighLevel] Sending email to contact:", contactId);

    const response = await fetch(`${GOHIGHLEVEL_BASE_URL}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": GOHIGHLEVEL_API_VERSION,
      },
      body: JSON.stringify({
        type: "Email",
        contactId: contactId,
        subject: subject,
        html: htmlBody,
        emailFrom: fromEmail || "noreply@goforno.com",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ [GoHighLevel] Email API Error:", error);
      return {
        success: false,
        error: `GoHighLevel Email API failed: ${response.status} - ${error}`
      };
    }

    const data = await response.json();
    console.log("✅ [GoHighLevel] Email sent successfully");
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("❌ [GoHighLevel] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generate welcome email HTML with Rejection Hero branding
 */
export function getWelcomeEmailHTML(userName: string): string {
  const backendUrl = process.env.BACKEND_URL || "https://api.rejectionhero.com";

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
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          margin: 20px auto;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          max-width: 150px;
          height: auto;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .tagline {
          font-size: 18px;
          margin-top: 10px;
          font-style: italic;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .content p {
          margin: 16px 0;
          font-size: 16px;
          color: #333;
        }
        .content ul {
          margin: 20px 0;
          padding-left: 20px;
        }
        .content li {
          margin: 12px 0;
          font-size: 15px;
          color: #555;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
          color: white !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: scale(1.05);
        }
        .highlight {
          background-color: #FFF3E0;
          padding: 20px;
          border-left: 4px solid #FF6B35;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 30px;
          background-color: #f9f9f9;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          margin: 8px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          color: #FF6B35;
          text-decoration: none;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${backendUrl}/uploads/rejection-hero-logo.png" alt="Rejection Hero" class="logo">
          <h1>Welcome to Rejection Hero!</h1>
          <p class="tagline">Embrace Your NO's 🎯</p>
        </div>

        <div class="content">
          <p><strong>Hey ${userName}!</strong></p>

          <p>Welcome to the <strong>Rejection Hero</strong> community! We're thrilled to have you join us on this transformative journey to turn rejection into your superpower.</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>🎯 Your Mission:</strong> Transform every "NO" into fuel for growth, confidence, and unstoppable success!</p>
          </div>

          <p><strong>Here's how to get started:</strong></p>
          <ul>
            <li>🎯 <strong>Start Your First Quest</strong> - Create AI-powered rejection challenges tailored to your goals</li>
            <li>🔥 <strong>Build Your Streak</strong> - Complete daily quests and watch your confidence soar</li>
            <li>👥 <strong>Join the Community</strong> - Connect with fellow Rejection Heroes</li>
            <li>📹 <strong>Go Live</strong> - Stream your challenges and inspire others</li>
            <li>💪 <strong>Level Up</strong> - Earn XP, unlock achievements, and climb the leaderboard</li>
          </ul>

          <div class="button-container">
            <a href="com.vibecode.goforno://home" class="button">🚀 Open the App</a>
          </div>

          <p><strong>Remember:</strong> Every NO brings you one step closer to your YES. The only way to fail is to stop trying!</p>

          <p>Let's turn rejection into your greatest advantage! 💪</p>

          <p>
            To your success,<br>
            <strong>The Rejection Hero Team</strong>
          </p>
        </div>

        <div class="footer">
          <p><strong>Rejection Hero</strong> - Embrace Your NO's</p>
          <p>You're receiving this email because you signed up for Rejection Hero.</p>
          <p>© ${new Date().getFullYear()} Rejection Hero. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get invite email HTML template
 */
export function getInviteEmailHTML(inviteeName: string, inviterName: string): string {
  const backendUrl = process.env.BACKEND_URL || "https://api.rejectionhero.com";
  const appUrl = `${backendUrl}/invite`; // Web URL that redirects to app

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
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          margin: 20px auto;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #FF6B35;
          font-size: 24px;
          margin-top: 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
          color: white;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 18px;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);
        }
        .feature-box {
          background: #f8f9fa;
          border-left: 4px solid #FF6B35;
          padding: 15px 20px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="https://raw.githubusercontent.com/yourusername/rejection-hero/main/logo.png" alt="Rejection Hero Logo" class="logo">
          <h1>Rejection Hero</h1>
          <p>Embrace Your NO's</p>
        </div>

        <div class="content">
          <h2>Hey ${inviteeName}! 👋</h2>

          <p><strong>${inviterName}</strong> thinks you'd be perfect for <strong>Rejection Hero</strong> - an app that helps you turn rejection into your greatest advantage!</p>

          <p>Join ${inviterName} and thousands of others who are:</p>

          <div class="feature-box">
            <strong>🎯 Conquering Fear</strong><br>
            Face rejection head-on through gamified challenges and quests
          </div>

          <div class="feature-box">
            <strong>💪 Building Confidence</strong><br>
            Track your progress and celebrate every NO as a victory
          </div>

          <div class="feature-box">
            <strong>🏆 Achieving Goals</strong><br>
            Turn rejection into fuel for success in sales, dating, career, and life
          </div>

          <div class="feature-box">
            <strong>👥 Growing Together</strong><br>
            Connect with ${inviterName} and a community of warriors
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}" class="cta-button">Join Rejection Hero</a>
          </div>

          <p>Every successful person has faced rejection. The difference? <strong>They embraced it.</strong></p>

          <p><strong>Remember:</strong> Your biggest breakthrough could be just one NO away!</p>

          <p>
            See you in the app,<br>
            <strong>The Rejection Hero Team</strong>
          </p>
        </div>

        <div class="footer">
          <p><strong>Rejection Hero</strong> - Embrace Your NO's</p>
          <p>You received this invitation from ${inviterName}.</p>
          <p>© ${new Date().getFullYear()} Rejection Hero. All rights reserved.</p>
        </div>
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
      name: name,
      email: email,
      tags: ["Go for No User", "New User", "App User"],
      customFields: [
        { key: "username", field_value: username || "" },
        { key: "userId", field_value: userId },
        { key: "signupDate", field_value: new Date().toISOString() },
      ],
    };

    const ghlContact = await createOrUpdateContact(contact);
    const contactId = ghlContact.contact?.id || ghlContact.id;

    if (!contactId) {
      console.error("❌ [GoHighLevel] Failed to get contact ID");
      return { success: false };
    }

    // Send welcome email (optional - requires email scope)
    try {
      const emailHTML = getWelcomeEmailHTML(firstName);
      await sendEmail(
        contactId,
        "Welcome to Go for No! 🎯",
        emailHTML
      );
      console.log("✅ [GoHighLevel] User synced and welcome email sent!");
    } catch (emailError) {
      console.log("⚠️ [GoHighLevel] User synced but email sending failed (scope permission needed):", emailError);
    }

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
      name: name,
      email: email,
      tags: ["Go for No User", "Active User"],
      customFields: [
        { key: "totalXP", field_value: stats.totalXP.toString() },
        { key: "currentStreak", field_value: stats.currentStreak.toString() },
        { key: "totalPoints", field_value: stats.totalPoints.toString() },
        { key: "level", field_value: stats.level.toString() },
        { key: "lastUpdated", field_value: new Date().toISOString() },
      ],
    };

    await createOrUpdateContact(contact);
    console.log("✅ [GoHighLevel] User stats updated!");
    return { success: true };
  } catch (error) {
    console.error("❌ [GoHighLevel] Error updating user stats:", error);
    return { success: false, error };
  }
}

/**
 * Generate HTML for group invitation email
 */
export function getGroupInviteEmailHTML(
  groupName: string,
  inviterName: string,
  inviteMessage: string,
  joinLink: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${groupName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(126, 63, 228, 0.3);
      border-radius: 16px;
      padding: 40px;
      backdrop-filter: blur(10px);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    h1 {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .group-name {
      color: #7E3FE4;
      font-weight: bold;
    }
    .message-box {
      background: rgba(126, 63, 228, 0.1);
      border-left: 4px solid #7E3FE4;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .inviter {
      color: #00D9FF;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7E3FE4 0%, #5E1FA8 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 24px;
      font-weight: bold;
      font-size: 18px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(126, 63, 228, 0.4);
    }
    .button-container {
      text-align: center;
    }
    .features {
      margin: 30px 0;
    }
    .feature {
      display: flex;
      align-items: start;
      margin: 16px 0;
      gap: 12px;
    }
    .feature-icon {
      width: 24px;
      height: 24px;
      background: rgba(0, 217, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }
    p {
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-text">🎯 Rejection Hero</div>
      </div>

      <h1>You're Invited!</h1>

      <p style="text-align: center; font-size: 18px;">
        <span class="inviter">${inviterName}</span> has invited you to join
        <span class="group-name">${groupName}</span>
      </p>

      ${inviteMessage ? `
      <div class="message-box">
        <p style="margin: 0; font-style: italic;">"${inviteMessage}"</p>
      </div>
      ` : ''}

      <div class="features">
        <div class="feature">
          <div class="feature-icon">🎮</div>
          <div>
            <strong>Complete Group Quests</strong><br/>
            Take on rejection challenges together and support each other's growth
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">📹</div>
          <div>
            <strong>Group Live Streaming</strong><br/>
            Watch and encourage members as they complete quests in real-time
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">👥</div>
          <div>
            <strong>Community Support</strong><br/>
            Connect with like-minded warriors pushing past their comfort zones
          </div>
        </div>
      </div>

      <div class="button-container">
        <a href="${joinLink}" class="cta-button">Join Group</a>
      </div>

      <p style="text-align: center; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
        Don't have an account? Clicking the button above will guide you through signing up!
      </p>

      <div class="footer">
        <p>This is an automated invitation from Rejection Hero</p>
        <p>Turn rejection into your superpower 💪</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
