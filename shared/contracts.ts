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
  avatar: z.string().nullable(), // AI-generated or uploaded avatar URL
  interests: z.array(z.string()).optional(), // Interest tags
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
  avatar: z.string().optional(), // AI-generated or uploaded avatar URL
  interests: z.array(z.string()).optional(), // Interest tags
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

// GET /api/stats - Get user stats
export const getUserStatsResponseSchema = z.object({
  currentStreak: z.number(),
  longestStreak: z.number(),
  totalXP: z.number(),
  totalPoints: z.number(),
  trophies: z.number(),
  diamonds: z.number(),
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
      isCurrentUser: z.boolean(),
    })
  ),
  currentUserRank: z.number(),
  totalUsers: z.number(),
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

// POST /api/journal/transcribe - Transcribe audio to text
export const transcribeAudioRequestSchema = z.object({
  audioBase64: z.string(), // Base64 encoded audio
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
});
export type UpdateJournalEntryRequest = z.infer<typeof updateJournalEntryRequestSchema>;
export const updateJournalEntryResponseSchema = z.object({
  id: z.string(),
  userEditedSummary: z.string(),
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

