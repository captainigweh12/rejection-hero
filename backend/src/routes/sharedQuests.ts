import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const sharedQuestsRouter = new Hono<AppType>();

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

  // Get active quests count
  const activeCount = await db.userQuest.count({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  // Create user quest (ACTIVE if less than 2 active, otherwise QUEUED)
  const status = activeCount < 2 ? "ACTIVE" : "QUEUED";

  await db.userQuest.create({
    data: {
      userId: user.id,
      questId: sharedQuest.questId,
      status,
      startedAt: status === "ACTIVE" ? new Date() : null,
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
