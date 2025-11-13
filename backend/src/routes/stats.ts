import { Hono } from "hono";
import { type GetUserStatsResponse } from "@/shared/contracts";
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

  const stats = await db.userStats.findUnique({
    where: { userId: user.id },
  });

  if (!stats) {
    // Create default stats if not exists
    const newStats = await db.userStats.create({
      data: {
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        totalPoints: 0,
        trophies: 0,
        diamonds: 0,
      },
    });

    return c.json({
      currentStreak: newStats.currentStreak,
      longestStreak: newStats.longestStreak,
      totalXP: newStats.totalXP,
      totalPoints: newStats.totalPoints,
      trophies: newStats.trophies,
      diamonds: newStats.diamonds,
    } satisfies GetUserStatsResponse);
  }

  return c.json({
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalXP: stats.totalXP,
    totalPoints: stats.totalPoints,
    trophies: stats.trophies,
    diamonds: stats.diamonds,
  } satisfies GetUserStatsResponse);
});

export { statsRouter };
