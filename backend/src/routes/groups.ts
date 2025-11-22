import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";

const groupsRouter = new Hono<AppType>();

// ============================================
// GET /api/groups - Get all public groups + user's groups
// ============================================
groupsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get user's group memberships
  const memberships = await db.group_member.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          user: {
            include: { profile: true },
          },
          group_member: true,
        },
      },
    },
  });

  const myGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    coverImage: m.group.coverImage,
    isPrivate: m.group.isPrivate,
    creatorId: m.group.creatorId,
    creatorName: m.group.user.profile?.displayName || m.group.user.email?.split("@")[0] || "User",
    memberCount: m.group.group_member.length,
    role: m.role,
    joinedAt: m.joinedAt,
    createdAt: m.group.createdAt,
  }));

  // Get public groups user hasn't joined
  const publicGroups = await db.group.findMany({
    where: {
      isPrivate: false,
      group_member: {
        none: {
          userId: user.id,
        },
      },
    },
    include: {
      user: {
        include: { profile: true },
      },
      group_member: true,
    },
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  });

  const discoverGroups = publicGroups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    coverImage: group.coverImage,
    isPrivate: group.isPrivate,
    creatorId: group.creatorId,
    creatorName: group.user.profile?.displayName || group.user.email?.split("@")[0] || "User",
    memberCount: group.group_member.length,
    createdAt: group.createdAt,
  }));

  return c.json({ myGroups, discoverGroups });
});

// ============================================
// GET /api/groups/:groupId - Get group details
// ============================================
groupsRouter.get("/:groupId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      user: {
        include: { profile: true },
      },
      group_member: {
        include: {
          user: {
            include: { profile: true },
          },
        },
      },
    },
  });

  if (!group) {
    return c.json({ message: "Group not found" }, 404);
  }

  // Check if user is a member
  const membership = group.group_member.find((m) => m.userId === user.id);

  if (group.isPrivate && !membership) {
    return c.json({ message: "This is a private group" }, 403);
  }

  const members = group.group_member.map((m) => ({
    id: m.userId,
    displayName: m.user.profile?.displayName || m.user.email?.split("@")[0] || "User",
    avatar: m.user.profile?.avatar || null,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  return c.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      isPrivate: group.isPrivate,
      creatorId: group.creatorId,
      creatorName: group.user.profile?.displayName || group.user.email?.split("@")[0] || "User",
      memberCount: members.length,
      members,
      userRole: membership?.role || null,
      createdAt: group.createdAt,
    },
  });
});

// ============================================
// POST /api/groups/create - Create a new group
// ============================================
const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  coverImage: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

groupsRouter.post("/create", zValidator("json", createGroupSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  // Create the group
  const group = await db.group.create({
    data: {
      name: data.name,
      description: data.description,
      coverImage: data.coverImage,
      isPrivate: data.isPrivate,
      creatorId: user.id,
    },
  });

  // Add creator as admin member
  await db.group_member.create({
    data: {
      groupId: group.id,
      userId: user.id,
      role: "admin",
    },
  });

  return c.json({ success: true, groupId: group.id });
});

// ============================================
// POST /api/groups/:groupId/join - Join a group
// ============================================
groupsRouter.post("/:groupId/join", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Check if group exists
  const group = await db.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (group.isPrivate) {
    return c.json({ message: "Cannot join private group without invitation" }, 403);
  }

  // Check if already a member
  const existing = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    return c.json({ message: "Already a member of this group" }, 400);
  }

  // Add user as member
  await db.group_member.create({
    data: {
      groupId,
      userId: user.id,
      role: "member",
    },
  });

  return c.json({ success: true, message: "Joined group successfully" });
});

// ============================================
// POST /api/groups/:groupId/leave - Leave a group
// ============================================
groupsRouter.post("/:groupId/leave", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Find membership
  const membership = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You are not a member of this group" }, 404);
  }

  // Check if user is the creator
  const group = await db.group.findUnique({
    where: { id: groupId },
  });

  if (group?.creatorId === user.id) {
    return c.json({ message: "Group creator cannot leave. Delete the group instead." }, 400);
  }

  // Remove membership
  await db.group_member.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  return c.json({ success: true, message: "Left group successfully" });
});

// ============================================
// DELETE /api/groups/:groupId - Delete a group
// ============================================
groupsRouter.delete("/:groupId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Find group
  const group = await db.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return c.json({ message: "Group not found" }, 404);
  }

  // Only creator can delete
  if (group.creatorId !== user.id) {
    return c.json({ message: "Only the group creator can delete the group" }, 403);
  }

  // Delete group (members will be cascade deleted)
  await db.group.delete({
    where: { id: groupId },
  });

  return c.json({ success: true, message: "Group deleted successfully" });
});

// ============================================
// POST /api/groups/:groupId/invite - Invite someone to group
// ============================================
groupsRouter.post(
  "/:groupId/invite",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      message: z.string().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const groupId = c.req.param("groupId");
    const { email, message } = c.req.valid("json");

    console.log(`📧 [Groups] Inviting ${email} to group ${groupId}`);

    // Find group
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        group_member: {
          where: { userId: user.id },
        },
      },
    });

    if (!group) {
      return c.json({ message: "Group not found" }, 404);
    }

    // Check if user is a member with moderator/admin role
    const membership = group.group_member[0];
    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
      return c.json({ message: "Only admins and moderators can invite members" }, 403);
    }

    // Get inviter profile
    const inviterProfile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const inviterName = inviterProfile?.displayName || user.email?.split("@")[0] || "A member";

    // Import GoHighLevel functions
    const { createOrUpdateContact, sendEmail, getGroupInviteEmailHTML } = await import("../services/gohighlevel");

    // Create or update contact in GoHighLevel
    console.log(`📝 [Groups] Creating/updating contact in GoHighLevel for ${email}`);
    const contactResult = await createOrUpdateContact({
      email,
      tags: ["group-invite", `invited-to-${group.name}`, "potential-user"],
      customFields: [
        { key: "invited_by", field_value: inviterName },
        { key: "invited_to_group", field_value: group.name },
        { key: "invite_date", field_value: new Date().toISOString() },
      ],
    });

    if (!contactResult.success || !contactResult.contactId) {
      console.error("❌ [Groups] Failed to create contact in GoHighLevel");
      return c.json(
        {
          success: false,
          message: "Failed to send invitation",
          error: "Could not create contact in CRM"
        },
        500
      );
    }

    console.log(`✅ [Groups] Contact created/updated with ID: ${contactResult.contactId}`);

    // Generate join link (web URL that redirects to app)
    const backendUrl = process.env.BACKEND_URL || "https://api.rejectionhero.com";
    const joinLink = `${backendUrl}/accept-invite?groupId=${encodeURIComponent(groupId)}&email=${encodeURIComponent(email)}`;

    // Generate email HTML
    const emailHTML = getGroupInviteEmailHTML(
      group.name,
      inviterName,
      message || "",
      joinLink
    );

    // Send invitation email via GoHighLevel
    console.log(`📨 [Groups] Sending invitation email to ${email}`);
    const emailResult = await sendEmail(
      contactResult.contactId,
      `You're invited to join ${group.name} on Rejection Hero!`,
      emailHTML,
      "invites@rejectionhero.com"
    );

    if (!emailResult.success) {
      console.error("❌ [Groups] Failed to send email via GoHighLevel");
      // Don't fail the request - contact is created, email just failed
      return c.json({
        success: true,
        message: "Invitation created but email failed to send. Contact added to CRM.",
        warning: "Email delivery failed"
      });
    }

    console.log(`✅ [Groups] Invitation sent successfully to ${email}`);

    return c.json({
      success: true,
      message: "Invitation sent successfully!",
    });
  }
);

// ============================================
// PATCH /api/groups/:groupId/avatar - Update group avatar/picture (admin only)
// ============================================
const updateGroupAvatarSchema = z.object({
  coverImage: z.string(),
});

groupsRouter.patch("/:groupId/avatar", zValidator("json", updateGroupAvatarSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const { coverImage } = c.req.valid("json");

  // Check if user is admin
  const membership = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    return c.json({ message: "Only admins can update group avatar" }, 403);
  }

  // Update group avatar
  const group = await db.group.update({
    where: { id: groupId },
    data: { coverImage },
  });

  return c.json({ success: true, coverImage: group.coverImage });
});

// ============================================
// POST /api/groups/:groupId/invite-user - Invite in-app user to group (admin/moderator only)
// ============================================
const inviteUserSchema = z.object({
  userId: z.string(),
  message: z.string().optional(),
});

groupsRouter.post("/:groupId/invite-user", zValidator("json", inviteUserSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const { userId, message } = c.req.valid("json");

  // Check if user is admin or moderator
  const membership = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
    return c.json({ message: "Only admins and moderators can invite users" }, 403);
  }

  // Check if user to invite exists
  const userToInvite = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!userToInvite) {
    return c.json({ message: "User not found" }, 404);
  }

  // Check if user is already a member
  const existingMember = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (existingMember) {
    return c.json({ message: "User is already a member of this group" }, 400);
  }

  // Add user as member
  await db.group_member.create({
    data: {
      groupId,
      userId,
      role: "member",
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      senderId: user.id,
      type: "GROUP_INVITE",
      title: "Group Invitation",
      message: message || `${user.name || "Someone"} invited you to join a group`,
      read: false,
    },
  });

  return c.json({ success: true, message: "User invited successfully" });
});

// ============================================
// GET /api/groups/:groupId/posts - Get group posts (members only)
// ============================================
groupsRouter.get("/:groupId/posts", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Check if user is a member
  const membership = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You must be a member to view group posts" }, 403);
  }

  // Get group posts
  const posts = await db.post.findMany({
    where: {
      groupId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: true,
        },
      },
      post_image: true,
      post_like: true,
      post_comment: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const formattedPosts = posts.map((post) => ({
    id: post.id,
    content: post.content,
    privacy: post.privacy,
    groupId: post.groupId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    user: {
      id: post.user.id,
      name: post.user.name,
      email: post.user.email,
      avatar: post.user.profile?.avatar || post.user.image,
    },
    group: {
      id: groupId,
      name: "", // Will be filled by frontend
    },
    images: post.post_image.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      order: img.order,
    })),
    likes: post.post_like.map((like) => ({
      id: like.id,
      userId: like.userId,
      createdAt: like.createdAt.toISOString(),
    })),
    comments: post.post_comment.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.profile?.avatar || comment.user.image,
      },
    })),
    likeCount: post.post_like.length,
    commentCount: post.post_comment.length,
    isLikedByCurrentUser: post.post_like.some((like) => like.userId === user.id),
  }));

  return c.json({ posts: formattedPosts });
});

// ============================================
// GET /api/groups/:groupId/moments - Get group stories (members only)
// ============================================
groupsRouter.get("/:groupId/moments", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  // Check if user is a member
  const membership = await db.group_member.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return c.json({ message: "You must be a member to view group stories" }, 403);
  }

  // Get active group moments (not expired)
  const now = new Date();
  const moments = await db.moment.findMany({
    where: {
      groupId: groupId,
      expiresAt: {
        gt: now,
      },
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Group moments by user (similar to moments.ts pattern)
  const momentsByUser = moments.reduce(
    (acc, moment) => {
      const userId = moment.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId: moment.user.id,
          userName: moment.user.profile?.displayName || moment.user.email?.split("@")[0] || "User",
          userAvatar: moment.user.profile?.avatar || moment.user.image || null,
          moments: [],
        };
      }
      acc[userId].moments.push({
        id: moment.id,
        imageUrl: moment.imageUrl,
        videoUrl: moment.videoUrl,
        content: moment.content,
        createdAt: moment.createdAt.toISOString(),
        expiresAt: moment.expiresAt.toISOString(),
      });
      return acc;
    },
    {} as Record<
      string,
      {
        userId: string;
        userName: string;
        userAvatar: string | null;
        moments: Array<{
          id: string;
          imageUrl: string | null;
          videoUrl: string | null;
          content: string | null;
          createdAt: string;
          expiresAt: string;
        }>;
      }
    >
  );

  // Convert to array
  const formattedMoments = Object.values(momentsByUser);

  return c.json({ moments: formattedMoments });
});

// ============================================
// POST /api/groups/generate-avatar - Generate AI avatar for group
// ============================================
const generateGroupAvatarSchema = z.object({
  groupName: z.string().min(1),
  style: z.string().optional().default("gaming"),
  description: z.string().optional(),
});

groupsRouter.post("/generate-avatar", zValidator("json", generateGroupAvatarSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return c.json({
      success: false,
      avatarUrl: "",
      message: "AI avatar generation is not configured.",
    }, 503);
  }

  try {
    const style = data.style || "gaming";
    const customDescription = data.description || "";

    let prompt: string;
    if (customDescription) {
      prompt = `Create a group logo/avatar for "${data.groupName}" with this description: ${customDescription}. Style: ${style}. High quality, professional, suitable for a group profile picture.`;
    } else {
      const stylePrompts: Record<string, string> = {
        gaming: "Epic gaming group logo, futuristic design, neon colors, purple and orange glow, cyberpunk style, professional group emblem",
        anime: "Anime style group logo, bold colors, dynamic design, professional anime art style",
        realistic: "Professional group logo, modern design, high quality, clean and professional",
        fantasy: "Fantasy RPG group emblem, magical aura, heroic design, detailed fantasy art style, glowing effects",
        warrior: "Powerful warrior group logo, battle-ready design, strong presence, epic fantasy style, glowing armor",
        ninja: "Stealth ninja group emblem, mysterious design, dark background, professional game art",
        mage: "Magical wizard group logo, mystical energy, fantasy RPG style, glowing magic effects",
        cyborg: "Futuristic tech group emblem with cybernetic elements, neon lights and digital effects, advanced technology aesthetic, sci-fi style",
      };

      prompt = (stylePrompts[style] ?? stylePrompts.gaming) + `. Group name: "${data.groupName}". Square composition, centered, suitable for group profile picture. No text or watermarks.`;
    }

    // Call OpenAI DALL-E API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return c.json({
        success: false,
        avatarUrl: "",
        message: "Failed to generate avatar. Please try again.",
      }, 500);
    }

    const result = (await response.json()) as { data: Array<{ url: string }> };
    const dallEUrl = result.data[0]?.url;

    if (!dallEUrl) {
      return c.json({
        success: false,
        avatarUrl: "",
        message: "No avatar was generated. Please try again.",
      }, 500);
    }

    // Download and save the image
    const imageResponse = await fetch(dallEUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download avatar from DALL-E");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { randomUUID } = await import("node:crypto");

    const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const uniqueFilename = `group-avatar-${randomUUID()}.png`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);
    fs.writeFileSync(filePath, imageBuffer);

    const serverAvatarUrl = `/uploads/${uniqueFilename}`;

    return c.json({
      success: true,
      avatarUrl: serverAvatarUrl,
      message: "Avatar generated successfully!",
    });
  } catch (error) {
    console.error("Error generating group avatar:", error);
    return c.json({
      success: false,
      avatarUrl: "",
      message: "An error occurred while generating the avatar. Please try again.",
    }, 500);
  }
});

// ============================================
// GROUP CHAT ENDPOINTS
// ============================================

// POST /api/groups/:groupId/chat/message - Send a message to group chat
groupsRouter.post("/:groupId/chat/message", zValidator("json", z.object({ content: z.string().min(1).max(1000) })), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const { content } = c.req.valid("json");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to send messages" }, 403);
    }

    // Create group chat message
    const message = await db.group_chat_message.create({
      data: {
        groupId,
        senderId: user.id,
        content,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.profile?.displayName || message.sender.email?.split("@")[0] || "User",
        senderAvatar: message.sender.profile?.avatar || null,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Send group chat message error:", error);
    return c.json({ message: "Failed to send message" }, 500);
  }
});

// GET /api/groups/:groupId/chat/messages - Get group chat messages
groupsRouter.get("/:groupId/chat/messages", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to view messages" }, 403);
    }

    // Get messages
    const messages = await db.group_chat_message.findMany({
      where: { groupId },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.profile?.displayName || msg.sender.email?.split("@")[0] || "User",
      senderAvatar: msg.sender.profile?.avatar || null,
      createdAt: msg.createdAt.toISOString(),
    }));

    return c.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Get group chat messages error:", error);
    return c.json({ message: "Failed to get messages" }, 500);
  }
});

// ============================================
// GROUP FEED ENDPOINTS
// ============================================

// GET /api/groups/:groupId/feed - Get group feed posts
groupsRouter.get("/:groupId/feed", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to view the feed" }, 403);
    }

    // Get posts
    const posts = await db.group_post.findMany({
      where: { groupId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: post.author.profile?.displayName || post.author.email?.split("@")[0] || "User",
      authorAvatar: post.author.profile?.avatar || null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

    return c.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Get group feed error:", error);
    return c.json({ message: "Failed to get feed" }, 500);
  }
});

// POST /api/groups/:groupId/feed - Create a group post
groupsRouter.post("/:groupId/feed", zValidator("json", z.object({ content: z.string().min(1).max(2000) })), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const { content } = c.req.valid("json");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to post" }, 403);
    }

    // Create post
    const post = await db.group_post.create({
      data: {
        groupId,
        authorId: user.id,
        content,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Notify group members (except the author)
    const { notifyGroupMembers } = await import("../services/groupNotifications");
    await notifyGroupMembers(groupId, user.id, "GROUP_POST_CREATED", {
      postId: post.id,
      postContent: content.substring(0, 100),
    });

    return c.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        authorId: post.authorId,
        authorName: post.author.profile?.displayName || post.author.email?.split("@")[0] || "User",
        authorAvatar: post.author.profile?.avatar || null,
        createdAt: post.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create group post error:", error);
    return c.json({ message: "Failed to create post" }, 500);
  }
});

// ============================================
// GROUP LEADERBOARD ENDPOINTS
// ============================================

// GET /api/groups/:groupId/leaderboards - Get all leaderboards for a group
groupsRouter.get("/:groupId/leaderboards", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to view leaderboards" }, 403);
    }

    // Get leaderboards
    const leaderboards = await db.group_leaderboard.findMany({
      where: { groupId },
      include: {
        entries: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = leaderboards.map((lb) => ({
      id: lb.id,
      name: lb.name,
      entries: lb.entries.map((entry, index) => ({
        userId: entry.userId,
        displayName: entry.user.profile?.displayName || entry.user.email?.split("@")[0] || "User",
        avatar: entry.user.profile?.avatar || null,
        score: entry.score,
        rank: entry.rank || index + 1,
      })),
      createdAt: lb.createdAt.toISOString(),
    }));

    return c.json({ leaderboards: formatted });
  } catch (error) {
    console.error("Get group leaderboards error:", error);
    return c.json({ message: "Failed to get leaderboards" }, 500);
  }
});

// POST /api/groups/:groupId/leaderboards - Create a new leaderboard (admin only)
groupsRouter.post("/:groupId/leaderboards", zValidator("json", z.object({ name: z.string().min(1).max(100) })), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const { name } = c.req.valid("json");

  try {
    // Check if user is admin
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group" }, 403);
    }

    if (membership.role !== "admin" && membership.role !== "moderator") {
      return c.json({ message: "Only admins and moderators can create leaderboards" }, 403);
    }

    // Create leaderboard
    const leaderboard = await db.group_leaderboard.create({
      data: {
        groupId,
        name,
      },
    });

    return c.json({ success: true, leaderboardId: leaderboard.id });
  } catch (error) {
    console.error("Create leaderboard error:", error);
    return c.json({ message: "Failed to create leaderboard" }, 500);
  }
});

// GET /api/groups/:groupId/leaderboards/:leaderboardId - Get specific leaderboard entries
groupsRouter.get("/:groupId/leaderboards/:leaderboardId", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const leaderboardId = c.req.param("leaderboardId");

  try {
    // Check if user is a member
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return c.json({ message: "You must be a member of this group to view leaderboards" }, 403);
    }

    // Get leaderboard
    const leaderboard = await db.group_leaderboard.findUnique({
      where: { id: leaderboardId },
      include: {
        entries: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
      },
    });

    if (!leaderboard) {
      return c.json({ message: "Leaderboard not found" }, 404);
    }

    if (leaderboard.groupId !== groupId) {
      return c.json({ message: "Leaderboard does not belong to this group" }, 403);
    }

    // Calculate ranks
    const entries = leaderboard.entries.map((entry, index) => ({
      userId: entry.userId,
      displayName: entry.user.profile?.displayName || entry.user.email?.split("@")[0] || "User",
      avatar: entry.user.profile?.avatar || null,
      score: entry.score,
      rank: index + 1,
    }));

    return c.json({
      id: leaderboard.id,
      name: leaderboard.name,
      entries,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return c.json({ message: "Failed to get leaderboard" }, 500);
  }
});

// POST /api/groups/:groupId/leaderboards/:leaderboardId/update-score - Update user's score (admin only)
groupsRouter.post("/:groupId/leaderboards/:leaderboardId/update-score", zValidator("json", z.object({ userId: z.string(), score: z.number().int() })), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const groupId = c.req.param("groupId");
  const leaderboardId = c.req.param("leaderboardId");
  const { userId: targetUserId, score } = c.req.valid("json");

  try {
    // Check if user is admin
    const membership = await db.group_member.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
      return c.json({ message: "Only admins and moderators can update scores" }, 403);
    }

    // Upsert entry
    await db.group_leaderboard_entry.upsert({
      where: {
        leaderboardId_userId: {
          leaderboardId,
          userId: targetUserId,
        },
      },
      update: {
        score,
      },
      create: {
        leaderboardId,
        userId: targetUserId,
        score,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Update score error:", error);
    return c.json({ message: "Failed to update score" }, 500);
  }
});

export { groupsRouter };
