// contracts.ts
// Shared API contracts (schemas and types) used by both the server and the app.
// Import in the app as: `import { type GetSampleResponse } from "@shared/contracts"`
// Import in the server as: `import { postSampleRequestSchema } from "@shared/contracts"`

import { z } from "zod";

// GET /api/sample
export const getSampleResponseSchema = z.object({
  message: z.string(),
});
export type GetSampleResponse = z.infer<typeof getSampleResponseSchema>;

// POST /api/sample
export const postSampleRequestSchema = z.object({
  value: z.string(),
});
export type PostSampleRequest = z.infer<typeof postSampleRequestSchema>;
export const postSampleResponseSchema = z.object({
  message: z.string(),
});
export type PostSampleResponse = z.infer<typeof postSampleResponseSchema>;

// POST /api/upload/image
export const uploadImageRequestSchema = z.object({
  image: z.instanceof(File),
});
export type UploadImageRequest = z.infer<typeof uploadImageRequestSchema>;
export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
  filename: z.string(),
});
export type UploadImageResponse = z.infer<typeof uploadImageResponseSchema>;

// ==========================================
// Profile Routes
// ==========================================

// GET /api/profile - Get current user's profile
export const getProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  age: z.number().nullable(),
  photos: z.array(z.string()),
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isLive: z.boolean(),
  liveViewers: z.number(),
});
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;

// POST /api/profile - Create/Update profile
export const updateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  age: z.number().min(18).max(120).optional(),
  photos: z.array(z.string()).optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export const updateProfileResponseSchema = z.object({
  success: z.boolean(),
  profile: getProfileResponseSchema,
});
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;

// ==========================================
// Discover Routes
// ==========================================

// GET /api/discover - Get profiles to swipe on
export const getDiscoverResponseSchema = z.object({
  profiles: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      displayName: z.string(),
      bio: z.string().nullable(),
      age: z.number().nullable(),
      photos: z.array(z.string()),
      location: z.string().nullable(),
      isLive: z.boolean(),
      liveViewers: z.number(),
    })
  ),
});
export type GetDiscoverResponse = z.infer<typeof getDiscoverResponseSchema>;

// ==========================================
// Swipe Routes
// ==========================================

// POST /api/swipe - Create a swipe
export const createSwipeRequestSchema = z.object({
  swipedId: z.string(),
  direction: z.enum(["left", "right"]), // left = yes, right = no
});
export type CreateSwipeRequest = z.infer<typeof createSwipeRequestSchema>;
export const createSwipeResponseSchema = z.object({
  success: z.boolean(),
  matched: z.boolean(),
  matchId: z.string().nullable(),
});
export type CreateSwipeResponse = z.infer<typeof createSwipeResponseSchema>;

// ==========================================
// Matches Routes
// ==========================================

// GET /api/matches - Get user's matches
export const getMatchesResponseSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      profile: z.object({
        id: z.string(),
        userId: z.string(),
        displayName: z.string(),
        bio: z.string().nullable(),
        age: z.number().nullable(),
        photos: z.array(z.string()),
        isLive: z.boolean(),
      }),
      createdAt: z.string(),
    })
  ),
});
export type GetMatchesResponse = z.infer<typeof getMatchesResponseSchema>;
