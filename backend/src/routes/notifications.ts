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
          Profile: true,
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

export { notificationsRouter };
