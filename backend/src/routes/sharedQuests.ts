import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";

const sharedQuestsRouter = new Hono<AppType>();

// ============================================
// AI Safety Filtering Function
// ============================================
async function checkQuestSafety(description: string): Promise<{ isSafe: boolean; warning?: string; cleanDescription?: string }> {
  const OPENAI_API_KEY = env.OPENAI_API_KEY || env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.warn("⚠️ No OpenAI API key - skipping AI safety check");
    return { isSafe: true, cleanDescription: description };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a content safety moderator for a personal growth app called "Go for No".
The app helps users overcome fear of rejection through challenges.

Your job is to review quest descriptions and determine if they are safe and appropriate.

REJECT quests that involve:
- Illegal activities (theft, harassment, violence, fraud, trespassing)
- Harmful behavior (stalking, bullying, deception for malicious purposes)
- Inappropriate sexual content or advances
- Dangerous physical activities that could cause injury
- Privacy violations or unauthorized recording
- Manipulative or exploitative behavior
- Discrimination or hate speech

ALLOW quests that involve:
- Politely asking for things (discounts, favors, recommendations)
- Networking and professional outreach
- Social confidence building (compliments, small talk, public speaking)
- Sales and entrepreneurship practice
- Career advancement (job applications, pitching ideas)
- Dating (respectful approaches, asking for numbers/dates)
- Personal growth challenges (stepping outside comfort zone)

If the quest is SAFE, respond with JSON: {"safe": true, "description": "cleaned up description"}
If the quest is UNSAFE, respond with JSON: {"safe": false, "reason": "brief explanation"}

Important: Be permissive with rejection challenges - the app is about overcoming fear, not breaking rules.`,
          },
          {
            role: "user",
            content: `Review this quest description: "${description}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.statusText);
      return { isSafe: true, cleanDescription: description }; // Fail open
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return { isSafe: true, cleanDescription: description };
    }

    const safetyResult = JSON.parse(content);

    if (safetyResult.safe === false) {
      return {
        isSafe: false,
        warning: safetyResult.reason || "This quest was flagged as potentially unsafe or inappropriate.",
      };
    }

    return {
      isSafe: true,
      cleanDescription: safetyResult.description || description,
    };
  } catch (error) {
    console.error("Error in AI safety check:", error);
    return { isSafe: true, cleanDescription: description }; // Fail open on error
  }
}

// ============================================
// GET /api/shared-quests - Get received quest shares
// ============================================
sharedQuestsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuests = await db.sharedQuest.findMany({
    where: {
      receiverId: user.id,
    },
    include: {
      sender: {
        include: { Profile: true },
      },
      quest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatted = sharedQuests.map((sq) => ({
    id: sq.id,
    quest: {
      id: sq.quest.id,
      title: sq.quest.title,
      description: sq.quest.description,
      category: sq.quest.category,
      difficulty: sq.quest.difficulty,
      goalType: sq.quest.goalType,
      goalCount: sq.quest.goalCount,
      xpReward: sq.quest.xpReward,
      pointReward: sq.quest.pointReward,
    },
    sender: {
      id: sq.sender.id,
      displayName: sq.sender.Profile?.displayName || sq.sender.email?.split("@")[0] || "User",
      avatar: sq.sender.Profile?.avatar || null,
    },
    message: sq.message,
    status: sq.status,
    createdAt: sq.createdAt,
  }));

  return c.json({ sharedQuests: formatted });
});

// ============================================
// POST /api/shared-quests/share - Share a quest with friend
// ============================================
const shareQuestSchema = z.object({
  friendId: z.string(),
  questId: z.string(),
  message: z.string().max(500).optional(),
});

sharedQuestsRouter.post("/share", zValidator("json", shareQuestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { friendId, questId, message } = c.req.valid("json");

  // Check if quest exists
  const quest = await db.quest.findUnique({
    where: { id: questId },
  });

  if (!quest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Check if they are friends
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: user.id, receiverId: friendId, status: "ACCEPTED" },
        { initiatorId: friendId, receiverId: user.id, status: "ACCEPTED" },
      ],
    },
  });

  if (!friendship) {
    return c.json({ message: "You can only share quests with friends" }, 403);
  }

  // Create shared quest
  const sharedQuest = await db.sharedQuest.create({
    data: {
      senderId: user.id,
      receiverId: friendId,
      questId,
      message,
      status: "pending",
    },
  });

  return c.json({ success: true, sharedQuestId: sharedQuest.id });
});

// ============================================
// POST /api/shared-quests/:id/accept - Accept shared quest
// ============================================
sharedQuestsRouter.post("/:id/accept", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuestId = c.req.param("id");

  const sharedQuest = await db.sharedQuest.findUnique({
    where: { id: sharedQuestId },
  });

  if (!sharedQuest) {
    return c.json({ message: "Shared quest not found" }, 404);
  }

  if (sharedQuest.receiverId !== user.id) {
    return c.json({ message: "You can only accept quests shared with you" }, 403);
  }

  // Update status
  await db.sharedQuest.update({
    where: { id: sharedQuestId },
    data: { status: "accepted" },
  });

  // Check if user already has this quest
  const existingUserQuest = await db.userQuest.findUnique({
    where: {
      userId_questId: {
        userId: user.id,
        questId: sharedQuest.questId,
      },
    },
  });

  if (existingUserQuest) {
    return c.json({ success: true, message: "Quest already in your list" });
  }

  // Get active quests - check slots separately
  const activeQuests = await db.userQuest.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  // Count active user quests and friend quests
  const activeUserQuests = activeQuests.filter((q) => !q.isFromFriend);
  const activeFriendQuests = activeQuests.filter((q) => q.isFromFriend);

  // Determine status - friend quest uses friend slot (1 slot)
  const status = activeFriendQuests.length < 1 ? "ACTIVE" : "QUEUED";

  // Create user quest marked as from friend
  await db.userQuest.create({
    data: {
      userId: user.id,
      questId: sharedQuest.questId,
      status,
      startedAt: status === "ACTIVE" ? new Date() : null,
      isFromFriend: true, // Mark as friend quest
      sharedById: sharedQuest.senderId, // Track who shared it
    },
  });

  return c.json({ success: true, message: "Quest added to your list", status });
});

// ============================================
// POST /api/shared-quests/:id/decline - Decline shared quest
// ============================================
sharedQuestsRouter.post("/:id/decline", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuestId = c.req.param("id");

  const sharedQuest = await db.sharedQuest.findUnique({
    where: { id: sharedQuestId },
  });

  if (!sharedQuest) {
    return c.json({ message: "Shared quest not found" }, 404);
  }

  if (sharedQuest.receiverId !== user.id) {
    return c.json({ message: "You can only decline quests shared with you" }, 403);
  }

  // Update status
  await db.sharedQuest.update({
    where: { id: sharedQuestId },
    data: { status: "declined" },
  });

  return c.json({ success: true, message: "Quest declined" });
});

export { sharedQuestsRouter };

// ============================================
// POST /api/shared-quests/create-custom - Create custom quest and share with friend
// ============================================
const createCustomQuestSchema = z.object({
  friendId: z.string(),
  audioTranscript: z.string().optional(),
  textDescription: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  goalType: z.enum(["COLLECT_NOS", "COLLECT_YES", "TAKE_ACTION"]).optional(),
  goalCount: z.number().min(1).max(50).optional(),
  giftXP: z.number().min(0).max(10000).default(0),
  giftPoints: z.number().min(0).max(10000).default(0),
  message: z.string().max(500).optional(),
});

sharedQuestsRouter.post("/create-custom", zValidator("json", createCustomQuestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ success: false, message: "Unauthorized", isSafe: false }, 401);
  }

  const data = c.req.valid("json");
  const { friendId, audioTranscript, textDescription, category, difficulty, goalType, goalCount, giftXP, giftPoints, message } = data;

  // Check if they are friends
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: user.id, receiverId: friendId, status: "ACCEPTED" },
        { initiatorId: friendId, receiverId: user.id, status: "ACCEPTED" },
      ],
    },
  });

  if (!friendship) {
    return c.json({ success: false, message: "You can only share quests with friends", isSafe: false }, 403);
  }

  // Check user's balance if gifting points/XP
  if (giftXP > 0 || giftPoints > 0) {
    const userStats = await db.userStats.findUnique({
      where: { userId: user.id },
    });

    if (!userStats) {
      return c.json({
        success: false,
        message: "You need to complete a quest first to earn XP and Points before gifting!",
        isSafe: false,
      }, 400);
    }

    if (giftXP > userStats.totalXP) {
      return c.json({
        success: false,
        message: `You only have ${userStats.totalXP} XP. You can't gift ${giftXP} XP. Complete more quests to earn XP!`,
        isSafe: false,
      }, 400);
    }

    if (giftPoints > userStats.totalPoints) {
      return c.json({
        success: false,
        message: `You only have ${userStats.totalPoints} Points. You can't gift ${giftPoints} Points. Complete more quests to earn Points!`,
        isSafe: false,
      }, 400);
    }

    // Deduct from sender's balance
    await db.userStats.update({
      where: { userId: user.id },
      data: {
        totalXP: { decrement: giftXP },
        totalPoints: { decrement: giftPoints },
      },
    });
  }

  // Get description from voice or text
  const description = audioTranscript || textDescription;

  if (!description) {
    return c.json({
      success: false,
      message: "Please provide a quest description via voice or text",
      isSafe: false,
    }, 400);
  }

  // AI Safety Check
  console.log("🛡️ Running AI safety check on quest description...");
  const safetyCheck = await checkQuestSafety(description);

  if (!safetyCheck.isSafe) {
    // Refund XP/Points if quest was unsafe
    if (giftXP > 0 || giftPoints > 0) {
      await db.userStats.update({
        where: { userId: user.id },
        data: {
          totalXP: { increment: giftXP },
          totalPoints: { increment: giftPoints },
        },
      });
    }

    return c.json({
      success: false,
      message: "Quest cannot be created",
      isSafe: false,
      safetyWarning: safetyCheck.warning,
    }, 400);
  }

  console.log("✅ Quest passed safety check");

  // Determine quest parameters
  const finalCategory = category || "SOCIAL";
  const finalDifficulty = difficulty || "MEDIUM";
  const finalGoalType = goalType || "COLLECT_NOS";
  const finalGoalCount = goalCount || (finalDifficulty === "EASY" ? 3 : finalDifficulty === "MEDIUM" ? 5 : 8);

  // Calculate rewards
  const difficultyMultiplier = { EASY: 1, MEDIUM: 1.5, HARD: 2, EXPERT: 3 }[finalDifficulty] || 1;
  const baseXP = Math.floor(finalGoalCount * 10 * difficultyMultiplier) + 50;
  const basePoints = Math.floor(finalGoalCount * 20 * difficultyMultiplier) + 100;

  // Create the quest in the database
  const quest = await db.quest.create({
    data: {
      title: safetyCheck.cleanDescription?.substring(0, 50) || description.substring(0, 50),
      description: safetyCheck.cleanDescription || description,
      category: finalCategory,
      difficulty: finalDifficulty,
      goalType: finalGoalType,
      goalCount: finalGoalCount,
      xpReward: baseXP + giftXP,
      pointReward: basePoints + giftPoints,
      isAIGenerated: false,
    },
  });

  // Create shared quest with custom fields
  const sharedQuest = await db.sharedQuest.create({
    data: {
      senderId: user.id,
      receiverId: friendId,
      questId: quest.id,
      message,
      status: "pending",
      isCustomQuest: true,
      customTitle: quest.title,
      customDescription: quest.description,
      customCategory: finalCategory,
      customDifficulty: finalDifficulty,
      customGoalType: finalGoalType,
      customGoalCount: finalGoalCount,
      audioTranscript: audioTranscript || null,
      giftedXP: giftXP,
      giftedPoints: giftPoints,
    },
  });

  const userName = user.name || user.email || "A friend";
  const giftMessage = giftXP > 0 || giftPoints > 0 ? ` with ${giftXP} XP and ${giftPoints} Points!` : "!";

  // Create notification for friend
  await db.notification.create({
    data: {
      userId: friendId,
      senderId: user.id,
      type: "QUEST_SHARED",
      title: "Custom Quest Received!",
      message: `${userName} created a custom quest for you${giftMessage}`,
      read: false,
    },
  });

  console.log(`✅ Custom quest created and shared with friend ${friendId}`);
  console.log(`💎 Gifted: ${giftXP} XP, ${giftPoints} Points`);

  return c.json({
    success: true,
    sharedQuestId: sharedQuest.id,
    message: "Custom quest created and shared successfully!",
    quest: {
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      goalType: quest.goalType,
      goalCount: quest.goalCount,
      xpReward: quest.xpReward,
      pointReward: quest.pointReward,
    },
    isSafe: true,
  });
});
