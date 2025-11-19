import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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
    
    // Get user's admin status
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });
    
    let profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    // Auto-create profile if it doesn't exist (for OAuth users)
    if (!profile) {
      console.log(`📝 Creating default profile for user ${user.id} (${user.email})`);
      const displayName = user.name || user.email?.split("@")[0] || "User";

      profile = await db.profile.create({
        data: {
          userId: user.id,
          displayName: displayName,
          bio: null,
          age: null,
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

    console.log(`✅ [Profile] Successfully fetched profile for user ${user.id}`);
    return c.json({
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

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      username: data.username,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: data.avatar,
      interests: interestsJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      userContext: data.userContext,
      userGoals: data.userGoals,
      onboardingCompleted: data.onboardingCompleted ?? false,
      challengeDuration: data.challengeDuration,
      questMode: data.questMode,
    },
    update: {
      username: data.username,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: data.avatar,
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
  console.log("🔑 Checking OpenAI API key...");
  console.log("  env.OPENAI_API_KEY exists:", !!env.OPENAI_API_KEY);
  console.log("  env.OPENAI_API_KEY length:", env.OPENAI_API_KEY?.length);
  console.log("  process.env.OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
  console.log("  All env keys:", Object.keys(env));

  if (!env.OPENAI_API_KEY) {
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
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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

      // Get uploads directory
      const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
      
      // Ensure uploads directory exists
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      // Generate unique filename
      const uniqueFilename = `avatar-${randomUUID()}.png`;
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);

      // Save file to disk
      fs.writeFileSync(filePath, imageBuffer);
      console.log("💾 Avatar saved to server:", filePath);

      // Return server URL instead of DALL-E URL
      const serverAvatarUrl = `/uploads/${uniqueFilename}`;
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

export { profileRouter };
