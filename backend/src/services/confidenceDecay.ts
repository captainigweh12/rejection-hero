import { db } from "../db";

/**
 * Decay confidence meter for all users over time
 * Called periodically to decrease confidence when users are inactive
 */
export async function decayConfidenceMeters() {
  try {
    const now = new Date();
    
    // Check if user_stats table exists before querying
    try {
      await db.$queryRawUnsafe("SELECT 1 FROM user_stats LIMIT 1");
    } catch (error: any) {
      // Handle table doesn't exist error (P2021)
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        console.log("⚠️  [Confidence Decay] user_stats table does not exist yet, skipping...");
        return { updatedCount: 0, notificationCount: 0 };
      }
      // Handle database connection errors gracefully
      if (error?.name === "PrismaClientInitializationError" || 
          error?.message?.includes("Can't reach database server") ||
          error?.message?.includes("Can not reach database server")) {
        console.warn("⚠️  [Confidence Decay] Database connection error, skipping...");
        console.warn("   Error:", error.message?.substring(0, 100));
        return { updatedCount: 0, notificationCount: 0 };
      }
      // Log unexpected errors but don't crash
      console.error("❌ [Confidence Decay] Unexpected error checking tables:", error?.message || error);
      return { updatedCount: 0, notificationCount: 0 };
    }
    
    // Get all user stats
    const allStats = await db.user_stats.findMany({
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
      await db.user_stats.update({
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
          const notification = await db.notification.create({
            data: {
              id: crypto.randomUUID(),
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
          
          // Send push notification (in-app notification will be handled by frontend)
          try {
            const { sendPushNotificationForNotification } = await import("./pushNotifications");
            await sendPushNotificationForNotification(
              stats.userId,
              notification.title,
              notification.message,
              JSON.parse(notification.data || "{}")
            );
          } catch (error) {
            console.error("Error sending push notification:", error);
            // Continue even if push notification fails
          }
          
          notificationCount++;
        }
      }
    }
  }

    console.log(`✅ [Confidence Decay] Updated ${updatedCount} users, sent ${notificationCount} low confidence notifications`);
  
    return { updatedCount, notificationCount };
  } catch (error) {
    console.error("❌ [Confidence Decay] Error:", error);
    return { updatedCount: 0, notificationCount: 0 };
  }
}

