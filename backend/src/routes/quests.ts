import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetUserQuestsResponse,
  generateQuestRequestSchema,
  type GenerateQuestResponse,
  type StartQuestResponse,
  recordQuestActionRequestSchema,
  type RecordQuestActionResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

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
// POST /api/quests/generate - Generate AI quest
// ============================================
questsRouter.post("/generate", zValidator("json", generateQuestRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { category, difficulty, customPrompt, userLocation, userLatitude, userLongitude } = c.req.valid("json");

  // Generate quest using OpenAI with location context
  const questData = await generateQuestWithAI(
    category,
    difficulty,
    customPrompt,
    user.id,
    userLocation,
    userLatitude,
    userLongitude
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
// POST /api/quests/:id/start - Start a quest
// ============================================
questsRouter.post("/:id/start", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userQuestId = c.req.param("id");

  // Check active quests limit (max 2)
  const activeCount = await db.userQuest.count({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  if (activeCount >= 2) {
    return c.json({ message: "Maximum 2 active quests allowed" }, 400);
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
// POST /api/quests/:id/record - Record NO or YES
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

  // Update counts
  const newNoCount = action === "NO" ? userQuest.noCount + 1 : userQuest.noCount;
  const newYesCount = action === "YES" ? userQuest.yesCount + 1 : userQuest.yesCount;

  // Check if quest is completed
  const isCompleted =
    (userQuest.quest.goalType === "COLLECT_NOS" && newNoCount >= userQuest.quest.goalCount) ||
    (userQuest.quest.goalType === "COLLECT_YES" && newYesCount >= userQuest.quest.goalCount);

  // Update user quest
  const updated = await db.userQuest.update({
    where: { id: userQuestId },
    data: {
      noCount: newNoCount,
      yesCount: newYesCount,
      ...(isCompleted && {
        status: "COMPLETED",
        completedAt: new Date(),
      }),
    },
  });

  // If completed, update user stats
  if (isCompleted) {
    await updateUserStats(user.id, userQuest.quest.xpReward, userQuest.quest.pointReward);
  }

  return c.json({
    success: true,
    completed: isCompleted,
    noCount: newNoCount,
    yesCount: newYesCount,
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

async function generateQuestWithAI(
  category?: string,
  difficulty?: string,
  customPrompt?: string,
  userId?: string,
  userLocation?: string,
  userLatitude?: number,
  userLongitude?: number
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
      ? `\n\nLOCATION CONTEXT: User is currently at ${userLocation} (GPS: ${userLatitude}, ${userLongitude}).

VERIFIED NEARBY PLACES (from Google Maps within 10 miles):
${nearbyPlaces.slice(0, 10).map((place, i) => `${i + 1}. ${place.name} - ${place.address} (GPS: ${place.lat}, ${place.lng})`).join("\n")}

CRITICAL LOCATION REQUIREMENTS:
- MUST select a location from the verified places list above or use their coordinates as reference
- Pick a place that matches the quest category (${category || "any"})
- Use the EXACT coordinates provided for the selected place
- Include the place name and address in the quest description
- DO NOT make up coordinates - use the real coordinates from the list above
- The quest should direct users to visit these verified real locations`
      : userLocation && userLatitude && userLongitude
      ? `\n\nLOCATION CONTEXT: User is currently at ${userLocation} (GPS: ${userLatitude}, ${userLongitude}).
CRITICAL LOCATION REQUIREMENTS:
- Generate a quest location that is WITHIN 10 MILES (16 km) of coordinates ${userLatitude}, ${userLongitude}
- Calculate approximate coordinates for the quest location that are near the user
- The quest location should be accessible within 15-20 minutes by car or public transit
- Include specific neighborhood or district names from ${userLocation}
- Provide approximate latitude/longitude that is close to ${userLatitude}, ${userLongitude} (within 10 miles radius)`
      : userLocation
      ? `\n\nLOCATION CONTEXT: User is in/near ${userLocation}.
IMPORTANT: Only suggest generic location types (coffee shops, gyms, malls) without specific coordinates since exact location is unavailable. User should find these places nearby themselves.`
      : "";

    const timeContext = `\n\nTIME/DATE CONTEXT:
- Current time: ${timeOfDay} (${hour}:00)
- Day: ${dayName} (${dayType})
- Date: ${month} ${date}
- Consider what businesses/places are typically open and busy at this time
- Consider what activities are appropriate for this time of day
- If it's ${timeOfDay}, suggest locations and activities that would be active right now`;

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
- goalType: COLLECT_NOS (most common) or COLLECT_YES
- goalCount: number of NOs or YESes to collect (3-15 based on difficulty)
${previousQuestsContext}

GOOD EXAMPLES:
- "Ask baristas at 5 different coffee shops if they can make a 'unicorn rainbow latte' (not on menu)"
- "Request 8 business owners for a 90% discount on their most expensive item"
- "Ask 5 gym trainers if you can teach their next class for free"

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
- goalType: COLLECT_NOS (primary) or COLLECT_YES (rare)
- goalCount:
  * EASY: 3-5 NOs
  * MEDIUM: 5-8 NOs
  * HARD: 8-12 NOs
  * EXPERT: 12-15 NOs
${previousQuestsContext}${locationContext}${timeContext}

GOOD EXAMPLES:
- SALES: "Request grocery stores for expired produce samples to take home"
- SOCIAL: "Ask 5 dog owners at the park if you can walk their dog for 5 minutes"
- ENTREPRENEURSHIP: "Pitch restaurant managers to let you place your flyers on their tables"
- DATING: "Ask 5 people at the bookstore for their book recommendation and phone number"
- CONFIDENCE: "Request clothing stores for a private fashion show of their most expensive items"
- CAREER: "Ask 6 professionals on LinkedIn to mentor you for free for 3 months"

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
              "You are a creative motivational coach creating unique rejection challenges. Each title MUST be exactly 3 words. Each challenge must be completely unique and different from previous challenges. BE EXTREMELY SPECIFIC - include concrete locations, specific types of people, specific items/services. Avoid generic phrases like 'pitch your product' or 'ask strangers'. Instead say things like 'ask baristas for a custom drink not on the menu' or 'request bookstore managers to display your handmade bookmark'. Be actionable and specific.",
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

async function updateUserStats(userId: string, xpReward: number, pointReward: number) {
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
    },
    update: {
      totalXP: { increment: xpReward },
      totalPoints: { increment: pointReward },
      lastActiveAt: new Date(),
    },
  });
}

export { questsRouter };
