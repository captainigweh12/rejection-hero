import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const followRouter = new Hono<AppType>();

// ============================================
// POST /api/follow/:userId - Follow a user
// ============================================
followRouter.post("/:userId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const targetUserId = c.req.param("userId");

  // Prevent self-follow
  if (user.id === targetUserId) {
    return c.json({ message: "You cannot follow yourself" }, 400);
  }

  try {
    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return c.json({ message: "Already following this user" }, 400);
    }

    // Create follow relationship
    await db.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    return c.json({ success: true, message: "User followed successfully" });
  } catch (error) {
    console.error("Follow user error:", error);
    return c.json({ message: "Failed to follow user" }, 500);
  }
});

// ============================================
// DELETE /api/follow/:userId - Unfollow a user
// ============================================
followRouter.delete("/:userId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const targetUserId = c.req.param("userId");

  try {
    // Check if following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      return c.json({ message: "Not following this user" }, 400);
    }

    // Delete follow relationship
    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    return c.json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return c.json({ message: "Failed to unfollow user" }, 500);
  }
});

// ============================================
// GET /api/follow/status?userId=... - Get follow and friend status
// ============================================
followRouter.get("/status", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const targetUserId = c.req.query("userId");

  if (!targetUserId) {
    return c.json({ message: "userId query parameter is required" }, 400);
  }

  try {
    // Check follow status
    const followStatus = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    // Check friendship status
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: targetUserId, status: "ACCEPTED" },
          { initiatorId: targetUserId, receiverId: user.id, status: "ACCEPTED" },
        ],
      },
    });

    return c.json({
      isFollowing: !!followStatus,
      isFriend: !!friendship,
    });
  } catch (error) {
    console.error("Get follow status error:", error);
    return c.json({ message: "Failed to get follow status" }, 500);
  }
});

// ============================================
// POST /api/follow/status-batch - Get follow and friend status for multiple users
// ============================================
followRouter.post(
  "/status-batch",
  zValidator("json", z.object({ userIds: z.array(z.string()) })),
  async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const { userIds } = c.req.valid("json");

    if (userIds.length === 0) {
      return c.json({});
    }

    try {
      // Get all follow relationships
      const follows = await db.follow.findMany({
        where: {
          followerId: user.id,
          followingId: { in: userIds },
        },
        select: {
          followingId: true,
        },
      });

      const followingSet = new Set(follows.map((f) => f.followingId));

      // Get all friendships
      const friendships = await db.friendship.findMany({
        where: {
          OR: [
            { initiatorId: user.id, receiverId: { in: userIds }, status: "ACCEPTED" },
            { receiverId: user.id, initiatorId: { in: userIds }, status: "ACCEPTED" },
          ],
        },
      });

      const friendSet = new Set(
        friendships.map((f) => (f.initiatorId === user.id ? f.receiverId : f.initiatorId))
      );

      // Build response map
      const statusMap: Record<string, { isFollowing: boolean; isFriend: boolean }> = {};
      for (const userId of userIds) {
        statusMap[userId] = {
          isFollowing: followingSet.has(userId),
          isFriend: friendSet.has(userId),
        };
      }

      return c.json(statusMap);
    } catch (error) {
      console.error("Get batch follow status error:", error);
      return c.json({ message: "Failed to get batch follow status" }, 500);
    }
  }
);

export default followRouter;

