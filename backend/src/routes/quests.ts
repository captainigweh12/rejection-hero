import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetUserQuestsResponse,
  generateQuestRequestSchema,
  type GenerateQuestResponse,
  type StartQuestResponse,
  recordQuestActionRequestSchema,
  type RecordQuestActionResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const questsRouter = new Hono<AppType>();

// ============================================
// GET /api/quests - Get user's quests
// ============================================
questsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuests = await db.userQuest.findMany({
    where: { userId: user.id },
    include: {
      quest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeQuests = userQuests
    .filter((uq) => uq.status === "ACTIVE")
    .map((uq) => ({
      id: uq.id,
      quest: {
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        category: uq.quest.category,
        difficulty: uq.quest.difficulty,
        goalType: uq.quest.goalType,
        goalCount: uq.quest.goalCount,
        xpReward: uq.quest.xpReward,
        pointReward: uq.quest.pointReward,
      },
      noCount: uq.noCount,
      yesCount: uq.yesCount,
      status: uq.status,
      startedAt: uq.startedAt?.toISOString() || null,
    }));

  const queuedQuests = userQuests
    .filter((uq) => uq.status === "QUEUED")
    .map((uq) => ({
      id: uq.id,
      quest: {
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        category: uq.quest.category,
        difficulty: uq.quest.difficulty,
      },
    }));

  return c.json({
    activeQuests,
    queuedQuests,
  } satisfies GetUserQuestsResponse);
});

// ============================================
// POST /api/quests/generate - Generate AI quest
// ============================================
questsRouter.post("/generate", zValidator("json", generateQuestRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { category, difficulty, customPrompt } = c.req.valid("json");

  // Generate quest using OpenAI
  const questData = await generateQuestWithAI(category, difficulty, customPrompt, user.id);

  // Create quest in database
  const quest = await db.quest.create({
    data: {
      title: questData.title,
      description: questData.description,
      category: questData.category,
      difficulty: questData.difficulty,
      goalType: questData.goalType,
      goalCount: questData.goalCount,
      xpReward: questData.xpReward,
      pointReward: questData.pointReward,
      isAIGenerated: true,
    },
  });

  // Create user quest
  const userQuest = await db.userQuest.create({
    data: {
      userId: user.id,
      questId: quest.id,
      status: "QUEUED",
    },
  });

  return c.json({
    success: true,
    userQuestId: userQuest.id,
    quest: {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      goalType: quest.goalType,
      goalCount: quest.goalCount,
      xpReward: quest.xpReward,
      pointReward: quest.pointReward,
    },
  } satisfies GenerateQuestResponse);
});

// ============================================
// POST /api/quests/:id/start - Start a quest
// ============================================
questsRouter.post("/:id/start", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");

  // Check active quests limit (max 2)
  const activeCount = await db.userQuest.count({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  if (activeCount >= 2) {
    return c.json({ message: "Maximum 2 active quests allowed" }, 400);
  }

  // Update quest status
  const userQuest = await db.userQuest.update({
    where: { id: userQuestId },
    data: {
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    userQuestId: userQuest.id,
  } satisfies StartQuestResponse);
});

// ============================================
// POST /api/quests/:id/record - Record NO or YES
// ============================================
questsRouter.post("/:id/record", zValidator("json", recordQuestActionRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");
  const { action } = c.req.valid("json");

  const userQuest = await db.userQuest.findUnique({
    where: { id: userQuestId },
    include: { quest: true },
  });

  if (!userQuest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Update counts
  const newNoCount = action === "NO" ? userQuest.noCount + 1 : userQuest.noCount;
  const newYesCount = action === "YES" ? userQuest.yesCount + 1 : userQuest.yesCount;

  // Check if quest is completed
  const isCompleted =
    (userQuest.quest.goalType === "COLLECT_NOS" && newNoCount >= userQuest.quest.goalCount) ||
    (userQuest.quest.goalType === "COLLECT_YES" && newYesCount >= userQuest.quest.goalCount);

  // Update user quest
  const updated = await db.userQuest.update({
    where: { id: userQuestId },
    data: {
      noCount: newNoCount,
      yesCount: newYesCount,
      ...(isCompleted && {
        status: "COMPLETED",
        completedAt: new Date(),
      }),
    },
  });

  // If completed, update user stats
  if (isCompleted) {
    await updateUserStats(user.id, userQuest.quest.xpReward, userQuest.quest.pointReward);
  }

  return c.json({
    success: true,
    completed: isCompleted,
    noCount: newNoCount,
    yesCount: newYesCount,
  } satisfies RecordQuestActionResponse);
});

// ============================================
// Helper Functions
// ============================================

async function generateQuestWithAI(
  category?: string,
  difficulty?: string,
  customPrompt?: string,
  userId?: string
): Promise<{
  title: string;
  description: string;
  category: string;
  difficulty: string;
  goalType: string;
  goalCount: number;
  xpReward: number;
  pointReward: number;
}> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    // Fallback to predefined quests if no API key
    return getPredefinedQuest(category, difficulty);
  }

  try {
    // Get user's previous quests to avoid duplicates
    let previousQuestTitles: string[] = [];
    if (userId) {
      const userQuests = await db.userQuest.findMany({
        where: { userId },
        include: { quest: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
      previousQuestTitles = userQuests.map((uq) => uq.quest.title);
    }

    const previousQuestsContext =
      previousQuestTitles.length > 0
        ? `\n\nIMPORTANT: Do NOT create quests similar to these previous quests:\n${previousQuestTitles.join("\n")}\n\nCreate a completely NEW and UNIQUE challenge.`
        : "";

    const prompt = customPrompt
      ? `Create a "Go for No" rejection challenge based on: ${customPrompt}.

REQUIREMENTS:
- Title MUST be exactly 3 words (action statement, e.g., "Ask Coffee Shops", "Request Business Cards", "Pitch Startup Idea")
- Description should be 2-3 sentences explaining the specific challenge
- Make it actionable and specific
- Category: SALES/SOCIAL/ENTREPRENEURSHIP/DATING/CONFIDENCE/CAREER
- Difficulty: EASY/MEDIUM/HARD/EXPERT
- goalType: COLLECT_NOS (most common) or COLLECT_YES
- goalCount: number of NOs or YESes to collect (3-15 based on difficulty)
${previousQuestsContext}

Return a JSON object with: title (exactly 3 words), description, category, difficulty, goalType, goalCount.`
      : `Create a unique "Go for No" rejection challenge for ${category || "general"} category at ${difficulty || "medium"} difficulty level.

REQUIREMENTS:
- Title MUST be exactly 3 words (action statement, e.g., "Ask Coffee Shops", "Request Business Cards", "Pitch Startup Idea")
- Description should be 2-3 sentences with specific, actionable instructions
- The goal is to help users overcome fear of rejection by collecting "NO" responses
- Make each challenge unique and creative
- Category: ${category || "SALES/SOCIAL/ENTREPRENEURSHIP/DATING/CONFIDENCE/CAREER"}
- Difficulty: ${difficulty || "EASY/MEDIUM/HARD/EXPERT"}
- goalType: COLLECT_NOS (primary) or COLLECT_YES (rare)
- goalCount:
  * EASY: 3-5 NOs
  * MEDIUM: 5-8 NOs
  * HARD: 8-12 NOs
  * EXPERT: 12-15 NOs
${previousQuestsContext}

Return a JSON object with: title (exactly 3 words), description, category, difficulty, goalType, goalCount.`;

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
            content:
              "You are a creative motivational coach creating unique rejection challenges. Each title MUST be exactly 3 words. Each challenge must be completely unique and different from previous challenges. Be specific and actionable.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9, // Higher temperature for more creativity and uniqueness
      }),
    });

    const data = await response.json();
    const questData = JSON.parse(data.choices[0].message.content);

    // Ensure title is 3 words
    const titleWords = questData.title.split(" ");
    if (titleWords.length > 3) {
      questData.title = titleWords.slice(0, 3).join(" ");
    } else if (titleWords.length < 3) {
      // Pad with action words if needed
      while (questData.title.split(" ").length < 3) {
        questData.title += " Challenge";
      }
    }

    // Calculate rewards based on difficulty
    const difficultyMultiplier = {
      EASY: 1,
      MEDIUM: 1.5,
      HARD: 2,
      EXPERT: 3,
    }[questData.difficulty] || 1;

    return {
      ...questData,
      xpReward: Math.round(questData.goalCount * 10 * difficultyMultiplier + 50),
      pointReward: Math.round(questData.goalCount * 20 * difficultyMultiplier + 100),
    };
  } catch (error) {
    console.error("AI generation failed, using predefined quest:", error);
    return getPredefinedQuest(category, difficulty);
  }
}

function getPredefinedQuest(category?: string, difficulty?: string) {
  const quests = [
    {
      title: "Coffee Shop Challenge",
      description:
        "Ask 5 coffee shops for an item that's not on their menu. Practice handling rejection in a low-stakes environment.",
      category: "CONFIDENCE",
      difficulty: "EASY",
      goalType: "COLLECT_NOS",
      goalCount: 5,
      xpReward: 100,
      pointReward: 200,
    },
    {
      title: "Social Connection Quest",
      description:
        "Ask 3 strangers for a small favor (time, directions, recommendation). Build confidence in social interactions.",
      category: "SOCIAL",
      difficulty: "MEDIUM",
      goalType: "COLLECT_NOS",
      goalCount: 3,
      xpReward: 150,
      pointReward: 300,
    },
    {
      title: "Sales Pitch Practice",
      description:
        "Pitch your product/service to 10 people. Focus on the process, not the outcome. Every NO is progress.",
      category: "SALES",
      difficulty: "HARD",
      goalType: "COLLECT_NOS",
      goalCount: 10,
      xpReward: 250,
      pointReward: 500,
    },
  ];

  return quests[Math.floor(Math.random() * quests.length)];
}

async function updateUserStats(userId: string, xpReward: number, pointReward: number) {
  await db.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalXP: xpReward,
      totalPoints: pointReward,
      currentStreak: 1,
      longestStreak: 1,
      trophies: 0,
      diamonds: 0,
    },
    update: {
      totalXP: { increment: xpReward },
      totalPoints: { increment: pointReward },
      lastActiveAt: new Date(),
    },
  });
}

export { questsRouter };
