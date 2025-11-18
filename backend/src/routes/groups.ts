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
  const memberships = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          creator: {
            include: { Profile: true },
          },
          members: true,
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
    creatorName: m.group.creator.Profile?.displayName || m.group.creator.email?.split("@")[0] || "User",
    memberCount: m.group.members.length,
    role: m.role,
    joinedAt: m.joinedAt,
    createdAt: m.group.createdAt,
  }));

  // Get public groups user hasn't joined
  const publicGroups = await db.group.findMany({
    where: {
      isPrivate: false,
      members: {
        none: {
          userId: user.id,
        },
      },
    },
    include: {
      creator: {
        include: { Profile: true },
      },
      members: true,
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
    creatorName: group.creator.Profile?.displayName || group.creator.email?.split("@")[0] || "User",
    memberCount: group.members.length,
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
      creator: {
        include: { Profile: true },
      },
      members: {
        include: {
          user: {
            include: { Profile: true },
          },
        },
      },
    },
  });

  if (!group) {
    return c.json({ message: "Group not found" }, 404);
  }

  // Check if user is a member
  const membership = group.members.find((m) => m.userId === user.id);

  if (group.isPrivate && !membership) {
    return c.json({ message: "This is a private group" }, 403);
  }

  const members = group.members.map((m) => ({
    id: m.userId,
    displayName: m.user.Profile?.displayName || m.user.email?.split("@")[0] || "User",
    avatar: m.user.Profile?.avatar || null,
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
      creatorName: group.creator.Profile?.displayName || group.creator.email?.split("@")[0] || "User",
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
  await db.groupMember.create({
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
  const existing = await db.groupMember.findUnique({
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
  await db.groupMember.create({
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
  const membership = await db.groupMember.findUnique({
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
  await db.groupMember.delete({
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
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!group) {
      return c.json({ message: "Group not found" }, 404);
    }

    // Check if user is a member with moderator/admin role
    const membership = group.members[0];
    if (!membership || (membership.role !== "ADMIN" && membership.role !== "MODERATOR")) {
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
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
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

export { groupsRouter };
