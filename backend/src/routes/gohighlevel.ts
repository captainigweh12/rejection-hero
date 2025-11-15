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
      message: "Welcome email sent",
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
    const stats = await db.userStats.findUnique({
      where: { userId: user.id },
    });

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    if (!stats) {
      return c.json({ error: "User stats not found" }, 404);
    }

    const displayName = profile?.displayName || user.name || "User";
    const result = await updateUserStatsInGoHighLevel(user.email, displayName, {
      totalXP: stats.totalXP,
      currentStreak: stats.currentStreak,
      totalPoints: stats.totalPoints,
      level: Math.floor(stats.totalXP / 100) + 1,
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

  try {
    const body = await c.req.json();
    const { email, name, inviterName } = body;

    if (!email || !name) {
      return c.json({ error: "Email and name are required" }, 400);
    }

    // Create or update contact in GoHighLevel
    const contactResult = await createOrUpdateContact({
      email,
      name,
      tags: ["invited", "rejection-hero"],
      customFields: [
        { key: "invited_by", field_value: inviterName || user.name || "Unknown" },
        { key: "invite_status", field_value: "pending" },
      ],
    });

    if (!contactResult.success || !contactResult.contactId) {
      return c.json(
        {
          error: "Failed to create contact in GoHighLevel",
          details: contactResult.error,
        },
        500
      );
    }

    // Send invite email
    const inviteEmailHTML = getInviteEmailHTML(name, inviterName || user.name || "A friend");
    const emailResult = await sendEmail(
      contactResult.contactId,
      `${inviterName || user.name} invited you to join Rejection Hero!`,
      inviteEmailHTML,
      "noreply@rejectionhero.com"
    );

    if (!emailResult.success) {
      return c.json(
        {
          error: "Failed to send invite email",
          details: emailResult.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "Invite sent successfully",
      contactId: contactResult.contactId,
    });
  } catch (error) {
    console.error("❌ Error sending invite:", error);
    return c.json(
      {
        error: "Failed to send invite",
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

    // Handle different webhook events here
    // For example: user updates, email opens, etc.

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
