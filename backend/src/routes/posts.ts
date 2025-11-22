import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type AppType } from "../types";
import { db } from "../db";
import {
  createPostRequestSchema,
  addCommentRequestSchema,
} from "../../../shared/contracts";
import { filterBlockedUsers } from "./moderation";
import { randomUUID } from "node:crypto";

const postsRouter = new Hono<AppType>();

// ============================================
// POST /api/posts - Create a new post
// ============================================
postsRouter.post("/", zValidator("json", createPostRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { content, privacy, groupId, imageUrls, userQuestId } = c.req.valid("json");

  try {
    // Verify group exists if groupId provided
    if (groupId) {
      const group = await db.group.findUnique({
        where: { id: groupId },
        include: {
          group_member: true,
        },
      });

      if (!group) {
        return c.json({ message: "Group not found" }, 404);
      }

      // Check if user is a member of the group
      const isMember = group.group_member.some((m) => m.userId === user.id);
      if (!isMember && group.creatorId !== user.id) {
        return c.json({ message: "You must be a member of this group to post" }, 403);
      }
    }

    // Create post
    const post = await db.post.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        content,
        privacy,
        groupId: groupId || null,
        userQuestId: userQuestId || null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Create post images if provided
    const images = [];
    if (imageUrls && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        if (!imageUrl) continue;
        const image = await db.post_image.create({
          data: {
            id: randomUUID(),
            postId: post.id,
            imageUrl: imageUrl,
            order: i,
          },
        });
        images.push({
          id: image.id,
          imageUrl: image.imageUrl,
          order: image.order,
        });
      }
    }

    return c.json({
      id: post.id,
      content: post.content,
      privacy: post.privacy,
      groupId: post.groupId,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        name: post.user.name,
        avatar: post.user.profile?.avatar || post.user.image || null,
      },
      images,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return c.json({ message: "Failed to create post" }, 500);
  }
});

// ============================================
// GET /api/posts/feed - Get posts feed with privacy filtering
// ============================================
postsRouter.get("/feed", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Get user's friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id, status: "ACCEPTED" },
          { receiverId: user.id, status: "ACCEPTED" },
        ],
      },
    });

    let friendIds = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    // Filter out blocked users from friends list
    friendIds = await filterBlockedUsers(user.id, friendIds);

    // Get blocked users
    const blockedUsers = await db.user_block.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true },
    });
    const blockedIds = blockedUsers.map((b) => b.blockedId);

    // Get user's groups
    const userGroups = await db.group_member.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    });

    const groupIds = userGroups.map((g) => g.groupId);

    // Fetch posts with privacy filtering (excluding blocked users and deleted/hidden posts)
    const posts = await db.post.findMany({
      where: {
        AND: [
          {
            OR: [
              // Public posts from everyone (except blocked)
              { privacy: "PUBLIC", userId: { notIn: blockedIds } },
              // Friends-only posts from friends
              {
                privacy: "FRIENDS",
                userId: { in: [...friendIds, user.id] },
              },
              // Group posts from user's groups
              {
                privacy: "GROUPS",
                groupId: { in: groupIds },
              },
              // User's own posts
              { userId: user.id },
            ],
          },
          // Exclude deleted/hidden posts
          { deletedAt: null },
          { isHidden: false },
        ],
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        post_image: {
          orderBy: {
            order: "asc",
          },
        },
        post_like: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
        },
        post_comment: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to 50 recent posts
    });

    // Format response
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
        avatar: post.user.profile?.avatar || post.user.image || null,
      },
      group: post.group,
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
          avatar: comment.user.profile?.avatar || comment.user.image || null,
        },
      })),
      likeCount: post.post_like.length,
      commentCount: post.post_comment.length,
      isLikedByCurrentUser: post.post_like.some((like) => like.userId === user.id),
    }));

    return c.json({
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Get feed error:", error);
    return c.json({ message: "Failed to fetch feed" }, 500);
  }
});

// ============================================
// POST /api/posts/:id/like - Like a post
// ============================================
postsRouter.post("/:id/like", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const postId = c.req.param("id");

  try {
    // Check if already liked
    const existingLike = await db.post_like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      return c.json({ message: "Post already liked" }, 400);
    }

    // Create like
    await db.post_like.create({
      data: {
        id: randomUUID(),
        postId,
        userId: user.id,
      },
    });

    // Get updated like count
    const likeCount = await db.post_like.count({
      where: { postId },
    });

    return c.json({
      success: true,
      likeCount,
    });
  } catch (error) {
    console.error("Like post error:", error);
    return c.json({ message: "Failed to like post" }, 500);
  }
});

// ============================================
// DELETE /api/posts/:id/like - Unlike a post
// ============================================
postsRouter.delete("/:id/like", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const postId = c.req.param("id");

  try {
    // Delete like
    await db.post_like.delete({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    // Get updated like count
    const likeCount = await db.post_like.count({
      where: { postId },
    });

    return c.json({
      success: true,
      likeCount,
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    return c.json({ message: "Failed to unlike post" }, 500);
  }
});

// ============================================
// POST /api/posts/:id/comment - Add a comment
// ============================================
postsRouter.post("/:id/comment", zValidator("json", addCommentRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const postId = c.req.param("id");
  const { content } = c.req.valid("json");

  try {
    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ message: "Post not found" }, 404);
    }

    // Create comment
    const comment = await db.post_comment.create({
      data: {
        id: randomUUID(),
        postId,
        userId: user.id,
        content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return c.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.profile?.avatar || comment.user.image || null,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return c.json({ message: "Failed to add comment" }, 500);
  }
});

// ============================================
// PUT /api/posts/:id - Update a post
// ============================================
postsRouter.put("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const postId = c.req.param("id");
  const body = await c.req.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return c.json({ message: "Content is required" }, 400);
  }

  try {
    // Verify post exists and belongs to user
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ message: "Post not found" }, 404);
    }

    if (post.userId !== user.id) {
      return c.json({ message: "You can only edit your own posts" }, 403);
    }

    // Update post
    const updatedPost = await db.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return c.json({
      id: updatedPost.id,
      content: updatedPost.content,
      privacy: updatedPost.privacy,
      updatedAt: updatedPost.updatedAt.toISOString(),
      user: {
        id: updatedPost.user.id,
        name: updatedPost.user.name,
        avatar: updatedPost.user.profile?.avatar || updatedPost.user.image || null,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    return c.json({ message: "Failed to update post" }, 500);
  }
});

// ============================================
// DELETE /api/posts/:id - Delete a post
// ============================================
postsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const postId = c.req.param("id");

  try {
    // Verify post exists and belongs to user
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ message: "Post not found" }, 404);
    }

    if (post.userId !== user.id) {
      return c.json({ message: "You can only delete your own posts" }, 403);
    }

    // Delete post (cascades to images, likes, comments)
    await db.post.delete({
      where: { id: postId },
    });

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete post error:", error);
    return c.json({ message: "Failed to delete post" }, 500);
  }
});

export default postsRouter;
