import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const moderationRouter = new Hono<AppType>();

// ============================================
// POST /api/moderation/block - Block a user
// ============================================
const blockUserSchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

moderationRouter.post("/block", zValidator("json", blockUserSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { userId, reason } = c.req.valid("json");

  // Can't block yourself
  if (userId === user.id) {
    return c.json({ message: "You cannot block yourself" }, 400);
  }

  // Check if already blocked
  const existingBlock = await db.user_block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: userId,
      },
    },
  });

  if (existingBlock) {
    return c.json({ message: "User is already blocked" }, 400);
  }

  // Create block
  await db.user_block.create({
    data: {
      blockerId: user.id,
      blockedId: userId,
      reason: reason || null,
    },
  });

  // Remove any existing friendship
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: user.id, receiverId: userId },
        { initiatorId: userId, receiverId: user.id },
      ],
    },
  });

  if (friendship) {
    await db.friendship.delete({
      where: { id: friendship.id },
    });
  }

  // Delete or hide existing messages
  await db.message.updateMany({
    where: {
      OR: [
        { senderId: userId, receiverId: user.id },
        { senderId: user.id, receiverId: userId },
      ],
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    message: "User blocked successfully",
  });
});

// ============================================
// POST /api/moderation/unblock - Unblock a user
// ============================================
const unblockUserSchema = z.object({
  userId: z.string(),
});

moderationRouter.post("/unblock", zValidator("json", unblockUserSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { userId } = c.req.valid("json");

  const block = await db.user_block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: userId,
      },
    },
  });

  if (!block) {
    return c.json({ message: "User is not blocked" }, 404);
  }

  await db.user_block.delete({
    where: { id: block.id },
  });

  return c.json({
    success: true,
    message: "User unblocked successfully",
  });
});

// ============================================
// GET /api/moderation/blocked - Get list of blocked users
// ============================================
moderationRouter.get("/blocked", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const blocked = await db.user_block.findMany({
    where: { blockerId: user.id },
    include: {
      blocked: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = blocked.map((block) => ({
    id: block.blocked.id,
    email: block.blocked.email,
    displayName: block.blocked.Profile?.displayName || block.blocked.email?.split("@")[0] || "User",
    avatar: block.blocked.Profile?.avatar || null,
    blockedAt: block.createdAt,
    reason: block.reason,
  }));

  return c.json({ blocked: formatted });
});

// ============================================
// POST /api/moderation/report - Report a user or content
// ============================================
const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  contentType: z.enum(["user", "post", "comment", "message", "live_stream", "quest"]),
  contentId: z.string().optional(),
  reason: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
});

moderationRouter.post("/report", zValidator("json", reportSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { reportedUserId, contentType, contentId, reason, description } = c.req.valid("json");

  // Can't report yourself
  if (reportedUserId === user.id) {
    return c.json({ message: "You cannot report yourself" }, 400);
  }

  // Check for duplicate reports (same user reporting same content within 24 hours)
  const recentReport = await db.report.findFirst({
    where: {
      reporterId: user.id,
      contentType,
      contentId: contentId || null,
      reportedUserId: reportedUserId || null,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (recentReport) {
    return c.json({ message: "You have already reported this content recently" }, 400);
  }

  // Create report
  const report = await db.report.create({
    data: {
      reporterId: user.id,
      reportedUserId: reportedUserId || null,
      contentType,
      contentId: contentId || null,
      reason,
      description: description || null,
      status: "pending",
    },
  });

  // If reporting a message, mark it for review
  if (contentType === "message" && contentId) {
    await db.message.update({
      where: { id: contentId },
      data: {
        isModerated: false, // Pending review
      },
    });
  }

  // TODO: Notify admins about new report

  return c.json({
    success: true,
    message: "Report submitted successfully. Our team will review it.",
    reportId: report.id,
  });
});

// ============================================
// GET /api/moderation/reports - Get reports created by current user
// ============================================
moderationRouter.get("/reports", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const reports = await db.report.findMany({
    where: { reporterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ reports });
});

// ============================================
// POST /api/moderation/chat/moderate - Moderate a chat message (Admin only or automated)
// ============================================
const moderateMessageSchema = z.object({
  messageId: z.string(),
  action: z.enum(["warn", "hide", "delete"]),
  reason: z.string().min(1),
});

moderationRouter.post("/chat/moderate", zValidator("json", moderateMessageSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check if user is admin
  const userProfile = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!userProfile?.isAdmin) {
    return c.json({ message: "Only admins can moderate messages" }, 403);
  }

  const { messageId, action, reason } = c.req.valid("json");

  // Get message
  const message = await db.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return c.json({ message: "Message not found" }, 404);
  }

  // Perform moderation action
  if (action === "delete") {
    await db.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isModerated: true,
        moderatedAt: new Date(),
        moderationReason: reason,
      },
    });
  } else if (action === "hide") {
    await db.message.update({
      where: { id: messageId },
      data: {
        isModerated: true,
        moderatedAt: new Date(),
        moderationReason: reason,
      },
    });
  }

  // Create moderation record
  await db.messageModeration.create({
    data: {
      messageId,
      action,
      reason,
      moderatedBy: user.id,
    },
  });

  // If action is delete or hide, notify message sender
  if (action === "delete" || action === "hide") {
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: message.senderId,
        type: "CONTENT_MODERATED",
        title: "Message Moderated",
        message: `Your message was ${action === "delete" ? "deleted" : "hidden"} due to: ${reason}`,
        data: JSON.stringify({
          messageId,
          action,
          reason,
          type: "message_moderated",
        }),
      },
    });

    // Send push notification
    try {
      const { sendPushNotificationForNotification } = await import("../services/pushNotifications");
      const notification = await db.notification.findFirst({
        where: {
          userId: message.senderId,
          type: "CONTENT_MODERATED",
          message: { contains: action === "delete" ? "deleted" : "hidden" },
        },
        orderBy: { createdAt: "desc" },
      });

      if (notification) {
        await sendPushNotificationForNotification(
          message.senderId,
          notification.title,
          notification.message,
          JSON.parse(notification.data || "{}")
        );
      }
    } catch (error) {
      console.error("Error sending moderation push notification:", error);
    }
  }

  return c.json({
    success: true,
    message: `Message ${action}d successfully`,
  });
});

// ============================================
// GET /api/moderation/chat/reports - Get chat messages that need moderation (Admin only)
// ============================================
moderationRouter.get("/chat/reports", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check if user is admin
  const userProfile = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!userProfile?.isAdmin) {
    return c.json({ message: "Only admins can view reports" }, 403);
  }

  // Get pending reports
  const reports = await db.report.findMany({
    where: {
      status: "pending",
      contentType: { in: ["message", "user"] },
    },
    include: {
      reporter: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formatted = reports.map((report) => ({
    id: report.id,
    reporter: {
      id: report.reporter.id,
      displayName: report.reporter.Profile?.displayName || report.reporter.email?.split("@")[0] || "User",
      avatar: report.reporter.Profile?.avatar || null,
    },
    reportedUserId: report.reportedUserId,
    contentType: report.contentType,
    contentId: report.contentId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
  }));

  return c.json({ reports: formatted });
});

// ============================================
// POST /api/moderation/chat/review - Review and resolve a report (Admin only)
// ============================================
const reviewReportSchema = z.object({
  reportId: z.string(),
  status: z.enum(["resolved", "dismissed"]),
  resolution: z.string().optional(),
  action: z.enum(["none", "warn", "hide", "delete", "ban"]).optional(),
  contentId: z.string().optional(), // For content moderation
});

moderationRouter.post("/chat/review", zValidator("json", reviewReportSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check if user is admin
  const userProfile = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!userProfile?.isAdmin) {
    return c.json({ message: "Only admins can review reports" }, 403);
  }

  const { reportId, status, resolution, action, contentId } = c.req.valid("json");

  // Get report
  const report = await db.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    return c.json({ message: "Report not found" }, 404);
  }

  // Update report
  await db.report.update({
    where: { id: reportId },
    data: {
      status,
      resolution: resolution || null,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    },
  });

  // If action is specified, perform moderation
  if (action && action !== "none" && report.contentId) {
    if (report.contentType === "message") {
      // Moderate message
      await db.messageModeration.create({
        data: {
          messageId: report.contentId,
          action: action === "ban" ? "delete" : action,
          reason: resolution || report.reason,
          moderatedBy: user.id,
          reportId: report.id,
        },
      });

      if (action === "delete" || action === "hide") {
        await db.message.update({
          where: { id: report.contentId },
          data: {
            isDeleted: action === "delete",
            deletedAt: action === "delete" ? new Date() : null,
            isModerated: true,
            moderatedAt: new Date(),
            moderationReason: resolution || report.reason,
          },
        });
      }
    } else if (report.contentType === "post") {
      // Moderate post
      await db.content_moderation.create({
        data: {
          contentId: report.contentId,
          contentType: "post",
          action,
          reason: resolution || report.reason,
          moderatedBy: user.id,
          reportId: report.id,
          userId: report.reportedUserId || null,
        },
      });

      // Hide or delete post based on action
      if (action === "delete" || action === "hide") {
        await db.post.update({
          where: { id: report.contentId },
          data: {
            deletedAt: action === "delete" ? new Date() : null,
            isHidden: action === "hide",
          },
        });
      }
    }
    // Add other content types as needed
  }

  return c.json({
    success: true,
    message: "Report reviewed successfully",
  });
});

// ============================================
// Helper: Check if user is blocked
// ============================================
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await db.user_block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  return !!block;
}

// ============================================
// Helper: Filter blocked users from list
// ============================================
export async function filterBlockedUsers(userId: string, userIds: string[]): Promise<string[]> {
  const blocks = await db.user_block.findMany({
    where: {
      blockerId: userId,
      blockedId: { in: userIds },
    },
  });

  const blockedIds = new Set(blocks.map((b) => b.blockedId));
  return userIds.filter((id) => !blockedIds.has(id));
}

export { moderationRouter };

