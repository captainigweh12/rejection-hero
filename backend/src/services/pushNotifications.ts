import { db } from "../db";

interface PushNotificationMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: any;
  badge?: number;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

/**
 * Send push notification via Expo Push Notification Service
 */
async function sendExpoPushNotification(message: PushNotificationMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(message),
    });

    const result: any = await response.json();
    
    if (response.ok && result.data?.status === "ok") {
      return { success: true };
    } else {
      const error = result.errors?.[0]?.message || "Unknown error";
      console.error("❌ [Push] Expo API error:", error);
      return { success: false, error };
    }
  } catch (error) {
    console.error("❌ [Push] Error sending to Expo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Send push notification when a notification is created in the database
 * This is called after creating a notification record
 */
export async function sendPushNotificationForNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    // Get user's push token from profile
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { pushToken: true, notificationPreferences: true },
    });

    // Check if user has notifications enabled for this type
    let shouldNotify = true;
    if (profile?.notificationPreferences) {
      try {
        const prefs = JSON.parse(profile.notificationPreferences);
        // Check specific notification type preference
        if (data?.type === "confidence_low") {
          shouldNotify = prefs.confidenceLow !== false;
        } else if (data?.type === "friend_request") {
          shouldNotify = prefs.friendRequest !== false;
        } else if (data?.type === "friend_accepted") {
          shouldNotify = prefs.friendAccepted !== false;
        }
        // Add more type checks as needed
      } catch {
        // Use default
      }
    }

    if (!shouldNotify) {
      console.log(`📬 [Push] Skipping notification for user ${userId} - preference disabled`);
      return;
    }

    // If user has a push token, send via Expo Push Notification service
    if (profile?.pushToken) {
      const result = await sendExpoPushNotification({
        to: profile.pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
        priority: "high",
      });

      if (result.success) {
        console.log(`✅ [Push] Push notification sent to ${userId}: ${title}`);
      } else {
        console.error(`❌ [Push] Failed to send push notification to ${userId}:`, result.error);
      }
    } else {
      console.log(`📬 [Push] No push token for user ${userId} - in-app notification will be shown`);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    // Don't throw - we don't want to break notification creation
  }
}

/**
 * Send push notification to multiple users (for admin broadcasts)
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Get all users' push tokens
  const profiles = await db.profile.findMany({
    where: {
      userId: { in: userIds },
      pushToken: { not: null },
    },
    select: {
      userId: true,
      pushToken: true,
      notificationPreferences: true,
    },
  });

  // Send notifications in parallel (batch of 10 at a time)
  const batchSize = 10;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (profile) => {
        if (!profile.pushToken) return;

        // Check user preferences
        let shouldNotify = true;
        if (profile.notificationPreferences) {
          try {
            const prefs = JSON.parse(profile.notificationPreferences);
            if (data?.type && prefs[data.type] === false) {
              shouldNotify = false;
            }
          } catch {
            // Use default
          }
        }

        if (!shouldNotify) {
          return;
        }

        const result = await sendExpoPushNotification({
          to: profile.pushToken,
          sound: "default",
          title,
          body,
          data: data || {},
          priority: "high",
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`User ${profile.userId}: ${result.error}`);
        }
      })
    );
  }

  return { sent, failed, errors };
}

/**
 * Send push notification to all users with push tokens
 */
export async function sendPushNotificationToAllUsers(
  title: string,
  body: string,
  data?: any
): Promise<{ sent: number; failed: number; errors: string[] }> {
  // Get all users with push tokens (in batches)
  const batchSize = 100;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const profiles = await db.profile.findMany({
      where: {
        pushToken: { not: null },
      },
      select: {
        userId: true,
        pushToken: true,
        notificationPreferences: true,
      },
      skip,
      take: batchSize,
    });

    if (profiles.length === 0) {
      hasMore = false;
      break;
    }

    // Send notifications in parallel (batch of 10 at a time)
    const notificationBatchSize = 10;
    for (let i = 0; i < profiles.length; i += notificationBatchSize) {
      const batch = profiles.slice(i, i + notificationBatchSize);
      
      await Promise.all(
        batch.map(async (profile) => {
          if (!profile.pushToken) return;

          // Check user preferences
          let shouldNotify = true;
          if (profile.notificationPreferences) {
            try {
              const prefs = JSON.parse(profile.notificationPreferences);
              if (data?.type && prefs[data.type] === false) {
                shouldNotify = false;
              }
            } catch {
              // Use default
            }
          }

          if (!shouldNotify) {
            return;
          }

          const result = await sendExpoPushNotification({
            to: profile.pushToken,
            sound: "default",
            title,
            body,
            data: data || {},
            priority: "high",
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push(`User ${profile.userId}: ${result.error}`);
          }
        })
      );
    }

    skip += batchSize;
    if (profiles.length < batchSize) {
      hasMore = false;
    }
  }

  return { sent, failed, errors };
}

/**
 * Helper function to create a notification and send push notification
 * This combines the notification creation with push notification sending
 */
export async function createNotificationWithPush(
  userId: string,
  senderId: string | null,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  try {
    // Create the notification in the database
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        senderId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    // Send push notification
    await sendPushNotificationForNotification(userId, title, message, { type, ...data });
  } catch (error) {
    console.error("Error creating notification with push:", error);
    // Don't throw - allow notification creation to continue even if push fails
  }
}

