import { db } from "../db";
import { randomUUID } from "node:crypto";
import { sendPushNotificationForNotification } from "./pushNotifications";

/**
 * Notify group members about group activity
 */
export async function notifyGroupMembers(
  groupId: string,
  actorUserId: string,
  notificationType: "GROUP_POST_CREATED" | "GROUP_QUEST_STARTED" | "GROUP_QUEST_COMPLETED" | "GROUP_LIVE_STARTED" | "GROUP_CALL_STARTED",
  data: {
    postId?: string;
    postContent?: string;
    questId?: string;
    questTitle?: string;
    liveId?: string;
    liveTitle?: string;
  }
): Promise<void> {
  try {
    // Get group info
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    if (!group) {
      return;
    }

    // Get actor's profile
    const actorProfile = await db.profile.findUnique({
      where: { userId: actorUserId },
      select: { displayName: true, avatar: true },
    });

    const actorName = actorProfile?.displayName || "A member";

    // Get all group members except the actor
    const members = await db.group_member.findMany({
      where: {
        groupId,
        userId: { not: actorUserId },
      },
      select: { userId: true },
    });

    if (members.length === 0) {
      return; // No one to notify
    }

    const memberIds = members.map((m) => m.userId);

    // Create notification data based on type
    let title = "";
    let message = "";
    let notificationData: any = { type: notificationType, groupId };

    switch (notificationType) {
      case "GROUP_POST_CREATED":
        title = "New Post in Group";
        message = `${actorName} posted in ${group.name}`;
        notificationData = {
          type: notificationType,
          groupId,
          postId: data.postId,
          postContent: data.postContent,
          actorUserId,
        };
        break;
      case "GROUP_QUEST_STARTED":
        title = "Group Quest Started";
        message = `${actorName} started a group quest: ${data.questTitle || "New Quest"}`;
        notificationData = {
          type: notificationType,
          groupId,
          questId: data.questId,
          questTitle: data.questTitle,
          actorUserId,
        };
        break;
      case "GROUP_QUEST_COMPLETED":
        title = "Group Quest Completed!";
        message = `${actorName} completed a group quest: ${data.questTitle || "Quest"}`;
        notificationData = {
          type: notificationType,
          groupId,
          questId: data.questId,
          questTitle: data.questTitle,
          actorUserId,
        };
        break;
      case "GROUP_LIVE_STARTED":
        title = "Group Live Stream";
        message = `${actorName} just went live in ${group.name}`;
        notificationData = {
          type: notificationType,
          groupId,
          liveId: data.liveId,
          liveTitle: data.liveTitle,
          actorUserId,
        };
        break;
      case "GROUP_CALL_STARTED":
        title = "Group Call Started";
        message = `${actorName} started a call in ${group.name}`;
        notificationData = {
          type: notificationType,
          groupId,
          liveId: data.liveId,
          liveTitle: data.liveTitle,
          actorUserId,
        };
        break;
    }

    // Create notifications for all members
    const notifications = await Promise.all(
      memberIds.map((memberId) =>
        db.notification.create({
          data: {
            id: randomUUID(),
            userId: memberId,
            senderId: actorUserId,
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

    console.log(`✅ [Group Notifications] Notified ${memberIds.length} members about ${notificationType} in group ${groupId}`);
  } catch (error) {
    console.error(`❌ [Group Notifications] Error notifying group members:`, error);
    // Don't throw - we don't want to break the main operation
  }
}

