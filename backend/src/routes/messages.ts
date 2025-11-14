import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const messagesRouter = new Hono<AppType>();

// ============================================
// GET /api/messages/conversations - Get all conversations
// ============================================
messagesRouter.get("/conversations", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get all messages where user is sender or receiver
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
    },
    include: {
      sender: {
        include: { Profile: true },
      },
      receiver: {
        include: { Profile: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Group by conversation partner
  const conversationsMap = new Map();

  messages.forEach((message) => {
    const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
    const partner = message.senderId === user.id ? message.receiver : message.sender;

    if (!conversationsMap.has(partnerId)) {
      const unreadCount = messages.filter(
        (m) => m.senderId === partnerId && m.receiverId === user.id && !m.read
      ).length;

      conversationsMap.set(partnerId, {
        userId: partnerId,
        email: partner.email,
        displayName: partner.Profile?.displayName || partner.email?.split("@")[0] || "User",
        avatar: partner.Profile?.avatar || null,
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
        unreadCount,
      });
    }
  });

  const conversations = Array.from(conversationsMap.values());

  return c.json({ conversations });
});

// ============================================
// GET /api/messages/:userId - Get messages with specific user
// ============================================
messagesRouter.get("/:userId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const otherUserId = c.req.param("userId");

  // Get all messages between the two users
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ],
    },
    include: {
      sender: {
        include: { Profile: true },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Mark all received messages as read
  await db.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  const formattedMessages = messages.map((message) => ({
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: message.sender.Profile?.displayName || message.sender.email?.split("@")[0] || "User",
    senderAvatar: message.sender.Profile?.avatar || null,
    createdAt: message.createdAt,
    read: message.read,
    isMine: message.senderId === user.id,
  }));

  return c.json({ messages: formattedMessages });
});

// ============================================
// POST /api/messages/send - Send a message
// ============================================
const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(1000),
});

messagesRouter.post("/send", zValidator("json", sendMessageSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { receiverId, content } = c.req.valid("json");

  // Check if receiver exists
  const receiver = await db.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver) {
    return c.json({ message: "Receiver not found" }, 404);
  }

  // Create the message
  const message = await db.message.create({
    data: {
      senderId: user.id,
      receiverId,
      content,
    },
  });

  return c.json({ success: true, messageId: message.id });
});

// ============================================
// DELETE /api/messages/:messageId - Delete a message
// ============================================
messagesRouter.delete("/:messageId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const messageId = c.req.param("messageId");

  // Find the message
  const message = await db.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return c.json({ message: "Message not found" }, 404);
  }

  // Only sender can delete
  if (message.senderId !== user.id) {
    return c.json({ message: "You can only delete your own messages" }, 403);
  }

  // Delete the message
  await db.message.delete({
    where: { id: messageId },
  });

  return c.json({ success: true });
});

export { messagesRouter };
