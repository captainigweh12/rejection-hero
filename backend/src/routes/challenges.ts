import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";
import { generateQuestWithAI } from "./quests";
import { generateDailyChallengesForAllUsers, sendMotivationalNotifications } from "../services/challengeScheduler";

const challengesRouter = new Hono<AppType>();

// ============================================
// POST /api/challenges/enroll - Enroll in 100 Day Challenge
// ============================================
const enrollChallengeSchema = z.object({
  category: z.enum(["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"]),
});

challengesRouter.post("/enroll", zValidator("json", enrollChallengeSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Check if user already has an active challenge
    const existingChallenge = await db.challenge.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingChallenge) {
      return c.json({ message: "You already have an active 100 Day Challenge" }, 400);
    }

    // Calculate end date (100 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 100);

    // Create challenge
    const challenge = await db.challenge.create({
      data: {
        userId: user.id,
        category: c.req.valid("json").category,
        startDate,
        endDate,
        currentDay: 1,
        isActive: true,
        completedDays: 0,
      },
    });

    // Generate first day's quest
    await generateDailyChallengeQuest(challenge.id, 1, challenge.category);

    // Send welcome notification
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "CHALLENGE_STARTED",
        title: "🎯 100 Day Challenge Started!",
        message: `Your ${challenge.category} challenge begins today! Check your quest for Day 1.`,
        data: JSON.stringify({ challengeId: challenge.id, day: 1 }),
      },
    });

    return c.json({
      success: true,
      challenge: {
        id: challenge.id,
        category: challenge.category,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
        currentDay: challenge.currentDay,
        completedDays: challenge.completedDays,
      },
    });
  } catch (error) {
    console.error("Enroll challenge error:", error);
    return c.json({ message: "Failed to enroll in challenge" }, 500);
  }
});

// ============================================
// GET /api/challenges/active - Get active challenge
// ============================================
challengesRouter.get("/active", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const challenge = await db.challenge.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        challenge_daily_quest: {
          where: {
            day: { lte: 100 }, // Only get up to day 100
          },
          orderBy: {
            day: "desc",
          },
          include: {
            quest: true,
            user_quest: true,
          },
        },
      },
    });

    if (!challenge) {
      return c.json({ challenge: null });
    }

    // Calculate current day based on start date
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(1, daysSinceStart), 100);

    // Update current day if needed
    if (currentDay !== challenge.currentDay) {
      await db.challenge.update({
        where: { id: challenge.id },
        data: { currentDay },
      });
    }

    // Get today's quest
    const todayQuest = challenge.challenge_daily_quest.find((dq) => dq.day === currentDay);

    return c.json({
      challenge: {
        id: challenge.id,
        category: challenge.category,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
        currentDay,
        completedDays: challenge.completedDays,
        todayQuest: todayQuest
          ? {
              id: todayQuest.id,
              day: todayQuest.day,
              status: todayQuest.status,
              quest: todayQuest.quest
                ? {
                    id: todayQuest.quest.id,
                    title: todayQuest.quest.title,
                    description: todayQuest.quest.description,
                    category: todayQuest.quest.category,
                    goalCount: todayQuest.quest.goalCount,
                  }
                : null,
              userQuestId: todayQuest.user_questId,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get active challenge error:", error);
    return c.json({ message: "Failed to get challenge" }, 500);
  }
});

// ============================================
// POST /api/challenges/generate-daily - Generate today's quest (called by cron or manually)
// ============================================
challengesRouter.post("/generate-daily", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const challenge = await db.challenge.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (!challenge) {
      return c.json({ message: "No active challenge found" }, 404);
    }

    // Calculate current day
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(1, daysSinceStart), 100);

    // Check if quest already exists for today
    const existingQuest = await db.challenge_daily_quest.findUnique({
      where: {
        challengeId_day: {
          challengeId: challenge.id,
          day: currentDay,
        },
      },
    });

    if (existingQuest && existingQuest.status !== "PENDING") {
      return c.json({ message: "Quest already generated for today" }, 400);
    }

    // Generate quest
    const dailyQuest = await generateDailyChallengeQuest(challenge.id, currentDay, challenge.category);

    // Send notification
    const motivationMessages = getMotivationMessage(currentDay, challenge.category);
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "DAILY_CHALLENGE",
        title: `Day ${currentDay} Challenge Ready!`,
        message: motivationMessages.daily,
        data: JSON.stringify({ challengeId: challenge.id, day: currentDay, questId: dailyQuest.questId }),
      },
    });

    return c.json({
      success: true,
      dailyQuest: {
        id: dailyQuest.id,
        day: dailyQuest.day,
        questId: dailyQuest.questId,
      },
    });
  } catch (error) {
    console.error("Generate daily quest error:", error);
    return c.json({ message: "Failed to generate daily quest" }, 500);
  }
});

// ============================================
// Helper Functions
// ============================================

async function generateDailyChallengeQuest(challengeId: string, day: number, category: string) {
  // Determine difficulty based on day
  const difficulty = day <= 30 ? "EASY" : day <= 60 ? "MEDIUM" : day <= 80 ? "HARD" : "EXPERT";
  
  // Generate quest using AI
  const questData = await generateQuestWithAI(
    category,
    difficulty,
    `Create a Day ${day} rejection challenge for a 100 Day Challenge focused on ${category}. This should be a COLLECT_NOS quest that helps build confidence through rejection. Make it appropriate for day ${day} of the challenge - progressively challenging but achievable.`,
    undefined, // userId - not needed for quest creation
    undefined, // userLocation
    undefined, // userLatitude
    undefined, // userLongitude
    "REJECTION" // preferredQuestType
  );

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
      location: questData.location,
      latitude: questData.latitude,
      longitude: questData.longitude,
      timeContext: questData.timeContext,
      dateContext: questData.dateContext,
    },
  });

  // Create or update daily quest entry
  const dailyQuest = await db.challenge_daily_quest.upsert({
    where: {
      challengeId_day: {
        challengeId,
        day,
      },
    },
    create: {
      challengeId,
      day,
      questId: quest.id,
      status: "PENDING",
      generatedAt: new Date(),
    },
    update: {
      questId: quest.id,
      generatedAt: new Date(),
    },
  });

  return dailyQuest;
}

function getMotivationMessage(day: number, category: string): { daily: string; motivational: string } {
  const categoryNames: Record<string, string> = {
    SALES: "sales",
    SOCIAL: "social confidence",
    ENTREPRENEURSHIP: "entrepreneurship",
    DATING: "dating",
    CONFIDENCE: "confidence",
    CAREER: "career growth",
  };

  const categoryName = categoryNames[category] || "growth";

  const dailyMessages = [
    `Your Day ${day} challenge is ready! Keep building that ${categoryName} confidence! 💪`,
    `Day ${day} - You're ${day}% closer to your goal! Let's do this! 🎯`,
    `New challenge unlocked for Day ${day}! Every NO brings you closer to YES! 🚀`,
    `Day ${day} challenge waiting for you! You've got this! 💎`,
    `Ready for Day ${day}? Your ${categoryName} journey continues! 🌟`,
  ];

  const motivationalMessages = [
    `You're on Day ${day} of 100! That's ${day} days of courage. Keep going! 🔥`,
    `${day} days strong! You're building unstoppable ${categoryName} skills! 💪`,
    `Day ${day} - You're crushing it! Every challenge makes you stronger! 🎯`,
    `Amazing progress! Day ${day} shows your commitment to ${categoryName} growth! 🌟`,
    `Day ${day} complete! You're ${100 - day} days away from transformation! 🚀`,
  ];

  return {
    daily: dailyMessages[day % dailyMessages.length],
    motivational: motivationalMessages[day % motivationalMessages.length],
  };
}

// ============================================
// POST /api/challenges/cron/generate-daily - Cron endpoint to generate daily challenges (call this daily)
// ============================================
challengesRouter.post("/cron/generate-daily", async (c) => {
  // Optional: Add API key check for security
  const apiKey = c.req.header("X-API-Key");
  const expectedKey = process.env.CRON_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    await generateDailyChallengesForAllUsers();
    return c.json({ success: true, message: "Daily challenges generated" });
  } catch (error) {
    console.error("Cron generate daily error:", error);
    return c.json({ message: "Failed to generate daily challenges" }, 500);
  }
});

// ============================================
// POST /api/challenges/cron/send-motivation - Cron endpoint to send motivational notifications
// ============================================
challengesRouter.post("/cron/send-motivation", async (c) => {
  // Optional: Add API key check for security
  const apiKey = c.req.header("X-API-Key");
  const expectedKey = process.env.CRON_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    await sendMotivationalNotifications();
    return c.json({ success: true, message: "Motivational notifications sent" });
  } catch (error) {
    console.error("Cron send motivation error:", error);
    return c.json({ message: "Failed to send motivational notifications" }, 500);
  }
});

export default challengesRouter;

