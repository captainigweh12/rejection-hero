import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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

const profileRouter = new Hono<AppType>();

// ============================================
// GET /api/profile - Get current user's profile
// ============================================
profileRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let profile = await db.profile.findUnique({
    where: { userId: user.id },
  });

  // Auto-create profile if it doesn't exist (for OAuth users)
  if (!profile) {
    console.log(`📝 Creating default profile for user ${user.id} (${user.email})`);
    profile = await db.profile.create({
      data: {
        userId: user.id,
        displayName: user.name || user.email?.split("@")[0] || "User",
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
      },
    });
  }

  const photos = profile.photos ? JSON.parse(profile.photos) : [];
  const interests = profile.interests ? JSON.parse(profile.interests) : [];

  return c.json({
    id: profile.id,
    userId: profile.userId,
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
  const interestsJson = data.interests ? JSON.stringify(data.interests) : undefined;

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: data.avatar,
      interests: interestsJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    update: {
      displayName: data.displayName,
      bio: data.bio,
      age: data.age,
      photos: photosJson,
      avatar: data.avatar,
      interests: interestsJson,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  const photos = profile.photos ? JSON.parse(profile.photos) : [];
  const interests = profile.interests ? JSON.parse(profile.interests) : [];

  return c.json({
    success: true,
    profile: {
      id: profile.id,
      userId: profile.userId,
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

    let prompt = "";
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
        cyborg: "Futuristic cyborg character, half human half machine, neon lights, cyberpunk aesthetic",
      };

      prompt = stylePrompts[style] || stylePrompts.gaming;
      prompt += ". Square composition, centered, suitable for profile picture. No text or watermarks.";
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

    const result = await response.json();
    const avatarUrl = result.data[0]?.url;

    if (!avatarUrl) {
      return c.json({
        success: false,
        avatarUrl: "",
        message: "No avatar was generated. Please try again.",
      } satisfies GenerateAvatarResponse, 500);
    }

    console.log("✅ Avatar generated successfully:", avatarUrl);

    return c.json({
      success: true,
      avatarUrl,
      message: "Avatar generated successfully!",
    } satisfies GenerateAvatarResponse);
  } catch (error) {
    console.error("Error generating avatar:", error);
    return c.json({
      success: false,
      avatarUrl: "",
      message: "An error occurred while generating your avatar. Please try again.",
    } satisfies GenerateAvatarResponse, 500);
  }
});

export { profileRouter };
