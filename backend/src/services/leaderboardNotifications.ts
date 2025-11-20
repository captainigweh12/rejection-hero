import { db } from "../db";

/**
 * Check if users have fallen behind in leaderboard and send notifications
 * This should be called periodically (e.g., every hour or when quests are completed)
 */
export async function checkLeaderboardFallBehind() {
  const now = new Date();
  
  // Get leaderboard for current period (day, week, month)
  const periods: Array<{ key: "day" | "week" | "month"; startDate: Date }> = [
    {
      key: "day",
      startDate: (() => {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        return date;
      })(),
    },
    {
      key: "week",
      startDate: (() => {
        const date = new Date(now);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
      })(),
    },
    {
      key: "month",
      startDate: (() => {
        const date = new Date(now.getFullYear(), now.getMonth(), 1);
        date.setHours(0, 0, 0, 0);
        return date;
      })(),
    },
  ];

  let notificationCount = 0;

  for (const period of periods) {
    // Get quest completions for this period
    const completedQuests = await db.user_quest.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: period.startDate,
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

    // Get all users with stats
    const allUserStats = await db.user_stats.findMany({
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate rankings
    const rankings = allUserStats.map((userStat) => {
      const completions = completionMap.get(userStat.userId) || 0;
      return {
        userId: userStat.userId,
        completions,
      };
    });

    rankings.sort((a, b) => b.completions - a.completions);

    // Check each user's position and if they've fallen behind
    for (let i = 0; i < rankings.length; i++) {
      const userRanking = rankings[i];
      const userRank = i + 1;

      // Get user's previous rank (stored in a notification or we track it)
      // For now, we'll check if user is in bottom 50% and hasn't completed a quest recently
      const isInBottomHalf = userRank > rankings.length / 2;
      const hasNoCompletions = userRanking.completions === 0;

      // Check if user has completed a quest in the last 24 hours
      const lastQuestCompletion = await db.user_quest.findFirst({
        where: {
          userId: userRanking.userId,
          status: "COMPLETED",
          completedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          completedAt: "desc",
        },
      });

      // Send notification if:
      // 1. User is in bottom 50% AND hasn't completed a quest in last 24 hours
      // 2. OR user has 0 completions in the period
      if ((isInBottomHalf && !lastQuestCompletion) || hasNoCompletions) {
        // Check user's notification preferences
        const profile = await db.profile.findUnique({
          where: { userId: userRanking.userId },
          select: { notificationPreferences: true },
        });

        let shouldNotify = true;
        if (profile?.notificationPreferences) {
          try {
            const prefs = JSON.parse(profile.notificationPreferences);
            shouldNotify = prefs.leaderboardFallBehind !== false; // Default to true if not set
          } catch {
            // Use default
          }
        }

        if (shouldNotify) {
          // Check if we've already sent a notification for this period today
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);

          const existingNotification = await db.notification.findFirst({
            where: {
              userId: userRanking.userId,
              type: "LEADERBOARD_FALL_BEHIND",
              createdAt: {
                gte: todayStart,
              },
            },
          });

          if (!existingNotification) {
            // Create notification with push notification
            const notification = await db.notification.create({
              data: {
                userId: userRanking.userId,
                type: "LEADERBOARD_FALL_BEHIND",
                title: "📉 You're Falling Behind!",
                message: `You're ranked #${userRank} of ${rankings.length}. Complete a quest to climb the ${period.key === "day" ? "daily" : period.key === "week" ? "weekly" : "monthly"} leaderboard!`,
                data: JSON.stringify({
                  type: "leaderboard_fall_behind",
                  period: period.key,
                  rank: userRank,
                  totalUsers: rankings.length,
                }),
              },
            });

            // Send push notification
            try {
              const { sendPushNotificationForNotification } = await import("./pushNotifications");
              await sendPushNotificationForNotification(
                userRanking.userId,
                notification.title,
                notification.message,
                JSON.parse(notification.data || "{}")
              );
            } catch (error) {
              console.error("Error sending leaderboard push notification:", error);
              // Continue even if push notification fails
            }

            notificationCount++;
          }
        }
      }
    }
  }

  console.log(`✅ [Leaderboard Notifications] Sent ${notificationCount} fall-behind notifications`);
  
  return { notificationCount };
}

