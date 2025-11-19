import * as Notifications from "expo-notifications";
import { db } from "../db";

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
      // Note: In production, you would use Expo's push notification service
      // For now, we'll just log it. The frontend will handle in-app notifications
      console.log(`📬 [Push] Would send push notification to ${userId}: ${title}`);
      
      // TODO: Implement Expo Push Notification API call
      // await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     to: profile.pushToken,
      //     title,
      //     body,
      //     data,
      //   }),
      // });
    } else {
      console.log(`📬 [Push] No push token for user ${userId} - in-app notification will be shown`);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    // Don't throw - we don't want to break notification creation
  }
}

