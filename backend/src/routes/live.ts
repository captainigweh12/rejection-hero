import { Hono } from "hono";
import type { AppType } from "../index";
import { db } from "../db";
import {
  startLiveStreamRequestSchema,
  startLiveStreamResponseSchema,
  endLiveStreamResponseSchema,
  getActiveLiveStreamsResponseSchema,
  addLiveCommentRequestSchema,
  addLiveCommentResponseSchema,
  getLiveCommentsResponseSchema,
} from "@/shared/contracts";

const live = new Hono<AppType>();

// POST /api/live/start - Start a live stream
live.post("/start", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const { userQuestId } = startLiveStreamRequestSchema.parse(body);

    // Check if user already has an active live stream and end it automatically
    const existingStream = await db.liveStream.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingStream) {
      // Automatically end the existing stream
      await db.liveStream.update({
        where: { id: existingStream.id },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      // Update profile to mark user as not live
      await db.profile.updateMany({
        where: { userId: user.id },
        data: {
          isLive: false,
          liveViewers: 0,
        },
      });

      console.log(`[Live] Auto-ended existing stream ${existingStream.id} for user ${user.id}`);
    }

    // Generate Daily.co room
    const roomName = `quest-live-${user.id}-${Date.now()}`;
    const DAILY_API_KEY = process.env.DAILY_API_KEY;

    let roomUrl = `https://vibecode.daily.co/${roomName}`;
    let token = "mock-token";

    if (DAILY_API_KEY) {
      try {
        // Create room via Daily.co API
        const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: roomName,
            privacy: "public",
            properties: {
              max_participants: 100,
              enable_chat: true,
              enable_screenshare: false,
              start_video_off: false,
              start_audio_off: false,
            },
          }),
        });

        if (!roomResponse.ok) {
          throw new Error(`Daily.co room creation failed: ${roomResponse.statusText}`);
        }

        const roomData = await roomResponse.json();
        roomUrl = roomData.url;

        // Create meeting token for the host
        const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              is_owner: true,
            },
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Daily.co token creation failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        token = tokenData.token;

        console.log(`[Live] Created Daily.co room: ${roomUrl}`);
      } catch (error) {
        console.error("[Live] Daily.co API error:", error);
        // Fall back to mock room if API fails
        console.log("[Live] Falling back to mock room");
      }
    } else {
      console.log("[Live] No DAILY_API_KEY found, using mock room");
    }

    // Create live stream in database
    const liveStream = await db.liveStream.create({
      data: {
        userId: user.id,
        roomUrl,
        roomName,
        userQuestId,
        isActive: true,
        viewerCount: 0,
      },
    });

    // Update profile to mark user as live (or create if doesn't exist)
    await db.profile.upsert({
      where: { userId: user.id },
      update: {
        isLive: true,
        liveViewers: 0,
      },
      create: {
        userId: user.id,
        displayName: user.name || user.email || "User",
        isLive: true,
        liveViewers: 0,
      },
    });

    const response: startLiveStreamResponseSchema._type = {
      success: true,
      liveStreamId: liveStream.id,
      roomUrl: liveStream.roomUrl,
      roomName: liveStream.roomName,
      token: "mock-token", // In production, return actual Daily.co token
    };

    return c.json(response);
  } catch (error) {
    console.error("Start live stream error:", error);
    return c.json({ error: "Failed to start live stream" }, 500);
  }
});

// POST /api/live/:id/end - End a live stream
live.post("/:id/end", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");

    const liveStream = await db.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      return c.json({ error: "Live stream not found" }, 404);
    }

    if (liveStream.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // End the live stream
    await db.liveStream.update({
      where: { id: liveStreamId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Update profile to mark user as not live
    await db.profile.upsert({
      where: { userId: user.id },
      update: {
        isLive: false,
        liveViewers: 0,
      },
      create: {
        userId: user.id,
        displayName: user.name || user.email || "User",
        isLive: false,
        liveViewers: 0,
      },
    });

    // Delete the Daily.co room
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    if (DAILY_API_KEY) {
      try {
        await fetch(`https://api.daily.co/v1/rooms/${liveStream.roomName}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
        });
        console.log(`[Live] Deleted Daily.co room: ${liveStream.roomName}`);
      } catch (error) {
        console.error("[Live] Failed to delete Daily.co room:", error);
      }
    }

    const response: endLiveStreamResponseSchema._type = {
      success: true,
    };

    return c.json(response);
  } catch (error) {
    console.error("End live stream error:", error);
    return c.json({ error: "Failed to end live stream" }, 500);
  }
});

// GET /api/live/active - Get active live streams
live.get("/active", async (c) => {
  try {
    const streams = await db.liveStream.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        userQuest: {
          include: {
            quest: {
              select: {
                title: true,
                description: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const response: getActiveLiveStreamsResponseSchema._type = {
      streams: streams.map((stream) => ({
        id: stream.id,
        roomUrl: stream.roomUrl,
        roomName: stream.roomName,
        viewerCount: stream.viewerCount,
        startedAt: stream.startedAt.toISOString(),
        user: {
          id: stream.user.id,
          name: stream.user.name,
          image: stream.user.image,
        },
        userQuest: stream.userQuest
          ? {
              id: stream.userQuest.id,
              quest: {
                title: stream.userQuest.quest.title,
                description: stream.userQuest.quest.description,
                category: stream.userQuest.quest.category,
              },
            }
          : null,
      })),
    };

    return c.json(response);
  } catch (error) {
    console.error("Get active live streams error:", error);
    return c.json({ error: "Failed to get active live streams" }, 500);
  }
});

// POST /api/live/:id/comment - Add a comment to live stream
live.post("/:id/comment", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");
    const body = await c.req.json();
    const { message } = addLiveCommentRequestSchema.parse(body);

    const liveStream = await db.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream || !liveStream.isActive) {
      return c.json({ error: "Live stream not found or ended" }, 404);
    }

    const comment = await db.liveStreamComment.create({
      data: {
        liveStreamId,
        userId: user.id,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: addLiveCommentResponseSchema._type = {
      success: true,
      comment: {
        id: comment.id,
        message: comment.message,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name,
        },
      },
    };

    return c.json(response);
  } catch (error) {
    console.error("Add live comment error:", error);
    return c.json({ error: "Failed to add comment" }, 500);
  }
});

// GET /api/live/:id/comments - Get comments for a live stream
live.get("/:id/comments", async (c) => {
  try {
    const liveStreamId = c.req.param("id");

    const comments = await db.liveStreamComment.findMany({
      where: { liveStreamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 comments
    });

    const response: getLiveCommentsResponseSchema._type = {
      comments: comments.map((comment) => ({
        id: comment.id,
        message: comment.message,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name,
        },
      })),
    };

    return c.json(response);
  } catch (error) {
    console.error("Get live comments error:", error);
    return c.json({ error: "Failed to get comments" }, 500);
  }
});

export default live;
