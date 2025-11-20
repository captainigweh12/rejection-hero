import { Hono } from "hono";
import { type GetMatchesResponse } from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const matchesRouter = new Hono<AppType>();

// ============================================
// GET /api/matches - Get user's matches
// ============================================
matchesRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get matches where user is either user1 or user2
  const matches = await db.match.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    include: {
      user1: {
        include: {
          profile: true,
        },
      },
      user2: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedMatches = matches.map((match) => {
    // Get the other user's profile
    const otherUser = match.user1Id === user.id ? match.user2 : match.user1;
    const profile = otherUser.Profile;

    if (!profile) {
      return null;
    }

    return {
      id: match.id,
      profile: {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        age: profile.age,
        photos: profile.photos ? JSON.parse(profile.photos) : [],
        isLive: profile.isLive,
      },
      createdAt: match.createdAt.toISOString(),
    };
  }).filter(Boolean);

  return c.json({
    matches: formattedMatches,
  } satisfies GetMatchesResponse);
});

export { matchesRouter };
