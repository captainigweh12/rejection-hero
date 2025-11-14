import { Hono } from "hono";
import { type GetUserStatsResponse, type GetLeaderboardResponse } from "@/shared/contracts";
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

// ============================================
// GET /api/stats/leaderboard - Get leaderboard
// ============================================
statsRouter.get("/leaderboard", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get top 100 users by totalXP
  const topUsers = await db.userStats.findMany({
    take: 100,
    orderBy: {
      totalXP: "desc",
    },
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

  // Find current user's rank
  const allUsersCount = await db.userStats.count();
  const currentUserStats = await db.userStats.findUnique({
    where: { userId: user.id },
  });

  const usersAbove = currentUserStats
    ? await db.userStats.count({
        where: {
          totalXP: {
            gt: currentUserStats.totalXP,
          },
        },
      })
    : 0;

  const userRank = usersAbove + 1;

  const leaderboard = topUsers.map((userStat, index) => ({
    rank: index + 1,
    userId: userStat.user.id,
    userName: userStat.user.name || userStat.user.email || "Anonymous",
    totalXP: userStat.totalXP,
    totalPoints: userStat.totalPoints,
    currentStreak: userStat.currentStreak,
    isCurrentUser: userStat.user.id === user.id,
  }));

  return c.json({
    leaderboard,
    currentUserRank: userRank,
    totalUsers: allUsersCount,
  } satisfies GetLeaderboardResponse);
});

export { statsRouter };
