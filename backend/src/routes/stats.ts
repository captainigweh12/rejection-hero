import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetUserStatsResponse,
  type GetLeaderboardResponse,
  type GetReflectionPromptResponse,
  type GetCourageBoostResponse,
  type GetWeeklyForecastResponse,
  completeWarmupRequestSchema,
  type CompleteWarmupResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const statsRouter = new Hono<AppType>();

// ============================================
// GET /api/stats - Get user stats
// ============================================
statsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const stats = await db.user_stats.findUnique({
    where: { userId: user.id },
  });

  if (!stats) {
    // Auto-create user and stats if they don't exist (for session recovery after DB wipe)
    try {
      // First, check if user exists in database
      const userExists = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!userExists) {
        // User exists in session but not in database - recreate from session data
        console.log(`📝 [Stats] Recreating user ${user.id} from session (${user.email})`);
        await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified ?? false,
            name: user.name ?? null,
            image: user.image ?? null,
          },
        });
        console.log(`✅ [Stats] User ${user.id} recreated from session`);
      }

      // Create default stats
      const newStats = await db.user_stats.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          totalPoints: 0,
          trophies: 0,
          diamonds: 0,
          tokens: 0,
        },
      });

      return c.json({
        currentStreak: newStats.currentStreak,
        longestStreak: newStats.longestStreak,
        totalXP: newStats.totalXP,
        totalPoints: newStats.totalPoints,
        trophies: newStats.trophies,
        diamonds: newStats.diamonds,
        tokens: newStats.tokens || 0,
        confidenceLevel: newStats.confidenceLevel,
        previousConfidence: newStats.previousConfidence,
        confidenceChange: newStats.confidenceLevel - newStats.previousConfidence,
        dailyConfidenceMeter: newStats.dailyConfidenceMeter || 0,
        easyZoneCount: newStats.easyZoneCount,
        growthZoneCount: newStats.growthZoneCount,
        fearZoneCount: newStats.fearZoneCount,
        lastQuestAttemptAt: newStats.lastQuestAttemptAt?.toISOString() || null,
        lastQuestCompletedAt: newStats.lastQuestCompletedAt?.toISOString() || null,
        questCompletionRate: newStats.questCompletionRate,
        avgQuestDifficulty: newStats.avgQuestDifficulty,
        warmUpsCompleted: newStats.warmUpsCompleted,
        lastWarmUpAt: newStats.lastWarmUpAt?.toISOString() || null,
      } satisfies GetUserStatsResponse);
    } catch (error) {
      console.error(`❌ [Stats] Error recovering user/stats:`, error);
      throw error;
    }
  }

  return c.json({
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalXP: stats.totalXP,
    totalPoints: stats.totalPoints,
    trophies: stats.trophies,
    diamonds: stats.diamonds,
      tokens: stats.tokens || 0,
      confidenceLevel: stats.confidenceLevel,
      previousConfidence: stats.previousConfidence,
      confidenceChange: stats.confidenceLevel - stats.previousConfidence,
      dailyConfidenceMeter: stats.dailyConfidenceMeter || 0,
    easyZoneCount: stats.easyZoneCount,
    growthZoneCount: stats.growthZoneCount,
    fearZoneCount: stats.fearZoneCount,
    lastQuestAttemptAt: stats.lastQuestAttemptAt?.toISOString() || null,
    lastQuestCompletedAt: stats.lastQuestCompletedAt?.toISOString() || null,
    questCompletionRate: stats.questCompletionRate,
    avgQuestDifficulty: stats.avgQuestDifficulty,
    warmUpsCompleted: stats.warmUpsCompleted,
    lastWarmUpAt: stats.lastWarmUpAt?.toISOString() || null,
  } satisfies GetUserStatsResponse);
});

// ============================================
// GET /api/stats/leaderboard - Get leaderboard
// Supports period query param: "day", "week", "month", or "all" (default)
// ============================================
statsRouter.get("/leaderboard", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const periodParam = c.req.query("period") || "all";
  const period = (periodParam === "day" || periodParam === "week" || periodParam === "month" || periodParam === "all") 
    ? periodParam 
    : "all";
  const now = new Date();
  let startDate: Date | null = null;

  // Calculate start date based on period
  if (period === "day") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate = new Date(now);
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
  }

  // Get quest completions for the period
  let periodCompletions: { userId: string; count: number }[] = [];
  
  if (startDate) {
    // Count completed quests per user in the period
    const completedQuests = await db.user_quest.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: startDate,
        },
      },
      select: {
        userId: true,
      },
    });

    // Count completions per user
    const completionMap = new Map<string, number>();
    for (const quest of completedQuests) {
      completionMap.set(quest.userId, (completionMap.get(quest.userId) || 0) + 1);
    }

    periodCompletions = Array.from(completionMap.entries()).map(([userId, count]) => ({
      userId,
      count,
    }));
  }

  // Get all user stats
  const allUserStats = await db.user_stats.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate ranking based on period
  let rankedUsers: Array<{
    userId: string;
    userName: string;
    score: number;
    questsCompleted: number;
    totalXP: number;
    totalPoints: number;
    currentStreak: number;
  }> = [];

  for (const userStat of allUserStats) {
    const periodCompletionsCount = periodCompletions.find((p) => p.userId === userStat.userId)?.count || 0;
    
    let score: number;
    if (period === "all") {
      // For "all", use totalXP as score
      score = userStat.totalXP;
    } else {
      // For day/week/month, use quest completions in that period
      score = periodCompletionsCount;
    }

    rankedUsers.push({
      userId: userStat.user.id,
      userName: userStat.user.name || userStat.user.email || "Anonymous",
      score,
      questsCompleted: periodCompletionsCount,
      totalXP: userStat.totalXP,
      totalPoints: userStat.totalPoints,
      currentStreak: userStat.currentStreak,
    });
  }

  // Sort by score (descending)
  rankedUsers.sort((a, b) => b.score - a.score);

  // Get top 100
  const topUsers = rankedUsers.slice(0, 100);

  // Find current user's rank
  const currentUserIndex = rankedUsers.findIndex((u) => u.userId === user.id);
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : rankedUsers.length + 1;

  const leaderboard = topUsers.map((userData, index) => ({
    rank: index + 1,
    userId: userData.userId,
    userName: userData.userName,
    totalXP: userData.totalXP,
    totalPoints: userData.totalPoints,
    currentStreak: userData.currentStreak,
    questsCompleted: userData.questsCompleted,
    isCurrentUser: userData.userId === user.id,
  }));

  return c.json({
    leaderboard,
    currentUserRank,
    totalUsers: rankedUsers.length,
    period,
  } satisfies GetLeaderboardResponse);
});

// ============================================
// GET /api/stats/reflection-prompt - Get AI Reflection Prompt of the Day
// ============================================
statsRouter.get("/reflection-prompt", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // AI-generated reflection prompts that rotate based on user's journey
  const reflectionPrompts = [
    { prompt: "What did you learn from your last NO?", category: "reflection" },
    { prompt: "What fear are you avoiding right now?", category: "reflection" },
    { prompt: "When did you last step outside your comfort zone?", category: "reflection" },
    { prompt: "What would you attempt if you knew you couldn't fail?", category: "motivation" },
    { prompt: "How has rejection made you stronger this week?", category: "learning" },
    { prompt: "What's one uncomfortable conversation you've been avoiding?", category: "reflection" },
    { prompt: "How did today's NO move you closer to your goals?", category: "learning" },
    { prompt: "What's the smallest courageous act you can do right now?", category: "motivation" },
    { prompt: "How does discomfort feel different now than when you started?", category: "reflection" },
    { prompt: "What limiting belief did you challenge today?", category: "learning" },
  ];

  // Select prompt based on day of year for consistency
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const selectedPrompt = reflectionPrompts[dayOfYear % reflectionPrompts.length];

  return c.json({
    prompt: selectedPrompt.prompt,
    category: selectedPrompt.category,
    date: new Date().toISOString(),
  } satisfies GetReflectionPromptResponse);
});

// ============================================
// GET /api/stats/courage-boost - Get random courage boost notification
// ============================================
statsRouter.get("/courage-boost", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const stats = await db.user_stats.findUnique({
    where: { userId: user.id },
  });

  // Randomly decide if we should show a boost (30% chance)
  const shouldShow = Math.random() < 0.3;

  // Generate dynamic confidence percentage
  const baseConfidence = stats?.confidenceLevel || 50;
  const boost = Math.floor(Math.random() * 30) + 15; // 15-45% boost

  const boostMessages = [
    `Confidence Surge! You're ${boost}% more likely to get a YES right now. Try a quest!`,
    `Your courage is peaking! ${boost}% higher success rate detected. Strike while the iron's hot!`,
    `Energy spike detected! You're ${boost}% more confident than usual. Time to push boundaries!`,
    `Momentum alert! Your rejection resilience is ${boost}% stronger. Go for it!`,
    `Power mode activated! Your fear tolerance just jumped ${boost}%. Perfect time for a challenge!`,
  ];

  const randomMessage = boostMessages[Math.floor(Math.random() * boostMessages.length)];

  return c.json({
    message: randomMessage,
    confidence: boost,
    shouldShow,
  } satisfies GetCourageBoostResponse);
});

// ============================================
// GET /api/stats/weekly-forecast - Get AI prediction for the week
// ============================================
statsRouter.get("/weekly-forecast", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const stats = await db.user_stats.findUnique({
    where: { userId: user.id },
  });

  // Get user's quest history from the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentQuests = await db.user_quest.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: oneWeekAgo },
    },
    include: {
      quest: true,
    },
  });

  const completedQuests = recentQuests.filter((uq) => uq.status === "completed");
  const totalNOs = completedQuests.reduce((sum, uq) => sum + uq.noCount, 0);

  // Analyze trending category
  const categoryCounts: Record<string, number> = {};
  completedQuests.forEach((uq) => {
    const category = uq.quest.category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const trendingCategory = Object.keys(categoryCounts).length > 0
    ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
    : "social";

  // Generate personalized forecast
  const avgQuestDifficulty = stats?.avgQuestDifficulty || 1;
  let forecast = "";

  if (totalNOs === 0) {
    forecast = "Ready for a fresh start? This week is perfect for building momentum. Start with 3-5 small NOs to warm up your courage muscle.";
  } else if (totalNOs < 5) {
    forecast = `You're building consistency! Last week you collected ${totalNOs} NOs. This week, aim to double down on ${trendingCategory} challenges to build deeper confidence.`;
  } else if (totalNOs < 10) {
    forecast = `Strong momentum detected! ${totalNOs} NOs last week shows real commitment. Based on your pattern, you're trending toward more ${trendingCategory} challenges. Push for 10+ this week!`;
  } else {
    forecast = `Incredible progress! ${totalNOs} NOs last week puts you in the top tier. Your ${trendingCategory} focus is paying off. Consider leveling up to harder quests to maximize growth.`;
  }

  const recommendedTarget = Math.max(5, Math.ceil(totalNOs * 1.3)); // 30% increase

  // Generate AI motivations and accomplishments
  let motivations: string[] = [];
  let accomplishments: string[] = [];
  
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
    
    if (OPENAI_API_KEY) {
      const aiPrompt = `You are a motivational coach for a rejection therapy app. Based on the user's stats:
- Previous week NOs: ${totalNOs}
- Trending category: ${trendingCategory}
- Recommended target: ${recommendedTarget} NOs
- Average difficulty: ${avgQuestDifficulty}

Generate:
1. 3-5 specific, actionable motivations/challenges for this week (e.g., "Try asking for discounts at 3 different stores", "Pitch your idea to 2 local business owners")
2. 3-5 potential accomplishments they could achieve (e.g., "Complete your first HARD difficulty quest", "Reach 20 total NOs this week", "Master the ${trendingCategory} category")

Return ONLY a JSON object with this exact structure:
{
  "motivations": ["motivation 1", "motivation 2", ...],
  "accomplishments": ["accomplishment 1", "accomplishment 2", ...]
}

Make them specific, actionable, and encouraging. Focus on growth and building confidence.`;

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
              content: "You are a motivational coach. Return only valid JSON, no other text.",
            },
            { role: "user", content: aiPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            motivations?: string[];
            accomplishments?: string[];
          };
          motivations = parsed.motivations || [];
          accomplishments = parsed.accomplishments || [];
        }
      }
    }
  } catch (error) {
    console.error("Error generating AI motivations/accomplishments:", error);
    // Fallback motivations and accomplishments
    motivations = [
      `Aim for ${recommendedTarget} NOs this week`,
      `Focus on ${trendingCategory} challenges`,
      "Try one quest that pushes you out of your comfort zone",
    ];
    accomplishments = [
      `Reach ${recommendedTarget} total NOs`,
      `Complete a ${trendingCategory} quest`,
      "Build your confidence meter to 100%",
    ];
  }

  // If AI didn't generate enough, add fallbacks
  if (motivations.length === 0) {
    motivations = [
      `Aim for ${recommendedTarget} NOs this week`,
      `Focus on ${trendingCategory} challenges`,
      "Try one quest that pushes you out of your comfort zone",
    ];
  }
  if (accomplishments.length === 0) {
    accomplishments = [
      `Reach ${recommendedTarget} total NOs`,
      `Complete a ${trendingCategory} quest`,
      "Build your confidence meter to 100%",
    ];
  }

  return c.json({
    forecast,
    recommendedWeeklyTarget: recommendedTarget,
    trendingCategory,
    previousWeekNOs: totalNOs,
    motivations,
    accomplishments,
  } satisfies GetWeeklyForecastResponse);
});

// ============================================
// POST /api/stats/complete-warmup - Record a warm-up action completion
// ============================================
statsRouter.post("/complete-warmup", zValidator("json", completeWarmupRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  // Update stats with warm-up completion
  const stats = await db.user_stats.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      warmUpsCompleted: 1,
      lastWarmUpAt: new Date(),
      confidenceLevel: 52, // Small boost from warm-up
    },
    update: {
      warmUpsCompleted: { increment: 1 },
      lastWarmUpAt: new Date(),
      confidenceLevel: { increment: 2 }, // +2 confidence per warm-up
    },
  });

  return c.json({
    success: true,
    warmUpsCompleted: stats.warmUpsCompleted,
    confidenceBoost: 2,
  } satisfies CompleteWarmupResponse);
});

export { statsRouter };
