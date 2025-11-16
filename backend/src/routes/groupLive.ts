import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const groupLiveRouter = new Hono<AppType>();

// ============================================
// GET /api/group-live/:groupId - Get active live streams in a group
// ============================================
groupLiveRouter.get("/:groupId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Check if user is a member of the group
  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You are not a member of this group" }, 403);
  }

  // Get all active live streams in this group
  const liveStreams = await db.liveStream.findMany({
    where: {
      groupId,
      isActive: true,
    },
    include: {
      user: {
        include: {
          Profile: true,
        },
      },
      userQuest: {
        include: {
          quest: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  const formattedStreams = liveStreams.map((stream) => ({
    id: stream.id,
    roomUrl: stream.roomUrl,
    roomName: stream.roomName,
    viewerCount: stream.viewerCount,
    startedAt: stream.startedAt.toISOString(),
    streamer: {
      id: stream.user.id,
      displayName: stream.user.Profile?.displayName || stream.user.email?.split("@")[0] || "User",
      avatar: stream.user.Profile?.avatar || null,
    },
    quest: stream.userQuest
      ? {
          id: stream.userQuest.quest.id,
          title: stream.userQuest.quest.title,
          description: stream.userQuest.quest.description,
          category: stream.userQuest.quest.category,
          difficulty: stream.userQuest.quest.difficulty,
        }
      : null,
  }));

  return c.json({ liveStreams: formattedStreams });
});

// ============================================
// POST /api/group-live/start - Start a group live stream
// ============================================
const startGroupLiveSchema = z.object({
  groupId: z.string(),
  userQuestId: z.string().optional(),
});

groupLiveRouter.post("/start", zValidator("json", startGroupLiveSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { groupId, userQuestId } = c.req.valid("json");

  // Check if user is a member of the group
  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You are not a member of this group" }, 403);
  }

  // Check if user already has an active stream
  const existingStream = await db.liveStream.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
  });

  if (existingStream) {
    return c.json({ message: "You already have an active live stream" }, 400);
  }

  // Generate room name and URL (using Daily.co or mock for development)
  const roomName = `group-${groupId}-${Date.now()}`;
  const roomUrl = `https://daily.co/${roomName}`; // In production, create via Daily.co API

  console.log(`📹 [Group Live] Starting group live stream for user ${user.id} in group ${groupId}`);

  // Create the live stream
  const liveStream = await db.liveStream.create({
    data: {
      userId: user.id,
      groupId,
      roomName,
      roomUrl,
      userQuestId: userQuestId || null,
      isActive: true,
      viewerCount: 0,
    },
  });

  // Update user profile to show they're live
  await db.profile.update({
    where: { userId: user.id },
    data: {
      isLive: true,
      liveViewers: 0,
    },
  });

  console.log(`✅ [Group Live] Stream created with ID: ${liveStream.id}`);

  return c.json({
    success: true,
    liveStreamId: liveStream.id,
    roomUrl: liveStream.roomUrl,
    roomName: liveStream.roomName,
  });
});

// ============================================
// POST /api/group-live/:streamId/end - End a group live stream
// ============================================
groupLiveRouter.post("/:streamId/end", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const streamId = c.req.param("streamId");

  // Find the stream
  const stream = await db.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!stream) {
    return c.json({ message: "Stream not found" }, 404);
  }

  // Only the streamer can end their stream
  if (stream.userId !== user.id) {
    return c.json({ message: "You can only end your own stream" }, 403);
  }

  console.log(`📹 [Group Live] Ending stream ${streamId}`);

  // End the stream
  await db.liveStream.update({
    where: { id: streamId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  });

  // Update user profile
  await db.profile.update({
    where: { userId: user.id },
    data: {
      isLive: false,
      liveViewers: 0,
    },
  });

  console.log(`✅ [Group Live] Stream ended successfully`);

  return c.json({ success: true, message: "Stream ended successfully" });
});

// ============================================
// POST /api/group-live/:streamId/join - Join a group live stream (increment viewer count)
// ============================================
groupLiveRouter.post("/:streamId/join", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const streamId = c.req.param("streamId");

  // Find the stream
  const stream = await db.liveStream.findUnique({
    where: { id: streamId },
    include: {
      group: true,
    },
  });

  if (!stream) {
    return c.json({ message: "Stream not found" }, 404);
  }

  if (!stream.isActive) {
    return c.json({ message: "Stream is no longer active" }, 400);
  }

  // Check if user is a member of the group
  if (stream.groupId) {
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: stream.groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You are not a member of this group" }, 403);
    }
  }

  // Increment viewer count
  await db.liveStream.update({
    where: { id: streamId },
    data: {
      viewerCount: {
        increment: 1,
      },
    },
  });

  // Update streamer's profile viewer count
  await db.profile.update({
    where: { userId: stream.userId },
    data: {
      liveViewers: {
        increment: 1,
      },
    },
  });

  return c.json({ success: true, message: "Joined stream" });
});

// ============================================
// POST /api/group-live/:streamId/leave - Leave a group live stream (decrement viewer count)
// ============================================
groupLiveRouter.post("/:streamId/leave", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const streamId = c.req.param("streamId");

  // Find the stream
  const stream = await db.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!stream) {
    return c.json({ message: "Stream not found" }, 404);
  }

  // Decrement viewer count (don't go below 0)
  await db.liveStream.update({
    where: { id: streamId },
    data: {
      viewerCount: Math.max(0, stream.viewerCount - 1),
    },
  });

  // Update streamer's profile viewer count
  const profile = await db.profile.findUnique({
    where: { userId: stream.userId },
  });

  if (profile) {
    await db.profile.update({
      where: { userId: stream.userId },
      data: {
        liveViewers: Math.max(0, profile.liveViewers - 1),
      },
    });
  }

  return c.json({ success: true, message: "Left stream" });
});

export { groupLiveRouter };
