import { db } from "../db";
import { generateQuestWithAI } from "../routes/quests";

/**
 * Generate daily challenges for all active challenges
 * This should be called daily (via cron job or scheduled task)
 */
export async function generateDailyChallengesForAllUsers() {
  console.log("[Challenge Scheduler] Starting daily challenge generation...");

  try {
    // Get all active challenges
    const activeChallenges = await db.challenge.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    console.log(`[Challenge Scheduler] Found ${activeChallenges.length} active challenges`);

    for (const challenge of activeChallenges) {
      try {
        // Calculate current day
        const today = new Date();
        const daysSinceStart = Math.floor((today.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const currentDay = Math.min(Math.max(1, daysSinceStart), 100);

        // Check if challenge is still active (not past 100 days)
        if (currentDay > 100) {
          // Mark challenge as inactive
          await db.challenge.update({
            where: { id: challenge.id },
            data: { isActive: false },
          });
          console.log(`[Challenge Scheduler] Challenge ${challenge.id} completed (100 days)`);
          continue;
        }

        // Check if quest already exists for today
        const existingQuest = await db.challengeDailyQuest.findUnique({
          where: {
            challengeId_day: {
              challengeId: challenge.id,
              day: currentDay,
            },
          },
        });

        if (existingQuest && existingQuest.status !== "PENDING") {
          console.log(`[Challenge Scheduler] Quest already exists for challenge ${challenge.id}, day ${currentDay}`);
          continue;
        }

        // Generate quest
        const difficulty = currentDay <= 30 ? "EASY" : currentDay <= 60 ? "MEDIUM" : currentDay <= 80 ? "HARD" : "EXPERT";
        const questData = await generateQuestWithAI(
          challenge.category,
          difficulty,
          `Create a Day ${currentDay} rejection challenge for a 100 Day Challenge focused on ${challenge.category}. This should be a COLLECT_NOS quest that helps build confidence through rejection. Make it appropriate for day ${currentDay} of the challenge - progressively challenging but achievable.`,
          challenge.userId,
          undefined,
          undefined,
          undefined,
          "REJECTION"
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
        const dailyQuest = await db.challengeDailyQuest.upsert({
          where: {
            challengeId_day: {
              challengeId: challenge.id,
              day: currentDay,
            },
          },
          create: {
            challengeId: challenge.id,
            day: currentDay,
            questId: quest.id,
            status: "PENDING",
            generatedAt: new Date(),
          },
          update: {
            questId: quest.id,
            generatedAt: new Date(),
          },
        });

        // Create user quest and auto-start it
        const userQuest = await db.userQuest.create({
          data: {
            userId: challenge.userId,
            questId: quest.id,
            status: "ACTIVE",
            startedAt: new Date(),
          },
        });

        // Link user quest to daily quest
        await db.challengeDailyQuest.update({
          where: { id: dailyQuest.id },
          data: {
            userQuestId: userQuest.id,
            status: "ACTIVE",
          },
        });

        // Send notification with motivation and push notification
        const motivationMessages = getMotivationMessage(currentDay, challenge.category);
        const notification = await db.notification.create({
          data: {
            userId: challenge.userId,
            type: "DAILY_CHALLENGE",
            title: `Day ${currentDay} Challenge Ready! 🎯`,
            message: motivationMessages.daily,
            data: JSON.stringify({ challengeId: challenge.id, day: currentDay, questId: quest.id, userQuestId: userQuest.id }),
          },
        });

        // Send push notification
        try {
          const { sendPushNotificationForNotification } = await import("./pushNotifications");
          await sendPushNotificationForNotification(
            challenge.userId,
            notification.title,
            notification.message,
            JSON.parse(notification.data || "{}")
          );
        } catch (error) {
          console.error("Error sending daily challenge push notification:", error);
          // Continue even if push notification fails
        }

        // Send additional motivational notification (random chance)
        if (Math.random() < 0.3) {
          // 30% chance to send extra motivation
          const motivationNotification = await db.notification.create({
            data: {
              userId: challenge.userId,
              type: "CHALLENGE_MOTIVATION",
              title: "💪 Keep Going!",
              message: motivationMessages.motivational,
              data: JSON.stringify({ challengeId: challenge.id, day: currentDay }),
            },
          });

          // Send push notification
          try {
            const { sendPushNotificationForNotification } = await import("./pushNotifications");
            await sendPushNotificationForNotification(
              challenge.userId,
              motivationNotification.title,
              motivationNotification.message,
              JSON.parse(motivationNotification.data || "{}")
            );
          } catch (error) {
            console.error("Error sending motivation push notification:", error);
            // Continue even if push notification fails
          }
        }

        console.log(`[Challenge Scheduler] Generated quest for challenge ${challenge.id}, day ${currentDay}`);
      } catch (error) {
        console.error(`[Challenge Scheduler] Error generating quest for challenge ${challenge.id}:`, error);
      }
    }

    console.log("[Challenge Scheduler] Daily challenge generation completed");
  } catch (error) {
    console.error("[Challenge Scheduler] Error in daily challenge generation:", error);
  }
}

/**
 * Send motivational notifications to users with active challenges
 * This can be called multiple times per day
 */
export async function sendMotivationalNotifications() {
  console.log("[Challenge Scheduler] Sending motivational notifications...");

  try {
    const activeChallenges = await db.challenge.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    for (const challenge of activeChallenges) {
      try {
        const today = new Date();
        const daysSinceStart = Math.floor((today.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const currentDay = Math.min(Math.max(1, daysSinceStart), 100);

        // Only send motivation on certain days (milestones)
        if ([7, 14, 21, 30, 50, 75, 90, 100].includes(currentDay)) {
          const motivationMessages = getMotivationMessage(currentDay, challenge.category);
          await db.notification.create({
            data: {
              userId: challenge.userId,
              type: "CHALLENGE_MOTIVATION",
              title: `🎉 Day ${currentDay} Milestone!`,
              message: motivationMessages.motivational,
              data: JSON.stringify({ challengeId: challenge.id, day: currentDay }),
            },
          });
        }
      } catch (error) {
        console.error(`[Challenge Scheduler] Error sending motivation for challenge ${challenge.id}:`, error);
      }
    }

    console.log("[Challenge Scheduler] Motivational notifications sent");
  } catch (error) {
    console.error("[Challenge Scheduler] Error sending motivational notifications:", error);
  }
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
    `Incredible! ${day} days of facing your fears. You're unstoppable! 💎`,
    `Day ${day} - Look how far you've come! Keep pushing forward! 🌟`,
  ];

  return {
    daily: dailyMessages[day % dailyMessages.length] || dailyMessages[0],
    motivational: motivationalMessages[day % motivationalMessages.length] || motivationalMessages[0],
  };
}

