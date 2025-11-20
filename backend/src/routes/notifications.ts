import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const notificationsRouter = new Hono<AppType>();

// ============================================
// GET /api/notifications - Get user's notifications
// ============================================
notificationsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    include: {
      sender: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const formattedNotifications = notifications.map((notification) => {
    const senderProfile = notification.sender?.Profile;
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      data: notification.data ? JSON.parse(notification.data) : null,
      createdAt: notification.createdAt,
      sender: notification.sender
        ? {
            id: notification.sender.id,
            displayName: senderProfile?.displayName || notification.sender.email?.split("@")[0] || "User",
            avatar: senderProfile?.avatar || null,
          }
        : null,
    };
  });

  return c.json({ notifications: formattedNotifications });
});

// ============================================
// GET /api/notifications/unread-count - Get count of unread notifications
// ============================================
notificationsRouter.get("/unread-count", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const count = await db.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return c.json({ count });
});

// ============================================
// POST /api/notifications/:id/read - Mark notification as read
// ============================================
notificationsRouter.post("/:id/read", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const notificationId = c.req.param("id");

  // Verify notification belongs to user
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return c.json({ message: "Notification not found" }, 404);
  }

  if (notification.userId !== user.id) {
    return c.json({ message: "Unauthorized" }, 403);
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return c.json({ success: true });
});

// ============================================
// POST /api/notifications/mark-all-read - Mark all notifications as read
// ============================================
notificationsRouter.post("/mark-all-read", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await db.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: { read: true },
  });

  return c.json({ success: true });
});

// ============================================
// DELETE /api/notifications/:id - Delete notification
// ============================================
notificationsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const notificationId = c.req.param("id");

  // Verify notification belongs to user
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return c.json({ message: "Notification not found" }, 404);
  }

  if (notification.userId !== user.id) {
    return c.json({ message: "Unauthorized" }, 403);
  }

  await db.notification.delete({
    where: { id: notificationId },
  });

  return c.json({ success: true });
});

// ============================================
// GET /api/notifications/preferences - Get notification preferences
// ============================================
notificationsRouter.get("/preferences", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { notificationPreferences: true },
  });

  // Default preferences - all enabled
  const defaultPreferences = {
    questCompleted: true,
    questShared: true,
    friendRequest: true,
    friendAccepted: true,
    confidenceLow: true,
    leaderboardFallBehind: true,
    challengeReminder: true,
    dailyMotivation: true,
    achievementUnlocked: true,
  };

  if (!profile?.notificationPreferences) {
    return c.json({ preferences: defaultPreferences });
  }

  try {
    const preferences = JSON.parse(profile.notificationPreferences);
    // Merge with defaults to ensure all keys exist
    return c.json({ preferences: { ...defaultPreferences, ...preferences } });
  } catch {
    return c.json({ preferences: defaultPreferences });
  }
});

// ============================================
// POST /api/notifications/preferences - Update notification preferences
// ============================================
notificationsRouter.post(
  "/preferences",
  zValidator(
    "json",
    z.object({
      questCompleted: z.boolean().optional(),
      questShared: z.boolean().optional(),
      friendRequest: z.boolean().optional(),
      friendAccepted: z.boolean().optional(),
      confidenceLow: z.boolean().optional(),
      challengeReminder: z.boolean().optional(),
      dailyMotivation: z.boolean().optional(),
      achievementUnlocked: z.boolean().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const updates = c.req.valid("json");

    // Get current preferences
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
      select: { notificationPreferences: true },
    });

    const defaultPreferences = {
      questCompleted: true,
      questShared: true,
      friendRequest: true,
      friendAccepted: true,
      confidenceLow: true,
      leaderboardFallBehind: true,
      challengeReminder: true,
      dailyMotivation: true,
      achievementUnlocked: true,
    };

    let currentPreferences = defaultPreferences;
    if (profile?.notificationPreferences) {
      try {
        currentPreferences = { ...defaultPreferences, ...JSON.parse(profile.notificationPreferences) };
      } catch {
        // Use defaults
      }
    }

    // Merge updates
    const newPreferences = { ...currentPreferences, ...updates };

    // Update profile
    await db.profile.update({
      where: { userId: user.id },
      data: {
        notificationPreferences: JSON.stringify(newPreferences),
      },
    });

    return c.json({ success: true, preferences: newPreferences });
  }
);

export { notificationsRouter };
