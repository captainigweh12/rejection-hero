import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";

const sharedQuestsRouter = new Hono<AppType>();

// ============================================
// AI Fine-tuning Function - Optimizes quest based on user preferences
// ============================================
async function fineTuneQuestWithAI(params: {
  description: string;
  category: string;
  goalType: string;
  goalCount?: number;
  locationType?: string;
  customLocation?: string;
  difficulty?: string;
}): Promise<{
  description: string;
  category: string;
  goalType: string;
  goalCount: number;
  difficulty: string;
  location?: string;
}> {
  const OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.warn("⚠️ No OpenAI API key - skipping AI fine-tuning");
    return {
      description: params.description,
      category: params.category,
      goalType: params.goalType,
      goalCount: params.goalCount || 5,
      difficulty: params.difficulty || "MEDIUM",
      location: params.customLocation,
    };
  }

  try {
    const locationContext = params.locationType === "CURRENT"
      ? "Use the user's current location"
      : params.locationType === "CUSTOM" && params.customLocation
      ? `Location: ${params.customLocation}`
      : "No specific location required";

    const prompt = `You are an expert quest designer for a personal growth app called "Go for No" that helps people overcome fear of rejection.

User's quest idea: "${params.description}"
Category: ${params.category}
Goal Type: ${params.goalType} (COLLECT_NOS = track rejections, COLLECT_YES = track approvals, TAKE_ACTION = complete actions)
Desired Goal Count: ${params.goalCount || "not specified"}
${locationContext}
Difficulty: ${params.difficulty || "MEDIUM"}

Your task: Fine-tune and optimize this quest to help the user meet their desired goal. Make it:
1. Clear and actionable
2. Appropriate for the specified difficulty level
3. Optimized for the goal type (if COLLECT_NOS, make it rejection-focused; if TAKE_ACTION, make it action-focused)
4. Location-appropriate if location is specified
5. Achievable and motivating

🚨 CRITICAL GOAL COUNT RULE: If your description mentions a specific number (e.g., "ask 5 local gyms", "visit 3 coffee shops", "request 8 managers"), the goalCount MUST match that exact number. For example:
- "Ask 5 local gyms for free trial" → goalCount: 5
- "Visit 3 coffee shops and request custom drinks" → goalCount: 3
- "Request 8 store managers for discounts" → goalCount: 8
- "Compliment 5 random people" → goalCount: 5
- "Apply to 10 jobs on LinkedIn" → goalCount: 10

The number in the description ALWAYS takes priority over difficulty-based ranges or user-specified goalCount.

Return a JSON object with:
{
  "description": "Optimized quest description (2-3 sentences, clear and actionable)",
  "category": "One of: SOCIAL, SALES, ENTREPRENEURSHIP, DATING, CONFIDENCE, CAREER",
  "goalType": "COLLECT_NOS, COLLECT_YES, or TAKE_ACTION",
  "goalCount": number (1-50, MUST match number in description if mentioned, otherwise appropriate for difficulty),
  "difficulty": "EASY, MEDIUM, HARD, or EXPERT",
  "location": "Location name if applicable, or null"
}

Only return valid JSON, no other text.`;

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
            content: "You are an expert quest designer. Always return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.statusText);
      return {
        description: params.description,
        category: params.category,
        goalType: params.goalType,
        goalCount: params.goalCount || 5,
        difficulty: params.difficulty || "MEDIUM",
        location: params.customLocation,
      };
    }

    const result = (await response.json()) as { choices: Array<{ message?: { content?: string } }> };
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return {
        description: params.description,
        category: params.category,
        goalType: params.goalType,
        goalCount: params.goalCount || 5,
        difficulty: params.difficulty || "MEDIUM",
        location: params.customLocation,
      };
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      console.log("✅ AI fine-tuning completed:", parsed);
      
      // 🚨 CRITICAL: Extract number from description and match goalCount
      // If description says "ask 5 local gyms", goalCount MUST be 5
      const descriptionText = `${parsed.description || params.description}`.toLowerCase();
      const numberPattern = /\b(\d+)\b/g;
      const numbers = descriptionText.match(numberPattern)?.map(Number) || [];
      
      let finalGoalCount = parsed.goalCount || params.goalCount || 5;
      
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
            console.log(`[Quest Fine-tuning] Extracted number ${extractedNumber} from description, updating goalCount from ${finalGoalCount} to ${extractedNumber}`);
            finalGoalCount = extractedNumber;
          }
        }
      }
      
      return {
        description: parsed.description || params.description,
        category: parsed.category || params.category,
        goalType: parsed.goalType || params.goalType,
        goalCount: finalGoalCount,
        difficulty: parsed.difficulty || params.difficulty || "MEDIUM",
        location: parsed.location || params.customLocation,
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return {
        description: params.description,
        category: params.category,
        goalType: params.goalType,
        goalCount: params.goalCount || 5,
        difficulty: params.difficulty || "MEDIUM",
        location: params.customLocation,
      };
    }
  } catch (error) {
    console.error("Error in AI fine-tuning:", error);
    return {
      description: params.description,
      category: params.category,
      goalType: params.goalType,
      goalCount: params.goalCount || 5,
      difficulty: params.difficulty || "MEDIUM",
      location: params.customLocation,
    };
  }
}

// ============================================
// AI Safety Filtering Function
// ============================================
export async function checkQuestSafety(description: string): Promise<{ isSafe: boolean; warning?: string; cleanDescription?: string }> {
  const OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.warn("⚠️ No OpenAI API key - skipping AI safety check");
    return { isSafe: true, cleanDescription: description };
  }

  try {
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
            content: `You are a content safety moderator for a personal growth app called "Go for No".
The app helps users overcome fear of rejection through challenges.

Your job is to review quest descriptions and determine if they are safe and appropriate.

REJECT quests that involve:
- Illegal activities (theft, harassment, violence, fraud, trespassing)
- Harmful behavior (stalking, bullying, deception for malicious purposes)
- Inappropriate sexual content or advances
- Dangerous physical activities that could cause injury
- Privacy violations or unauthorized recording
- Manipulative or exploitative behavior
- Discrimination or hate speech

ALLOW quests that involve:
- Politely asking for things (discounts, favors, recommendations)
- Networking and professional outreach
- Social confidence building (compliments, small talk, public speaking)
- Sales and entrepreneurship practice
- Career advancement (job applications, pitching ideas)
- Dating (respectful approaches, asking for numbers/dates)
- Personal growth challenges (stepping outside comfort zone)

If the quest is SAFE, respond with JSON: {"safe": true, "description": "cleaned up description"}
If the quest is UNSAFE, respond with JSON: {"safe": false, "reason": "brief explanation"}

Important: Be permissive with rejection challenges - the app is about overcoming fear, not breaking rules.`,
          },
          {
            role: "user",
            content: `Review this quest description: "${description}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.statusText);
      return { isSafe: true, cleanDescription: description }; // Fail open
    }

    const result = (await response.json()) as { choices: Array<{ message?: { content?: string } }> };
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return { isSafe: true, cleanDescription: description };
    }

    const safetyResult = JSON.parse(content);

    if (safetyResult.safe === false) {
      return {
        isSafe: false,
        warning: safetyResult.reason || "This quest was flagged as potentially unsafe or inappropriate.",
      };
    }

    return {
      isSafe: true,
      cleanDescription: safetyResult.description || description,
    };
  } catch (error) {
    console.error("Error in AI safety check:", error);
    return { isSafe: true, cleanDescription: description }; // Fail open on error
  }
}

// ============================================
// GET /api/shared-quests - Get received quest shares
// ============================================
sharedQuestsRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuests = await db.shared_quest.findMany({
    where: {
      receiverId: user.id,
    },
    include: {
      sender: {
        include: { profile: true },
      },
      quest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatted = sharedQuests.map((sq) => ({
    id: sq.id,
    quest: {
      id: sq.quest.id,
      title: sq.quest.title,
      description: sq.quest.description,
      category: sq.quest.category,
      difficulty: sq.quest.difficulty,
      goalType: sq.quest.goalType,
      goalCount: sq.quest.goalCount,
      xpReward: sq.quest.xpReward,
      pointReward: sq.quest.pointReward,
    },
    sender: {
      id: sq.sender.id,
      displayName: sq.sender.Profile?.displayName || sq.sender.email?.split("@")[0] || "User",
      avatar: sq.sender.Profile?.avatar || null,
    },
    message: sq.message,
    status: sq.status,
    createdAt: sq.createdAt,
  }));

  return c.json({ sharedQuests: formatted });
});

// ============================================
// POST /api/shared-quests/share - Share a quest with friend
// ============================================
const shareQuestSchema = z.object({
  friendId: z.string(),
  questId: z.string(),
  message: z.string().max(500).optional(),
});

sharedQuestsRouter.post("/share", zValidator("json", shareQuestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { friendId, questId, message } = c.req.valid("json");

  // Check if quest exists
  const quest = await db.quest.findUnique({
    where: { id: questId },
  });

  if (!quest) {
    return c.json({ message: "Quest not found" }, 404);
  }

  // Check if they are friends
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: user.id, receiverId: friendId, status: "ACCEPTED" },
        { initiatorId: friendId, receiverId: user.id, status: "ACCEPTED" },
      ],
    },
  });

  if (!friendship) {
    return c.json({ message: "You can only share quests with friends" }, 403);
  }

  // Check token balance (1 token required to send quest to friend)
  const userStats = await db.user_stats.findUnique({
    where: { userId: user.id },
  });

  if (!userStats || (userStats.tokens || 0) < 1) {
    return c.json(
      {
        message: "You need at least 1 token to send a quest to a friend. Complete quests to earn tokens!",
        requiresTokens: true,
      },
      400
    );
  }

  // Deduct token
  await db.user_stats.update({
    where: { userId: user.id },
    data: {
      tokens: {
        decrement: 1,
      },
    },
  });

  // Create token transaction record
  await db.token_transaction.create({
    data: {
      userId: user.id,
      type: "spent",
      amount: -1,
      description: `Spent 1 token to send quest "${quest.title}" to friend`,
      questId: quest.id,
    },
  });

  // Create shared quest
  const sharedQuest = await db.shared_quest.create({
    data: {
      senderId: user.id,
      receiverId: friendId,
      questId,
      message,
      status: "pending",
    },
  });

  return c.json({ success: true, sharedQuestId: sharedQuest.id });
});

// ============================================
// POST /api/shared-quests/:id/accept - Accept shared quest
// ============================================
sharedQuestsRouter.post("/:id/accept", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuestId = c.req.param("id");

  const sharedQuest = await db.shared_quest.findUnique({
    where: { id: sharedQuestId },
  });

  if (!sharedQuest) {
    return c.json({ message: "Shared quest not found" }, 404);
  }

  if (sharedQuest.receiverId !== user.id) {
    return c.json({ message: "You can only accept quests shared with you" }, 403);
  }

  // Update status
  await db.shared_quest.update({
    where: { id: sharedQuestId },
    data: { status: "accepted" },
  });

  // Check if user already has this quest
  const existingUserQuest = await db.user_quest.findUnique({
    where: {
      userId_questId: {
        userId: user.id,
        questId: sharedQuest.questId,
      },
    },
  });

  if (existingUserQuest) {
    return c.json({ success: true, message: "Quest already in your list" });
  }

  // Get active quests - check slots separately
  const activeQuests = await db.user_quest.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  // Count active user quests and friend quests
  const activeUserQuests = activeQuests.filter((q) => !q.isFromFriend);
  const activeFriendQuests = activeQuests.filter((q) => q.isFromFriend);

  // Determine status - friend quest uses friend slot (1 slot)
  const status = activeFriendQuests.length < 1 ? "ACTIVE" : "QUEUED";

  // Create user quest marked as from friend
  await db.user_quest.create({
    data: {
      userId: user.id,
      questId: sharedQuest.questId,
      status,
      startedAt: status === "ACTIVE" ? new Date() : null,
      isFromFriend: true, // Mark as friend quest
      sharedById: sharedQuest.senderId, // Track who shared it
    },
  });

  return c.json({ success: true, message: "Quest added to your list", status });
});

// ============================================
// POST /api/shared-quests/:id/decline - Decline shared quest
// ============================================
sharedQuestsRouter.post("/:id/decline", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sharedQuestId = c.req.param("id");

  const sharedQuest = await db.shared_quest.findUnique({
    where: { id: sharedQuestId },
  });

  if (!sharedQuest) {
    return c.json({ message: "Shared quest not found" }, 404);
  }

  if (sharedQuest.receiverId !== user.id) {
    return c.json({ message: "You can only decline quests shared with you" }, 403);
  }

  // Update status
  await db.shared_quest.update({
    where: { id: sharedQuestId },
    data: { status: "declined" },
  });

  return c.json({ success: true, message: "Quest declined" });
});

export { sharedQuestsRouter };

// ============================================
// POST /api/shared-quests/create-custom - Create custom quest and share with friend
// ============================================
const createCustomQuestSchema = z.object({
  friendId: z.string().optional(), // For backward compatibility
  friendIds: z.array(z.string()).optional(), // For multiple friends (optional)
  audioTranscript: z.string().optional(),
  textDescription: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  goalType: z.enum(["COLLECT_NOS", "COLLECT_YES", "TAKE_ACTION"]).optional(),
  goalCount: z.number().min(1).max(50).optional(),
  locationType: z.enum(["CURRENT", "CUSTOM", "NONE"]).optional(),
  customLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  giftXP: z.number().min(0).max(10000).default(0),
  giftPoints: z.number().min(0).max(10000).default(0),
  message: z.string().max(500).optional(),
});
// Note: friendId/friendIds are now optional - users can create personal quests

sharedQuestsRouter.post("/create-custom", zValidator("json", createCustomQuestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ success: false, message: "Unauthorized", isSafe: false }, 401);
  }

  const data = c.req.valid("json");
  const { friendId, friendIds, audioTranscript, textDescription, category, difficulty, goalType, goalCount, locationType, customLocation, latitude, longitude, giftXP, giftPoints, message } = data;

  // Normalize to array of friend IDs
  const targetFriendIds = friendIds || (friendId ? [friendId] : []);

  // If no friends selected, create a personal quest instead
  const isPersonalQuest = targetFriendIds.length === 0;

  // Check if user is admin - admins have full access
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  // Check free tier limit: max 10 custom quests for free users
  if (!userRecord?.isAdmin) {
    // Check if user has active premium subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    const isPremium = subscription?.status === "active";

    // If not premium, count custom quests created by this user
    if (!isPremium) {
      const customQuestCount = await db.user_quest.count({
        where: {
          userId: user.id,
          quest: {
            isAIGenerated: true, // Only count AI-generated (custom) quests
          },
        },
      });

      // Also count shared custom quests sent by this user
      const sharedCustomQuestCount = await db.shared_quest.count({
        where: {
          senderId: user.id,
          isCustomQuest: true,
        },
      });

      const totalCustomQuests = customQuestCount + sharedCustomQuestCount;

      if (totalCustomQuests >= 10) {
        return c.json(
          {
            success: false,
            message: "You've reached your free tier limit of 10 custom quests. Upgrade to premium to create unlimited custom quests!",
            requiresPremium: true,
            currentCustomQuests: totalCustomQuests,
            limit: 10,
          },
          403
        );
      }
    }
  }

  // Note: Custom quest creation is now available to all users
  // Free users can create up to 10 custom quests, premium users have unlimited

  // Only verify friendships if friends are selected
  let validFriendIds: string[] = [];
  if (!isPersonalQuest) {
    // Verify all friends exist and are actually friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: targetFriendIds.flatMap((fId) => [
          { initiatorId: user.id, receiverId: fId, status: "ACCEPTED" },
          { initiatorId: fId, receiverId: user.id, status: "ACCEPTED" },
        ]),
      },
    });

    validFriendIds = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    if (validFriendIds.length !== targetFriendIds.length) {
      const invalidIds = targetFriendIds.filter((id) => !validFriendIds.includes(id));
      return c.json({
        success: false,
        message: `Some selected users are not your friends. Please only select friends.`,
        isSafe: false,
      }, 403);
    }

    // Check token balance (1 token per friend required)
    const requiredTokens = validFriendIds.length;
    const userStats = await db.user_stats.findUnique({
      where: { userId: user.id },
    });

    if (!userStats || (userStats.tokens || 0) < requiredTokens) {
      return c.json(
        {
          success: false,
          message: `You need at least ${requiredTokens} token${requiredTokens > 1 ? 's' : ''} to send a quest to ${requiredTokens} friend${requiredTokens > 1 ? 's' : ''}. Complete quests to earn tokens!`,
          isSafe: false,
          requiresTokens: true,
        },
        400
      );
    }
  }

  // Check user's balance if gifting points/XP
  if (giftXP > 0 || giftPoints > 0) {
    const userStats = await db.user_stats.findUnique({
      where: { userId: user.id },
    });

    if (!userStats) {
      return c.json({
        success: false,
        message: "You need to complete a quest first to earn XP and Points before gifting!",
        isSafe: false,
      }, 400);
    }

    if (giftXP > userStats.totalXP) {
      return c.json({
        success: false,
        message: `You only have ${userStats.totalXP} XP. You can't gift ${giftXP} XP. Complete more quests to earn XP!`,
        isSafe: false,
      }, 400);
    }

    if (giftPoints > userStats.totalPoints) {
      return c.json({
        success: false,
        message: `You only have ${userStats.totalPoints} Points. You can't gift ${giftPoints} Points. Complete more quests to earn Points!`,
        isSafe: false,
      }, 400);
    }

    // Deduct from sender's balance
    await db.user_stats.update({
      where: { userId: user.id },
      data: {
        totalXP: { decrement: giftXP },
        totalPoints: { decrement: giftPoints },
      },
    });
  }

  // Get description from voice or text
  const rawDescription = audioTranscript || textDescription;

  if (!rawDescription) {
    return c.json({
      success: false,
      message: "Please provide a quest description via voice or text",
      isSafe: false,
    }, 400);
  }

  // AI Safety Check
  console.log("🛡️ Running AI safety check on quest description...");
  const safetyCheck = await checkQuestSafety(rawDescription);

  if (!safetyCheck.isSafe) {
    // Refund XP/Points if quest was unsafe
    if (giftXP > 0 || giftPoints > 0) {
      await db.user_stats.update({
        where: { userId: user.id },
        data: {
          totalXP: { increment: giftXP },
          totalPoints: { increment: giftPoints },
        },
      });
    }

    return c.json({
      success: false,
      message: "Quest cannot be created",
      isSafe: false,
      safetyWarning: safetyCheck.warning,
    }, 400);
  }

  console.log("✅ Quest passed safety check");

  // AI Fine-tuning: Use smart algorithm to optimize quest based on user preferences
  console.log("🤖 Running AI fine-tuning to optimize quest...");
  const fineTunedQuest = await fineTuneQuestWithAI({
    description: safetyCheck.cleanDescription || rawDescription,
    category: category || "SOCIAL",
    goalType: goalType || "COLLECT_NOS",
    goalCount: goalCount,
    locationType: locationType || "NONE",
    customLocation: customLocation,
    difficulty: difficulty || "MEDIUM",
  });

  // Determine quest parameters (use AI-optimized values or defaults)
  const finalCategory = fineTunedQuest.category || category || "SOCIAL";
  const finalDifficulty = fineTunedQuest.difficulty || difficulty || "MEDIUM";
  const finalGoalType = fineTunedQuest.goalType || goalType || "COLLECT_NOS";
  const finalGoalCount = fineTunedQuest.goalCount || goalCount || (finalDifficulty === "EASY" ? 3 : finalDifficulty === "MEDIUM" ? 5 : 8);
  const finalDescription = fineTunedQuest.description || safetyCheck.cleanDescription || rawDescription;
  const finalLocation = fineTunedQuest.location || customLocation;

  // Calculate rewards
  const difficultyMultiplier = { EASY: 1, MEDIUM: 1.5, HARD: 2, EXPERT: 3 }[finalDifficulty] || 1;
  const baseXP = Math.floor(finalGoalCount * 10 * difficultyMultiplier) + 50;
  const basePoints = Math.floor(finalGoalCount * 20 * difficultyMultiplier) + 100;

  // Create the quest in the database
  const quest = await db.quest.create({
    data: {
      title: finalDescription.substring(0, 50),
      description: finalDescription,
      category: finalCategory,
      difficulty: finalDifficulty,
      goalType: finalGoalType,
      goalCount: finalGoalCount,
      location: finalLocation || null,
      latitude: locationType === "CURRENT" && latitude ? latitude : null,
      longitude: locationType === "CURRENT" && longitude ? longitude : null,
      xpReward: baseXP + giftXP,
      pointReward: basePoints + giftPoints,
      isAIGenerated: true, // Mark as AI-generated since we fine-tuned it
    },
  });

  // For personal quests: assign directly to the user as a UserQuest
  // For shared quests: deduct tokens, create SharedQuest records, and send notifications
  if (isPersonalQuest) {
    // Create a UserQuest for the user (personal quest)
    const userQuest = await db.user_quest.create({
      data: {
        userId: user.id,
        questId: quest.id,
        status: "ACTIVE",
        startedAt: new Date(),
        noCount: 0,
        yesCount: 0,
        actionCount: 0,
      },
    });

    console.log(`✅ Personal custom quest created for user ${user.id}`);

    return c.json({
      success: true,
      userQuestId: userQuest.id,
      message: "Personal custom quest created successfully!",
      quest: {
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        goalType: quest.goalType,
        goalCount: quest.goalCount,
        xpReward: quest.xpReward,
        pointReward: quest.pointReward,
      },
      isSafe: true,
    });
  }

  // Shared quest flow (with friends)
  // Deduct tokens for sending quest (1 per friend)
  await db.user_stats.update({
    where: { userId: user.id },
    data: {
      tokens: {
        decrement: validFriendIds.length,
      },
    },
  });

  // Create token transaction record
  await db.token_transaction.create({
    data: {
      userId: user.id,
      type: "spent",
      amount: -validFriendIds.length,
      description: `Spent ${validFriendIds.length} token${validFriendIds.length > 1 ? 's' : ''} to send custom quest to ${validFriendIds.length} friend${validFriendIds.length > 1 ? 's' : ''}`,
      questId: quest.id,
    },
  });

  // Create shared quests for all friends
  const sharedQuests = await Promise.all(
    validFriendIds.map((fId) =>
      db.shared_quest.create({
        data: {
          senderId: user.id,
          receiverId: fId,
          questId: quest.id,
          message,
          status: "pending",
          isCustomQuest: true,
          customTitle: quest.title,
          customDescription: quest.description,
          customCategory: finalCategory,
          customDifficulty: finalDifficulty,
          customGoalType: finalGoalType,
          customGoalCount: finalGoalCount,
          audioTranscript: audioTranscript || null,
          giftedXP: giftXP,
          giftedPoints: giftPoints,
        },
      })
    )
  );

  const userName = user.name || user.email || "A friend";
  const giftMessage = giftXP > 0 || giftPoints > 0 ? ` with ${giftXP} XP and ${giftPoints} Points!` : "!";

  // Create notifications for all friends
  await db.notification.createMany({
    data: validFriendIds.map((fId) => ({
      userId: fId,
      senderId: user.id,
      type: "QUEST_SHARED",
      title: "Custom Quest Received!",
      message: `${userName} created a custom quest for you${giftMessage}`,
      read: false,
    })),
  });

  console.log(`✅ Custom quest created and shared with ${validFriendIds.length} friend${validFriendIds.length > 1 ? 's' : ''}`);
  console.log(`💎 Gifted: ${giftXP} XP, ${giftPoints} Points`);

  return c.json({
    success: true,
    sharedQuestIds: sharedQuests.map((sq) => sq.id),
    sharedQuestId: sharedQuests[0]?.id, // For backward compatibility
    message: `Custom quest created and shared with ${validFriendIds.length} friend${validFriendIds.length > 1 ? 's' : ''} successfully!`,
    quest: {
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      goalType: quest.goalType,
      goalCount: quest.goalCount,
      xpReward: quest.xpReward,
      pointReward: quest.pointReward,
    },
    isSafe: true,
  });
});
