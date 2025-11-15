import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const groupQuestsRouter = new Hono<AppType>();

// ============================================
// GET /api/group-quests/:groupId - Get all group quests for a group
// ============================================
groupQuestsRouter.get("/:groupId", async (c) => {
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

  // Get all group quests with participants
  const groupQuests = await db.groupQuest.findMany({
    where: { groupId },
    include: {
      quest: true,
      creator: {
        include: { Profile: true },
      },
      participants: {
        include: {
          user: {
            include: { Profile: true },
          },
        },
      },
      assignments: {
        include: {
          user: {
            include: { Profile: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedQuests = groupQuests.map((gq) => ({
    id: gq.id,
    groupId: gq.groupId,
    assignmentType: gq.assignmentType,
    createdAt: gq.createdAt.toISOString(),
    creator: {
      id: gq.creator.id,
      displayName: gq.creator.Profile?.displayName || gq.creator.email?.split("@")[0] || "User",
      avatar: gq.creator.Profile?.avatar || null,
    },
    quest: {
      id: gq.quest.id,
      title: gq.quest.title,
      description: gq.quest.description,
      category: gq.quest.category,
      difficulty: gq.quest.difficulty,
      goalType: gq.quest.goalType,
      goalCount: gq.quest.goalCount,
      xpReward: gq.quest.xpReward,
      pointReward: gq.quest.pointReward,
      location: gq.quest.location,
      latitude: gq.quest.latitude,
      longitude: gq.quest.longitude,
    },
    participants: gq.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.user.Profile?.displayName || p.user.email?.split("@")[0] || "User",
      avatar: p.user.Profile?.avatar || null,
      status: p.status,
      noCount: p.noCount,
      yesCount: p.yesCount,
      actionCount: p.actionCount,
      startedAt: p.startedAt?.toISOString() || null,
      completedAt: p.completedAt?.toISOString() || null,
      joinedAt: p.joinedAt.toISOString(),
    })),
    assignedMembers: gq.assignments.map((a) => ({
      userId: a.userId,
      displayName: a.user.Profile?.displayName || a.user.email?.split("@")[0] || "User",
      avatar: a.user.Profile?.avatar || null,
    })),
    userParticipation: gq.participants.find((p) => p.userId === user.id) || null,
  }));

  return c.json({ groupQuests: formattedQuests });
});

// ============================================
// POST /api/group-quests/create - Create a group quest
// ============================================
const createGroupQuestSchema = z.object({
  groupId: z.string(),
  questId: z.string(),
  assignmentType: z.enum(["all", "assigned"]).default("all"),
  assignedMemberIds: z.array(z.string()).optional(), // Only used if assignmentType is "assigned"
});

groupQuestsRouter.post("/create", zValidator("json", createGroupQuestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { groupId, questId, assignmentType, assignedMemberIds } = c.req.valid("json");

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

  // Check if quest exists
  const quest = await db.quest.findUnique({
    where: { id: questId },
  });

  if (!quest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Create the group quest
  const groupQuest = await db.groupQuest.create({
    data: {
      groupId,
      questId,
      createdBy: user.id,
      assignmentType,
    },
  });

  // If assigned, create assignments
  if (assignmentType === "assigned" && assignedMemberIds && assignedMemberIds.length > 0) {
    await Promise.all(
      assignedMemberIds.map((memberId) =>
        db.groupQuestAssignment.create({
          data: {
            groupQuestId: groupQuest.id,
            userId: memberId,
          },
        })
      )
    );
  }

  return c.json({ success: true, groupQuestId: groupQuest.id });
});

// ============================================
// POST /api/group-quests/:groupQuestId/join - Join a group quest
// ============================================
groupQuestsRouter.post("/:groupQuestId/join", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupQuestId = c.req.param("groupQuestId");

  // Get the group quest
  const groupQuest = await db.groupQuest.findUnique({
    where: { id: groupQuestId },
    include: {
      assignments: true,
    },
  });

  if (!groupQuest) {
    return c.json({ message: "Group quest not found" }, 404);
  }

  // Check if user is a member of the group
  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: groupQuest.groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You are not a member of this group" }, 403);
  }

  // If assigned quest, check if user is assigned
  if (groupQuest.assignmentType === "assigned") {
    const isAssigned = groupQuest.assignments.some((a) => a.userId === user.id);
    if (!isAssigned) {
      return c.json({ message: "This quest is only for assigned members" }, 403);
    }
  }

  // Check if already joined
  const existing = await db.groupQuestParticipant.findUnique({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    return c.json({ message: "You have already joined this quest" }, 400);
  }

  // Join the quest
  await db.groupQuestParticipant.create({
    data: {
      groupQuestId,
      userId: user.id,
      status: "joined",
    },
  });

  return c.json({ success: true, message: "Joined group quest successfully" });
});

// ============================================
// POST /api/group-quests/:groupQuestId/start - Start a group quest
// ============================================
groupQuestsRouter.post("/:groupQuestId/start", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupQuestId = c.req.param("groupQuestId");

  // Find participation
  const participation = await db.groupQuestParticipant.findUnique({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
  });

  if (!participation) {
    return c.json({ message: "You have not joined this quest" }, 404);
  }

  if (participation.status === "in_progress") {
    return c.json({ message: "Quest already started" }, 400);
  }

  if (participation.status === "completed") {
    return c.json({ message: "Quest already completed" }, 400);
  }

  // Start the quest
  await db.groupQuestParticipant.update({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
    data: {
      status: "in_progress",
      startedAt: new Date(),
    },
  });

  return c.json({ success: true, message: "Started group quest" });
});

// ============================================
// POST /api/group-quests/:groupQuestId/record - Record progress
// ============================================
const recordProgressSchema = z.object({
  action: z.enum(["no", "yes", "complete"]),
});

groupQuestsRouter.post("/:groupQuestId/record", zValidator("json", recordProgressSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupQuestId = c.req.param("groupQuestId");
  const { action } = c.req.valid("json");

  // Find participation
  const participation = await db.groupQuestParticipant.findUnique({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
    include: {
      groupQuest: {
        include: {
          quest: true,
        },
      },
    },
  });

  if (!participation) {
    return c.json({ message: "You have not joined this quest" }, 404);
  }

  const quest = participation.groupQuest.quest;

  // Update counts based on action
  let updateData: any = {};

  if (action === "no") {
    updateData.noCount = participation.noCount + 1;
  } else if (action === "yes") {
    updateData.yesCount = participation.yesCount + 1;
  } else if (action === "complete") {
    updateData.actionCount = participation.actionCount + 1;
  }

  // Check if quest is complete
  const newNoCount = updateData.noCount || participation.noCount;
  const newYesCount = updateData.yesCount || participation.yesCount;
  const newActionCount = updateData.actionCount || participation.actionCount;

  let isComplete = false;
  if (quest.goalType === "COLLECT_NOS" && newNoCount >= quest.goalCount) {
    isComplete = true;
  } else if (quest.goalType === "COLLECT_YES" && newYesCount >= quest.goalCount) {
    isComplete = true;
  } else if (quest.goalType === "TAKE_ACTION" && newActionCount >= quest.goalCount) {
    isComplete = true;
  }

  if (isComplete) {
    updateData.status = "completed";
    updateData.completedAt = new Date();
  } else if (participation.status === "joined") {
    updateData.status = "in_progress";
    updateData.startedAt = new Date();
  }

  // Update participation
  const updated = await db.groupQuestParticipant.update({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
    data: updateData,
  });

  return c.json({
    success: true,
    noCount: updated.noCount,
    yesCount: updated.yesCount,
    actionCount: updated.actionCount,
    isComplete,
    status: updated.status,
  });
});

// ============================================
// POST /api/group-quests/:groupQuestId/fail - Mark quest as failed
// ============================================
groupQuestsRouter.post("/:groupQuestId/fail", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupQuestId = c.req.param("groupQuestId");

  // Find participation
  const participation = await db.groupQuestParticipant.findUnique({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
  });

  if (!participation) {
    return c.json({ message: "You have not joined this quest" }, 404);
  }

  // Mark as failed
  await db.groupQuestParticipant.update({
    where: {
      groupQuestId_userId: {
        groupQuestId,
        userId: user.id,
      },
    },
    data: {
      status: "failed",
    },
  });

  return c.json({ success: true, message: "Quest marked as failed" });
});

export { groupQuestsRouter };
