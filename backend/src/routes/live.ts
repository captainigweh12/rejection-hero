import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";
import { randomUUID } from "crypto";
import {
  startLiveStreamRequestSchema,
  startLiveStreamResponseSchema,
  endLiveStreamResponseSchema,
  getActiveLiveStreamsResponseSchema,
  addLiveCommentRequestSchema,
  addLiveCommentResponseSchema,
  getLiveCommentsResponseSchema,
  suggestQuestToStreamerRequestSchema,
  suggestQuestToStreamerResponseSchema,
  getQuestSuggestionsResponseSchema,
  respondToSuggestionRequestSchema,
  respondToSuggestionResponseSchema,
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

    // Check if user already has an active live stream and return it
    const existingStream = await db.live_stream.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingStream) {
      // Return the existing stream instead of creating a new one
      console.log(`[Live] User ${user.id} already has active stream ${existingStream.id}, returning it`);

      return c.json({
        success: true,
        stream: {
          id: existingStream.id,
          roomUrl: existingStream.roomUrl,
          roomName: existingStream.roomName,
          userQuestId: existingStream.userQuestId,
          isActive: existingStream.isActive,
          viewerCount: existingStream.viewerCount,
          startedAt: existingStream.startedAt.toISOString(),
        },
        token: "existing-stream-token",
      } satisfies z.infer<typeof startLiveStreamResponseSchema>);
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
          const errorText = await roomResponse.text();
          throw new Error(`Daily.co room creation failed: ${roomResponse.status} ${roomResponse.statusText} - ${errorText}`);
        }

        const roomData = await roomResponse.json();
        if (!roomData.url) {
          throw new Error("Daily.co room creation succeeded but no URL returned");
        }
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
          const errorText = await tokenResponse.text();
          console.warn(`[Live] Daily.co token creation failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
          // Continue with mock token if token creation fails
        } else {
          const tokenData = await tokenResponse.json();
          if (tokenData.token) {
            token = tokenData.token;
          }
        }

        console.log(`[Live] Created Daily.co room: ${roomUrl}`);
      } catch (error: any) {
        console.error("[Live] Daily.co API error:", error);
        // Fall back to mock room if API fails
        console.log("[Live] Falling back to mock room");
        // Ensure we have valid values even if API fails
        roomUrl = `https://vibecode.daily.co/${roomName}`;
        token = "mock-token";
      }
    } else {
      console.log("[Live] No DAILY_API_KEY found, using mock room");
    }

    // Create live stream in database
    const liveStream = await db.live_stream.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        roomUrl,
        roomName,
        userQuestId,
        isActive: true,
        viewerCount: 0,
        updatedAt: new Date(),
      },
    });

    // Update profile to mark user as live (or create if doesn't exist)
    await db.profile.upsert({
      where: { userId: user.id },
      update: {
        isLive: true,
        liveViewers: 0,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        displayName: user.name || user.email || "User",
        isLive: true,
        liveViewers: 0,
        updatedAt: new Date(),
      },
    });

    const response: startLiveStreamResponseSchema._type = {
      success: true,
      liveStreamId: liveStream.id,
      roomUrl: liveStream.roomUrl,
      roomName: liveStream.roomName,
      token: token, // Return actual token from API or mock token
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

    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      return c.json({ error: "Live stream not found" }, 404);
    }

    if (liveStream.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // End the live stream
    await db.live_stream.update({
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
    const streams = await db.live_stream.findMany({
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
        user_quest: {
          include: {
            quest: {
              select: {
                title: true,
                description: true,
                category: true,
                goalCount: true,
                goalType: true,
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
        user_quest: stream.user_quest
          ? {
              id: stream.user_quest.id,
              noCount: stream.user_quest.noCount,
              yesCount: stream.user_quest.yesCount,
              actionCount: stream.user_quest.actionCount,
              quest: {
                title: stream.user_quest.quest.title,
                description: stream.user_quest.quest.description,
                category: stream.user_quest.quest.category,
                goalCount: stream.user_quest.quest.goalCount,
                goalType: stream.user_quest.quest.goalType,
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

    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream || !liveStream.isActive) {
      return c.json({ error: "Live stream not found or ended" }, 404);
    }

    const comment = await db.live_stream_comment.create({
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

    const comments = await db.live_stream_comment.findMany({
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

// POST /api/live/:id/suggest-quest - Suggest a quest to streamer
live.post("/:id/suggest-quest", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");
    const body = await c.req.json();
    const { questId, boostAmount, message } = suggestQuestToStreamerRequestSchema.parse(body);

    // Verify stream exists and is active
    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
      include: { user: true },
    });

    if (!liveStream || !liveStream.isActive) {
      return c.json({ error: "Live stream not found or ended" }, 404);
    }

    // Can't suggest quests to your own stream
    if (liveStream.userId === user.id) {
      return c.json({ error: "Cannot suggest quests to your own stream" }, 400);
    }

    // Verify quest exists
    const quest = await db.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return c.json({ error: "Quest not found" }, 404);
    }

    // Check if user has enough diamonds for boost
    if (boostAmount > 0) {
      const userStats = await db.user_stats.findUnique({
        where: { userId: user.id },
      });

      if (!userStats || userStats.diamonds < boostAmount) {
        return c.json({ error: "Insufficient diamonds for boost" }, 400);
      }

      // Deduct diamonds
      await db.user_stats.update({
        where: { userId: user.id },
        data: {
          diamonds: {
            decrement: boostAmount,
          },
        },
      });
    }

    // Create quest suggestion (will work once migration is run)
    try {
      const suggestion = await (db as any).questSuggestion.create({
        data: {
          liveStreamId,
          suggestedBy: user.id,
          questId,
          boostAmount,
          message,
          status: "pending",
        },
      });

      // Get updated diamond balance
      const updatedStats = await db.user_stats.findUnique({
        where: { userId: user.id },
      });

      const response: suggestQuestToStreamerResponseSchema._type = {
        success: true,
        suggestionId: suggestion.id,
        newDiamondBalance: updatedStats?.diamonds || 0,
      };

      return c.json(response);
    } catch (dbError) {
      console.error("[Live] Quest suggestion table not yet created:", dbError);
      return c.json({ error: "Quest suggestions feature coming soon - database migration pending" }, 503);
    }
  } catch (error) {
    console.error("Suggest quest error:", error);
    return c.json({ error: "Failed to suggest quest" }, 500);
  }
});

// GET /api/live/:id/quest-suggestions - Get pending quest suggestions for a stream
live.get("/:id/quest-suggestions", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");

    // Verify user owns this stream
    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      return c.json({ error: "Live stream not found" }, 404);
    }

    if (liveStream.userId !== user.id) {
      return c.json({ error: "Unauthorized - not your stream" }, 403);
    }

    try {
      // Get pending suggestions sorted by boost amount (highest first)
      const suggestions = await (db as any).questSuggestion.findMany({
        where: {
          liveStreamId,
          status: "pending",
        },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              difficulty: true,
              goalType: true,
              goalCount: true,
            },
          },
          suggester: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { boostAmount: "desc" }, // Highest boost first
          { createdAt: "asc" }, // Then oldest first
        ],
      });

      const response: getQuestSuggestionsResponseSchema._type = {
        suggestions: suggestions.map((s: any) => ({
          id: s.id,
          quest: s.quest,
          suggester: s.suggester,
          boostAmount: s.boostAmount,
          message: s.message,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        })),
      };

      return c.json(response);
    } catch (dbError) {
      console.error("[Live] Quest suggestion table not yet created:", dbError);
      return c.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Get quest suggestions error:", error);
    return c.json({ error: "Failed to get quest suggestions" }, 500);
  }
});

// POST /api/live/:id/respond-to-suggestion - Accept or decline a quest suggestion
live.post("/:id/respond-to-suggestion", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");
    const body = await c.req.json();
    const { suggestionId, action } = respondToSuggestionRequestSchema.parse(body);

    // Verify stream ownership
    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream || liveStream.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    try {
      // Get suggestion
      const suggestion = await (db as any).questSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          quest: true,
        },
      });

      if (!suggestion || suggestion.liveStreamId !== liveStreamId) {
        return c.json({ error: "Suggestion not found" }, 404);
      }

      if (suggestion.status !== "pending") {
        return c.json({ error: "Suggestion already responded to" }, 400);
      }

      if (action === "accept") {
        // Check active quests count
        const activeQuests = await db.user_quest.findMany({
          where: {
            userId: user.id,
            status: "active",
          },
        });

        if (activeQuests.length >= 2) {
          return c.json({ error: "Cannot accept - you already have 2 active quests" }, 400);
        }

        // Check if user already has this quest
        const existingUserQuest = await db.user_quest.findUnique({
          where: {
            userId_questId: {
              userId: user.id,
              questId: suggestion.questId,
            },
          },
        });

        if (existingUserQuest) {
          return c.json({ error: "You already have this quest" }, 400);
        }

        // Create UserQuest
        const userQuest = await db.user_quest.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            questId: suggestion.questId,
            status: "active",
            startedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update suggestion status
        await (db as any).questSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: "accepted",
            respondedAt: new Date(),
          },
        });

        // Update live stream to link this quest
        await db.live_stream.update({
          where: { id: liveStreamId },
          data: {
            userQuestId: userQuest.id,
          },
        });

        const response: respondToSuggestionResponseSchema._type = {
          success: true,
          userQuestId: userQuest.id,
          message: "Quest accepted and started!",
        };

        return c.json(response);
      } else {
        // Decline
        await (db as any).questSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: "declined",
            respondedAt: new Date(),
          },
        });

        const response: respondToSuggestionResponseSchema._type = {
          success: true,
          message: "Quest suggestion declined",
        };

        return c.json(response);
      }
    } catch (dbError) {
      console.error("[Live] Quest suggestion table not yet created:", dbError);
      return c.json({ error: "Quest suggestions feature coming soon - database migration pending" }, 503);
    }
  } catch (error) {
    console.error("Respond to suggestion error:", error);
    return c.json({ error: "Failed to respond to suggestion" }, 500);
  }
});

// ============================================
// POST /api/live/:id/record-quest-action - Record quest action for streamer's quest (viewers only)
// ============================================
live.post("/:id/record-quest-action", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const liveStreamId = c.req.param("id");
    const body = await c.req.json();
    const { action } = body; // "NO", "YES", or "ACTION"

    if (!["NO", "YES", "ACTION"].includes(action)) {
      return c.json({ error: "Invalid action. Must be NO, YES, or ACTION" }, 400);
    }

    // Get live stream with user quest
    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
      include: {
        user_quest: {
          include: {
            quest: true,
          },
        },
      },
    });

    if (!liveStream || !liveStream.isActive) {
      return c.json({ error: "Live stream not found or ended" }, 404);
    }

    if (!liveStream.user_quest) {
      return c.json({ error: "Streamer has no active quest" }, 400);
    }

    // Can't record actions for your own quest via this endpoint
    if (liveStream.userId === user.id) {
      return c.json({ error: "Use the quest detail screen to record your own quest actions" }, 400);
    }

    const userQuest = liveStream.user_quest;

    // Update counts based on action type
    const newNoCount = action === "NO" ? userQuest.noCount + 1 : userQuest.noCount;
    const newYesCount = action === "YES" ? userQuest.yesCount + 1 : userQuest.yesCount;
    const newActionCount = action === "ACTION" ? userQuest.actionCount + 1 : userQuest.actionCount;

    // Check if quest is completed
    const isCompleted =
      (userQuest.quest.goalType === "COLLECT_NOS" && newNoCount >= userQuest.quest.goalCount) ||
      (userQuest.quest.goalType === "COLLECT_YES" && newYesCount >= userQuest.quest.goalCount) ||
      (userQuest.quest.goalType === "TAKE_ACTION" && newActionCount >= userQuest.quest.goalCount);

    // Update user quest
    const updated = await db.user_quest.update({
      where: { id: userQuest.id },
      data: {
        noCount: newNoCount,
        yesCount: newYesCount,
        actionCount: newActionCount,
        ...(isCompleted && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    });

    // If completed, update streamer's stats
    if (isCompleted) {
      const { updateUserStats } = await import("./quests");
      await updateUserStats(
        liveStream.userId,
        userQuest.quest.xpReward,
        userQuest.quest.pointReward,
        userQuest.quest.difficulty
      );
    }

    return c.json({
      success: true,
      completed: isCompleted,
      noCount: newNoCount,
      yesCount: newYesCount,
      actionCount: newActionCount,
    });
  } catch (error) {
    console.error("Record quest action error:", error);
    return c.json({ error: "Failed to record quest action" }, 500);
  }
});

// ============================================
// POST /api/live/:id/link-quest - Link a quest to a live stream
// ============================================
const linkQuestSchema = z.object({
  userQuestId: z.string(),
});

live.post("/:id/link-quest", zValidator("json", linkQuestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const liveStreamId = c.req.param("id");
  const { userQuestId } = c.req.valid("json");

  try {
    // Verify the stream belongs to the user
    const liveStream = await db.live_stream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      return c.json({ error: "Live stream not found" }, 404);
    }

    if (liveStream.userId !== user.id) {
      return c.json({ error: "You can only link quests to your own stream" }, 403);
    }

    // Verify the quest belongs to the user
    const userQuest = await db.user_quest.findUnique({
      where: { id: userQuestId },
    });

    if (!userQuest) {
      return c.json({ error: "Quest not found" }, 404);
    }

    if (userQuest.userId !== user.id) {
      return c.json({ error: "You can only link your own quests" }, 403);
    }

    // Update the stream to link the quest
    await db.live_stream.update({
      where: { id: liveStreamId },
      data: {
        userQuestId: userQuestId,
      },
    });

    return c.json({ success: true, message: "Quest linked to stream" });
  } catch (error) {
    console.error("Link quest error:", error);
    return c.json({ error: "Failed to link quest" }, 500);
  }
});

export default live;
