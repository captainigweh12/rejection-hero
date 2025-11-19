import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const adminRouter = new Hono<AppType>();

// Middleware to check if user is admin
const requireAdmin = async (c: any, next: any) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check if user is admin
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!userRecord?.isAdmin) {
    return c.json({ message: "Forbidden: Admin access required" }, 403);
  }

  await next();
};

// Apply admin middleware to all routes
adminRouter.use("*", requireAdmin);

// ============================================
// GET /api/admin/users - Get all users
// ============================================
adminRouter.get("/users", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
  const search = c.req.query("search") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        Profile: {
          select: {
            displayName: true,
            username: true,
            createdAt: true,
          },
        },
        Subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
        UserStats: {
          select: {
            totalXP: true,
            currentStreak: true,
            createdAt: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return c.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      profile: u.Profile
        ? {
            displayName: u.Profile.displayName,
            username: u.Profile.username,
            createdAt: u.Profile.createdAt.toISOString(),
          }
        : null,
      subscription: u.Subscription
        ? {
            status: u.Subscription.status,
            plan: u.Subscription.plan,
            currentPeriodEnd: u.Subscription.currentPeriodEnd?.toISOString() || null,
          }
        : null,
      stats: u.UserStats
        ? {
            totalXP: u.UserStats.totalXP,
            currentStreak: u.UserStats.currentStreak,
            createdAt: u.UserStats.createdAt.toISOString(),
          }
        : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// ============================================
// GET /api/admin/users/:id - Get user details
// ============================================
adminRouter.get("/users/:id", async (c) => {
  const userId = c.req.param("id");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      Profile: true,
      Subscription: true,
      UserStats: true,
      UserQuests: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          quest: true,
        },
      },
    },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({ user });
});

// ============================================
// DELETE /api/admin/users/:id - Delete user account
// ============================================
adminRouter.delete("/users/:id", async (c) => {
  const userId = c.req.param("id");

  // Prevent deleting yourself
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  if (userId === currentUser.id) {
    return c.json({ message: "Cannot delete your own account" }, 400);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  // Delete user (cascade will handle related records)
  await db.user.delete({
    where: { id: userId },
  });

  return c.json({ success: true, message: "User deleted successfully" });
});

// ============================================
// POST /api/admin/users/:id/subscription - Manage user subscription
// ============================================
adminRouter.post(
  "/users/:id/subscription",
  zValidator(
    "json",
    z.object({
      action: z.enum(["activate", "cancel", "extend"]),
      days: z.number().optional(), // For extend action
    })
  ),
  async (c) => {
    const userId = c.req.param("id");
    const { action, days } = c.req.valid("json");

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Subscription: true },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    if (action === "activate") {
      if (user.Subscription) {
        await db.subscription.update({
          where: { userId },
          data: {
            status: "active",
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });
      } else {
        await db.subscription.create({
          data: {
            userId,
            status: "active",
            plan: "monthly",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }
    } else if (action === "cancel") {
      if (user.Subscription) {
        await db.subscription.update({
          where: { userId },
          data: {
            status: "canceled",
            cancelAtPeriodEnd: true,
            canceledAt: new Date(),
          },
        });
      }
    } else if (action === "extend" && days) {
      if (user.Subscription) {
        const currentEnd = user.Subscription.currentPeriodEnd || new Date();
        await db.subscription.update({
          where: { userId },
          data: {
            currentPeriodEnd: new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000),
            status: "active",
          },
        });
      }
    }

    return c.json({ success: true, message: `Subscription ${action}d successfully` });
  }
);

// ============================================
// POST /api/admin/users/:id/make-admin - Make user admin
// ============================================
adminRouter.post("/users/:id/make-admin", async (c) => {
  const userId = c.req.param("id");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  await db.user.update({
    where: { id: userId },
    data: { isAdmin: true },
  });

  return c.json({ success: true, message: `User ${user.email} is now an admin` });
});

// ============================================
// POST /api/admin/invite-admin - Invite admin by email
// ============================================
adminRouter.post(
  "/invite-admin",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { email } = c.req.valid("json");

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, make them admin
      await db.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
      });
      return c.json({ success: true, message: `User ${email} is now an admin` });
    } else {
      // User doesn't exist - in a real app, you'd send an invitation email
      // For now, we'll just return a message
      return c.json({
        success: true,
        message: `Invitation would be sent to ${email}. User will become admin upon signup.`,
        note: "In production, implement email invitation system",
      });
    }
  }
);

// ============================================
// POST /api/admin/send-email - Send email to user(s)
// ============================================
adminRouter.post(
  "/send-email",
  zValidator(
    "json",
    z.object({
      userId: z.string().optional(), // Send to specific user
      email: z.string().email().optional(), // Or send to specific email
      subject: z.string().min(1),
      html: z.string().min(1),
    })
  ),
  async (c) => {
    const { userId, email: emailAddress, subject, html } = c.req.valid("json");

    // Import email service
    const { sendEmail } = await import("../services/email");

    try {
      if (userId) {
        // Send to specific user
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (!user) {
          return c.json({ message: "User not found" }, 404);
        }

        await sendEmail({
          to: user.email,
          subject,
          html,
        });

        return c.json({
          success: true,
          message: `Email sent to ${user.email}`,
        });
      } else if (emailAddress) {
        // Send to specific email address
        await sendEmail({
          to: emailAddress,
          subject,
          html,
        });

        return c.json({
          success: true,
          message: `Email sent to ${emailAddress}`,
        });
      } else {
        return c.json({ message: "Either userId or email is required" }, 400);
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      return c.json(
        {
          success: false,
          message: error?.message || "Failed to send email",
        },
        500
      );
    }
  }
);

export { adminRouter };

