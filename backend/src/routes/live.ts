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

    // Check if user already has an active live stream
    const existingStream = await db.liveStream.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingStream) {
      return c.json({ error: "You already have an active live stream" }, 400);
    }

    // Generate Daily.co room (in production, you'd call Daily.co API)
    // For now, we'll create a mock room
    const roomName = `quest-live-${user.id}-${Date.now()}`;
    const roomUrl = `https://vibecode.daily.co/${roomName}`;

    // In production, you would create a room via Daily.co API:
    // const DAILY_API_KEY = process.env.DAILY_API_KEY;
    // const response = await fetch("https://api.daily.co/v1/rooms", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${DAILY_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     name: roomName,
    //     privacy: "public",
    //     properties: {
    //       max_participants: 100,
    //       enable_chat: true,
    //       enable_screenshare: false,
    //     }
    //   })
    // });
    // const roomData = await response.json();

    // Create meeting token for the host (in production)
    // const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${DAILY_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     properties: {
    //       room_name: roomName,
    //       is_owner: true,
    //     }
    //   })
    // });
    // const { token } = await tokenResponse.json();

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

    // Update profile to mark user as live
    await db.profile.update({
      where: { userId: user.id },
      data: {
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
    await db.profile.update({
      where: { userId: user.id },
      data: {
        isLive: false,
        liveViewers: 0,
      },
    });

    // In production, delete the Daily.co room:
    // await fetch(`https://api.daily.co/v1/rooms/${liveStream.roomName}`, {
    //   method: "DELETE",
    //   headers: {
    //     "Authorization": `Bearer ${DAILY_API_KEY}`
    //   }
    // });

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
