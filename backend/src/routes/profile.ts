import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetProfileResponse,
  updateProfileRequestSchema,
  type UpdateProfileResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const profileRouter = new Hono<AppType>();

// ============================================
// GET /api/profile - Get current user's profile
// ============================================
profileRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return c.json({ message: "Profile not found" }, 404);
  }

  const photos = profile.photos ? JSON.parse(profile.photos) : [];

  return c.json({
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    age: profile.age,
    photos,
    location: profile.location,
    latitude: profile.latitude,
    longitude: profile.longitude,
    isLive: profile.isLive,
    liveViewers: profile.liveViewers,
  } satisfies GetProfileResponse);
});

// ============================================
// POST /api/profile - Create/Update profile
// ============================================
profileRouter.post("/", zValidator("json", updateProfileRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const photosJson = data.photos ? JSON.stringify(data.photos) : undefined;

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    update: {
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  const photos = profile.photos ? JSON.parse(profile.photos) : [];

  return c.json({
    success: true,
    profile: {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      age: profile.age,
      photos,
      location: profile.location,
      latitude: profile.latitude,
      longitude: profile.longitude,
      isLive: profile.isLive,
      liveViewers: profile.liveViewers,
    },
  } satisfies UpdateProfileResponse);
});

export { profileRouter };
