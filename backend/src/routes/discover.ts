import { Hono } from "hono";
import { type GetDiscoverResponse } from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const discoverRouter = new Hono<AppType>();

// ============================================
// GET /api/discover - Get profiles to swipe on
// ============================================
discoverRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get IDs of users already swiped on
  const swipedIds = await db.swipe.findMany({
    where: { swiperId: user.id },
    select: { swipedId: true },
  });

  const swipedUserIds = swipedIds.map((s) => s.swipedId);

  // Get profiles not yet swiped on (excluding current user)
  const profiles = await db.profile.findMany({
    where: {
      userId: {
        notIn: [...swipedUserIds, user.id],
      },
    },
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedProfiles = profiles.map((profile) => ({
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    age: profile.age,
    photos: profile.photos ? JSON.parse(profile.photos) : [],
    interests: profile.interests ? JSON.parse(profile.interests) : [],
    location: profile.location,
    isLive: profile.isLive,
    liveViewers: profile.liveViewers,
  }));

  return c.json({
    profiles: formattedProfiles,
  } satisfies GetDiscoverResponse);
});

export { discoverRouter };
