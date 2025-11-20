import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";
import { sendPushNotificationForNotification } from "../services/pushNotifications";
import { getQuestBadges } from "../services/questBadges";

const questVerificationRouter = new Hono<AppType>();

// ============================================
// POST /api/quest-verification/send-request - Send quest for friend verification
// ============================================
const sendVerificationRequestSchema = z.object({
  userQuestId: z.string(),
  friendIds: z.array(z.string()).min(1),
  message: z.string().max(500).optional(),
});

questVerificationRouter.post(
  "/send-request",
  zValidator("json", sendVerificationRequestSchema),
  async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const { userQuestId, friendIds, message } = c.req.valid("json");

    // Get user quest
    const userQuest = await db.user_quest.findUnique({
      where: { id: userQuestId },
      include: { quest: true },
    });

    if (!userQuest) {
      return c.json({ message: "Quest not found" }, 404);
    }

    // Only completed quests can be verified
    if (userQuest.status !== "COMPLETED") {
      return c.json({ message: "Only completed quests can be verified" }, 400);
    }

    // Verify all friends exist and are actual friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: { in: friendIds }, status: "ACCEPTED" },
          { initiatorId: { in: friendIds }, receiverId: user.id, status: "ACCEPTED" },
        ],
      },
    });

    const validFriendIds = friendships
      .map((f) => (f.initiatorId === user.id ? f.receiverId : f.initiatorId))
      .filter((id) => friendIds.includes(id));

    if (validFriendIds.length === 0) {
      return c.json({ message: "No valid friends found to send verification to" }, 400);
    }

    // Create verification requests
    const requests = await Promise.all(
      validFriendIds.map((friendId) =>
        db.quest_verification_request.create({
          data: {
            userQuestId: userQuestId,
            senderId: user.id,
            receiverId: friendId,
            message: message || null,
            status: "pending",
          },
        })
      )
    );

    // Get sender profile for notification
    const senderProfile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const senderName = senderProfile?.displayName || user.email?.split("@")[0] || "A friend";

    // Send notifications to friends
    for (const request of requests) {
      const notification = await db.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: request.receiverId,
          senderId: user.id,
          type: "QUEST_VERIFICATION_REQUEST",
          title: "🔍 Verify Quest Completion",
          message: `${senderName} wants you to verify their quest completion: "${userQuest.quest.title}"`,
          data: JSON.stringify({
            verificationRequestId: request.id,
            userQuestId: userQuest.id,
            questId: userQuest.questId,
            type: "quest_verification_request",
          }),
        },
      });

      // Send push notification
      try {
        await sendPushNotificationForNotification(
          request.receiverId,
          notification.title,
          notification.message,
          JSON.parse(notification.data || "{}")
        );
      } catch (error) {
        console.error("Error sending verification request push notification:", error);
      }
    }

    return c.json({
      success: true,
      message: `Verification requests sent to ${validFriendIds.length} friend${validFriendIds.length > 1 ? "s" : ""}`,
      requestIds: requests.map((r) => r.id),
    });
  }
);

// ============================================
// GET /api/quest-verification/requests - Get pending verification requests for current user
// ============================================
questVerificationRouter.get("/requests", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const requests = await db.quest_verification_request.findMany({
    where: {
      receiverId: user.id,
      status: "pending",
    },
    include: {
      user_quest: {
        include: {
          quest: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      sender: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatted = requests.map((req) => ({
    id: req.id,
    userQuestId: req.user_questId,
    quest: {
      id: req.user_quest.quest.id,
      title: req.user_quest.quest.title,
      description: req.user_quest.quest.description,
      category: req.user_quest.quest.category,
      difficulty: req.user_quest.quest.difficulty,
      goalType: req.user_quest.quest.goalType,
      goalCount: req.user_quest.quest.goalCount,
    },
    sender: {
      id: req.sender.id,
      displayName: req.sender.Profile?.displayName || req.sender.email?.split("@")[0] || "User",
      avatar: req.sender.Profile?.avatar || null,
    },
    message: req.message,
    createdAt: req.createdAt.toISOString(),
    questStats: {
      noCount: req.user_quest.noCount,
      yesCount: req.user_quest.yesCount,
      actionCount: req.user_quest.actionCount,
      completedAt: req.user_quest.completedAt?.toISOString() || null,
    },
  }));

  return c.json({ requests: formatted });
});

// ============================================
// POST /api/quest-verification/:requestId/verify - Verify a quest completion
// ============================================
questVerificationRouter.post("/:requestId/verify", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const requestId = c.req.param("requestId");

  // Get verification request
  const verificationRequest = await db.quest_verification_request.findUnique({
    where: { id: requestId },
    include: {
      user_quest: {
        include: {
          quest: true,
          user: true,
        },
      },
    },
  });

  if (!verificationRequest) {
    return c.json({ message: "Verification request not found" }, 404);
  }

  // Check if user is the receiver
  if (verificationRequest.receiverId !== user.id) {
    return c.json({ message: "You can only verify requests sent to you" }, 403);
  }

  // Check if already verified
  if (verificationRequest.status === "verified") {
    return c.json({ message: "Quest already verified" }, 400);
  }

  // Check if already verified by this user
  const existingVerification = await db.quest_verification.findUnique({
    where: {
      userQuestId_verifiedBy: {
        userQuestId: verificationRequest.user_questId,
        verifiedBy: user.id,
      },
    },
  });

  if (existingVerification) {
    return c.json({ message: "You have already verified this quest" }, 400);
  }

  // Create verification
  const verification = await db.quest_verification.create({
    data: {
      userQuestId: verificationRequest.user_questId,
      verifiedBy: user.id,
      verificationRequestId: requestId,
    },
  });

  // Update request status
  await db.quest_verification_request.update({
    where: { id: requestId },
    data: {
      status: "verified",
      verifiedAt: new Date(),
    },
  });

  // Count total verifications for this quest
  const verificationCount = await db.quest_verification.count({
    where: { userQuestId: verificationRequest.user_questId },
  });

  // Get verifier profile
  const verifierProfile = await db.profile.findUnique({
    where: { userId: user.id },
  });

  const verifierName = verifierProfile?.displayName || user.email?.split("@")[0] || "A friend";

  // Send notification to quest owner
  const notification = await db.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: verificationRequest.user_quest.userId,
      senderId: user.id,
      type: "QUEST_VERIFIED",
      title: "✅ Quest Verified!",
      message: `${verifierName} verified your quest: "${verificationRequest.user_quest.quest.title}" (${verificationCount} verification${verificationCount > 1 ? "s" : ""})`,
      data: JSON.stringify({
        userQuestId: verificationRequest.user_questId,
        questId: verificationRequest.user_quest.questId,
        verificationCount,
        type: "quest_verified",
      }),
    },
  });

  // Send push notification
  try {
    await sendPushNotificationForNotification(
      verificationRequest.user_quest.userId,
      notification.title,
      notification.message,
      JSON.parse(notification.data || "{}")
    );
  } catch (error) {
    console.error("Error sending quest verified push notification:", error);
  }

  // If 2+ verifications, check and update badge
  if (verificationCount >= 2) {
    const badges = await getQuestBadges(verificationRequest.user_questId);
    
    // If quest doesn't have silver badge yet, update it via post (since we check posts for silver badge)
    // Actually, we should check if a post exists and add images, or create a verified post
    // For now, we'll just ensure the verification is counted in badge calculation
    // The silver badge will be awarded based on verifications instead of photos
    
    // Notify quest owner about verification badge
    if (verificationCount === 2) {
      const badgeNotification = await db.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: verificationRequest.user_quest.userId,
          type: "QUEST_VERIFICATION_BADGE",
          title: "🏆 Verification Badge Earned!",
          message: `Congratulations! Your quest "${verificationRequest.user_quest.quest.title}" has been verified by 2+ friends and earned a Silver Verification Badge!`,
          data: JSON.stringify({
            userQuestId: verificationRequest.user_questId,
            questId: verificationRequest.user_quest.questId,
            badge: "silver",
            type: "quest_verification_badge",
          }),
        },
      });

      try {
        await sendPushNotificationForNotification(
          verificationRequest.user_quest.userId,
          badgeNotification.title,
          badgeNotification.message,
          JSON.parse(badgeNotification.data || "{}")
        );
      } catch (error) {
        console.error("Error sending badge notification:", error);
      }
    }
  }

  return c.json({
    success: true,
    message: "Quest verified successfully",
    verificationCount,
    earnedBadge: verificationCount >= 2 ? "silver" : null,
  });
});

// ============================================
// POST /api/quest-verification/:requestId/decline - Decline verification request
// ============================================
questVerificationRouter.post("/:requestId/decline", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const requestId = c.req.param("requestId");

  const verificationRequest = await db.quest_verification_request.findUnique({
    where: { id: requestId },
  });

  if (!verificationRequest) {
    return c.json({ message: "Verification request not found" }, 404);
  }

  if (verificationRequest.receiverId !== user.id) {
    return c.json({ message: "You can only decline requests sent to you" }, 403);
  }

  await db.quest_verification_request.update({
    where: { id: requestId },
    data: { status: "declined" },
  });

  return c.json({ success: true, message: "Verification request declined" });
});

// ============================================
// GET /api/quest-verification/:userQuestId/status - Get verification status for a quest
// ============================================
questVerificationRouter.get("/:userQuestId/status", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("userQuestId");

  const userQuest = await db.user_quest.findUnique({
    where: { id: userQuestId },
  });

  if (!userQuest || userQuest.userId !== user.id) {
    return c.json({ message: "Quest not found or unauthorized" }, 404);
  }

  const verifications = await db.quest_verification.findMany({
    where: { userQuestId },
    include: {
      verifier: {
        include: {
          profile: true,
        },
      },
    },
  });

  const pendingRequests = await db.quest_verification_request.count({
    where: {
      userQuestId,
      status: "pending",
    },
  });

  return c.json({
    verificationCount: verifications.length,
    verifications: verifications.map((v) => ({
      id: v.id,
      verifiedBy: {
        id: v.verifier.id,
        displayName: v.verifier.Profile?.displayName || v.verifier.email?.split("@")[0] || "User",
        avatar: v.verifier.Profile?.avatar || null,
      },
      verifiedAt: v.createdAt.toISOString(),
    })),
    pendingRequests,
    hasBadge: verifications.length >= 2,
  });
});

export { questVerificationRouter };

