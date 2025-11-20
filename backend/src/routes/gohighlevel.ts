import { Hono } from "hono";
import { type AppType } from "../types";
import { db } from "../db";
import {
  syncNewUserToGoHighLevel,
  updateUserStatsInGoHighLevel,
  sendEmail,
  createOrUpdateContact,
  getWelcomeEmailHTML,
  getInviteEmailHTML,
} from "../services/gohighlevel";
import * as fs from "fs";
import * as path from "path";

const app = new Hono<AppType>();

/**
 * POST /api/gohighlevel/sync-user
 * Sync user data to GoHighLevel
 */
app.post("/sync-user", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get user profile from database
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const displayName = profile?.displayName || user.name || "User";
    const result = await syncNewUserToGoHighLevel(
      user.email,
      displayName,
      user.id,
      profile?.username || undefined
    );

    if (!result.success) {
      return c.json(
        {
          error: "Failed to sync user to GoHighLevel",
          details: result.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "User synced to GoHighLevel",
      contactId: result.contactId,
    });
  } catch (error) {
    console.error("❌ Error syncing user to GoHighLevel:", error);
    return c.json(
      {
        error: "Failed to sync user to GoHighLevel",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/gohighlevel/publish-privacy-policy
 * Create a public GoHighLevel site/page with privacy policy
 */
app.post("/publish-privacy-policy", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Read privacy policy markdown file
    const policyPath = path.join(__dirname, "../legal/privacy-policy.md");
    let policyContent = fs.readFileSync(policyPath, "utf-8");

    // Convert markdown to HTML (simple conversion)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Rejection Hero</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #FF6B35;
            border-bottom: 3px solid #0099FF;
            padding-bottom: 10px;
        }
        h2 {
            color: #0099FF;
            margin-top: 30px;
        }
        a {
            color: #FF6B35;
        }
        .contact {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${policyContent
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^(.+)$/gm, '<p>$1</p>')}
        <div class="contact">
            <h3>Contact Us</h3>
            <p>For privacy-related questions or concerns, contact us at: <a href="mailto:captainigweh12@gmail.com">captainigweh12@gmail.com</a></p>
        </div>
    </div>
</body>
</html>`;

    // Note: GoHighLevel API doesn't have direct site/funnel creation endpoints
    // You'll need to manually create a site in GoHighLevel and use their site builder
    // Or use a different hosting method
    
    // For now, return the HTML content and instructions
    return c.json({
      success: true,
      message: "Privacy Policy HTML generated. Use GoHighLevel Site Builder to create a public page.",
      htmlContent: htmlContent,
      instructions: [
        "1. Log into GoHighLevel",
        "2. Go to Sites → Create New Site",
        "3. Create a simple HTML page",
        "4. Copy the HTML content above",
        "5. Publish the site and get the public URL",
        "6. Use that URL as your Privacy Policy URL in Google Play Console"
      ]
    });
  } catch (error) {
    console.error("❌ Error generating privacy policy HTML:", error);
    return c.json(
      {
        error: "Failed to generate privacy policy",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/gohighlevel/send-welcome-email
 * Send welcome email via GoHighLevel (manually trigger)
 */
app.post("/send-welcome-email", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get user profile from database
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const displayName = profile?.displayName || user.name || "User";
    const result = await syncNewUserToGoHighLevel(
      user.email,
      displayName,
      user.id,
      profile?.username || undefined
    );

    if (!result.success) {
      return c.json(
        {
          error: "Failed to send welcome email",
          details: result.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "Welcome email sent via GoHighLevel",
      contactId: result.contactId,
    });
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return c.json(
      {
        error: "Failed to send welcome email",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/gohighlevel/sync-stats
 * Sync user stats (XP, streak, etc.) to GoHighLevel
 */
app.post("/sync-stats", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get user stats from database
    const stats = await db.user_stats.findUnique({
      where: { userId: user.id },
    });

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    if (!stats) {
      return c.json({ error: "User stats not found" }, 404);
    }

    const displayName = profile?.displayName || user.name || "User";
    
    // Calculate level from XP (if not stored directly)
    const calculatedLevel = Math.floor((stats.totalXP || 0) / 100) + 1;
    
    const result = await updateUserStatsInGoHighLevel(user.email, displayName, {
      totalXP: stats.totalXP || 0,
      currentStreak: stats.currentStreak || 0,
      totalPoints: stats.totalPoints || 0,
      level: calculatedLevel,
    });

    if (!result.success) {
      return c.json(
        {
          error: "Failed to sync stats to GoHighLevel",
          details: result.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "User stats synced to GoHighLevel",
    });
  } catch (error) {
    console.error("❌ Error syncing stats to GoHighLevel:", error);
    return c.json(
      {
        error: "Failed to sync stats to GoHighLevel",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/gohighlevel/send-invite
 * Send an invite email to a friend via GoHighLevel
 */
app.post("/send-invite", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { friendEmail, friendName, message } = body;

  if (!friendEmail) {
    return c.json({ error: "Friend email is required" }, 400);
  }

  try {
    // Get user profile
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const inviterName = profile?.displayName || user.name || "A friend";

    // Create or update contact in GoHighLevel
    const contactResult = await createOrUpdateContact({
      email: friendEmail,
      name: friendName || friendEmail,
      tags: ["invited", "potential-user"],
      customFields: [
        { key: "invited_by", field_value: inviterName },
        { key: "invite_date", field_value: new Date().toISOString() },
      ],
    });

    const contactId = contactResult.id || contactResult.contact?.id;
    
    if (!contactResult.success || !contactId) {
      return c.json(
        {
          error: "Failed to create contact in GoHighLevel",
          details: contactResult.error,
        },
        500
      );
    }

    // Generate invite email HTML
    const emailHTML = getInviteEmailHTML(
      friendName || "Friend",
      inviterName
    );

    // Send invitation email
    const emailResult = await sendEmail(
      contactId,
      `${inviterName} invited you to join Rejection Hero!`,
      emailHTML,
      undefined // fromEmail (optional)
    );

    if (!emailResult.success) {
      return c.json(
        {
          error: "Failed to send invitation email",
          details: emailResult.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "Invitation sent via GoHighLevel",
      contactId: contactId,
    });
  } catch (error) {
    console.error("❌ Error sending invite:", error);
    return c.json(
      {
        error: "Failed to send invitation",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/gohighlevel/webhook
 * Receive webhooks from GoHighLevel (for future use)
 */
app.post("/webhook", async (c) => {
  try {
    const payload = await c.req.json();
    console.log("📩 GoHighLevel webhook received:", payload);
    // Process webhook payload
    return c.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("❌ Error processing GoHighLevel webhook:", error);
    return c.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export { app as gohighlevelRouter };
