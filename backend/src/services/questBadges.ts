import { db } from "../db";

export interface QuestBadges {
  silver: boolean; // Quest has photos (shared to community with images)
  gold: boolean; // Quest was live streamed
  bronze: boolean; // Quest was performed with others
  blue: boolean; // Quest is a group quest
}

/**
 * Get badges for a completed quest
 */
export async function getQuestBadges(userQuestId: string): Promise<QuestBadges> {
  const badges: QuestBadges = {
    silver: false,
    gold: false,
    bronze: false,
    blue: false,
  };

  try {
    // Check for silver badge: Quest verified by 2+ friends OR shared to community with photos
    const verificationCount = await db.quest_verification.count({
      where: { userQuestId: userQuestId },
    });

    if (verificationCount >= 2) {
      badges.silver = true;
      // Verification badge takes priority - return early
      // Continue to check other badges though
    } else {
      // Fallback: Check if shared to community with photos
      const postWithImages = await db.post.findFirst({
        where: {
          userQuestId: userQuestId,
          images: {
            some: {}, // Has at least one image
          },
        },
        include: {
          images: true,
        },
      });

      if (postWithImages && postWithImages.post_image.length > 0) {
        badges.silver = true;
      }
    }

    // Check for gold badge: Quest was live streamed
    const liveStream = await db.live_stream.findFirst({
      where: {
        userQuestId: userQuestId,
        isActive: false, // Completed stream
        endedAt: { not: null }, // Has ended
      },
    });

    if (liveStream) {
      badges.gold = true;
    }

    // Get user quest to check questId and userId
    const userQuest = await db.user_quest.findUnique({
      where: { id: userQuestId },
    });

    if (userQuest) {
      // Check for blue badge: Quest is a group quest
      const groupQuestParticipant = await db.group_quest_participant.findFirst({
        where: {
          userId: userQuest.userId,
          group_quest: {
            questId: userQuest.questId,
          },
          status: "completed",
        },
        include: {
          group_quest: {
            include: {
              participants: true,
            },
          },
        },
      });

      if (groupQuestParticipant) {
        badges.blue = true;

        // Check for bronze badge: Quest performed with others (group quest with multiple participants)
        if (groupQuestParticipant.group_quest.group_quest_participant.length > 1) {
          badges.bronze = true;
        }
      } else {
        // Check for bronze badge: Quest performed during live stream with viewers
        if (liveStream && liveStream.viewerCount > 0) {
          badges.bronze = true;
        }

        // Check if quest was completed around the same time as other users completing the same quest
        if (userQuest.completedAt) {
          // Look for other users who completed the same quest within 1 hour
          const timeWindow = new Date(userQuest.completedAt.getTime() - 60 * 60 * 1000); // 1 hour before
          const timeWindowEnd = new Date(userQuest.completedAt.getTime() + 60 * 60 * 1000); // 1 hour after

          const simultaneousCompletions = await db.user_quest.count({
            where: {
              questId: userQuest.questId,
              status: "COMPLETED",
              completedAt: {
                gte: timeWindow,
                lte: timeWindowEnd,
              },
              userId: { not: userQuest.userId }, // Different user
            },
          });

          if (simultaneousCompletions > 0) {
            badges.bronze = true;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error getting quest badges:", error);
  }

  return badges;
}

/**
 * Get badges for multiple quests (batch processing)
 */
export async function getQuestBadgesBatch(userQuestIds: string[]): Promise<Record<string, QuestBadges>> {
  const result: Record<string, QuestBadges> = {};

  // Initialize all badges as false
  for (const id of userQuestIds) {
    result[id] = {
      silver: false,
      gold: false,
      bronze: false,
      blue: false,
    };
  }

  try {
    // Batch check for silver badges (verifications OR posts with images)
    // Check verifications first (takes priority)
    const verifications = await db.quest_verification.groupBy({
      by: ["userQuestId"],
      where: {
        userQuestId: { in: userQuestIds },
      },
      _count: {
        id: true,
      },
    });

    for (const verification of verifications) {
      if (verification._count.id >= 2) {
        result[verification.user_questId].silver = true;
      }
    }

    // Check posts with images for quests that don't have verifications yet
    const questsWithoutVerification = userQuestIds.filter((id) => !result[id].silver);
    if (questsWithoutVerification.length > 0) {
      const postsWithImages = await db.post.findMany({
        where: {
          userQuestId: { in: questsWithoutVerification },
          images: {
            some: {},
          },
        },
        include: {
          images: true,
        },
      });

      for (const post of postsWithImages) {
        if (post.user_questId && post.post_image.length > 0) {
          result[post.user_questId].silver = true;
        }
      }
    }

    // Batch check for gold badges
    const liveStreams = await db.live_stream.findMany({
      where: {
        userQuestId: { in: userQuestIds },
        isActive: false,
        endedAt: { not: null },
      },
    });

    for (const stream of liveStreams) {
      if (stream.user_questId) {
        result[stream.user_questId].gold = true;
      }
    }

    // Get user quests to check for group quests
    const userQuests = await db.user_quest.findMany({
      where: {
        id: { in: userQuestIds },
      },
    });

    // Batch check for blue and bronze badges (group quests)
    for (const userQuest of userQuests) {
      const groupQuestParticipant = await db.group_quest_participant.findFirst({
        where: {
          userId: userQuest.userId,
          group_quest: {
            questId: userQuest.questId,
          },
          status: "completed",
        },
        include: {
          group_quest: {
            include: {
              participants: true,
            },
          },
        },
      });

      if (groupQuestParticipant) {
        result[userQuest.id].blue = true;
        if (groupQuestParticipant.group_quest.group_quest_participant.length > 1) {
          result[userQuest.id].bronze = true;
        }
      }
    }

    // For quests not in group quests, check for bronze (live stream viewers or simultaneous completions)
    const questsNeedingBronzeCheck = userQuestIds.filter((id) => !result[id].bronze && !result[id].blue);

    if (questsNeedingBronzeCheck.length > 0) {
      const questsForBronzeCheck = await db.user_quest.findMany({
        where: {
          id: { in: questsNeedingBronzeCheck },
          status: "COMPLETED",
          completedAt: { not: null },
        },
      });

      for (const questForBronze of questsForBronzeCheck) {
        if (!questForBronze.completedAt) continue;

        // Check live stream viewers
        const stream = await db.live_stream.findFirst({
          where: {
            userQuestId: questForBronze.id,
            viewerCount: { gt: 0 },
          },
        });

        if (stream) {
          result[questForBronze.id].bronze = true;
          continue;
        }

        // Check simultaneous completions
        const timeWindow = new Date(questForBronze.completedAt.getTime() - 60 * 60 * 1000);
        const timeWindowEnd = new Date(questForBronze.completedAt.getTime() + 60 * 60 * 1000);

        const simultaneousCompletions = await db.user_quest.count({
          where: {
            questId: questForBronze.questId,
            status: "COMPLETED",
            completedAt: {
              gte: timeWindow,
              lte: timeWindowEnd,
            },
            userId: { not: questForBronze.userId },
          },
        });

        if (simultaneousCompletions > 0) {
          result[questForBronze.id].bronze = true;
        }
      }
    }
  } catch (error) {
    console.error("Error getting quest badges batch:", error);
  }

  return result;
}

