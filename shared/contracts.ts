// contracts.ts
// Shared API contracts (schemas and types) used by both the server and the app.
// Import in the app as: `import { type GetSampleResponse } from "@shared/contracts"`
// Import in the server as: `import { postSampleRequestSchema } from "@shared/contracts"`

import { z } from "zod";

// ==========================================
// Auth Routes - Password Reset
// ==========================================

// POST /api/auth/forgot-password
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export const forgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>;

// POST /api/auth/reset-password
export const resetPasswordRequestSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;

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
  username: z.string().nullable().optional(), // Unique username/tag name
  displayName: z.string(),
  bio: z.string().nullable(),
  age: z.number().nullable(),
  photos: z.array(z.string()),
  avatar: z.string().nullable(), // AI-generated or uploaded avatar URL
  interests: z.array(z.string()).optional(), // Interest tags
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isLive: z.boolean(),
  liveViewers: z.number(),
  userContext: z.string().nullable().optional(), // About you - for AI
  userGoals: z.string().nullable().optional(), // User's goals - for AI
  onboardingCompleted: z.boolean().optional(), // Track onboarding completion
  ageVerified: z.boolean().optional(), // Whether age has been verified
  parentalConsent: z.boolean().optional(), // For users 13-17
  parentalGuidance: z.record(z.string(), z.boolean()).optional(), // Parental guidance settings
  isAdmin: z.boolean().optional(), // Whether user is an admin
});
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;

// POST /api/profile - Create/Update profile
export const updateProfileRequestSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(), // Username: alphanumeric + underscore only
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  age: z.number().min(1).max(120).optional(), // Allow ages 13+ (validation happens in backend)
  ageVerified: z.boolean().optional(),
  parentalConsent: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  avatar: z.string().optional(), // AI-generated or uploaded avatar URL
  interests: z.array(z.string()).optional(), // Interest tags
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  userContext: z.string().optional(), // About you - for AI quest generation
  userGoals: z.string().optional(), // User's goals - for AI quest generation
  onboardingCompleted: z.boolean().optional(), // Mark onboarding as completed
  challengeDuration: z.number().optional(), // 14, 30, or 100 days
  questMode: z.enum(["QUEST_BY_QUEST", "AI_SERIES"]).optional(), // Quest mode selection
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export const updateProfileResponseSchema = z.object({
  success: z.boolean(),
  profile: getProfileResponseSchema,
});
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;

// POST /api/profile/generate-avatar - Generate AI avatar
export const generateAvatarRequestSchema = z.object({
  style: z.string().optional(), // e.g., "gaming", "anime", "realistic", "fantasy"
  description: z.string().optional(), // Custom description
});
export type GenerateAvatarRequest = z.infer<typeof generateAvatarRequestSchema>;
export const generateAvatarResponseSchema = z.object({
  success: z.boolean(),
  avatarUrl: z.string(),
  message: z.string().optional(),
});
export type GenerateAvatarResponse = z.infer<typeof generateAvatarResponseSchema>;

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
      interests: z.array(z.string()).optional(), // Interest tags
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

// ==========================================
// Quest Routes
// ==========================================

// GET /api/quests - Get user's quests
export const getUserQuestsResponseSchema = z.object({
  activeQuests: z.array(
    z.object({
      id: z.string(),
      quest: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        difficulty: z.string(),
        goalType: z.string(),
        goalCount: z.number(),
        xpReward: z.number(),
        pointReward: z.number(),
        location: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        timeContext: z.string().nullable(),
        dateContext: z.string().nullable(),
      }),
      noCount: z.number(),
      yesCount: z.number(),
      actionCount: z.number(),
      status: z.string(),
      startedAt: z.string().nullable(),
    })
  ),
  queuedQuests: z.array(
    z.object({
      id: z.string(),
      quest: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        difficulty: z.string(),
        goalType: z.string(),
        goalCount: z.number(),
        xpReward: z.number(),
        pointReward: z.number(),
        location: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
      }),
    })
  ),
});
export type GetUserQuestsResponse = z.infer<typeof getUserQuestsResponseSchema>;

// POST /api/quests/generate - Generate AI quest
export const generateQuestRequestSchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  customPrompt: z.string().optional(),
  userLocation: z.string().optional(), // User's current location name
  userLatitude: z.number().optional(), // User's GPS latitude
  userLongitude: z.number().optional(), // User's GPS longitude
  preferredQuestType: z.enum(["REJECTION", "ACTION"]).optional(), // User's preferred quest type
});
export type GenerateQuestRequest = z.infer<typeof generateQuestRequestSchema>;
export const generateQuestResponseSchema = z.object({
  success: z.boolean(),
  userQuestId: z.string(),
  quest: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    difficulty: z.string(),
    goalType: z.string(),
    goalCount: z.number(),
    xpReward: z.number(),
    pointReward: z.number(),
    location: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    timeContext: z.string().nullable(),
    dateContext: z.string().nullable(),
  }),
});
export type GenerateQuestResponse = z.infer<typeof generateQuestResponseSchema>;

// POST /api/quests/:id/start - Start a quest
export const startQuestResponseSchema = z.object({
  success: z.boolean(),
  userQuestId: z.string(),
});
export type StartQuestResponse = z.infer<typeof startQuestResponseSchema>;

// POST /api/quests/swap - Swap an active quest with a queued quest
export const swapQuestRequestSchema = z.object({
  activeQuestId: z.string(),
  queuedQuestId: z.string(),
});
export type SwapQuestRequest = z.infer<typeof swapQuestRequestSchema>;
export const swapQuestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SwapQuestResponse = z.infer<typeof swapQuestResponseSchema>;

// POST /api/quests/:id/record - Record NO or YES
export const recordQuestActionRequestSchema = z.object({
  action: z.enum(["NO", "YES", "ACTION"]),
});
export type RecordQuestActionRequest = z.infer<typeof recordQuestActionRequestSchema>;
export const recordQuestActionResponseSchema = z.object({
  success: z.boolean(),
  completed: z.boolean(),
  noCount: z.number(),
  yesCount: z.number(),
  actionCount: z.number(),
});
export type RecordQuestActionResponse = z.infer<typeof recordQuestActionResponseSchema>;

// POST /api/quests/refresh-all - Refresh all queued quests
export const refreshAllQuestsRequestSchema = z.object({
  count: z.number().min(1).max(10).optional().default(3), // Generate 3 quests by default
  userLocation: z.string().optional(),
  userLatitude: z.number().optional(),
  userLongitude: z.number().optional(),
});
export type RefreshAllQuestsRequest = z.infer<typeof refreshAllQuestsRequestSchema>;
export const refreshAllQuestsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newQuestCount: z.number(),
  quests: z.array(z.object({
    userQuestId: z.string(),
    quest: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.string(),
      xpReward: z.number(),
      pointReward: z.number(),
    }),
  })),
});
export type RefreshAllQuestsResponse = z.infer<typeof refreshAllQuestsResponseSchema>;

// POST /api/quests/generate-map-quests - Generate quests for map within 5 miles
export const generateMapQuestsRequestSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  count: z.number().min(1).max(10).optional().default(5), // Generate 5 quests by default
});
export type GenerateMapQuestsRequest = z.infer<typeof generateMapQuestsRequestSchema>;
export const generateMapQuestsResponseSchema = z.object({
  success: z.boolean(),
  quests: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.string(),
      goalType: z.string(),
      goalCount: z.number(),
      xpReward: z.number(),
      pointReward: z.number(),
      location: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      timeContext: z.string().nullable(),
      dateContext: z.string().nullable(),
    })
  ),
});
export type GenerateMapQuestsResponse = z.infer<typeof generateMapQuestsResponseSchema>;

// GET /api/stats - Get user stats
// ==========================================
// Payments Routes
// ==========================================

// GET /api/payments/subscription - Get subscription status
export const getSubscriptionResponseSchema = z.object({
  hasActiveSubscription: z.boolean(),
  subscription: z
    .object({
      id: z.string(),
      status: z.string(),
      plan: z.string(),
      currentPeriodEnd: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
    })
    .nullable(),
});
export type GetSubscriptionResponse = z.infer<typeof getSubscriptionResponseSchema>;

// POST /api/payments/create-subscription - Create subscription checkout
export const createSubscriptionResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string().nullable(),
});
export type CreateSubscriptionResponse = z.infer<typeof createSubscriptionResponseSchema>;

// POST /api/payments/cancel-subscription - Cancel subscription
export const cancelSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type CancelSubscriptionResponse = z.infer<typeof cancelSubscriptionResponseSchema>;

// POST /api/payments/create-token-purchase - Create token purchase checkout
export const createTokenPurchaseRequestSchema = z.object({
  amount: z.number().int().min(1).max(1000),
});
export type CreateTokenPurchaseRequest = z.infer<typeof createTokenPurchaseRequestSchema>;
export const createTokenPurchaseResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string().nullable(),
});
export type CreateTokenPurchaseResponse = z.infer<typeof createTokenPurchaseResponseSchema>;

// GET /api/payments/tokens - Get token balance
export const getTokensResponseSchema = z.object({
  tokens: z.number(),
});
export type GetTokensResponse = z.infer<typeof getTokensResponseSchema>;

// ==========================================
// Stats Routes
// ==========================================

export const getUserStatsResponseSchema = z.object({
  currentStreak: z.number(),
  longestStreak: z.number(),
  totalXP: z.number(),
  totalPoints: z.number(),
  trophies: z.number(),
  diamonds: z.number(),
  tokens: z.number(),

  // Confidence & Fear Zone Tracking
  confidenceLevel: z.number(), // 0-100 confidence percentage
  previousConfidence: z.number(), // For calculating weekly change
  confidenceChange: z.number(), // Calculated: confidenceLevel - previousConfidence
  dailyConfidenceMeter: z.number(), // 0-100, grows with quests, decays over time

  // Fear Zone Stats
  easyZoneCount: z.number(), // Count of easy difficulty quests
  growthZoneCount: z.number(), // Count of medium difficulty quests
  fearZoneCount: z.number(), // Count of hard/extreme difficulty quests

  // Activity Tracking for AI
  lastQuestAttemptAt: z.string().nullable(),
  lastQuestCompletedAt: z.string().nullable(),
  questCompletionRate: z.number(), // Percentage of quests completed
  avgQuestDifficulty: z.number(), // Average difficulty level

  // Warm-up tracking
  warmUpsCompleted: z.number(),
  lastWarmUpAt: z.string().nullable(),
});
export type GetUserStatsResponse = z.infer<typeof getUserStatsResponseSchema>;

// GET /api/stats/leaderboard - Get leaderboard
export const getLeaderboardResponseSchema = z.object({
  leaderboard: z.array(
    z.object({
      rank: z.number(),
      userId: z.string(),
      userName: z.string(),
      totalXP: z.number(),
      totalPoints: z.number(),
      currentStreak: z.number(),
      questsCompleted: z.number().optional(), // Quest completions in the period
      isCurrentUser: z.boolean(),
    })
  ),
  currentUserRank: z.number(),
  totalUsers: z.number(),
  period: z.enum(["day", "week", "month", "all"]).optional(),
});
export type GetLeaderboardResponse = z.infer<typeof getLeaderboardResponseSchema>;

// ==========================================
// Live Stream Routes
// ==========================================

// POST /api/live/start - Start a live stream
export const startLiveStreamRequestSchema = z.object({
  userQuestId: z.string().optional(),
});
export type StartLiveStreamRequest = z.infer<typeof startLiveStreamRequestSchema>;
export const startLiveStreamResponseSchema = z.object({
  success: z.boolean(),
  liveStreamId: z.string(),
  roomUrl: z.string(),
  roomName: z.string(),
  token: z.string(),
});
export type StartLiveStreamResponse = z.infer<typeof startLiveStreamResponseSchema>;

// POST /api/live/:id/end - End a live stream
export const endLiveStreamResponseSchema = z.object({
  success: z.boolean(),
});
export type EndLiveStreamResponse = z.infer<typeof endLiveStreamResponseSchema>;

// GET /api/live/active - Get active live streams
export const getActiveLiveStreamsResponseSchema = z.object({
  streams: z.array(
    z.object({
      id: z.string(),
      roomUrl: z.string(),
      roomName: z.string(),
      viewerCount: z.number(),
      startedAt: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        image: z.string().nullable(),
      }),
      userQuest: z
        .object({
          id: z.string(),
          noCount: z.number(),
          yesCount: z.number(),
          actionCount: z.number(),
          quest: z.object({
            title: z.string(),
            description: z.string(),
            category: z.string(),
            goalCount: z.number(),
            goalType: z.string(),
          }),
        })
        .nullable(),
    })
  ),
});
export type GetActiveLiveStreamsResponse = z.infer<typeof getActiveLiveStreamsResponseSchema>;

// POST /api/live/:id/comment - Add a comment to live stream
export const addLiveCommentRequestSchema = z.object({
  message: z.string().min(1).max(500),
});
export type AddLiveCommentRequest = z.infer<typeof addLiveCommentRequestSchema>;
export const addLiveCommentResponseSchema = z.object({
  success: z.boolean(),
  comment: z.object({
    id: z.string(),
    message: z.string(),
    createdAt: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string().nullable(),
    }),
  }),
});
export type AddLiveCommentResponse = z.infer<typeof addLiveCommentResponseSchema>;

// GET /api/live/:id/comments - Get comments for a live stream
export const getLiveCommentsResponseSchema = z.object({
  comments: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
    })
  ),
});
export type GetLiveCommentsResponse = z.infer<typeof getLiveCommentsResponseSchema>;

// POST /api/live/:id/suggest-quest - Suggest a quest to streamer
export const suggestQuestToStreamerRequestSchema = z.object({
  questId: z.string(),
  boostAmount: z.number().min(0).default(0), // Diamonds to boost priority
  message: z.string().optional(),
});
export type SuggestQuestToStreamerRequest = z.infer<typeof suggestQuestToStreamerRequestSchema>;
export const suggestQuestToStreamerResponseSchema = z.object({
  success: z.boolean(),
  suggestionId: z.string(),
  newDiamondBalance: z.number(),
});
export type SuggestQuestToStreamerResponse = z.infer<typeof suggestQuestToStreamerResponseSchema>;

// GET /api/live/:id/quest-suggestions - Get pending quest suggestions for a stream
export const getQuestSuggestionsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      quest: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        difficulty: z.string(),
        goalType: z.string(),
        goalCount: z.number(),
      }),
      suggester: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
      boostAmount: z.number(),
      message: z.string().nullable(),
      status: z.string(),
      createdAt: z.string(),
    })
  ),
});
export type GetQuestSuggestionsResponse = z.infer<typeof getQuestSuggestionsResponseSchema>;

// POST /api/live/:id/respond-to-suggestion - Accept or decline a quest suggestion
export const respondToSuggestionRequestSchema = z.object({
  suggestionId: z.string(),
  action: z.enum(["accept", "decline"]),
});
export type RespondToSuggestionRequest = z.infer<typeof respondToSuggestionRequestSchema>;
export const respondToSuggestionResponseSchema = z.object({
  success: z.boolean(),
  userQuestId: z.string().optional(), // Returned if accepted
  message: z.string().optional(),
});
export type RespondToSuggestionResponse = z.infer<typeof respondToSuggestionResponseSchema>;

// ==========================================
// Journal Routes
// ==========================================

// POST /api/audio/transcribe - Transcribe audio file to text (used in CreateQuestScreen)
export const audioTranscribeResponseSchema = z.object({
  transcription: z.string(),
});
export type AudioTranscribeResponse = z.infer<typeof audioTranscribeResponseSchema>;

// POST /api/journal/transcribe - Transcribe audio to text or process text
export const transcribeAudioRequestSchema = z.object({
  audioBase64: z.string().optional(), // Base64 encoded audio (optional if text is provided)
  text: z.string().optional(), // Direct text input (optional if audio is provided)
});
export type TranscribeAudioRequest = z.infer<typeof transcribeAudioRequestSchema>;
export const transcribeAudioResponseSchema = z.object({
  transcript: z.string(),
  summary: z.string(),
});
export type TranscribeAudioResponse = z.infer<typeof transcribeAudioResponseSchema>;

// POST /api/journal - Create journal entry
export const createJournalEntryRequestSchema = z.object({
  audioUrl: z.string().optional(),
  audioTranscript: z.string().optional(),
  aiSummary: z.string(),
  userEditedSummary: z.string().optional(),
  outcome: z.enum(["YES", "NO", "ACTIVITY"]),
  imageUrls: z.array(z.string()).optional(), // Array of image URLs
  location: z.string().optional(), // Location/place name
});
export type CreateJournalEntryRequest = z.infer<typeof createJournalEntryRequestSchema>;
export const createJournalEntryResponseSchema = z.object({
  id: z.string(),
  achievement: z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    earnedAt: z.string(),
  }),
});
export type CreateJournalEntryResponse = z.infer<typeof createJournalEntryResponseSchema>;

// GET /api/journal - Get all journal entries
export const getJournalEntriesResponseSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      audioUrl: z.string().nullable(),
      audioTranscript: z.string().nullable(),
      aiSummary: z.string(),
      userEditedSummary: z.string().nullable(),
      outcome: z.string(),
      imageUrls: z.array(z.string()).optional(), // Array of image URLs
      location: z.string().nullable(), // Location/place name
      createdAt: z.string(),
      updatedAt: z.string(),
      achievements: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          description: z.string(),
          earnedAt: z.string(),
        })
      ),
    })
  ),
});
export type GetJournalEntriesResponse = z.infer<typeof getJournalEntriesResponseSchema>;

// PUT /api/journal/:id - Update journal entry summary
export const updateJournalEntryRequestSchema = z.object({
  userEditedSummary: z.string(),
  outcome: z.enum(["YES", "NO", "ACTIVITY"]).optional(),
  imageUrls: z.array(z.string()).optional(),
  location: z.string().optional(),
});
export type UpdateJournalEntryRequest = z.infer<typeof updateJournalEntryRequestSchema>;
export const updateJournalEntryResponseSchema = z.object({
  id: z.string(),
  userEditedSummary: z.string(),
  imageUrls: z.array(z.string()).optional(),
  location: z.string().nullable(),
});
export type UpdateJournalEntryResponse = z.infer<typeof updateJournalEntryResponseSchema>;

// GET /api/journal/achievements - Get all growth achievements
export const getGrowthAchievementsResponseSchema = z.object({
  achievements: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      description: z.string(),
      earnedAt: z.string(),
      journalEntry: z.object({
        id: z.string(),
        aiSummary: z.string(),
        userEditedSummary: z.string().nullable(),
        outcome: z.string(),
        createdAt: z.string(),
      }),
    })
  ),
  stats: z.object({
    totalAchievements: z.number(),
    goldStars: z.number(),
    silverStars: z.number(),
    bronzeStars: z.number(),
  }),
});
export type GetGrowthAchievementsResponse = z.infer<typeof getGrowthAchievementsResponseSchema>;

// ==========================================
// Posts Routes
// ==========================================

// POST /api/posts - Create a new post
export const createPostRequestSchema = z.object({
  content: z.string().min(1),
  privacy: z.enum(["PUBLIC", "FRIENDS", "GROUPS"]),
  groupId: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;
export const createPostResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  privacy: z.string(),
  groupId: z.string().nullable(),
  createdAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
  images: z.array(
    z.object({
      id: z.string(),
      imageUrl: z.string(),
      order: z.number(),
    })
  ),
});
export type CreatePostResponse = z.infer<typeof createPostResponseSchema>;

// GET /api/posts/feed - Get posts feed (with privacy filtering)
export const getPostsFeedResponseSchema = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      privacy: z.string(),
      groupId: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string(),
        avatar: z.string().nullable(),
      }),
      group: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .nullable(),
      images: z.array(
        z.object({
          id: z.string(),
          imageUrl: z.string(),
          order: z.number(),
        })
      ),
      likes: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          createdAt: z.string(),
        })
      ),
      comments: z.array(
        z.object({
          id: z.string(),
          content: z.string(),
          createdAt: z.string(),
          user: z.object({
            id: z.string(),
            name: z.string().nullable(),
            avatar: z.string().nullable(),
          }),
        })
      ),
      likeCount: z.number(),
      commentCount: z.number(),
      isLikedByCurrentUser: z.boolean(),
    })
  ),
});
export type GetPostsFeedResponse = z.infer<typeof getPostsFeedResponseSchema>;

// POST /api/posts/:id/like - Like a post
export const likePostResponseSchema = z.object({
  success: z.boolean(),
  likeCount: z.number(),
});
export type LikePostResponse = z.infer<typeof likePostResponseSchema>;

// DELETE /api/posts/:id/like - Unlike a post
export const unlikePostResponseSchema = z.object({
  success: z.boolean(),
  likeCount: z.number(),
});
export type UnlikePostResponse = z.infer<typeof unlikePostResponseSchema>;

// POST /api/posts/:id/comment - Comment on a post
export const addCommentRequestSchema = z.object({
  content: z.string().min(1),
});
export type AddCommentRequest = z.infer<typeof addCommentRequestSchema>;
export const addCommentResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
});
export type AddCommentResponse = z.infer<typeof addCommentResponseSchema>;

// DELETE /api/posts/:id - Delete a post
export const deletePostResponseSchema = z.object({
  success: z.boolean(),
});
export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;

// ==========================================
// Moments (Stories) Routes
// ==========================================

// POST /api/moments - Create a moment/story
export const createMomentRequestSchema = z.object({
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  content: z.string().optional(),
  groupId: z.string().optional(), // If posting to a group
});
export type CreateMomentRequest = z.infer<typeof createMomentRequestSchema>;
export const createMomentResponseSchema = z.object({
  id: z.string(),
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  content: z.string().nullable(),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type CreateMomentResponse = z.infer<typeof createMomentResponseSchema>;

// GET /api/moments - Get active moments from friends
export const getMomentsResponseSchema = z.object({
  moments: z.array(
    z.object({
      userId: z.string(),
      userName: z.string().nullable(),
      userAvatar: z.string().nullable(),
      moments: z.array(
        z.object({
          id: z.string(),
          imageUrl: z.string().nullable(),
          videoUrl: z.string().nullable(),
          content: z.string().nullable(),
          expiresAt: z.string(),
          createdAt: z.string(),
        })
      ),
    })
  ),
});
export type GetMomentsResponse = z.infer<typeof getMomentsResponseSchema>;

// ==========================================
// AI Insights & Growth Routes
// ==========================================

// GET /api/stats/reflection-prompt - Get AI Reflection Prompt of the Day
export const getReflectionPromptResponseSchema = z.object({
  prompt: z.string(),
  category: z.string(), // e.g., "reflection", "motivation", "learning"
  date: z.string(),
});
export type GetReflectionPromptResponse = z.infer<typeof getReflectionPromptResponseSchema>;

// GET /api/stats/courage-boost - Get random courage boost notification
export const getCourageBoostResponseSchema = z.object({
  message: z.string(),
  confidence: z.number(), // Percentage boost (e.g., 23)
  shouldShow: z.boolean(), // Whether to show the boost right now
});
export type GetCourageBoostResponse = z.infer<typeof getCourageBoostResponseSchema>;

// GET /api/stats/weekly-forecast - Get AI prediction for the week
export const getWeeklyForecastResponseSchema = z.object({
  forecast: z.string(),
  recommendedWeeklyTarget: z.number(),
  trendingCategory: z.string(),
  previousWeekNOs: z.number(),
  motivations: z.array(z.string()).optional(),
  accomplishments: z.array(z.string()).optional(),
});
export type GetWeeklyForecastResponse = z.infer<typeof getWeeklyForecastResponseSchema>;

// POST /api/stats/complete-warmup - Record a warm-up action completion
export const completeWarmupRequestSchema = z.object({
  warmupAction: z.string(),
});
export type CompleteWarmupRequest = z.infer<typeof completeWarmupRequestSchema>;
export const completeWarmupResponseSchema = z.object({
  success: z.boolean(),
  warmUpsCompleted: z.number(),
  confidenceBoost: z.number(), // Small confidence increase from warm-up
});
export type CompleteWarmupResponse = z.infer<typeof completeWarmupResponseSchema>;

// GET /api/quests/radar - Get location-based quest opportunities (NO Radar)
export const getQuestRadarRequestSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  category: z.string().optional(),
});
export type GetQuestRadarRequest = z.infer<typeof getQuestRadarRequestSchema>;
export const getQuestRadarResponseSchema = z.object({
  opportunities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.string(),
      distance: z.string().optional(), // e.g., "0.2 mi away"
      location: z.string().optional(),
      isLocationBased: z.boolean(),
    })
  ),
});
export type GetQuestRadarResponse = z.infer<typeof getQuestRadarResponseSchema>;

// GET /api/quests/warmup - Get a warm-up action before a quest
export const getWarmupActionResponseSchema = z.object({
  action: z.string(),
  description: z.string(),
  estimatedSeconds: z.number(),
});
export type GetWarmupActionResponse = z.infer<typeof getWarmupActionResponseSchema>;

// GET /api/quests/smart-suggestions - Get AI-adapted quest suggestions based on user behavior
export const getSmartQuestSuggestionsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      questId: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.string(),
      reason: z.string(), // Why this quest is suggested
      adaptationType: z.string(), // e.g., "easier", "micro-task", "big-risk-upgrade"
    })
  ),
  message: z.string().optional(), // Encouraging message from AI coach
});
export type GetSmartQuestSuggestionsResponse = z.infer<typeof getSmartQuestSuggestionsResponseSchema>;

// ==========================================
// Group Quests Routes
// ==========================================

// GET /api/group-quests/:groupId - Get all group quests for a group
export const getGroupQuestsResponseSchema = z.object({
  groupQuests: z.array(
    z.object({
      id: z.string(),
      groupId: z.string(),
      assignmentType: z.enum(["all", "assigned"]),
      createdAt: z.string(),
      creator: z.object({
        id: z.string(),
        displayName: z.string(),
        avatar: z.string().nullable(),
      }),
      quest: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        difficulty: z.string(),
        goalType: z.string(),
        goalCount: z.number(),
        xpReward: z.number(),
        pointReward: z.number(),
        location: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
      }),
      participants: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          displayName: z.string(),
          avatar: z.string().nullable(),
          status: z.string(),
          noCount: z.number(),
          yesCount: z.number(),
          actionCount: z.number(),
          startedAt: z.string().nullable(),
          completedAt: z.string().nullable(),
          joinedAt: z.string(),
        })
      ),
      assignedMembers: z.array(
        z.object({
          userId: z.string(),
          displayName: z.string(),
          avatar: z.string().nullable(),
        })
      ),
      userParticipation: z
        .object({
          id: z.string(),
          userId: z.string(),
          status: z.string(),
          noCount: z.number(),
          yesCount: z.number(),
          actionCount: z.number(),
          startedAt: z.string().nullable(),
          completedAt: z.string().nullable(),
          joinedAt: z.string(),
        })
        .nullable(),
    })
  ),
});
export type GetGroupQuestsResponse = z.infer<typeof getGroupQuestsResponseSchema>;

// POST /api/group-quests/create - Create a group quest
export const createGroupQuestRequestSchema = z.object({
  groupId: z.string(),
  questId: z.string().optional(), // Optional for custom quests
  customQuestDescription: z.string().optional(), // For custom quests
  questType: z.enum(["action", "rejection"]).default("action"), // Quest type
  rejectionNos: z.number().int().min(1).max(100).optional(), // Number of No's required for rejection quests
  assignmentType: z.enum(["all", "assigned"]).default("all"),
  assignedMemberIds: z.array(z.string()).optional(),
});
export type CreateGroupQuestRequest = z.infer<typeof createGroupQuestRequestSchema>;

export const createGroupQuestResponseSchema = z.object({
  success: z.boolean(),
  groupQuestId: z.string(),
});
export type CreateGroupQuestResponse = z.infer<typeof createGroupQuestResponseSchema>;

// POST /api/group-quests/:groupQuestId/join - Join a group quest
export const joinGroupQuestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type JoinGroupQuestResponse = z.infer<typeof joinGroupQuestResponseSchema>;

// POST /api/group-quests/:groupQuestId/start - Start a group quest
export const startGroupQuestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type StartGroupQuestResponse = z.infer<typeof startGroupQuestResponseSchema>;

// POST /api/group-quests/:groupQuestId/record - Record progress
export const recordGroupQuestProgressRequestSchema = z.object({
  action: z.enum(["no", "yes", "complete"]),
});
export type RecordGroupQuestProgressRequest = z.infer<typeof recordGroupQuestProgressRequestSchema>;

export const recordGroupQuestProgressResponseSchema = z.object({
  success: z.boolean(),
  noCount: z.number(),
  yesCount: z.number(),
  actionCount: z.number(),
  isComplete: z.boolean(),
  status: z.string(),
});
export type RecordGroupQuestProgressResponse = z.infer<typeof recordGroupQuestProgressResponseSchema>;

// ==========================================
// Group Live Routes
// ==========================================

// GET /api/group-live/:groupId - Get active live streams in a group
export const getGroupLiveStreamsResponseSchema = z.object({
  liveStreams: z.array(
    z.object({
      id: z.string(),
      roomUrl: z.string(),
      roomName: z.string(),
      viewerCount: z.number(),
      startedAt: z.string(),
      streamer: z.object({
        id: z.string(),
        displayName: z.string(),
        avatar: z.string().nullable(),
      }),
      quest: z
        .object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          category: z.string(),
          difficulty: z.string(),
        })
        .nullable(),
    })
  ),
});
export type GetGroupLiveStreamsResponse = z.infer<typeof getGroupLiveStreamsResponseSchema>;

// POST /api/group-live/start - Start a group live stream
export const startGroupLiveRequestSchema = z.object({
  groupId: z.string(),
  userQuestId: z.string().optional(),
});
export type StartGroupLiveRequest = z.infer<typeof startGroupLiveRequestSchema>;

export const startGroupLiveResponseSchema = z.object({
  success: z.boolean(),
  liveStreamId: z.string(),
  roomUrl: z.string(),
  roomName: z.string(),
});
export type StartGroupLiveResponse = z.infer<typeof startGroupLiveResponseSchema>;

// POST /api/group-live/:streamId/end - End a group live stream
export const endGroupLiveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type EndGroupLiveResponse = z.infer<typeof endGroupLiveResponseSchema>;

// POST /api/group-live/:streamId/join - Join a group live stream
export const joinGroupLiveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type JoinGroupLiveResponse = z.infer<typeof joinGroupLiveResponseSchema>;

// POST /api/group-live/:streamId/leave - Leave a group live stream
export const leaveGroupLiveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type LeaveGroupLiveResponse = z.infer<typeof leaveGroupLiveResponseSchema>;

// ==========================================
// Challenges Routes
// ==========================================

// POST /api/challenges/enroll - Enroll in 100 Day Challenge
export const enrollChallengeRequestSchema = z.object({
  category: z.enum(["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"]),
});
export type EnrollChallengeRequest = z.infer<typeof enrollChallengeRequestSchema>;

export const enrollChallengeResponseSchema = z.object({
  success: z.boolean(),
  challenge: z.object({
    id: z.string(),
    category: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    currentDay: z.number(),
    completedDays: z.number(),
  }),
});
export type EnrollChallengeResponse = z.infer<typeof enrollChallengeResponseSchema>;

// GET /api/challenges/active - Get active challenge
export const getActiveChallengeResponseSchema = z.object({
  challenge: z
    .object({
      id: z.string(),
      category: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      currentDay: z.number(),
      completedDays: z.number(),
      todayQuest: z
        .object({
          id: z.string(),
          day: z.number(),
          status: z.string(),
          quest: z
            .object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              category: z.string(),
              goalCount: z.number(),
            })
            .nullable(),
          userQuestId: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
});
export type GetActiveChallengeResponse = z.infer<typeof getActiveChallengeResponseSchema>;

// POST /api/challenges/generate-daily - Generate today's quest
export const generateDailyChallengeResponseSchema = z.object({
  success: z.boolean(),
  dailyQuest: z.object({
    id: z.string(),
    day: z.number(),
    questId: z.string().nullable(),
  }),
});
export type GenerateDailyChallengeResponse = z.infer<typeof generateDailyChallengeResponseSchema>;

// ==========================================
// Messages Routes
// ==========================================

// GET /api/messages/:userId - Get messages with specific user
export const getMessagesResponseSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      senderId: z.string(),
      receiverId: z.string(),
      content: z.string(),
      read: z.boolean(),
      createdAt: z.string(),
      sender: z.object({
        id: z.string(),
        displayName: z.string(),
        avatar: z.string().nullable(),
      }),
    })
  ),
});
export type GetMessagesResponse = z.infer<typeof getMessagesResponseSchema>;

// POST /api/messages/send - Send a message
export const sendMessageRequestSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(500),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const sendMessageResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
});
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

// GET /api/messages/conversations - Get all conversations
export const getConversationsResponseSchema = z.object({
  conversations: z.array(
    z.object({
      userId: z.string(),
      email: z.string(),
      displayName: z.string(),
      avatar: z.string().nullable(),
      lastMessage: z.string(),
      lastMessageAt: z.string(),
      unreadCount: z.number(),
    })
  ),
});
export type GetConversationsResponse = z.infer<typeof getConversationsResponseSchema>;

// ==========================================
// Custom Quest Creation for Friends
// ==========================================

// POST /api/shared-quests/create-custom - Create and share custom quest with AI safety filtering
export const createCustomQuestRequestSchema = z.object({
  friendId: z.string().optional(), // For backward compatibility
  friendIds: z.array(z.string()).optional(), // For multiple friends

  // Quest creation method
  audioTranscript: z.string().optional(), // Voice-to-text transcript
  textDescription: z.string().optional(), // OR text description

  // Optional customization
  category: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  goalType: z.enum(["COLLECT_NOS", "COLLECT_YES", "TAKE_ACTION"]).optional(),
  goalCount: z.number().min(1).max(50).optional(),

  // Location options
  locationType: z.enum(["CURRENT", "CUSTOM", "NONE"]).optional(),
  customLocation: z.string().optional(), // Location name when locationType is CUSTOM
  latitude: z.number().optional(), // Current location latitude
  longitude: z.number().optional(), // Current location longitude

  // Gifting (from sender's balance)
  giftXP: z.number().min(0).max(10000).default(0),
  giftPoints: z.number().min(0).max(10000).default(0),

  // Optional message
  message: z.string().max(500).optional(),
});
export type CreateCustomQuestRequest = z.infer<typeof createCustomQuestRequestSchema>;

export const createCustomQuestResponseSchema = z.object({
  success: z.boolean(),
  sharedQuestId: z.string().optional(), // For shared quests (deprecated - use sharedQuestIds)
  sharedQuestIds: z.array(z.string()).optional(), // For multiple friends
  userQuestId: z.string().optional(), // For personal quests
  message: z.string(),

  // Quest details (after AI safety filtering)
  quest: z
    .object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.string(),
      goalType: z.string(),
      goalCount: z.number(),
      xpReward: z.number(),
      pointReward: z.number(),
    })
    .optional(),

  // Safety check result
  isSafe: z.boolean(),
  safetyWarning: z.string().optional(),

  // Premium tier limit response (when free user exceeds 10 quests)
  requiresPremium: z.boolean().optional(),
  currentCustomQuests: z.number().optional(),
  limit: z.number().optional(),
});
export type CreateCustomQuestResponse = z.infer<typeof createCustomQuestResponseSchema>;

// ==========================================
// Policy Routes
// ==========================================

// GET /api/policies - Get all policies and user's acceptance status
export const getPoliciesResponseSchema = z.object({
  policies: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      accepted: z.boolean(),
      acceptedAt: z.string().nullable(),
      version: z.string(),
    })
  ),
});
export type GetPoliciesResponse = z.infer<typeof getPoliciesResponseSchema>;

// POST /api/policies/:policyType/accept - Accept a specific policy
export const acceptPolicyRequestSchema = z.object({});
export type AcceptPolicyRequest = z.infer<typeof acceptPolicyRequestSchema>;
export const acceptPolicyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  acceptance: z.object({
    policyType: z.string(),
    acceptedAt: z.string(),
    emailSent: z.boolean(),
  }),
});
export type AcceptPolicyResponse = z.infer<typeof acceptPolicyResponseSchema>;

// GET /api/policies/check-required - Check which policies user needs to accept
export const checkRequiredPoliciesResponseSchema = z.object({
  required: z.array(z.string()),
  allAccepted: z.boolean(),
  acceptedCount: z.number(),
  totalCount: z.number(),
});
export type CheckRequiredPoliciesResponse = z.infer<typeof checkRequiredPoliciesResponseSchema>;
