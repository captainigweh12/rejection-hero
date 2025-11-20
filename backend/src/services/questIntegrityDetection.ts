import { db } from "../db";

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  suspiciousScore: number; // 0-100, higher = more suspicious
  reasons: string[];
  shouldFlag: boolean; // True if activity should be flagged (for transparency)
  motivationalMessage?: string; // Message to encourage authentic behavior
}

/**
 * Detect suspicious quest activity patterns (transparent system - no blocking)
 */
export async function detectSuspiciousActivity(
  userQuestId: string,
  userId: string,
  action: "NO" | "YES" | "ACTION",
  currentCount: number
): Promise<SuspiciousActivityResult> {
  const result: SuspiciousActivityResult = {
    isSuspicious: false,
    suspiciousScore: 0,
    reasons: [],
    shouldFlag: false,
  };

  try {
    // Get user quest with timing info
    const userQuest = await db.user_quest.findUnique({
      where: { id: userQuestId },
      include: { quest: true },
    });

    if (!userQuest || !userQuest.startedAt) {
      return result; // Can't analyze without start time
    }

    const now = new Date();
    const startedAt = new Date(userQuest.startedAt);
    const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

    // Get quest action history for more accurate detection
    const recentActions = await db.quest_action_log.count({
      where: {
        userQuestId: userQuestId,
        recordedAt: {
          gte: new Date(now.getTime() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    const actionsPerMinute = (currentCount + 1) / Math.max(elapsedMinutes, 0.1); // +1 for current action
    const actionsInLast5Min = recentActions + 1; // +1 for current action

    // Detection 1: Too many actions in too short a time
    // Example: 10 NOs in 5 minutes is suspicious
    if (actionsInLast5Min > 8) {
      const score = (actionsInLast5Min - 8) * 10;
      result.suspiciousScore += Math.min(100, score);
      result.reasons.push(
        `High activity rate: ${actionsInLast5Min} actions in the last 5 minutes`
      );
      result.isSuspicious = true;
      result.shouldFlag = true;
      result.motivationalMessage = `Hey! We noticed you're completing actions very quickly. Remember, authentic quests take time - each "NO" should be a real interaction with someone! Take your time and make each action count. Consider sharing this quest with friends for verification when you complete it! 💪`;
    } else if (actionsPerMinute > 2) {
      // More than 2 actions per minute is suspicious
      const score = Math.min(100, (actionsPerMinute - 2) * 20); // Scale to 0-100
      result.suspiciousScore += score;
      result.reasons.push(
        `Unusually high activity rate: ${actionsPerMinute.toFixed(1)} actions per minute`
      );
      result.isSuspicious = true;
      result.shouldFlag = true;
      result.motivationalMessage = `You're moving fast! Remember, each quest action should be a genuine interaction. Slow down and enjoy the journey - authenticity is what makes quests meaningful! When you complete this quest, share it with friends for verification to earn a special badge! 🎯`;
    }

    // Detection 2: Actions coming in suspiciously fast intervals
    // Check the last few action timestamps from logs
    const recentActionLogs = await db.quest_action_log.findMany({
      where: {
        userQuestId: userQuestId,
      },
      orderBy: { recordedAt: "desc" },
      take: 5, // Check last 5 actions
    });

    // Check intervals between recent actions
    if (recentActionLogs.length > 1) {
      const intervals: number[] = [];
      for (let i = 0; i < recentActionLogs.length - 1; i++) {
        const interval = (recentActionLogs[i].recordedAt.getTime() - recentActionLogs[i + 1].recordedAt.getTime()) / 1000;
        intervals.push(interval);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const minInterval = Math.min(...intervals);

      if (minInterval < 10 && currentCount > 0) {
        const score = (10 - minInterval) * 5; // More suspicious the faster they are
        result.suspiciousScore += Math.min(50, score);
        result.reasons.push(
          `Actions recorded quickly: ${minInterval.toFixed(1)}s between actions. Average interval: ${avgInterval.toFixed(1)}s`
        );
        result.isSuspicious = true;
        result.shouldFlag = true;
        if (!result.motivationalMessage) {
          result.motivationalMessage = `Quick actions detected! Each quest action should represent a real moment with someone. Take time between actions - quality over quantity! When you complete this quest, consider sharing it with friends for verification to show it's authentic. ✨`;
        }
      }
    }

    // Detection 3: Unrealistic completion time
    // If a quest with goalCount 10 is completed in less than 2 minutes, that's very suspicious
    const goalCount = userQuest.quest.goalCount;
    const minutesPerAction = elapsedMinutes / (currentCount + 1);

    if (elapsedMinutes > 0 && currentCount + 1 >= goalCount) {
      const totalTimeMinutes = elapsedMinutes;
      const minimumRealisticTime = goalCount * 0.5; // At least 30 seconds per action on average

      if (totalTimeMinutes < minimumRealisticTime) {
        const score = ((minimumRealisticTime - totalTimeMinutes) / minimumRealisticTime) * 100;
        result.suspiciousScore += Math.min(100, score);
        result.reasons.push(
          `Quest completed quickly: ${totalTimeMinutes.toFixed(1)} minutes for ${goalCount} actions`
        );
        result.isSuspicious = true;
        result.shouldFlag = true;
        if (!result.motivationalMessage) {
          result.motivationalMessage = `You completed this quest very quickly! That's impressive, but make sure each action was authentic. Share this quest with friends to verify - if 2+ friends verify it, you'll earn a special Silver Verification Badge! 🏆`;
        }
      }
    }

    // Detection 4: Pattern detection - check if user has a history of suspicious quests
    const userSuspiciousQuests = await db.user_quest.count({
      where: {
        userId: userId,
        isFlaggedAsSuspicious: true,
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    if (userSuspiciousQuests > 2) {
      // User has multiple flagged quests recently
      result.suspiciousScore += userSuspiciousQuests * 10;
      result.reasons.push(
        `You have ${userSuspiciousQuests} flagged quests in the last 30 days`
      );
      result.isSuspicious = true;
      result.shouldFlag = true;
      if (!result.motivationalMessage) {
        result.motivationalMessage = `We've noticed a pattern of fast completions. Remember, the goal is authentic growth, not speed! Take time with each quest and consider asking friends to verify your completion - verified quests get special badges! 🌟`;
      }
    }

    // Detection 5: Check for rapid-fire actions (multiple actions in very short time)
    // This would require tracking individual action timestamps, but we can approximate
    // by checking if the quest was just started and already has many actions
    if (elapsedMinutes < 1 && currentCount + 1 > 3) {
      // More than 3 actions in less than a minute is very suspicious
      const score = ((currentCount + 1) / elapsedMinutes) * 10;
      result.suspiciousScore += Math.min(100, score);
      result.reasons.push(
        `${currentCount + 1} actions recorded in first ${elapsedMinutes.toFixed(1)} minutes`
      );
      result.isSuspicious = true;
      result.shouldFlag = true;
      if (!result.motivationalMessage) {
        result.motivationalMessage = `You're off to a fast start! Remember, each action should be a real, meaningful interaction. Take your time and enjoy the process. When you complete this quest, share it with friends for verification! 🎉`;
      }
    }

    // Calculate overall suspicious score (cap at 100)
    result.suspiciousScore = Math.min(100, result.suspiciousScore);

    // Set flags based on score (no blocking - just transparency)
    if (result.suspiciousScore >= 50) {
      result.shouldFlag = true;
      if (!result.motivationalMessage) {
        result.motivationalMessage = `We noticed some patterns that suggest rushed completion. Remember, authentic quests take time! Consider sharing this quest with friends for verification when you complete it - verified quests earn special badges and show your genuine progress! 💎`;
      }
    }

    return result;
  } catch (error) {
    console.error("Error detecting suspicious activity:", error);
    // On error, allow the action but log it
    return result;
  }
}

