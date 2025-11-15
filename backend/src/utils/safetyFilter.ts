/**
 * Safety Filter Utility
 *
 * Filters quest content to prevent life-threatening or physically harmful quests
 * This ensures user safety across all quest creation methods: AI, custom, and livestream
 */

// Keywords and patterns that indicate potentially harmful or dangerous content
const HARMFUL_KEYWORDS = [
  // Physical harm
  "kill", "murder", "suicide", "self-harm", "cut yourself", "hurt yourself", "harm yourself",
  "jump off", "overdose", "poison", "weapon", "gun", "knife", "blade",

  // Dangerous activities
  "drive drunk", "drink and drive", "dangerous driving", "reckless driving",
  "trespass", "break in", "breaking and entering", "illegal entry",

  // Substance abuse
  "hard drugs", "illegal drugs", "drug dealer", "buy drugs", "sell drugs",
  "drink until", "get drunk", "excessive drinking", "binge drinking",

  // Sexual harassment/assault
  "sexual assault", "harass", "grope", "touch without", "unwanted touching",
  "expose yourself", "flash", "indecent",

  // Violence
  "fight", "assault", "attack", "punch", "hit someone", "beat up",
  "threaten", "intimidate", "stalk",

  // Dangerous locations
  "highway", "freeway", "train tracks", "railroad", "cliff", "roof edge",
  "high building", "bridge jump",

  // Fire/explosion
  "set fire", "burn down", "explosive", "bomb",

  // Illegal activities
  "steal", "rob", "theft", "shoplift", "vandalize", "destroy property",
  "fake id", "identity theft", "fraud",
];

// Regex patterns for more nuanced detection
const HARMFUL_PATTERNS = [
  /\b(kill|murder|suicide)\b/i,
  /\b(self[\s-]?harm|hurt\s+yourself|harm\s+yourself)\b/i,
  /\b(jump\s+off|jump\s+from)\s+(building|bridge|cliff|roof)/i,
  /\b(drunk\s+driv|drink\s+and\s+driv)/i,
  /\b(sexual|physica|violent)\s+(assault|harassment|abuse)/i,
  /\b(illegal|unlawful)\s+(activity|action|drug)/i,
  /\b(threaten|intimidate)\s+(someone|people|person)/i,
];

/**
 * Check if quest content contains harmful or dangerous elements
 * @param content - The quest title, description, or action to check
 * @returns Object with isSafe flag and reason if unsafe
 */
export function checkQuestSafety(content: string): { isSafe: boolean; reason?: string } {
  if (!content) {
    return { isSafe: true };
  }

  const lowerContent = content.toLowerCase();

  // Check for harmful keywords
  for (const keyword of HARMFUL_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return {
        isSafe: false,
        reason: `Quest contains potentially harmful content: "${keyword}". For your safety, we cannot create quests that may cause physical harm, involve illegal activities, or endanger others.`,
      };
    }
  }

  // Check for harmful patterns
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isSafe: false,
        reason:
          "Quest contains potentially harmful content. For your safety, we cannot create quests that may cause physical harm, involve illegal activities, or endanger others.",
      };
    }
  }

  return { isSafe: true };
}

/**
 * Comprehensive quest safety check for all fields
 * @param title - Quest title
 * @param description - Quest description
 * @param action - Quest action (optional)
 * @returns Object with isSafe flag and reason if unsafe
 */
export function checkFullQuestSafety(
  title: string,
  description: string,
  action?: string
): { isSafe: boolean; reason?: string } {
  // Check title
  const titleCheck = checkQuestSafety(title);
  if (!titleCheck.isSafe) {
    return titleCheck;
  }

  // Check description
  const descriptionCheck = checkQuestSafety(description);
  if (!descriptionCheck.isSafe) {
    return descriptionCheck;
  }

  // Check action if provided
  if (action) {
    const actionCheck = checkQuestSafety(action);
    if (!actionCheck.isSafe) {
      return actionCheck;
    }
  }

  return { isSafe: true };
}

/**
 * AI-based safety check using OpenAI moderation API
 * This is an additional layer of protection for more nuanced content
 * @param content - Content to check
 * @param openaiKey - OpenAI API key
 * @returns Object with isSafe flag and reason if unsafe
 */
export async function checkQuestSafetyWithAI(
  content: string,
  openaiKey: string
): Promise<{ isSafe: boolean; reason?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI moderation API error:", response.statusText);
      // Fall back to basic safety check
      return { isSafe: true };
    }

    const data = await response.json();
    const result = data.results[0];

    if (result.flagged) {
      return {
        isSafe: false,
        reason:
          "This quest was flagged by our AI safety system. For your safety, we cannot create quests that may cause harm or involve inappropriate content.",
      };
    }

    return { isSafe: true };
  } catch (error) {
    console.error("Error checking quest safety with AI:", error);
    // Fall back to basic safety check if AI check fails
    return { isSafe: true };
  }
}
