import { db } from "../db";
import { sendPushNotificationForNotification } from "./pushNotifications";

/**
 * Check active quests and send time warning notifications
 * This should be called periodically (e.g., every minute)
 */
export async function checkQuestTimeWarnings(): Promise<{ warningsSent: number }> {
  try {
    const now = new Date();
    let warningsSent = 0;

    // Check if tables exist before querying
    try {
      // Test if user_quest table exists by checking a simple query
      await db.$queryRawUnsafe("SELECT 1 FROM user_quest LIMIT 1");
    } catch (error: any) {
      // If table doesn't exist (P2021), skip this check
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        console.log("⚠️  [Quest Time Warnings] user_quest table does not exist yet, skipping...");
        return { warningsSent: 0 };
      }
      throw error; // Re-throw other errors
    }

    // Get all active quests with their start times
    const activeQuests = await db.user_quest.findMany({
      where: {
        status: "ACTIVE",
        startedAt: { not: null },
      },
      include: {
        quest: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    for (const userQuest of activeQuests) {
      if (!userQuest.startedAt) continue;

      const startedAt = new Date(userQuest.startedAt);
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000); // seconds

      // Calculate quest duration based on difficulty
      const durationSettings: Record<string, number> = {
        EASY: 10 * 60, // 10 minutes
        MEDIUM: 15 * 60, // 15 minutes
        HARD: 20 * 60, // 20 minutes
        EXPERT: 30 * 60, // 30 minutes
      };

      const totalDuration = durationSettings[userQuest.quest.difficulty] || 15 * 60;
      const timeRemaining = totalDuration - elapsed;
      const timeRemainingMinutes = Math.floor(timeRemaining / 60);

      // Check if we should send warnings
      // Send warning at 5 minutes remaining
      if (timeRemaining > 0 && timeRemaining <= 5 * 60 && timeRemaining > 4 * 60) {
        // Check if we've already sent a 5-minute warning for this quest
        const recentNotifications = await db.notification.findMany({
          where: {
            userId: userQuest.userId,
            type: "QUEST_TIME_WARNING_5MIN",
            createdAt: {
              gte: new Date(now.getTime() - 2 * 60 * 1000), // Within last 2 minutes
            },
          },
        });

        const existingWarning = recentNotifications.find((n) => {
          try {
            const data = n.data ? JSON.parse(n.data) : {};
            return data.user_questId === userQuest.id;
          } catch {
            return false;
          }
        });

        if (!existingWarning) {
          await db.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: userQuest.userId,
              type: "QUEST_TIME_WARNING_5MIN",
              title: "⏰ Quest Time Warning",
              message: `Your quest "${userQuest.quest.title}" has 5 minutes remaining! Complete it before time runs out!`,
              data: JSON.stringify({
                userQuestId: userQuest.id,
                questId: userQuest.questId,
                type: "quest_time_warning_5min",
                timeRemaining: 5 * 60,
              }),
            },
          });

          await sendPushNotificationForNotification(
            userQuest.userId,
            "⏰ Quest Time Warning",
            `Your quest "${userQuest.quest.title}" has 5 minutes remaining!`,
            {
              type: "quest_time_warning_5min",
              userQuestId: userQuest.id,
              questId: userQuest.questId,
              timeRemaining: 5 * 60,
            }
          );

          warningsSent++;
        }
      }

      // Send warning at 1 minute remaining
      if (timeRemaining > 0 && timeRemaining <= 60 && timeRemaining > 30) {
        // Check if we've already sent a 1-minute warning for this quest
        const recentNotifications = await db.notification.findMany({
          where: {
            userId: userQuest.userId,
            type: "QUEST_TIME_WARNING_1MIN",
            createdAt: {
              gte: new Date(now.getTime() - 2 * 60 * 1000), // Within last 2 minutes
            },
          },
        });

        const existingWarning = recentNotifications.find((n) => {
          try {
            const data = n.data ? JSON.parse(n.data) : {};
            return data.user_questId === userQuest.id;
          } catch {
            return false;
          }
        });

        if (!existingWarning) {
          await db.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: userQuest.userId,
              type: "QUEST_TIME_WARNING_1MIN",
              title: "🚨 Final Warning!",
              message: `Hurry! Your quest "${userQuest.quest.title}" has only 1 minute left!`,
              data: JSON.stringify({
                userQuestId: userQuest.id,
                questId: userQuest.questId,
                type: "quest_time_warning_1min",
                timeRemaining: 60,
              }),
            },
          });

          await sendPushNotificationForNotification(
            userQuest.userId,
            "🚨 Final Warning!",
            `Hurry! Your quest "${userQuest.quest.title}" has only 1 minute left!`,
            {
              type: "quest_time_warning_1min",
              userQuestId: userQuest.id,
              questId: userQuest.questId,
              timeRemaining: 60,
            }
          );

          warningsSent++;
        }
      }
    }

    return { warningsSent };
  } catch (error) {
    console.error("Error checking quest time warnings:", error);
    return { warningsSent: 0 };
  }
}

/**
 * Send quest reminder notifications to users with active quests
 * This can be called to remind users to complete their quests
 */
export async function sendQuestReminders(): Promise<{ remindersSent: number }> {
  try {
    let remindersSent = 0;

    // Check if tables exist before querying
    try {
      await db.$queryRawUnsafe("SELECT 1 FROM user_quest LIMIT 1");
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        console.log("⚠️  [Quest Reminders] user_quest table does not exist yet, skipping...");
        return { remindersSent: 0 };
      }
      throw error;
    }

    // Get all active quests that started more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeQuests = await db.user_quest.findMany({
      where: {
        status: "ACTIVE",
        startedAt: {
          lte: fiveMinutesAgo, // Started more than 5 minutes ago
        },
      },
      include: {
        quest: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    for (const userQuest of activeQuests) {
      // Check if we've sent a reminder in the last hour
      const recentNotifications = await db.notification.findMany({
        where: {
          userId: userQuest.userId,
          type: "QUEST_REMINDER",
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
          },
        },
      });

      const recentReminder = recentNotifications.find((n) => {
        try {
          const data = n.data ? JSON.parse(n.data) : {};
          return data.user_questId === userQuest.id;
        } catch {
          return false;
        }
      });

      if (!recentReminder) {
        const progress =
          userQuest.quest.goalType === "COLLECT_NOS"
            ? userQuest.noCount
            : userQuest.quest.goalType === "COLLECT_YES"
            ? userQuest.yesCount
            : userQuest.actionCount;

        await db.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: userQuest.userId,
            type: "QUEST_REMINDER",
            title: "📋 Quest Reminder",
            message: `Don't forget your quest: "${userQuest.quest.title}" (${progress}/${userQuest.quest.goalCount} progress)`,
            data: JSON.stringify({
              userQuestId: userQuest.id,
              questId: userQuest.questId,
              type: "quest_reminder",
              progress,
              goalCount: userQuest.quest.goalCount,
            }),
          },
        });

        await sendPushNotificationForNotification(
          userQuest.userId,
          "📋 Quest Reminder",
          `Don't forget your quest: "${userQuest.quest.title}" (${progress}/${userQuest.quest.goalCount} progress)`,
          {
            type: "quest_reminder",
            userQuestId: userQuest.id,
            questId: userQuest.questId,
            progress,
            goalCount: userQuest.quest.goalCount,
          }
        );

        remindersSent++;
      }
    }

    return { remindersSent };
  } catch (error) {
    console.error("Error sending quest reminders:", error);
    return { remindersSent: 0 };
  }
}

