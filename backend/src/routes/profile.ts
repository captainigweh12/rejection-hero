import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import {
  type GetProfileResponse,
  updateProfileRequestSchema,
  type UpdateProfileResponse,
  generateAvatarRequestSchema,
  type GenerateAvatarResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";
import { syncNewUserToGoHighLevel } from "../services/gohighlevel";
import { uploadToR2 } from "../services/r2";

const profileRouter = new Hono<AppType>();

// ============================================
// GET /api/profile - Get current user's profile
// ============================================
profileRouter.get("/", async (c) => {
  try {
    const user = c.get("user");
    console.log("👤 [Profile] GET request - User:", user ? user.id : "null");

    if (!user) {
      console.log("❌ [Profile] Unauthorized - no user in context");
      return c.json({ message: "Unauthorized" }, 401);
    }

    console.log(`🔍 [Profile] Fetching profile for user ${user.id}`);

    // Check if user exists in database
    let userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, isAdmin: true },
    });

    // Auto-recover user from session if not in database (for DB wipe recovery)
    if (!userRecord) {
      console.log(`📝 [Profile] Recreating user ${user.id} from session (${user.email})`);
      userRecord = await db.user.create({
        data: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified ?? false,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      });
      console.log(`✅ [Profile] User ${user.id} recreated from session`);
    }

    let profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    // Auto-create profile if it doesn't exist (for OAuth users or DB recovery)
    if (!profile) {
      console.log(`📝 Creating default profile for user ${user.id} (${user.email})`);
      const displayName = user.name || user.email?.split("@")[0] || "User";

      profile = await db.profile.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          displayName: displayName,
          bio: null,
          age: null,
          ageVerified: false, // Explicitly set to false - user must verify age during onboarding
          photos: null,
          avatar: null,
          interests: null,
          location: null,
          latitude: null,
          longitude: null,
          isLive: false,
          liveViewers: 0,
          userContext: null,
          userGoals: null,
          onboardingCompleted: false,
          updatedAt: new Date(),
        },
      });

      // Sync new user to GoHighLevel and send welcome email
      syncNewUserToGoHighLevel(
        user.email,
        displayName,
        user.id,
        profile.username || undefined
      ).catch(err => {
        console.error("⚠️ Failed to sync user to GoHighLevel (non-blocking):", err);
      });
    }

    const photos = profile.photos ? JSON.parse(profile.photos) : [];
    const interests = profile.interests ? JSON.parse(profile.interests) : [];

    // Normalize avatar URL to ensure it uses storage domain
    let normalizedAvatar = profile.avatar;
    if (normalizedAvatar && typeof normalizedAvatar === "string") {
      const storageUrl = env.STORAGE_URL || process.env.STORAGE_URL || "https://storage.rejectionhero.com";
      
      // Replace api.rejectionhero.com with storage.rejectionhero.com for uploads
      if (normalizedAvatar.includes("api.rejectionhero.com")) {
        normalizedAvatar = normalizedAvatar.replace(/https?:\/\/api\.rejectionhero\.com/, storageUrl);
      }
      // If it's a relative path, convert to absolute using storage URL
      if (normalizedAvatar.startsWith("/")) {
        normalizedAvatar = `${storageUrl}${normalizedAvatar}`;
      }
    }

    console.log(`✅ [Profile] Successfully fetched profile for user ${user.id}`);
    console.log(`🖼️ [Profile] Avatar URL: ${normalizedAvatar || "null"}`);
    return c.json({
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      age: profile.age,
      photos,
      avatar: normalizedAvatar,
      interests,
      location: profile.location,
      latitude: profile.latitude,
      longitude: profile.longitude,
      isLive: profile.isLive,
      liveViewers: profile.liveViewers,
      userContext: profile.userContext,
      userGoals: profile.userGoals,
      onboardingCompleted: profile.onboardingCompleted,
      ageVerified: profile.ageVerified,
      parentalConsent: profile.parentalConsent,
      parentalGuidance: profile.parentalGuidance ? JSON.parse(profile.parentalGuidance) : undefined,
      isAdmin: userRecord?.isAdmin || false,
    } satisfies GetProfileResponse);
  } catch (error) {
    console.error("❌ [Profile] Error in GET /api/profile:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
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
  const interestsJson = data.interests ? JSON.stringify(data.interests) : undefined;

  // Normalize avatar URL - use storage domain (storage.rejectionhero.com) for all file URLs
  let normalizedAvatar = data.avatar;
  if (normalizedAvatar && typeof normalizedAvatar === "string") {
    // Storage URL - use for all file uploads
    const storageUrl = env.STORAGE_URL || process.env.STORAGE_URL || "https://storage.rejectionhero.com";
    
    // Replace sandbox.dev URLs with storage URL
    if (normalizedAvatar.includes("sandbox.dev")) {
      normalizedAvatar = normalizedAvatar.replace(/https?:\/\/[^\/]+\.sandbox\.dev/, storageUrl);
    }
    // Replace api.rejectionhero.com with storage.rejectionhero.com for uploads
    if (normalizedAvatar.includes("api.rejectionhero.com")) {
      normalizedAvatar = normalizedAvatar.replace(/https?:\/\/api\.rejectionhero\.com/, storageUrl);
    }
    // If it's a relative path, convert to absolute using storage URL
    if (normalizedAvatar.startsWith("/")) {
      normalizedAvatar = `${storageUrl}${normalizedAvatar}`;
    }
  }

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    create: {
      id: randomUUID(), // Explicitly generate ID for profile
      userId: user.id,
      username: data.username,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: normalizedAvatar,
      interests: interestsJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      userContext: data.userContext,
      userGoals: data.userGoals,
      onboardingCompleted: data.onboardingCompleted ?? false,
      challengeDuration: data.challengeDuration,
      questMode: data.questMode,
      updatedAt: new Date(), // Required field
    },
    update: {
      username: data.username,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: normalizedAvatar,
      interests: interestsJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      userContext: data.userContext,
      userGoals: data.userGoals,
      onboardingCompleted: data.onboardingCompleted,
      ...(data.ageVerified !== undefined && { ageVerified: data.ageVerified }),
      ...(data.parentalConsent !== undefined && { parentalConsent: data.parentalConsent }),
      ...(data.challengeDuration !== undefined && { challengeDuration: data.challengeDuration }),
      ...(data.questMode !== undefined && { questMode: data.questMode }),
    },
  });

  const photos = profile.photos ? JSON.parse(profile.photos) : [];
  const interests = profile.interests ? JSON.parse(profile.interests) : [];

  return c.json({
    success: true,
    profile: {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      age: profile.age,
      photos,
      avatar: profile.avatar,
      interests,
      location: profile.location,
      latitude: profile.latitude,
      longitude: profile.longitude,
      isLive: profile.isLive,
      liveViewers: profile.liveViewers,
      userContext: profile.userContext,
      userGoals: profile.userGoals,
      onboardingCompleted: profile.onboardingCompleted,
      ageVerified: profile.ageVerified,
      parentalConsent: profile.parentalConsent,
    },
  } satisfies UpdateProfileResponse);
});

// ============================================
// POST /api/profile/generate-avatar - Generate AI avatar
// ============================================
profileRouter.post("/generate-avatar", zValidator("json", generateAvatarRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  // Check if OpenAI API key is configured
  // Try multiple sources: env.OPENAI_API_KEY, process.env.OPENAI_API_KEY, or process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY
  const openaiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  
  console.log("🔑 Checking OpenAI API key...");
  console.log("  env.OPENAI_API_KEY exists:", !!env.OPENAI_API_KEY);
  console.log("  process.env.OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
  console.log("  process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY exists:", !!process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY);
  console.log("  Final openaiApiKey exists:", !!openaiApiKey);
  console.log("  Final openaiApiKey length:", openaiApiKey?.length);

  if (!openaiApiKey) {
    return c.json({
      success: false,
      avatarUrl: "",
      message: "AI avatar generation is not configured. Please add OPENAI_API_KEY to your environment variables.",
    } satisfies GenerateAvatarResponse, 503);
  }

  try {
    // Get user's display name for the avatar generation
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const displayName = profile?.displayName || user.email?.split("@")[0] || "Warrior";

    // Create the prompt for DALL-E
    const style = data.style || "gaming";
    const customDescription = data.description || "";

    let prompt: string;
    if (customDescription) {
      prompt = `Create a profile avatar with this description: ${customDescription}. Style: ${style}. High quality, professional, suitable for a gaming profile picture.`;
    } else {
      // Default gaming-style prompts
      const stylePrompts: Record<string, string> = {
        gaming: "Epic gaming character avatar, futuristic warrior, neon colors, purple and orange glow, cyberpunk style, professional game character portrait",
        anime: "Anime style character avatar, bold colors, determined expression, hero character, professional anime art style",
        realistic: "Professional portrait photo, confident person, studio lighting, high quality, photorealistic",
        fantasy: "Fantasy RPG character portrait, magical aura, heroic pose, detailed fantasy art style, glowing effects",
        warrior: "Powerful warrior character, battle-ready, strong presence, epic fantasy style, glowing armor",
        ninja: "Stealth ninja character, mysterious, dark background, action pose, professional game art",
        mage: "Magical wizard character, casting spell, mystical energy, fantasy RPG style, glowing magic effects",
        cyborg: "Futuristic tech character with cybernetic elements, neon lights and digital effects, advanced technology aesthetic, sci-fi style",
      };

      prompt = (stylePrompts[style] ?? stylePrompts.gaming) + ". Square composition, centered, suitable for profile picture. No text or watermarks.";
    }

    console.log("🎨 Generating AI avatar with prompt:", prompt);

    // Call OpenAI DALL-E API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
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
      } satisfies GenerateAvatarResponse, 500);
    }

    const result = (await response.json()) as { data: Array<{ url: string }> };
    const dallEUrl = result.data[0]?.url;

    if (!dallEUrl) {
      return c.json({
        success: false,
        avatarUrl: "",
        message: "No avatar was generated. Please try again.",
      } satisfies GenerateAvatarResponse, 500);
    }

    console.log("✅ Avatar generated successfully from DALL-E:", dallEUrl);

    // Download the image from DALL-E and save it to our server
    try {
      const imageResponse = await fetch(dallEUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download avatar from DALL-E");
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Generate unique filename for R2
      const uniqueFilename = `avatar-${randomUUID()}.png`;
      const r2Key = `avatars/${uniqueFilename}`;

      // Upload to R2 (Cloudflare R2 storage)
      console.log("📤 [R2] Uploading avatar to R2...");
      const serverAvatarUrl = await uploadToR2(imageBuffer, r2Key, "image/png");
      console.log("✅ Avatar URL saved:", serverAvatarUrl);

      return c.json({
        success: true,
        avatarUrl: serverAvatarUrl,
        message: "Avatar generated successfully!",
      } satisfies GenerateAvatarResponse);
    } catch (downloadError) {
      console.error("Error downloading/saving avatar:", downloadError);
      // Fallback: return DALL-E URL (will expire but better than nothing)
      console.warn("⚠️ Using temporary DALL-E URL (will expire)");
      return c.json({
        success: true,
        avatarUrl: dallEUrl,
        message: "Avatar generated successfully!",
      } satisfies GenerateAvatarResponse);
    }
  } catch (error) {
    console.error("Error generating avatar:", error);
    return c.json({
      success: false,
      avatarUrl: "",
      message: "An error occurred while generating your avatar. Please try again.",
    } satisfies GenerateAvatarResponse, 500);
  }
});

// ============================================
// PUT /api/profile/parental-guidance - Update parental guidance settings
// ============================================
profileRouter.put("/parental-guidance", async (c) => {
  try {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const data = await c.req.json();
    const { parentalGuidance } = data;

    if (!parentalGuidance) {
      return c.json({ message: "parentalGuidance is required" }, 400);
    }

    // Store parental guidance settings as JSON string
    const parentalGuidanceJson = JSON.stringify(parentalGuidance);

    const profile = await db.profile.update({
      where: { userId: user.id },
      data: {
        parentalGuidance: parentalGuidanceJson,
      },
    });

    console.log(`✅ [Profile] Updated parental guidance for user ${user.id}`);

    return c.json({
      success: true,
      profile: {
        id: profile.id,
        userId: profile.userId,
        parentalGuidance: JSON.parse(profile.parentalGuidance || "{}"),
      },
    });
  } catch (error) {
    console.error("❌ [Profile] Error in PUT /api/profile/parental-guidance:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// ============================================
// POST /api/profile/push-token - Register/update push notification token
// ============================================
profileRouter.post("/push-token", zValidator("json", z.object({ pushToken: z.string() })), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const { pushToken } = c.req.valid("json");

    // Update user's profile with push token
    await db.profile.update({
      where: { userId: user.id },
      data: { pushToken },
    });

    console.log(`✅ [Profile] Push token registered for user ${user.id}`);
    return c.json({ success: true, message: "Push token registered successfully" });
  } catch (error) {
    console.error("Error registering push token:", error);
    return c.json({ success: false, message: "Failed to register push token" }, 500);
  }
});

export { profileRouter };
