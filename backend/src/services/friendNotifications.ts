import { db } from "../db";
import { randomUUID } from "node:crypto";
import { sendPushNotificationForNotification } from "./pushNotifications";

/**
 * Notify a user's friends about an activity
 */
export async function notifyFriends(
  userId: string,
  notificationType: "FRIEND_STARTED_QUEST" | "FRIEND_COMPLETED_QUEST" | "FRIEND_WENT_LIVE",
  data: {
    questId?: string;
    questTitle?: string;
    liveId?: string;
    liveTitle?: string;
  }
): Promise<void> {
  try {
    // Get user's profile for display name
    const userProfile = await db.profile.findUnique({
      where: { userId },
      select: { displayName: true, avatar: true },
    });

    const userName = userProfile?.displayName || "A friend";

    // Get all accepted friendships where user is either initiator or receiver
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { initiatorId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
    });

    // Get friend user IDs
    const friendUserIds = friendships.map((f) =>
      f.initiatorId === userId ? f.receiverId : f.initiatorId
    );

    if (friendUserIds.length === 0) {
      return; // No friends to notify
    }

    // Create notification data based on type
    let title = "";
    let message = "";
    let notificationData: any = { type: notificationType };

    switch (notificationType) {
      case "FRIEND_STARTED_QUEST":
        title = "Friend Started a Quest";
        message = `${userName} just started a new quest: ${data.questTitle || "New Quest"}`;
        notificationData = {
          type: notificationType,
          friendUserId: userId,
          questId: data.questId,
          questTitle: data.questTitle,
        };
        break;
      case "FRIEND_COMPLETED_QUEST":
        title = "Quest Completed!";
        message = `${userName} completed a quest: ${data.questTitle || "Quest"}`;
        notificationData = {
          type: notificationType,
          friendUserId: userId,
          questId: data.questId,
          questTitle: data.questTitle,
        };
        break;
      case "FRIEND_WENT_LIVE":
        title = "Friend Went Live";
        message = `${userName} just went live`;
        notificationData = {
          type: notificationType,
          friendUserId: userId,
          liveId: data.liveId,
          liveTitle: data.liveTitle,
        };
        break;
    }

    // Create notifications for all friends
    const notifications = await Promise.all(
      friendUserIds.map((friendId) =>
        db.notification.create({
          data: {
            id: randomUUID(),
            userId: friendId,
            senderId: userId,
            type: notificationType,
            title,
            message,
            data: JSON.stringify(notificationData),
          },
        })
      )
    );

    // Send push notifications
    for (const notification of notifications) {
      try {
        await sendPushNotificationForNotification(
          notification.userId,
          notification.title,
          notification.message,
          notificationData
        );
      } catch (error) {
        console.error(`Error sending push notification to ${notification.userId}:`, error);
        // Continue even if push notification fails
      }
    }

    console.log(`✅ [Friend Notifications] Notified ${friendUserIds.length} friends about ${notificationType}`);
  } catch (error) {
    console.error(`❌ [Friend Notifications] Error notifying friends:`, error);
    // Don't throw - we don't want to break the main operation
  }
}

