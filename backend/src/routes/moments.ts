import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type AppType } from "../types";
import { db } from "../db";
import { createMomentRequestSchema } from "../../../shared/contracts";

const momentsRouter = new Hono<AppType>();

// ============================================
// POST /api/moments - Create a moment/story
// ============================================
momentsRouter.post("/", zValidator("json", createMomentRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { imageUrl, videoUrl, content, groupId } = c.req.valid("json");

  // Validate that at least one content type is provided
  if (!imageUrl && !videoUrl && !content) {
    return c.json({ message: "Moment must have either an image, video, or text content" }, 400);
  }

  // If groupId provided, verify user is a member
  if (groupId) {
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to post stories" }, 403);
    }
  }

  try {
    // Create moment that expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const moment = await db.moment.create({
      data: {
        userId: user.id,
        groupId: groupId || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        content: content || null,
        expiresAt,
      },
    });

    return c.json({
      id: moment.id,
      imageUrl: moment.imageUrl,
      videoUrl: moment.videoUrl,
      content: moment.content,
      expiresAt: moment.expiresAt.toISOString(),
      createdAt: moment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Create moment error:", error);
    return c.json({ message: "Failed to create moment" }, 500);
  }
});

// ============================================
// GET /api/moments - Get active moments from friends
// ============================================
momentsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Get user's friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id, status: "ACCEPTED" },
          { receiverId: user.id, status: "ACCEPTED" },
        ],
      },
    });

    const friendIds = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    // Include user's own ID to show their moments too
    const userIds = [user.id, ...friendIds];

    // Get active moments (not expired) from friends and self (exclude group moments)
    const now = new Date();
    const moments = await db.moment.findMany({
      where: {
        userId: { in: userIds },
        groupId: null, // Only personal moments, not group moments
        expiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            Profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group moments by user
    const momentsByUser = moments.reduce(
      (acc, moment) => {
        const userId = moment.userId;
        if (!acc[userId]) {
          acc[userId] = {
            userId: moment.user.id,
            userName: moment.user.Profile?.displayName || moment.user.name,
            userAvatar: moment.user.Profile?.avatar || moment.user.image,
            moments: [],
          };
        }
        acc[userId].moments.push({
          id: moment.id,
          imageUrl: moment.imageUrl,
          videoUrl: moment.videoUrl,
          content: moment.content,
          expiresAt: moment.expiresAt.toISOString(),
          createdAt: moment.createdAt.toISOString(),
        });
        return acc;
      },
      {} as Record<
        string,
        {
          userId: string;
          userName: string | null;
          userAvatar: string | null;
          moments: Array<{
            id: string;
            imageUrl: string | null;
            videoUrl: string | null;
            content: string | null;
            expiresAt: string;
            createdAt: string;
          }>;
        }
      >
    );

    // Convert to array
    const formattedMoments = Object.values(momentsByUser);

    return c.json({
      moments: formattedMoments,
    });
  } catch (error) {
    console.error("Get moments error:", error);
    return c.json({ message: "Failed to fetch moments" }, 500);
  }
});

// ============================================
// DELETE /api/moments/:id - Delete a moment
// ============================================
momentsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const momentId = c.req.param("id");

  try {
    // Verify moment exists and belongs to user
    const moment = await db.moment.findUnique({
      where: { id: momentId },
    });

    if (!moment) {
      return c.json({ message: "Moment not found" }, 404);
    }

    if (moment.userId !== user.id) {
      return c.json({ message: "You can only delete your own moments" }, 403);
    }

    // Delete moment
    await db.moment.delete({
      where: { id: momentId },
    });

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete moment error:", error);
    return c.json({ message: "Failed to delete moment" }, 500);
  }
});

export default momentsRouter;
