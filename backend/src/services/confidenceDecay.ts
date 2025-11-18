import { db } from "../db";

/**
 * Decay confidence meter for all users over time
 * Called periodically to decrease confidence when users are inactive
 */
export async function decayConfidenceMeters() {
  const now = new Date();
  
  // Get all user stats
  const allStats = await db.userStats.findMany({
    where: {
      dailyConfidenceMeter: {
        gt: 0, // Only process users with confidence > 0
      },
    },
  });

  let updatedCount = 0;
  let notificationCount = 0;

  for (const stats of allStats) {
    const lastDecayAt = stats.lastConfidenceDecayAt || stats.lastQuestCompletedAt || stats.createdAt;
    const hoursSinceLastDecay = (now.getTime() - lastDecayAt.getTime()) / (1000 * 60 * 60);
    
    // Decay: 2% per hour of inactivity (max decay to 0)
    if (hoursSinceLastDecay > 0) {
      const decayAmount = Math.min(stats.dailyConfidenceMeter, hoursSinceLastDecay * 2);
      const newConfidence = Math.max(0, stats.dailyConfidenceMeter - decayAmount);
      
      // Check if confidence is low (below 20) and send notification
      const wasLow = stats.dailyConfidenceMeter < 20;
      const isNowLow = newConfidence < 20;
      
      // Update confidence meter
      await db.userStats.update({
        where: { id: stats.id },
        data: {
          dailyConfidenceMeter: newConfidence,
          lastConfidenceDecayAt: now,
        },
      });
      
      updatedCount++;
      
      // Send notification if confidence just dropped below 20
      if (!wasLow && isNowLow) {
        // Get user's notification preferences
        const profile = await db.profile.findUnique({
          where: { userId: stats.userId },
          select: { notificationPreferences: true },
        });
        
        let shouldNotify = true;
        if (profile?.notificationPreferences) {
          try {
            const prefs = JSON.parse(profile.notificationPreferences);
            shouldNotify = prefs.confidenceLow !== false; // Default to true if not set
          } catch {
            // Use default
          }
        }
        
        if (shouldNotify) {
          // Create notification
          await db.notification.create({
            data: {
              userId: stats.userId,
              type: "CONFIDENCE_LOW",
              title: "Your Confidence Meter is Low! 💪",
              message: "Your confidence meter has dropped. Complete a quest to boost your confidence!",
              data: JSON.stringify({
                type: "confidence_low",
                confidenceLevel: newConfidence,
              }),
            },
          });
          
          notificationCount++;
        }
      }
    }
  }

  console.log(`✅ [Confidence Decay] Updated ${updatedCount} users, sent ${notificationCount} low confidence notifications`);
  
  return { updatedCount, notificationCount };
}

