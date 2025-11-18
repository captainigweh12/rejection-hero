import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetUserQuestsResponse,
  generateQuestRequestSchema,
  type GenerateQuestResponse,
  type StartQuestResponse,
  recordQuestActionRequestSchema,
  type RecordQuestActionResponse,
  type GetQuestRadarResponse,
  type GetWarmupActionResponse,
  type GetSmartQuestSuggestionsResponse,
  generateMapQuestsRequestSchema,
  type GenerateMapQuestsResponse,
  refreshAllQuestsRequestSchema,
  type RefreshAllQuestsResponse,
  swapQuestRequestSchema,
  type SwapQuestResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";
import { checkFullQuestSafety, checkQuestSafetyWithAI } from "../utils/safetyFilter";

const questsRouter = new Hono<AppType>();

// ============================================
// GET /api/quests - Get user's quests
// ============================================
questsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuests = await db.userQuest.findMany({
    where: { userId: user.id },
    include: {
      quest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeQuests = userQuests
    .filter((uq) => uq.status === "ACTIVE")
    .map((uq) => ({
      id: uq.id,
      quest: {
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        category: uq.quest.category,
        difficulty: uq.quest.difficulty,
        goalType: uq.quest.goalType,
        goalCount: uq.quest.goalCount,
        xpReward: uq.quest.xpReward,
        pointReward: uq.quest.pointReward,
        location: uq.quest.location,
        latitude: uq.quest.latitude,
        longitude: uq.quest.longitude,
        timeContext: uq.quest.timeContext,
        dateContext: uq.quest.dateContext,
      },
      noCount: uq.noCount,
      yesCount: uq.yesCount,
      actionCount: uq.actionCount,
      status: uq.status,
      startedAt: uq.startedAt?.toISOString() || null,
    }));

  const queuedQuests = userQuests
    .filter((uq) => uq.status === "QUEUED")
    .map((uq) => ({
      id: uq.id,
      quest: {
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        category: uq.quest.category,
        difficulty: uq.quest.difficulty,
        goalType: uq.quest.goalType,
        goalCount: uq.quest.goalCount,
        xpReward: uq.quest.xpReward,
        pointReward: uq.quest.pointReward,
        location: uq.quest.location,
        latitude: uq.quest.latitude,
        longitude: uq.quest.longitude,
      },
    }));

  return c.json({
    activeQuests,
    queuedQuests,
  } satisfies GetUserQuestsResponse);
});

// ============================================
// GET /api/quests/completed - Get user's completed quests
// ============================================
questsRouter.get("/completed", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const completedUserQuests = await db.userQuest.findMany({
    where: {
      userId: user.id,
      status: "COMPLETED",
    },
    include: {
      quest: true,
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  const quests = completedUserQuests.map((uq) => ({
    id: uq.id,
    completedAt: uq.completedAt?.toISOString() || "",
    quest: {
      title: uq.quest.title,
      category: uq.quest.category,
      difficulty: uq.quest.difficulty,
      xpReward: uq.quest.xpReward,
      pointReward: uq.quest.pointReward,
    },
    noCount: uq.noCount,
    yesCount: uq.yesCount,
    actionCount: uq.actionCount,
  }));

  return c.json({ quests });
});

// Helper function to check if user has active subscription
async function hasActiveSubscription(userId: string): Promise<boolean> {
  // Check if user is admin - admins have full access
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (user?.isAdmin) {
    return true; // Admins have full access
  }

  const subscription = await db.subscription.findUnique({
    where: { userId },
  });
  return subscription?.status === "active" || subscription?.status === "trialing";
}

// ============================================
// POST /api/quests/generate - Generate AI quest
// ============================================
questsRouter.post("/generate", zValidator("json", generateQuestRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check subscription for AI features
  const hasSubscription = await hasActiveSubscription(user.id);
  if (!hasSubscription) {
    return c.json(
      {
        message: "AI quest generation requires a premium subscription. Subscribe to unlock AI-powered quests!",
        requiresSubscription: true,
      },
      403
    );
  }

  const { category, difficulty, customPrompt, userLocation, userLatitude, userLongitude, preferredQuestType } = c.req.valid("json");

  // Safety check: If custom prompt provided, check for harmful content
  if (customPrompt) {
    const { checkQuestSafety } = await import("./sharedQuests");
    const safetyCheck = await checkQuestSafety(customPrompt);
    
    if (!safetyCheck.isSafe) {
      return c.json(
        {
          message: "Quest cannot be created",
          isSafe: false,
          safetyWarning: safetyCheck.warning || "This quest contains content that may be harmful or inappropriate.",
        },
        400
      );
    }
  }

  // Generate quest using OpenAI with location context
  const questData = await generateQuestWithAI(
    category,
    difficulty,
    customPrompt,
    user.id,
    userLocation,
    userLatitude,
    userLongitude,
    preferredQuestType
  );

  // Safety check on generated quest description
  const { checkQuestSafety } = await import("./sharedQuests");
  const safetyCheck = await checkQuestSafety(questData.description);
  
  if (!safetyCheck.isSafe) {
    console.warn("⚠️ Generated quest failed safety check:", safetyCheck.warning);
    return c.json(
      {
        message: "Quest generation failed safety check",
        isSafe: false,
        safetyWarning: safetyCheck.warning || "The generated quest contains content that may be harmful.",
      },
      400
    );
  }

  // Use cleaned description if available
  const finalDescription = safetyCheck.cleanDescription || questData.description;

  // Create quest in database
  const quest = await db.quest.create({
    data: {
      title: questData.title,
      description: finalDescription,
      category: questData.category,
      difficulty: questData.difficulty,
      goalType: questData.goalType,
      goalCount: questData.goalCount,
      xpReward: questData.xpReward,
      pointReward: questData.pointReward,
      isAIGenerated: true,
      location: questData.location,
      latitude: questData.latitude,
      longitude: questData.longitude,
      timeContext: questData.timeContext,
      dateContext: questData.dateContext,
    },
  });

  // Create user quest
  const userQuest = await db.userQuest.create({
    data: {
      userId: user.id,
      questId: quest.id,
      status: "QUEUED",
    },
  });

  return c.json({
    success: true,
    userQuestId: userQuest.id,
    quest: {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      goalType: quest.goalType,
      goalCount: quest.goalCount,
      xpReward: quest.xpReward,
      pointReward: quest.pointReward,
      location: quest.location,
      latitude: quest.latitude,
      longitude: quest.longitude,
      timeContext: quest.timeContext,
      dateContext: quest.dateContext,
    },
  } satisfies GenerateQuestResponse);
});

// ============================================
// POST /api/quests/refresh-all - Refresh all queued quests
// ============================================
questsRouter.post("/refresh-all", zValidator("json", refreshAllQuestsRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Check subscription for AI features
  const hasSubscription = await hasActiveSubscription(user.id);
  if (!hasSubscription) {
    return c.json(
      {
        message: "AI quest generation requires a premium subscription. Subscribe to unlock AI-powered quests!",
        requiresSubscription: true,
      },
      403
    );
  }

  const { count = 3, userLocation, userLatitude, userLongitude } = c.req.valid("json");

  try {
    const newQuests = [];

    // Generate multiple quests in sequence
    for (let i = 0; i < count; i++) {
      const questData = await generateQuestWithAI(
        undefined, // category - let AI choose
        undefined, // difficulty - let AI choose
        undefined, // customPrompt
        user.id,
        userLocation,
        userLatitude,
        userLongitude,
        undefined // preferredQuestType
      );

      // Create quest in database
      const quest = await db.quest.create({
        data: {
          title: questData.title,
          description: questData.description,
          category: questData.category,
          difficulty: questData.difficulty,
          goalType: questData.goalType,
          goalCount: questData.goalCount,
          xpReward: questData.xpReward,
          pointReward: questData.pointReward,
          isAIGenerated: true,
          location: questData.location,
          latitude: questData.latitude,
          longitude: questData.longitude,
          timeContext: questData.timeContext,
          dateContext: questData.dateContext,
        },
      });

      // Create user quest
      const userQuest = await db.userQuest.create({
        data: {
          userId: user.id,
          questId: quest.id,
          status: "QUEUED",
        },
      });

      newQuests.push({
        userQuestId: userQuest.id,
        quest: {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          xpReward: quest.xpReward,
          pointReward: quest.pointReward,
        },
      });
    }

    return c.json({
      success: true,
      message: `Successfully generated ${count} new quests`,
      newQuestCount: count,
      quests: newQuests,
    } satisfies RefreshAllQuestsResponse);
  } catch (error) {
    console.error("Error refreshing quests:", error);
    return c.json(
      { message: "Failed to generate quests. Please try again." },
      500
    );
  }
});

// ============================================
// POST /api/quests/:id/start - Start a quest
// ============================================
questsRouter.post("/:id/start", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");
  const skipLimitCheck = c.req.query("skipLimitCheck") === "true"; // Allow bypassing limit for regeneration

  // Get the quest to check if it's from a friend
  const userQuestToStart = await db.userQuest.findUnique({
    where: { id: userQuestId },
    include: { quest: true },
  });

  if (!userQuestToStart) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Check active quests limit - NEW LOGIC: 1 slot for user quests, 1 slot for friend quests
  if (!skipLimitCheck) {
    const activeQuests = await db.userQuest.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    // Count active user quests (not from friends)
    const activeUserQuests = activeQuests.filter((q) => !q.isFromFriend);
    // Count active friend quests
    const activeFriendQuests = activeQuests.filter((q) => q.isFromFriend);

    // Check if the appropriate slot is full
    if (userQuestToStart.isFromFriend) {
      // This is a friend quest, check friend quest slot
      if (activeFriendQuests.length >= 1) {
        return c.json({ message: "Friend quest slot is full. Complete your active friend quest first." }, 400);
      }
    } else {
      // This is a user quest, check user quest slot
      if (activeUserQuests.length >= 1) {
        return c.json({ message: "Your quest slot is full. Complete your active quest first." }, 400);
      }
    }
  }

  // Update quest status
  const userQuest = await db.userQuest.update({
    where: { id: userQuestId },
    data: {
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    userQuestId: userQuest.id,
  } satisfies StartQuestResponse);
});

// ============================================
// POST /api/quests/swap - Swap an active quest with a queued quest
// ============================================
questsRouter.post("/swap", zValidator("json", swapQuestRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { activeQuestId, queuedQuestId } = c.req.valid("json");

  // Fetch both quests and verify they belong to the user
  const activeQuest = await db.userQuest.findUnique({
    where: { id: activeQuestId },
    include: { quest: true },
  });

  const queuedQuest = await db.userQuest.findUnique({
    where: { id: queuedQuestId },
    include: { quest: true },
  });

  if (!activeQuest || !queuedQuest) {
    return c.json({ message: "One or both quests not found" }, 404);
  }

  if (activeQuest.userId !== user.id || queuedQuest.userId !== user.id) {
    return c.json({ message: "Unauthorized - quests don't belong to you" }, 403);
  }

  // Verify statuses
  if (activeQuest.status !== "ACTIVE") {
    return c.json({ message: "First quest must be active" }, 400);
  }

  if (queuedQuest.status !== "QUEUED") {
    return c.json({ message: "Second quest must be queued" }, 400);
  }

  // 🚨 CRITICAL: Check if active quest has any actions recorded
  // If user has gotten their first No, Yes, or Action, they can't swap
  const hasActions = activeQuest.noCount > 0 || activeQuest.yesCount > 0 || activeQuest.actionCount > 0;

  if (hasActions) {
    return c.json(
      {
        success: false,
        message: "Cannot swap quests once you've started recording actions (No, Yes, or Action). Complete this quest first.",
      },
      400
    );
  }

  // Perform the swap: active -> queued, queued -> active
  await db.$transaction([
    // Move active quest to queue (reset startedAt)
    db.userQuest.update({
      where: { id: activeQuestId },
      data: {
        status: "QUEUED",
        startedAt: null,
      },
    }),
    // Move queued quest to active (set startedAt)
    db.userQuest.update({
      where: { id: queuedQuestId },
      data: {
        status: "ACTIVE",
        startedAt: new Date(),
      },
    }),
  ]);

  return c.json({
    success: true,
    message: "Quests swapped successfully",
  } satisfies SwapQuestResponse);
});

// ============================================
// POST /api/quests/:id/record - Record NO, YES, or ACTION
// ============================================
questsRouter.post("/:id/record", zValidator("json", recordQuestActionRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");
  const { action } = c.req.valid("json");

  const userQuest = await db.userQuest.findUnique({
    where: { id: userQuestId },
    include: { quest: true },
  });

  if (!userQuest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Update counts based on action type
  const newNoCount = action === "NO" ? userQuest.noCount + 1 : userQuest.noCount;
  const newYesCount = action === "YES" ? userQuest.yesCount + 1 : userQuest.yesCount;
  const newActionCount = action === "ACTION" ? userQuest.actionCount + 1 : userQuest.actionCount;

  // Check if quest is completed
  const isCompleted =
    (userQuest.quest.goalType === "COLLECT_NOS" && newNoCount >= userQuest.quest.goalCount) ||
    (userQuest.quest.goalType === "COLLECT_YES" && newYesCount >= userQuest.quest.goalCount) ||
    (userQuest.quest.goalType === "TAKE_ACTION" && newActionCount >= userQuest.quest.goalCount);

  // Update user quest
  const updated = await db.userQuest.update({
    where: { id: userQuestId },
    data: {
      noCount: newNoCount,
      yesCount: newYesCount,
      actionCount: newActionCount,
      ...(isCompleted && {
        status: "COMPLETED",
        completedAt: new Date(),
      }),
    },
  });

  // If completed, update user stats and award tokens
  if (isCompleted) {
    await updateUserStats(user.id, userQuest.quest.xpReward, userQuest.quest.pointReward, userQuest.quest.difficulty);

    // Award tokens proportional to the number of "No"s collected
    // Formula: 1 token per "No" collected (minimum 1 token if quest was completed)
    const tokensEarned = userQuest.quest.goalType === "COLLECT_NOS" 
      ? Math.max(1, newNoCount) // At least 1 token, or number of NOs collected
      : userQuest.quest.goalType === "COLLECT_YES"
      ? Math.max(1, newYesCount) // For YES quests, use YES count
      : Math.max(1, newActionCount); // For ACTION quests, use action count

    // Update user stats with tokens
    await db.userStats.update({
      where: { userId: user.id },
      data: {
        tokens: {
          increment: tokensEarned,
        },
      },
    });

    // Create token transaction record
    await db.tokenTransaction.create({
      data: {
        userId: user.id,
        type: "earned",
        amount: tokensEarned,
        description: `Earned ${tokensEarned} token${tokensEarned > 1 ? "s" : ""} from completing quest: ${userQuest.quest.title}`,
        questId: userQuest.quest.id,
      },
    });

    // Check if this is a challenge daily quest and mark it as completed
    const challengeDailyQuest = await db.challengeDailyQuest.findFirst({
      where: {
        userQuestId: userQuestId,
      },
      include: {
        challenge: true,
      },
    });

    if (challengeDailyQuest && challengeDailyQuest.status !== "COMPLETED") {
      // Mark daily quest as completed
      await db.challengeDailyQuest.update({
        where: { id: challengeDailyQuest.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Update challenge completed days count
      await db.challenge.update({
        where: { id: challengeDailyQuest.challengeId },
        data: {
          completedDays: {
            increment: 1,
          },
        },
      });

      // Send completion notification
      await db.notification.create({
        data: {
          userId: user.id,
          type: "CHALLENGE_DAY_COMPLETED",
          title: `🎉 Day ${challengeDailyQuest.day} Complete!`,
          message: `You completed Day ${challengeDailyQuest.day} of your 100 Day Challenge! Keep the momentum going! 🔥`,
          data: JSON.stringify({ challengeId: challengeDailyQuest.challengeId, day: challengeDailyQuest.day }),
        },
      });
    }
  }

  return c.json({
    success: true,
    completed: isCompleted,
    noCount: newNoCount,
    yesCount: newYesCount,
    actionCount: newActionCount,
  } satisfies RecordQuestActionResponse);
});

// ============================================
// Helper Functions
// ============================================

// Get nearby places using Google Places API
async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 16093, // 10 miles in meters
  type?: string
): Promise<Array<{ name: string; address: string; lat: number; lng: number; types: string[] }>> {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.log("No Google Maps API key found");
    return [];
  }

  try {
    const typeParam = type ? `&type=${type}` : "";
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}${typeParam}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message);
      return [];
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Return up to 10 places with relevant details
    return data.results.slice(0, 10).map((place: any) => ({
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      types: place.types || [],
    }));
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return [];
  }
}

export async function generateQuestWithAI(
  category?: string,
  difficulty?: string,
  customPrompt?: string,
  userId?: string,
  userLocation?: string,
  userLatitude?: number,
  userLongitude?: number,
  preferredQuestType?: "REJECTION" | "ACTION"
): Promise<{
  title: string;
  description: string;
  category: string;
  difficulty: string;
  goalType: string;
  goalCount: number;
  xpReward: number;
  pointReward: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  timeContext?: string;
  dateContext?: string;
}> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.log("No OpenAI API key found, using predefined quest");
    // Fallback to predefined quests if no API key
    return getPredefinedQuest(category, difficulty);
  }

  console.log("Using OpenAI API to generate quest");

  try {
    // Get current date/time context
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
    const month = now.toLocaleDateString("en-US", { month: "long" });
    const date = now.getDate();

    // Determine time of day
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else if (hour >= 21 || hour < 6) timeOfDay = "night";

    // Determine day type
    const isWeekend = day === 0 || day === 6;
    const dayType = isWeekend ? "weekend" : "weekday";

    // Get nearby places from Google Places API if user location is available
    let nearbyPlaces: Array<{ name: string; address: string; lat: number; lng: number; types: string[] }> = [];
    if (userLatitude && userLongitude) {
      console.log(`Fetching nearby places for ${userLocation} at ${userLatitude}, ${userLongitude}`);
      nearbyPlaces = await getNearbyPlaces(userLatitude, userLongitude, 16093); // 10 miles
      console.log(`Found ${nearbyPlaces.length} nearby places`);
    }

    // Build context string with verified nearby places from Google Maps
    const locationContext = userLocation && userLatitude && userLongitude && nearbyPlaces.length > 0
      ? `\n\nLOCATION CONTEXT: User is currently at ${userLocation}.

VERIFIED NEARBY PLACES (from Google Maps within 10 miles):
${nearbyPlaces.slice(0, 10).map((place, i) => `${i + 1}. "${place.name}" at ${place.address} (Coordinates: ${place.lat}, ${place.lng})`).join("\n")}

🚨 CRITICAL LOCATION REQUIREMENTS - READ CAREFULLY 🚨
YOU MUST SELECT ONE SPECIFIC PLACE FROM THE VERIFIED LIST ABOVE.

HOW TO USE THE VERIFIED PLACE IN YOUR JSON RESPONSE:
1. "description" field: Write naturally like "Visit Starbucks on Main Street" or "Go to Target on University Blvd"
   ❌ NEVER WRITE: "Visit (GPS: 35.123, -80.456)" or "at coordinates 35.123, -80.456"
   ❌ NEVER WRITE: "(Coordinates: 35.123, -80.456)" anywhere in description
   ❌ NEVER include numbers like "35.3088457, -80.7506283" in description
   ✅ ALWAYS WRITE: Just the place name and street/area like normal human speech

2. "location" field: Use format "Place Name - Street Address" (e.g., "Starbucks - 123 Main St")

3. "latitude" and "longitude" fields: Use the EXACT coordinates from the verified place

4. "goalCount" field:
   🚨 IMPORTANT: If the quest requires going to ONE SPECIFIC LOCATION and asking front desk/receptionist/manager:
   - SET goalCount to 1 (only 1 NO required)
   - Example: "Visit Hilton Hotel and ask front desk for free room upgrade" → goalCount: 1
   - Example: "Go to Planet Fitness and ask manager for free lifetime membership" → goalCount: 1

   For quests visiting MULTIPLE different locations, use normal difficulty-based counts:
   - Example: "Visit 5 coffee shops and ask for custom drinks" → goalCount: 5
   - Example: "Ask 3 gym trainers if you can teach their class" → goalCount: 3

EXAMPLES OF CORRECT DESCRIPTIONS:
✅ "Visit Starbucks on Main Street and ask for a custom drink"
✅ "Go to Target on University Boulevard and request a manager discount"
✅ "Ask baristas at Dunkin' Donuts on Oak Avenue for free samples"

EXAMPLES OF INCORRECT DESCRIPTIONS (DO NOT DO THIS):
❌ "Visit Starbucks at 123 Main St (GPS: 35.3088, -80.7506)"
❌ "Go to Target (Coordinates: 35.3088457, -80.7506283)"
❌ "Visit locations at 35.123, -80.456"

REMEMBER: Coordinates go ONLY in latitude/longitude JSON fields, NEVER in the description text!`
      : userLocation && userLatitude && userLongitude
      ? `\n\nLOCATION CONTEXT: User is currently at ${userLocation}.
CRITICAL LOCATION REQUIREMENTS:
- Describe a general area or neighborhood name near ${userLocation}
- DO NOT include coordinates in the description
- Use conversational language like "Visit coffee shops in downtown" not "at 37.7749, -122.4194"
- Provide approximate latitude/longitude in the JSON fields, but keep description readable`
      : userLocation
      ? `\n\nLOCATION CONTEXT: User is in/near ${userLocation}.
IMPORTANT: Describe generic location types (coffee shops, gyms, malls) without specific coordinates.`
      : "";

    const timeContext = `\n\n⏰ TIME/DATE CONTEXT (CRITICAL - FOLLOW STRICTLY):
- Current time: ${timeOfDay} (${hour}:00)
- Day: ${dayName} (${dayType})
- Date: ${month} ${date}

🚨 IMPORTANT TIME-BASED QUEST RULES:
${hour >= 6 && hour < 21
  ? `✅ IT IS DAYTIME (${timeOfDay})
- ONLY suggest businesses and places that are OPEN RIGHT NOW during ${timeOfDay}
- Examples of places typically open during ${timeOfDay}:
  * Coffee shops, cafes, restaurants
  * Retail stores, malls, grocery stores
  * Gyms, fitness centers (if morning/afternoon)
  * Office buildings, coworking spaces
  * Libraries, bookstores
  * Parks (for outdoor activities)
  * Banks (weekdays only during business hours)

❌ DO NOT suggest places that are closed during ${timeOfDay}:
- DO NOT suggest bars, nightclubs, or late-night venues
- DO NOT suggest activities that happen at night
- DO NOT suggest places that close early

✅ TIME-APPROPRIATE ACTIVITIES for ${timeOfDay}:
${hour >= 6 && hour < 12
  ? '- Morning coffee runs, breakfast spots, gym visits\n  - Professional networking (offices, coworking spaces)\n  - Early bird shopping at retail stores'
  : hour >= 12 && hour < 17
  ? '- Lunch spots, cafes, restaurants\n  - Shopping at malls, stores\n  - Afternoon networking events\n  - Library or bookstore visits'
  : '- Dinner restaurants, evening cafes\n  - Retail stores (before closing)\n  - Evening gym sessions\n  - Early evening social activities'
}`
  : `🌙 IT IS NIGHTTIME (${timeOfDay})
- Only suggest places that are open late at night
- Consider: 24-hour stores, late-night diners, bars, clubs
- Avoid: Regular retail stores, most restaurants, banks, offices`
}

🎯 QUEST SHOULD MATCH THE CURRENT TIME:
- If it's morning → suggest morning activities (coffee shops, breakfast places, gyms)
- If it's afternoon → suggest lunch spots, retail stores, libraries, afternoon locations
- If it's evening → suggest dinner spots, evening cafes, stores still open
- If it's night → suggest late-night venues only

The user is creating this quest RIGHT NOW at ${hour}:00 ${timeOfDay} and will likely start it soon, so make sure the locations you suggest are OPEN and APPROPRIATE for this time of day.`;

    // Get user's previous quests to avoid duplicates
    let previousQuestTitles: string[] = [];
    if (userId) {
      const userQuests = await db.userQuest.findMany({
        where: { userId },
        include: { quest: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
      previousQuestTitles = userQuests.map((uq) => uq.quest.title);
    }

    const previousQuestsContext =
      previousQuestTitles.length > 0
        ? `\n\nIMPORTANT: Do NOT create quests similar to these previous quests:\n${previousQuestTitles.join("\n")}\n\nCreate a completely NEW and UNIQUE challenge.`
        : "";

    // Quest type preference context
    const questTypeContext = preferredQuestType === "ACTION"
      ? `\n\n🎯 USER PREFERENCE: The user wants an ACTION challenge (not rejection-based).

IMPORTANT: Use goalType: "TAKE_ACTION" for this quest.
This means the quest should be about COMPLETING ACTIONS, not asking yes/no questions.

ACTION QUEST EXAMPLES:
- "Apply to 5 jobs on LinkedIn"
- "Send 3 cold emails to potential clients"
- "Compliment 5 random people"
- "Tell 5 people they have nice shoes"
- "Give 3 strangers genuine compliments about their outfit"
- "Post 2 updates on LinkedIn about your work"
- "Attend 1 networking event"
- "Update your resume with 3 new achievements"
- "Create a portfolio showcasing 5 projects"
- "Share your work with 3 people for feedback"

These are POSITIVE ACTIONS the user will complete and track with a star button, not rejection challenges.`
      : preferredQuestType === "REJECTION"
      ? `\n\n🎯 USER PREFERENCE: The user wants a REJECTION challenge.

IMPORTANT: Use goalType: "COLLECT_NOS" or "COLLECT_YES" for this quest.
This means the quest should involve asking people for things and getting yes/no responses.

REJECTION QUEST EXAMPLES:
- "Ask 5 baristas for a custom drink not on the menu"
- "Request 3 store managers for a discount on expensive items"
- "Ask 5 people at the bookstore for their phone number"
- "Pitch 3 business owners to display your flyers"
- "Request 5 gym trainers if you can teach their class"

These involve asking people for things and tracking their YES or NO responses.`
      : "";

    const prompt = customPrompt
      ? `Create a "Go for No" rejection challenge based on: ${customPrompt}.

REQUIREMENTS:
- Title MUST be exactly 3 words (action statement, e.g., "Ask Coffee Shops", "Request Business Cards", "Pitch Startup Idea")
- Description should be 2-3 sentences explaining the specific challenge
- BE EXTREMELY SPECIFIC - avoid generic phrases like "pitch your product", "ask strangers", "reach out to people"
- Include concrete details: specific locations, specific types of people, specific items/services, specific situations
- Make it actionable and specific
- Category: SALES/SOCIAL/ENTREPRENEURSHIP/DATING/CONFIDENCE/CAREER
- Difficulty: EASY/MEDIUM/HARD/EXPERT
- goalType: COLLECT_NOS (most common), COLLECT_YES, or TAKE_ACTION
- goalCount: number of NOs, YESes, or actions to complete (based on difficulty)
- 🚨 CRITICAL GOAL COUNT RULE: If your description mentions a specific number (e.g., "ask 5 local gyms", "visit 3 coffee shops", "request 8 managers"), the goalCount MUST match that exact number. For example:
  * "Ask 5 local gyms for free trial" → goalCount: 5
  * "Visit 3 coffee shops and request custom drinks" → goalCount: 3
  * "Request 8 store managers for discounts" → goalCount: 8
  * "Compliment 5 random people" → goalCount: 5
  * "Apply to 10 jobs on LinkedIn" → goalCount: 10
${previousQuestsContext}${questTypeContext}

GOOD EXAMPLES:
- "Ask baristas at 5 different coffee shops if they can make a 'unicorn rainbow latte' (not on menu)"
- "Request 8 business owners for a 90% discount on their most expensive item"
- "Ask 5 gym trainers if you can teach their next class for free"
- "Compliment 5 random people on their shoes" (TAKE_ACTION)
- "Tell 3 strangers they have a great smile" (TAKE_ACTION)

BAD EXAMPLES (too generic):
- "Pitch your product to 10 people"
- "Ask strangers for help"
- "Reach out to potential clients"

Return a JSON object with: title (exactly 3 words), description, category, difficulty, goalType, goalCount, location (specific place name if relevant), latitude (number), longitude (number).${locationContext}${timeContext}`
      : `Create a unique "Go for No" rejection challenge for ${category || "general"} category at ${difficulty || "medium"} difficulty level.

REQUIREMENTS:
- Title MUST be exactly 3 words (action statement, e.g., "Ask Coffee Shops", "Request Business Cards", "Pitch Startup Idea")
- Description should be 2-3 sentences with specific, actionable instructions
- BE EXTREMELY SPECIFIC - avoid generic phrases like "pitch your product", "ask strangers", "reach out to people"
- Include concrete details:
  * Specific locations (coffee shops, gyms, malls, restaurants, libraries, etc.)
  * Specific types of people (baristas, managers, gym trainers, store owners, etc.)
  * Specific items or services (menu items, products, classes, discounts, etc.)
  * Specific situations or contexts (during lunch rush, at closing time, etc.)
- The goal is to help users overcome fear of rejection by collecting "NO" responses
- Make each challenge unique, creative, and VERY specific
- Category: ${category || "SALES/SOCIAL/ENTREPRENEURSHIP/DATING/CONFIDENCE/CAREER"}
- Difficulty: ${difficulty || "EASY/MEDIUM/HARD/EXPERT"}
- goalType:
  * COLLECT_NOS (for collecting rejections/NOs)
  * COLLECT_YES (for collecting approvals/YESes)
  * TAKE_ACTION (for action-based tasks where you just track completion, not yes/no responses)

- When to use TAKE_ACTION:
  * Use this for quests that don't involve asking yes/no questions
  * Examples: "Apply to 5 jobs", "Send 3 cold emails", "Attend 2 networking events", "Update your resume", "Create a portfolio"
  * Social action examples: "Compliment 5 random people", "Tell 5 people they have nice shoes", "Give 3 strangers genuine compliments"
  * If the user's custom prompt mentions taking action (applying, sending, creating, updating, attending, complimenting), use TAKE_ACTION

- When to use COLLECT_NOS/COLLECT_YES:
  * Use these for quests that involve asking people for something and getting yes/no responses
  * Examples: "Ask for discounts", "Request favors", "Pitch ideas", "Ask someone out"

- goalCount: number based on difficulty and goalType
  * For COLLECT_NOS/COLLECT_YES:
    - EASY: 3-5 NOs/YESes
    - MEDIUM: 5-8 NOs/YESes
    - HARD: 8-12 NOs/YESes
    - EXPERT: 12-15 NOs/YESes
  * For TAKE_ACTION:
    - EASY: 1-3 actions
    - MEDIUM: 3-5 actions
    - HARD: 5-8 actions
    - EXPERT: 8-12 actions
  * 🚨 CRITICAL: If your description mentions a specific number (e.g., "ask 5 local gyms", "visit 3 coffee shops"), the goalCount MUST match that exact number, regardless of difficulty level. The number in the description takes priority.
${previousQuestsContext}${questTypeContext}${locationContext}${timeContext}

GOOD EXAMPLES:
- SALES: "Request grocery stores for expired produce samples to take home"
- SOCIAL: "Ask 5 dog owners at the park if you can walk their dog for 5 minutes"
- SOCIAL (ACTION): "Compliment 5 random people on their outfit" (TAKE_ACTION)
- SOCIAL (ACTION): "Tell 5 people they have nice shoes" (TAKE_ACTION)
- ENTREPRENEURSHIP: "Pitch restaurant managers to let you place your flyers on their tables"
- DATING: "Ask 5 people at the bookstore for their book recommendation and phone number"
- CONFIDENCE (ACTION): "Give 3 strangers genuine compliments" (TAKE_ACTION)
- CONFIDENCE: "Request clothing stores for a private fashion show of their most expensive items"
- CAREER: "Ask 6 professionals on LinkedIn to mentor you for free for 3 months"
- CAREER (ACTION): "Apply to 5 jobs on LinkedIn" (TAKE_ACTION)

BAD EXAMPLES (too generic):
- "Pitch your product to 10 people"
- "Ask strangers for their contact info"
- "Request help from business owners"
- "Reach out to potential clients"

Return a JSON object with: title (exactly 3 words), description, category, difficulty, goalType, goalCount, location (specific place name if mentioned), latitude (approx number if location given), longitude (approx number if location given).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a creative motivational coach creating unique rejection challenges. Each title MUST be exactly 3 words. Each challenge must be completely unique and different from previous challenges. BE EXTREMELY SPECIFIC - include concrete locations, specific types of people, specific items/services. Avoid generic phrases like 'pitch your product' or 'ask strangers'. Instead say things like 'ask baristas for a custom drink not on the menu' or 'request bookstore managers to display your handmade bookmark'. Be actionable and specific.\n\n🚨 CRITICAL RULES:\n1. When writing the 'description' field, NEVER include GPS coordinates like '(GPS: 35.123, -80.456)' or '(Coordinates: 35.123, -80.456)' or raw numbers like '35.3088457, -80.7506283'. Write naturally like a human would speak: 'Visit Starbucks on Main Street' not 'Visit Starbucks (GPS: 35.123, -80.456)'. Coordinates belong ONLY in the separate latitude/longitude JSON fields, NEVER in the description text.\n\n2. GOAL COUNT RULE:\n   a) If the quest requires visiting ONE SPECIFIC LOCATION and asking front desk/receptionist/manager, SET goalCount to 1. Examples: 'Visit Hilton Hotel and ask front desk for free upgrade' = goalCount: 1. 'Go to Planet Fitness and ask manager for free membership' = goalCount: 1.\n   b) 🚨 CRITICAL: If the description mentions a specific number (e.g., 'ask 5 local gyms', 'visit 3 coffee shops', 'request 8 managers'), the goalCount MUST match that exact number. The number in the description ALWAYS takes priority over difficulty-based ranges.\n   c) For quests visiting multiple locations without a specific number mentioned, use normal difficulty-based counts.\n\n🛡️ SAFETY REQUIREMENTS (CRITICAL - READ CAREFULLY):\nYou MUST NEVER create quests that:\n- Involve physical harm, violence, or danger to self or others\n- Involve illegal activities (theft, vandalism, trespassing, drug use, etc.)\n- Involve sexual harassment, unwanted touching, or inappropriate behavior\n- Involve dangerous driving, drunk driving, or reckless behavior\n- Involve dangerous locations (highways, train tracks, cliffs, roofs)\n- Involve weapons, fire, or explosive materials\n- Could lead to arrest, injury, or death\n- Involve stalking, threatening, or intimidating behavior\n- Involve excessive alcohol consumption or substance abuse\n\nONLY create quests that are:\n- Safe and legal\n- Respectful and appropriate\n- About overcoming social fears (rejection, embarrassment)\n- Focused on asking for things, pitching ideas, or making requests\n- About building confidence through harmless social interactions\n- Positive actions that help personal growth\n\nIf the user's prompt contains unsafe content, CREATE A SAFE ALTERNATIVE instead that achieves a similar confidence-building goal.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9, // Higher temperature for more creativity and uniqueness
      }),
    });

    const data = await response.json();

    // Log the response for debugging
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    // Check for API errors
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data);
      throw new Error("Invalid response format from OpenAI API");
    }

    const questData = JSON.parse(data.choices[0].message.content);

    // 🚨 CRITICAL: Extract number from description and match goalCount
    // If description says "ask 5 local gyms", goalCount MUST be 5
    const descriptionText = `${questData.title} ${questData.description}`.toLowerCase();
    const numberPattern = /\b(\d+)\b/g;
    const numbers = descriptionText.match(numberPattern)?.map(Number) || [];
    
    // Find the most relevant number (usually the first one mentioned)
    if (numbers.length > 0) {
      const extractedNumber = numbers[0];
      // Only override if the extracted number is reasonable (1-50)
      if (extractedNumber >= 1 && extractedNumber <= 50) {
        // Check if description mentions this number in context of the action
        const actionKeywords = ['ask', 'request', 'visit', 'pitch', 'tell', 'compliment', 'apply', 'send', 'contact', 'reach out'];
        const hasActionContext = actionKeywords.some(keyword => 
          descriptionText.includes(`${keyword} ${extractedNumber}`) || 
          descriptionText.includes(`${extractedNumber} ${keyword}`) ||
          descriptionText.includes(`${keyword} ${extractedNumber} `)
        );
        
        if (hasActionContext && extractedNumber !== undefined) {
          console.log(`[Quest Generation] Extracted number ${extractedNumber} from description, updating goalCount from ${questData.goalCount} to ${extractedNumber}`);
          questData.goalCount = extractedNumber;
        }
      }
    }

    // SAFETY CHECK: Verify quest content is safe
    const safetyCheck = checkFullQuestSafety(
      questData.title,
      questData.description,
      customPrompt || ""
    );

    if (!safetyCheck.isSafe) {
      console.error("Unsafe quest generated, rejecting:", safetyCheck.reason);
      throw new Error(
        safetyCheck.reason ||
          "This quest contains unsafe content. Please try a different challenge that focuses on building confidence through safe, respectful social interactions."
      );
    }

    // Additional AI-powered safety check using OpenAI Moderation API
    const aiSafetyCheck = await checkQuestSafetyWithAI(
      `${questData.title}. ${questData.description}`,
      OPENAI_API_KEY
    );

    if (!aiSafetyCheck.isSafe) {
      console.error("Quest flagged by AI moderation:", aiSafetyCheck.reason);
      throw new Error(
        aiSafetyCheck.reason ||
          "This quest was flagged by our safety system. Please try a different challenge."
      );
    }

    // Ensure title is 3 words
    const titleWords = questData.title.split(" ");
    if (titleWords.length > 3) {
      questData.title = titleWords.slice(0, 3).join(" ");
    } else if (titleWords.length < 3) {
      // Pad with action words if needed
      while (questData.title.split(" ").length < 3) {
        questData.title += " Challenge";
      }
    }

    // Calculate rewards based on difficulty
    const difficultyMultiplier = {
      EASY: 1,
      MEDIUM: 1.5,
      HARD: 2,
      EXPERT: 3,
    }[questData.difficulty] || 1;

    return {
      ...questData,
      xpReward: Math.round(questData.goalCount * 10 * difficultyMultiplier + 50),
      pointReward: Math.round(questData.goalCount * 20 * difficultyMultiplier + 100),
      location: questData.location || null,
      latitude: questData.latitude || null,
      longitude: questData.longitude || null,
      timeContext: `${dayType} ${timeOfDay}`,
      dateContext: `${dayName}, ${month} ${date}`,
    };
  } catch (error) {
    console.error("AI generation failed, using predefined quest:", error);
    return getPredefinedQuest(category, difficulty);
  }
}

function getPredefinedQuest(category?: string, difficulty?: string) {
  const quests = [
    {
      title: "Coffee Shop Challenge",
      description:
        "Ask 5 coffee shops for an item that's not on their menu. Practice handling rejection in a low-stakes environment.",
      category: "CONFIDENCE",
      difficulty: "EASY",
      goalType: "COLLECT_NOS",
      goalCount: 5,
      xpReward: 100,
      pointReward: 200,
    },
    {
      title: "Social Connection Quest",
      description:
        "Ask 3 strangers for a small favor (time, directions, recommendation). Build confidence in social interactions.",
      category: "SOCIAL",
      difficulty: "MEDIUM",
      goalType: "COLLECT_NOS",
      goalCount: 3,
      xpReward: 150,
      pointReward: 300,
    },
    {
      title: "Sales Pitch Practice",
      description:
        "Pitch your product/service to 10 people. Focus on the process, not the outcome. Every NO is progress.",
      category: "SALES",
      difficulty: "HARD",
      goalType: "COLLECT_NOS",
      goalCount: 10,
      xpReward: 250,
      pointReward: 500,
    },
  ];

  return quests[Math.floor(Math.random() * quests.length)];
}

export async function updateUserStats(userId: string, xpReward: number, pointReward: number, difficulty?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get current stats
  const currentStats = await db.userStats.findUnique({
    where: { userId },
  });

  // Calculate streak
  let newCurrentStreak = 1;
  let newLongestStreak = 1;

  if (currentStats) {
    const lastActiveDate = currentStats.lastActiveAt
      ? new Date(currentStats.lastActiveAt.getFullYear(), currentStats.lastActiveAt.getMonth(), currentStats.lastActiveAt.getDate())
      : null;

    if (lastActiveDate) {
      const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, keep current streak
        newCurrentStreak = currentStats.currentStreak;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newCurrentStreak = currentStats.currentStreak + 1;
      } else {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
      }
    }

    // Update longest streak if current streak is higher
    newLongestStreak = Math.max(newCurrentStreak, currentStats.longestStreak);
  }

  // Calculate confidence meter increase based on quest difficulty
  // Harder quests give more confidence boost
  const difficultyMultiplier: Record<string, number> = {
    easy: 5,
    medium: 10,
    hard: 15,
    expert: 20,
  };
  const confidenceBoost = difficultyMultiplier[difficulty?.toLowerCase() || "medium"] || 10;
  
  // Get current confidence meter
  const currentConfidence = currentStats?.dailyConfidenceMeter || 0;
  const newConfidenceMeter = Math.min(100, currentConfidence + confidenceBoost);

  // Determine which difficulty zone to increment
  const updateData: any = {
    totalXP: { increment: xpReward },
    totalPoints: { increment: pointReward },
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActiveAt: now,
    lastQuestCompletedAt: now,
    dailyConfidenceMeter: newConfidenceMeter,
    lastConfidenceDecayAt: now,
  };

  // Track difficulty zones
  if (difficulty) {
    const difficultyLower = difficulty.toLowerCase();
    if (difficultyLower === "easy") {
      updateData.easyZoneCount = { increment: 1 };
    } else if (difficultyLower === "medium") {
      updateData.growthZoneCount = { increment: 1 };
    } else if (difficultyLower === "hard" || difficultyLower === "expert") {
      updateData.fearZoneCount = { increment: 1 };
    }
  }

  // Calculate confidence meter for create case
  const difficultyMultiplier: Record<string, number> = {
    easy: 5,
    medium: 10,
    hard: 15,
    expert: 20,
  };
  const initialConfidence = difficultyMultiplier[difficulty?.toLowerCase() || "medium"] || 10;

  await db.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalXP: xpReward,
      totalPoints: pointReward,
      currentStreak: 1,
      longestStreak: 1,
      trophies: 0,
      diamonds: 0,
      lastActiveAt: now,
      lastQuestCompletedAt: now,
      dailyConfidenceMeter: initialConfidence,
      lastConfidenceDecayAt: now,
      easyZoneCount: difficulty?.toLowerCase() === "easy" ? 1 : 0,
      growthZoneCount: difficulty?.toLowerCase() === "medium" ? 1 : 0,
      fearZoneCount: (difficulty?.toLowerCase() === "hard" || difficulty?.toLowerCase() === "expert") ? 1 : 0,
    },
    update: updateData,
  });
}

// ============================================
// DELETE /api/quests/:id - Delete a user quest
// ============================================
questsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");

  // Check if the user quest exists and belongs to the user
  const userQuest = await db.userQuest.findUnique({
    where: { id: userQuestId },
  });

  if (!userQuest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  if (userQuest.userId !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  // Delete the user quest
  await db.userQuest.delete({
    where: { id: userQuestId },
  });

  return c.json({ message: "Quest deleted successfully" }, 200);
});

// ============================================
// GET /api/quests/warmup - Get a warm-up action before a quest
// ============================================
questsRouter.get("/warmup", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // List of 5-second warm-up actions
  const warmupActions = [
    { action: "Ask someone for the time", description: "Simple and non-threatening way to break the ice", estimatedSeconds: 5 },
    { action: "Smile at a stranger", description: "Practice being visible and friendly", estimatedSeconds: 3 },
    { action: "Compliment someone's shoes", description: "Give a specific, genuine compliment", estimatedSeconds: 5 },
    { action: "Ask someone to rate your outfit 1-10", description: "Accept potential criticism with humor", estimatedSeconds: 10 },
    { action: "Ask a cashier how their day is going", description: "Show genuine interest in someone's day", estimatedSeconds: 5 },
    { action: "Hold the door and make eye contact", description: "Practice presence and acknowledgment", estimatedSeconds: 3 },
    { action: "Ask a stranger for a restaurant recommendation", description: "Trust someone's opinion", estimatedSeconds: 10 },
    { action: "Give someone a high-five", description: "Practice physical connection and energy", estimatedSeconds: 3 },
    { action: "Ask someone what they're reading/watching", description: "Show curiosity about others", estimatedSeconds: 5 },
    { action: "Tell someone 'nice hat' or similar", description: "Practice noticing and affirming others", estimatedSeconds: 3 },
  ];

  const randomAction = warmupActions[Math.floor(Math.random() * warmupActions.length)];

  return c.json(randomAction satisfies GetWarmupActionResponse);
});

// ============================================
// GET /api/quests/radar - Get location-based quest opportunities (NO Radar)
// ============================================
questsRouter.get("/radar", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const latitude = c.req.query("latitude");
  const longitude = c.req.query("longitude");
  const category = c.req.query("category");

  // Get 3 random quests that could be location-relevant
  const allQuests = await db.quest.findMany({
    where: category ? { category } : undefined,
    take: 20,
  });

  // Location-based micro-opportunities (contextual)
  const locationOpportunities = [
    {
      title: "Ask for a free refill",
      description: "You're at a coffee shop - ask if free refills are available",
      category: "RETAIL",
      difficulty: "EASY",
      location: "Coffee Shop",
      isLocationBased: true,
    },
    {
      title: "Ask for 10% off",
      description: "You're near a retail store - politely ask if there's any discount available",
      category: "RETAIL",
      difficulty: "MEDIUM",
      location: "Retail Store",
      isLocationBased: true,
    },
    {
      title: "Ask someone for directions",
      description: "You're downtown - ask someone for directions even if you know the way",
      category: "SOCIAL",
      difficulty: "EASY",
      location: "Downtown",
      isLocationBased: true,
    },
    {
      title: "Request a sample",
      description: "You're at a food place - ask to try a sample before ordering",
      category: "RETAIL",
      difficulty: "EASY",
      location: "Restaurant/Food Court",
      isLocationBased: true,
    },
    {
      title: "Ask to pet someone's dog",
      description: "You see someone with a dog - ask if you can pet it",
      category: "SOCIAL",
      difficulty: "EASY",
      location: "Park/Street",
      isLocationBased: true,
    },
    {
      title: "Ask a stranger to take your photo",
      description: "You're at a nice spot - ask someone to take a photo of you",
      category: "SOCIAL",
      difficulty: "EASY",
      location: "Tourist Spot",
      isLocationBased: true,
    },
  ];

  // Mix location-based with regular quests
  const selectedLocationOps = locationOpportunities
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map((op, idx) => ({
      id: `location-${idx}`,
      ...op,
      distance: latitude && longitude ? `${(Math.random() * 0.5).toFixed(1)} mi away` : undefined,
    }));

  const selectedQuests = allQuests
    .sort(() => Math.random() - 0.5)
    .slice(0, 1)
    .map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      location: q.location || undefined,
      distance: latitude && longitude && q.latitude && q.longitude
        ? `${(Math.random() * 2).toFixed(1)} mi away`
        : undefined,
      isLocationBased: false,
    }));

  const opportunities = [...selectedLocationOps, ...selectedQuests];

  return c.json({ opportunities } satisfies GetQuestRadarResponse);
});

// ============================================
// GET /api/quests/smart-suggestions - Get AI-adapted quest suggestions
// ============================================
questsRouter.get("/smart-suggestions", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get user's stats to understand their behavior
  const stats = await db.userStats.findUnique({
    where: { userId: user.id },
  });

  // Get user's quest history
  const userQuests = await db.userQuest.findMany({
    where: { userId: user.id },
    include: { quest: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const completedQuests = userQuests.filter((uq) => uq.status === "completed");
  const activeQuests = userQuests.filter((uq) => uq.status === "ACTIVE");

  // Calculate time since last attempt
  const now = new Date();
  const lastAttempt = stats?.lastQuestAttemptAt;
  const hoursSinceAttempt = lastAttempt
    ? (now.getTime() - new Date(lastAttempt).getTime()) / (1000 * 60 * 60)
    : 999;

  // Analyze completion rate
  const totalAttempts = userQuests.length;
  const completionRate = totalAttempts > 0 ? (completedQuests.length / totalAttempts) * 100 : 0;

  let suggestions: any[] = [];
  let message = "";

  // Smart Fear Detection Logic
  if (hoursSinceAttempt > 48) {
    // Haven't tried in 48+ hours - suggest micro-tasks
    message = "I noticed you haven't attempted a quest in a while. Let's start small and build momentum!";

    const microQuests = await db.quest.findMany({
      where: { difficulty: "EASY" },
      take: 3,
    });

    suggestions = microQuests.map((q) => ({
      questId: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      reason: "Perfect for getting back into action",
      adaptationType: "micro-task",
    }));
  } else if (completionRate < 30 && totalAttempts > 5) {
    // Low completion rate - recommend easier quests
    message = "I see you're facing some challenges. These easier quests will help build confidence!";

    const easierQuests = await db.quest.findMany({
      where: { difficulty: "EASY" },
      take: 3,
    });

    suggestions = easierQuests.map((q) => ({
      questId: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      reason: "Matched to your current comfort level",
      adaptationType: "easier",
    }));
  } else if (completionRate > 70 && (stats?.avgQuestDifficulty || 0) < 2) {
    // High completion rate with easy quests - upgrade difficulty
    message = "You're crushing it! Time to level up and push into your growth zone!";

    const harderQuests = await db.quest.findMany({
      where: {
        difficulty: { in: ["MEDIUM", "HARD"] }
      },
      take: 3,
    });

    suggestions = harderQuests.map((q) => ({
      questId: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      reason: "Challenge yourself with bigger risks",
      adaptationType: "big-risk-upgrade",
    }));
  } else {
    // Normal suggestions based on current level
    message = "These quests match your current momentum. Keep going!";

    const normalQuests = await db.quest.findMany({
      take: 3,
    });

    suggestions = normalQuests.map((q) => ({
      questId: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      reason: "Aligned with your progress",
      adaptationType: "balanced",
    }));
  }

  return c.json({
    suggestions,
    message,
  } satisfies GetSmartQuestSuggestionsResponse);
});

// ============================================
// POST /api/quests/generate-map-quests - Generate quests for map within 5 miles
// ============================================
questsRouter.post("/generate-map-quests", zValidator("json", generateMapQuestsRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { latitude, longitude, count = 5 } = c.req.valid("json");

  console.log(`🗺️ [Map Quests] Generating ${count} quests near (${latitude}, ${longitude}) for user ${user.id}`);

  try {
    // Fetch nearby places within 5 miles (8 km)
    const nearbyPlaces = await getNearbyPlaces(latitude, longitude, 8000);

    if (nearbyPlaces.length === 0) {
      return c.json({
        success: false,
        quests: [],
      }, 400);
    }

    console.log(`🗺️ [Map Quests] Found ${nearbyPlaces.length} nearby places`);

    // Categories and difficulties for variety
    const categories = ["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"];
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const questTypes = ["REJECTION", "ACTION"];

    // Generate multiple quests
    const generatedQuests: any[] = [];

    for (let i = 0; i < count; i++) {
      // Select random category, difficulty, and quest type for variety
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const randomQuestType = questTypes[Math.floor(Math.random() * questTypes.length)];

      // Select a random nearby place for this quest
      const randomPlace = nearbyPlaces[Math.floor(Math.random() * nearbyPlaces.length)];

      try {
        // Generate quest using existing AI function
        const questData = await generateQuestWithAI(
          randomCategory,
          randomDifficulty,
          undefined, // no custom prompt
          user.id,
          randomPlace.name,
          randomPlace.lat,
          randomPlace.lng,
          randomQuestType as "REJECTION" | "ACTION"
        );

        // Create the quest in the database (but don't assign to user yet)
        const quest = await db.quest.create({
          data: {
            title: questData.title,
            description: questData.description,
            category: questData.category,
            difficulty: questData.difficulty,
            goalType: questData.goalType,
            goalCount: questData.goalCount,
            xpReward: questData.xpReward,
            pointReward: questData.pointReward,
            location: questData.location || randomPlace.name,
            latitude: questData.latitude || randomPlace.lat,
            longitude: questData.longitude || randomPlace.lng,
            timeContext: questData.timeContext,
            dateContext: questData.dateContext,
          },
        });

        generatedQuests.push({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          goalType: quest.goalType,
          goalCount: quest.goalCount,
          xpReward: quest.xpReward,
          pointReward: quest.pointReward,
          location: quest.location || "",
          latitude: quest.latitude || randomPlace.lat,
          longitude: quest.longitude || randomPlace.lng,
          timeContext: quest.timeContext,
          dateContext: quest.dateContext,
        });

        console.log(`✅ [Map Quests] Generated quest ${i + 1}/${count}: ${quest.title}`);
      } catch (error) {
        console.error(`❌ [Map Quests] Failed to generate quest ${i + 1}:`, error);
        // Continue with next quest
      }
    }

    console.log(`🗺️ [Map Quests] Successfully generated ${generatedQuests.length}/${count} quests`);

    return c.json({
      success: true,
      quests: generatedQuests,
    } satisfies GenerateMapQuestsResponse);
  } catch (error) {
    console.error("❌ [Map Quests] Error generating map quests:", error);
    return c.json({
      success: false,
      quests: [],
    }, 500);
  }
});

export { questsRouter };
