import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, Animated, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Menu as MenuIcon, Flame, Trophy, Clock, Sparkles, Star, X, Video, Share2 } from "lucide-react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { playSound } from "@/services/soundService";
import type {
  GetUserQuestsResponse,
  RecordQuestActionRequest,
  RecordQuestActionResponse,
  GetUserStatsResponse,
  GenerateQuestRequest,
  GenerateQuestResponse,
  GetLeaderboardResponse,
} from "@/shared/contracts";
import { generateStoryCaption, generatePostContent, getCategoryColor } from "@/utils/celebrationHelpers";

type Props = RootStackScreenProps<"QuestDetail">;

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { userQuestId: initialUserQuestId } = route.params;
  const { colors } = useTheme();
  const [currentUserQuestId, setCurrentUserQuestId] = useState(initialUserQuestId);
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [savedQuestData, setSavedQuestData] = useState<any>(null); // Save quest before it's removed
  const [celebrationAnim] = useState(new Animated.Value(0));
  const [loadingAnim] = useState(new Animated.Value(0));
  const [timeRemaining, setTimeRemaining] = useState(300); // Will be set based on difficulty
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [completionPage, setCompletionPage] = useState<"accomplishments" | "leaderboard" | "streak">("accomplishments");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [confettiAnims] = useState(() => Array.from({ length: 20 }, () => new Animated.Value(0)));
  const [pageTransitionAnim] = useState(new Animated.Value(0));

  const { data: questsData, isLoading } = useQuery<GetUserQuestsResponse>({
    queryKey: ["quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
    },
  });

  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      return api.get<GetUserStatsResponse>("/api/stats");
    },
  });

  const { data: leaderboardData } = useQuery<GetLeaderboardResponse>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      return api.get<GetLeaderboardResponse>("/api/stats/leaderboard");
    },
  });

  const userQuest = questsData?.activeQuests.find((q) => q.id === currentUserQuestId) ||
                    questsData?.queuedQuests.find((q) => q.id === currentUserQuestId);
  
  // Check if quest is queued (not active)
  const isQueuedQuest = questsData?.queuedQuests.some((q) => q.id === currentUserQuestId) || false;

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0] ? `${address[0].city}, ${address[0].region}` : undefined,
        });
      }
    } catch (error) {
      console.error("Error requesting location:", error);
    }
  };

  // Save quest data before it gets removed from active quests
  useEffect(() => {
    if (userQuest && !showLoading && !showCompletion) {
      setSavedQuestData(userQuest);
    }
  }, [userQuest, showLoading, showCompletion]);

  // Set timer based on difficulty when quest loads
  useEffect(() => {
    if (userQuest?.quest.difficulty) {
      const timerSettings = {
        EASY: 10 * 60, // 10 minutes
        MEDIUM: 15 * 60, // 15 minutes
        HARD: 20 * 60, // 20 minutes
        EXPERT: 30 * 60, // 30 minutes
      };
      setTimeRemaining(timerSettings[userQuest.quest.difficulty as keyof typeof timerSettings] || 15 * 60);
    }
  }, [userQuest?.quest.difficulty]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateNextMutation = useMutation({
    mutationFn: async (data: GenerateQuestRequest) => {
      return api.post<GenerateQuestResponse>("/api/quests/generate", data);
    },
    onSuccess: async (data) => {
      // Invalidate and wait for quests to refresh
      await queryClient.invalidateQueries({ queryKey: ["quests"] });

      // Auto-start the quest - no need for skipLimitCheck since the completed quest is no longer active
      try {
        await api.post(`/api/quests/${data.userQuestId}/start`, {});
        await queryClient.invalidateQueries({ queryKey: ["quests"] });

        // Update current quest ID to show the new quest
        setCurrentUserQuestId(data.userQuestId);
        setShowCompletion(false);
        setIsGeneratingNext(false);
        setTimeRemaining(300); // Reset timer
      } catch (error: any) {
        // This is an expected error when user has 2 active quests, not a breaking error
        console.log("Info: Could not auto-start next quest:", error);
        setIsGeneratingNext(false);

        // Check if it's the "Maximum 2 active quests" error
        const errorMessage = error?.message || error?.toString() || "";
        if (errorMessage.includes("Maximum 2 active quests")) {
          Alert.alert(
            "Quest Added to Queue",
            "Great job completing your quest! Your next quest has been added to your queue. Complete one of your active quests to start it.",
            [{ text: "Got it", style: "default" }]
          );
          // Navigate back to home to see the queued quest
          setShowCompletion(false);
          navigation.navigate("Tabs", { screen: "HomeTab" });
        } else {
          Alert.alert(
            "Quest Created",
            "Your next quest was created and added to your queue. You can start it from the home screen.",
            [{ text: "OK", style: "default" }]
          );
          setShowCompletion(false);
          navigation.navigate("Tabs", { screen: "HomeTab" });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to generate next quest:", error);
      setIsGeneratingNext(false);
    },
  });

  const recordMutation = useMutation({
    mutationFn: async (data: RecordQuestActionRequest) => {
      return api.post<RecordQuestActionResponse>(
        `/api/quests/${currentUserQuestId}/record`,
        data
      );
    },
    onSuccess: async (data) => {
      // Refetch quests and stats immediately to update counts
      await queryClient.refetchQueries({ queryKey: ["quests"] });
      await queryClient.refetchQueries({ queryKey: ["stats"] });

      if (data.completed && savedQuestData) {
        // Trigger success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Refresh leaderboard data
        await queryClient.refetchQueries({ queryKey: ["leaderboard"] });
        await queryClient.refetchQueries({ queryKey: ["stats"] });

        // Get updated stats and leaderboard
        const updatedStats = await queryClient.fetchQuery<GetUserStatsResponse>({
          queryKey: ["stats"],
          queryFn: async () => api.get<GetUserStatsResponse>("/api/stats"),
        });

        const updatedLeaderboard = await queryClient.fetchQuery<GetLeaderboardResponse>({
          queryKey: ["leaderboard"],
          queryFn: async () => api.get<GetLeaderboardResponse>("/api/stats/leaderboard"),
        });

        const quest = savedQuestData.quest;
        const previousStreak = (statsData?.currentStreak || 0);
        const currentStreak = (updatedStats?.currentStreak || 0);
        const previousRank = leaderboardData?.currentUserRank || 999;
        const currentRank = updatedLeaderboard?.currentUserRank || 999;

        // Prepare celebration data
        const celebrationData = {
          questTitle: quest.title,
          questCategory: quest.category,
          xpEarned: quest.xpReward,
          pointsEarned: quest.pointReward,
          noCount: data.noCount,
          yesCount: data.yesCount,
          actionCount: data.actionCount,
        };

        // Navigate to QuestCompleteScreen
        navigation.navigate("QuestComplete", {
          questData: celebrationData,
          onContinue: () => {
            // Navigate to QuestStreakScreen if streak changed
            if (currentStreak !== previousStreak) {
              navigation.navigate("QuestStreak", {
                streakData: {
                  currentStreak,
                  previousStreak,
                  streakIncreased: currentStreak > previousStreak,
                },
                onContinue: () => {
                  // Navigate to QuestWeeklyAchievementsScreen
                  // For now, create a simple weekly achievements structure
                  const weeklyAchievements = [
                    {
                      id: "weekly-nos",
                      title: "Weekly NOs",
                      description: "Collect NOs this week",
                      progress: updatedStats?.easyZoneCount || 0,
                      target: 10,
                      icon: "target" as const,
                      completed: (updatedStats?.easyZoneCount || 0) >= 10,
                    },
                    {
                      id: "weekly-quests",
                      title: "Weekly Quests",
                      description: "Complete quests this week",
                      progress: 1, // This would need to come from weekly stats
                      target: 5,
                      icon: "trophy" as const,
                      completed: false,
                    },
                  ];

                  navigation.navigate("QuestWeeklyAchievements", {
                    weeklyData: {
                      achievements: weeklyAchievements,
                      weeklyNoCount: updatedStats?.easyZoneCount || 0,
                      weeklyQuestCount: 1,
                    },
                    onContinue: () => {
                      // Navigate to QuestLeaderboardPositionScreen if rank changed
                      if (currentRank !== previousRank) {
                        navigation.navigate("QuestLeaderboardPosition", {
                          leaderboardData: {
                            currentRank,
                            previousRank,
                            rankChanged: true,
                            rankDirection: currentRank < previousRank ? "up" : currentRank > previousRank ? "down" : "same",
                            totalXP: updatedStats?.totalXP || 0,
                            totalPoints: updatedStats?.totalPoints || 0,
                          },
                          onContinue: () => {
                            navigateToFinalScreen(celebrationData, currentStreak, currentRank, currentRank - previousRank);
                          },
                        });
                      } else {
                        navigateToFinalScreen(celebrationData, currentStreak, currentRank);
                      }
                    },
                  });
                },
              });
            } else {
              // Skip streak screen, go to weekly achievements
              const weeklyAchievements = [
                {
                  id: "weekly-nos",
                  title: "Weekly NOs",
                  description: "Collect NOs this week",
                  progress: updatedStats?.easyZoneCount || 0,
                  target: 10,
                  icon: "target" as const,
                  completed: (updatedStats?.easyZoneCount || 0) >= 10,
                },
              ];

              navigation.navigate("QuestWeeklyAchievements", {
                weeklyData: {
                  achievements: weeklyAchievements,
                  weeklyNoCount: updatedStats?.easyZoneCount || 0,
                  weeklyQuestCount: 1,
                },
                onContinue: () => {
                  if (currentRank !== previousRank) {
                    navigation.navigate("QuestLeaderboardPosition", {
                      leaderboardData: {
                        currentRank,
                        previousRank,
                        rankChanged: true,
                        rankDirection: currentRank < previousRank ? "up" : currentRank > previousRank ? "down" : "same",
                        totalXP: updatedStats?.totalXP || 0,
                        totalPoints: updatedStats?.totalPoints || 0,
                      },
                      onContinue: () => {
                        navigateToFinalScreen(celebrationData, currentStreak, currentRank, currentRank - previousRank);
                      },
                    });
                  } else {
                    navigateToFinalScreen(celebrationData, currentStreak, currentRank);
                  }
                },
              });
            }
          },
        });
      }
    },
  });

  // Helper function to navigate to final celebration screen
  const navigateToFinalScreen = (
    celebrationData: {
      questTitle: string;
      questCategory: string;
      xpEarned: number;
      pointsEarned: number;
      noCount: number;
      yesCount: number;
      actionCount: number;
    },
    streak: number,
    rank: number,
    rankChange?: number
  ) => {
    if (!savedQuestData) return;

    const summary = {
      questTitle: celebrationData.questTitle,
      xpEarned: celebrationData.xpEarned,
      pointsEarned: celebrationData.pointsEarned,
      streak,
      rank,
      rankChange,
    };

    navigation.navigate("QuestCelebrationFinal", {
      celebrationSummary: summary,
      onShareToStory: () => {
        const caption = generateStoryCaption({
          questTitle: summary.questTitle,
          questCategory: celebrationData.questCategory,
          xpEarned: summary.xpEarned,
          pointsEarned: summary.pointsEarned,
          noCount: celebrationData.noCount,
          streak: summary.streak,
          rank: summary.rank,
          rankChange: summary.rankChange,
        });
        // Navigate to CreateStory with pre-filled caption
        navigation.navigate("CreateStory", { initialCaption: caption });
      },
      onShareAsPost: () => {
        const content = generatePostContent({
          questTitle: summary.questTitle,
          questCategory: celebrationData.questCategory,
          xpEarned: summary.xpEarned,
          pointsEarned: summary.pointsEarned,
          noCount: celebrationData.noCount,
          streak: summary.streak,
          rank: summary.rank,
          rankChange: summary.rankChange,
        });
        // Navigate to SwipeTab (Community) with pre-filled post content
        navigation.navigate("Tabs", { 
          screen: "SwipeTab",
          params: { initialPostContent: content }
        });
      },
    });
  };

  const handleGenerateNext = () => {
    if (!savedQuestData) return;

    setIsGeneratingNext(true);

    // Get next difficulty level
    const difficulties = ["EASY", "MEDIUM", "HARD", "EXPERT"];
    const currentDifficultyIndex = difficulties.indexOf(savedQuestData.quest.difficulty);
    const nextDifficulty = difficulties[Math.min(currentDifficultyIndex + 1, difficulties.length - 1)];

    generateNextMutation.mutate({
      category: savedQuestData.quest.category,
      difficulty: nextDifficulty,
      userLocation: userLocation?.address,
      userLatitude: userLocation?.latitude,
      userLongitude: userLocation?.longitude,
    });
  };

  // Share quest completion to community
  const shareToCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!savedQuestData || !completionData) {
        throw new Error("No quest data available");
      }

      const questTitle = savedQuestData.quest.title;
      const category = savedQuestData.quest.category;
      const difficulty = savedQuestData.quest.difficulty;
      const xpReward = savedQuestData.quest.xpReward;
      const pointsReward = savedQuestData.quest.pointsReward;
      const noCount = completionData.noCount || 0;
      const yesCount = completionData.yesCount || 0;
      const actionsCompleted = completionData.actionsCompleted || 0;

      let postContent = `🎯 Quest Complete!\n\n"${questTitle}"\n\n`;

      if (noCount > 0) {
        postContent += `✅ Collected ${noCount} NO${noCount > 1 ? 's' : ''}\n`;
      }
      if (yesCount > 0) {
        postContent += `✅ Collected ${yesCount} YES${yesCount > 1 ? 'es' : ''}\n`;
      }
      if (actionsCompleted > 0) {
        postContent += `✅ Completed ${actionsCompleted} action${actionsCompleted > 1 ? 's' : ''}\n`;
      }

      postContent += `\n📊 Category: ${category}\n`;
      postContent += `⚡ Difficulty: ${difficulty}\n`;
      postContent += `🏆 Earned: ${xpReward} XP + ${pointsReward} Points\n\n`;
      postContent += `#QuestComplete #${category}`;

      return api.post("/api/posts", {
        content: postContent,
        privacy: "PUBLIC",
        userQuestId: savedQuestData.id, // Link post to quest for badge tracking
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
      Alert.alert("Success", "Your quest achievement has been shared to the community!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to share to community. Please try again.");
    },
  });

  const handleShareToCommunity = () => {
    shareToCommunityMutation.mutate();
  };

  // Regenerate quest with new category/difficulty
  const regenerateQuestMutation = useMutation({
    mutationFn: async (params: { category: string; difficulty: string }) => {
      console.log("Mutation function called with params:", params);
      const response = await api.post<GenerateQuestResponse>("/api/quests/generate", {
        category: params.category,
        difficulty: params.difficulty,
        userLocation: userLocation?.address,
        userLatitude: userLocation?.latitude,
        userLongitude: userLocation?.longitude,
      });
      console.log("Quest generated:", response);
      return response;
    },
    onSuccess: async (data) => {
      console.log("onSuccess called with data:", data);

      try {
        // Delete the current quest
        if (userQuest) {
          console.log("Deleting current quest:", userQuest.id);
          await api.delete(`/api/quests/${userQuest.id}`);
          console.log("Quest deleted successfully");
        }

        // Start the new quest using the userQuestId with skipLimitCheck
        console.log("Starting new quest with userQuestId:", data.userQuestId);
        await api.post(`/api/quests/${data.userQuestId}/start?skipLimitCheck=true`);
        console.log("New quest started");

        // Refresh quests data
        await queryClient.invalidateQueries({ queryKey: ["quests"] });
        console.log("Queries invalidated");

        // Navigate to the new quest using the userQuestId
        const updatedQuests = await api.get<GetUserQuestsResponse>("/api/quests");
        const newUserQuest = updatedQuests.activeQuests.find((q) => q.id === data.userQuestId);
        console.log("New user quest found:", newUserQuest);

        if (newUserQuest) {
          setCurrentUserQuestId(newUserQuest.id);
          console.log("Updated current user quest ID to:", newUserQuest.id);
        }

        // Reset selections
        setSelectedCategory(null);
        setSelectedDifficulty(null);
        setIsRegenerating(false);
        console.log("Regeneration complete!");
      } catch (error: any) {
        console.error("Error during quest regeneration:", error);
        setIsRegenerating(false);

        // Parse error message if available
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        if (errorMessage.includes("Maximum 2 active quests")) {
          Alert.alert(
            "Quest Limit Reached",
            "You already have 2 active quests. Please complete one before regenerating this quest."
          );
        } else {
          Alert.alert("Error", "Failed to regenerate quest. Please try again.");
        }
      }
    },
    onError: (error) => {
      console.error("Failed to regenerate quest:", error);
      setIsRegenerating(false);
      Alert.alert("Error", "Failed to regenerate quest. Please try again.");
    },
  });

  const handleRegenerate = () => {
    console.log("handleRegenerate called");
    console.log("selectedCategory:", selectedCategory);
    console.log("selectedDifficulty:", selectedDifficulty);

    if (!selectedCategory || !selectedDifficulty) {
      Alert.alert("Selection Required", "Please select both category and difficulty");
      return;
    }

    console.log("Starting regeneration...");
    setIsRegenerating(true);
    regenerateQuestMutation.mutate({
      category: selectedCategory,
      difficulty: selectedDifficulty,
    });
  };

  const handleNextPage = () => {
    if (completionPage === "accomplishments") {
      // Fade out current page and fade in next
      Animated.timing(pageTransitionAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // After showing accomplishments page, just go back to home
        setShowCompletion(false);
        navigation.goBack();
      });
    }
  };

  const handleQuitQuest = () => {
    Alert.alert(
      "End Quest",
      "Are you sure you want to end this quest? Your progress will be saved but the quest will remain incomplete.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Quest",
          style: "destructive",
          onPress: () => {
            console.log("Ending quest and navigating back");
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SALES: "#FF6B35",
      SOCIAL: "#00D9FF",
      ENTREPRENEURSHIP: "#7E3FE4",
      DATING: "#FF4081",
      CONFIDENCE: "#FFD700",
      CAREER: "#4CAF50",
    };
    return colors[category] || "#7E3FE4";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: "#4CAF50",
      MEDIUM: "#FFD700",
      HARD: "#FF6B35",
      EXPERT: "#FF4081",
    };
    return colors[difficulty] || "#FFD700";
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!userQuest && !showLoading && !showCompletion) {
    // If still loading the quests query, show loading indicator instead of "Quest not found"
    if (isLoading) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16 }}>
                Loading quest...
              </Text>
            </View>
          </SafeAreaView>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
              Quest not found
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Use saved quest data if quest was completed and removed from active quests
  const displayQuest = userQuest || savedQuestData;

  if (!displayQuest && !isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
              Quest not found
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const quest = displayQuest.quest;
  const progress =
    quest.goalType === "COLLECT_NOS"
      ? (displayQuest.noCount / quest.goalCount) * 100
      : quest.goalType === "COLLECT_YES"
      ? (displayQuest.yesCount / quest.goalCount) * 100
      : (displayQuest.actionCount / quest.goalCount) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Modern 3D Header with Stats */}
        <LinearGradient
          colors={[colors.background[1], colors.background[0]]}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            {/* Back Button */}
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ArrowLeft size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>Back</Text>
            </Pressable>

            {/* Timer and Quit */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* Timer */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: timeRemaining < 60 ? "rgba(255, 59, 48, 0.1)" : colors.primaryLight,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: timeRemaining < 60 ? "rgba(255, 59, 48, 0.3)" : colors.border,
                }}
              >
                <Clock size={16} color={timeRemaining < 60 ? "#FF3B30" : colors.primary} />
                <Text
                  style={{
                    color: timeRemaining < 60 ? "#FF3B30" : colors.primary,
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {formatTime(timeRemaining)}
                </Text>
              </View>

              {/* Quit Button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleQuitQuest();
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "rgba(255, 59, 48, 0.2)" : "rgba(255, 59, 48, 0.1)",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 59, 48, 0.3)",
                })}
              >
                <X size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </View>

          {/* Stats Bar with 3D Cards - Now Clickable */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Streak - Clickable */}
            <Pressable
              onPress={() => navigation.navigate("GrowthAchievements")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 107, 53, 0.3)",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(255, 107, 53, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={20} color="#FF6B35" />
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  {statsData?.currentStreak || 0}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Streak</Text>
              </View>
            </Pressable>

            {/* Trophy - Shows trophies count */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 215, 0, 0.3)",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(255, 215, 0, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trophy size={20} color="#FFD700" />
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  {statsData?.trophies || 0}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Trophy</Text>
              </View>
            </View>


            {/* Go Live Button */}
            <Pressable
              onPress={() => navigation.navigate("Tabs", { screen: "LiveTab" })}
              style={{
                backgroundColor: colors.primaryLight,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: `${colors.primary}80`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={24} color={colors.primary} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
          <View
            style={{
              height: 8,
              backgroundColor: colors.surface,
              borderRadius: 999,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <LinearGradient
              colors={[getCategoryColor(quest.category), getCategoryColor(quest.category) + "80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: "100%",
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Quest Card with 3D Glassmorphism Design */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {/* Category & Difficulty Badges with Tap to Change */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setShowCategoryModal(true)}
                  style={{
                    backgroundColor: getCategoryColor(selectedCategory || quest.category) + "20",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: getCategoryColor(selectedCategory || quest.category) + "40",
                  }}
                >
                  <Text
                    style={{
                      color: getCategoryColor(selectedCategory || quest.category),
                      fontSize: 14,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedCategory || quest.category} ⌄
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDifficultyModal(true)}
                  style={{
                    backgroundColor: getDifficultyColor(selectedDifficulty || quest.difficulty) + "30",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: getDifficultyColor(selectedDifficulty || quest.difficulty) + "40",
                  }}
                >
                  <Text
                    style={{
                      color: getDifficultyColor(selectedDifficulty || quest.difficulty),
                      fontSize: 14,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedDifficulty || quest.difficulty} ⌄
                  </Text>
                </Pressable>
              </View>

              {/* Title */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 28,
                  fontWeight: "bold",
                  marginBottom: 12,
                  lineHeight: 34,
                }}
              >
                {quest.title}
              </Text>

              {/* Description */}
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                  lineHeight: 24,
                  marginBottom: 20,
                }}
                numberOfLines={showMore ? undefined : 2}
              >
                {quest.description}
              </Text>

              {/* Goal Badge */}
              <View
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 16,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "rgba(16, 185, 129, 0.4)",
                }}
              >
                <Text style={{ color: "#10B981", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                  Goal: Collect {quest.goalCount} NO&apos;s
                </Text>
              </View>

              {/* Rewards */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 215, 0, 0.1)",
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 215, 0, 0.3)",
                  }}
                >
                  <Text style={{ color: "#FFD700", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    +{quest.xpReward} XP
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 107, 53, 0.1)",
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 107, 53, 0.3)",
                  }}
                >
                  <Text style={{ color: "#FF6B35", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    +{quest.pointReward} pts
                  </Text>
                </View>
              </View>

              {/* Progress Indicators */}
              {quest.goalType === "TAKE_ACTION" ? (
                /* Single Action Counter for TAKE_ACTION quests */
                <View style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      backgroundColor: "rgba(255, 215, 0, 0.1)",
                      paddingVertical: 12,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255, 215, 0, 0.3)",
                    }}
                  >
                    <Star size={20} color="#FFD700" fill="#FFD700" />
                    <Text style={{ color: "#FFD700", fontSize: 16, fontWeight: "700" }}>
                      Actions: {displayQuest.actionCount}/{quest.goalCount}
                    </Text>
                  </View>
                </View>
              ) : (
                /* YES/NO Counters for COLLECT_NOS and COLLECT_YES quests */
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <Text style={{ color: "#10B981", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                      NOs: {displayQuest.noCount}/{quest.goalCount}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                      YES: {displayQuest.yesCount}
                    </Text>
                  </View>
                </View>
              )}

              {/* Progress Bar */}
              <View
                style={{
                  height: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: "100%",
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </View>

              {/* See More */}
              <Pressable onPress={() => setShowMore(!showMore)}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>
                  {showMore ? "See less" : "See more"}
                </Text>
              </Pressable>

              {/* View on Map Button */}
              {displayQuest.quest.latitude && displayQuest.quest.longitude ? (
                <Pressable
                  onPress={() => {
                    // Use place name if available, otherwise fall back to coordinates
                    const query = displayQuest.quest.location
                      ? encodeURIComponent(displayQuest.quest.location)
                      : `${displayQuest.quest.latitude},${displayQuest.quest.longitude}`;
                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    Linking.openURL(url).catch((err) => console.error("Error opening map:", err));
                  }}
                  style={{
                    marginTop: 16,
                    backgroundColor: "rgba(0, 217, 255, 0.2)",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    maxWidth: "100%",
                    borderWidth: 1,
                    borderColor: "rgba(0, 217, 255, 0.4)",
                  }}
                >
                  <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "600" }}>
                    📍 View on Map
                  </Text>
                  {displayQuest.quest.location && (
                    <Text
                      style={{
                        color: "rgba(0, 217, 255, 0.7)",
                        fontSize: 14,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ({displayQuest.quest.location.split(' - ')[0]})
                    </Text>
                  )}
                </Pressable>
              ) : !locationPermission ? (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Location Access Required",
                      "To get location-based quests within 10 miles of you, please enable location access.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Enable Location",
                          onPress: requestLocationPermission,
                        },
                      ]
                    );
                  }}
                  style={{
                    marginTop: 16,
                    backgroundColor: "rgba(255, 215, 0, 0.2)",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: "rgba(255, 215, 0, 0.4)",
                  }}
                >
                  <Text style={{ color: "#FFD700", fontSize: 16, fontWeight: "600" }}>
                    📍 Share Location
                  </Text>
                </Pressable>
              ) : null}

              {/* Regenerate Quest Button */}
              {selectedCategory && selectedDifficulty && (
                <Pressable
                  onPress={handleRegenerate}
                  disabled={isRegenerating}
                  style={{
                    marginTop: 16,
                    backgroundColor: isRegenerating ? colors.textTertiary : colors.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isRegenerating ? (
                    <>
                      <ActivityIndicator color={colors.text} size="small" />
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
                        Regenerating...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} color={colors.text} />
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
                        Regenerate Quest ({selectedCategory} • {selectedDifficulty})
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Bottom Text */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", lineHeight: 18 }}>
              1 slot for your quests • 1 slot for friend quests{"\n"}
              Complete quests to unlock new ones from the queue
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons with 3D Design */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: colors.backgroundSolid,
            borderTopWidth: 1,
            borderTopColor: colors.cardBorder,
          }}
        >
          {quest.goalType === "TAKE_ACTION" ? (
            /* Action Star Button for TAKE_ACTION quests */
            <Pressable
              onPress={() => {
                if (isQueuedQuest) {
                  Alert.alert(
                    "Activate quest first",
                    "Move this quest to your Active list before logging an action.",
                    [{ text: "OK" }]
                  );
                  return;
                }
                recordMutation.mutate({ action: "ACTION" });
              }}
              disabled={recordMutation.isPending || isQueuedQuest}
              style={{
                paddingVertical: 20,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                opacity: recordMutation.isPending ? 0.5 : 1,
                flexDirection: "row",
                gap: 12,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 24,
                }}
              />
              {recordMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Star size={28} color={colors.text} fill={colors.text} />
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                    I Did It!
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            /* YES/NO Buttons for COLLECT_NOS and COLLECT_YES quests */
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* YES Button */}
              <Pressable
                onPress={() => {
                  if (isQueuedQuest) {
                    Alert.alert(
                      "Activate quest first",
                      "Move this quest to your Active list before logging a YES or NO.",
                      [{ text: "OK" }]
                    );
                    return;
                  }
                  recordMutation.mutate({ action: "YES" });
                }}
                disabled={recordMutation.isPending || isQueuedQuest}
                style={{
                  flex: 1,
                  paddingVertical: 20,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: recordMutation.isPending ? 0.5 : 1,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 24,
                  }}
                />
                {recordMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>YES</Text>
                )}
              </Pressable>

              {/* NO Button */}
              <Pressable
                onPress={() => {
                  if (isQueuedQuest) {
                    Alert.alert(
                      "Activate quest first",
                      "Move this quest to your Active list before logging a YES or NO.",
                      [{ text: "OK" }]
                    );
                    return;
                  }
                  recordMutation.mutate({ action: "NO" });
                }}
                disabled={recordMutation.isPending || isQueuedQuest}
                style={{
                  flex: 1,
                  paddingVertical: 20,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: recordMutation.isPending ? 0.5 : 1,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 24,
                  }}
                />
                {recordMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>NO</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Completion Modal - Sequential Pages with 3D Glassmorphism Design */}
      <Modal visible={showCompletion} transparent animationType="fade" onRequestClose={() => {}}>
        <LinearGradient
          colors={colors.background as any}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={handleNextPage}
            style={{
              flex: 1,
            }}
          >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Floating Confetti Particles */}
            {confettiAnims.map((anim, index) => {
              const confettiColors = ["#FFD700", "#FF6B35", "#00D9FF", "#7E3FE4", "#4CAF50"];
              const size = 8 + Math.random() * 8;
              const leftPosition = Math.random() * 100;

              return (
                <Animated.View
                  key={index}
                  style={{
                    position: "absolute",
                    left: `${leftPosition}%`,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: confettiColors[index % confettiColors.length],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 800],
                        }),
                      },
                      {
                        translateX: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (Math.random() - 0.5) * 100],
                        }),
                      },
                      {
                        rotate: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", `${360 * (Math.random() > 0.5 ? 1 : -1)}deg`],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}

            {/* Page 1: Accomplishments */}
            {completionPage === "accomplishments" && (
              <Animated.View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 32,
                  opacity: pageTransitionAnim,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                    {
                      translateY: pageTransitionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }}
              >
                {/* Trophy Icon with bounce */}
                <Animated.View
                  style={{
                    marginBottom: 40,
                    transform: [
                      {
                        scale: celebrationAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.2, 1],
                        }),
                      },
                      {
                        rotate: celebrationAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ["-20deg", "20deg", "0deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <LinearGradient
                    colors={["#FFD700", "#FFA500"]}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#FFD700",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 20,
                      elevation: 10,
                    }}
                  >
                    <Trophy size={70} color={colors.text} />
                  </LinearGradient>
                </Animated.View>

                {/* Title with slide up animation */}
                <Animated.Text
                  style={{
                    fontSize: 40,
                    fontWeight: "bold",
                    color: colors.text,
                    marginBottom: 16,
                    textAlign: "center",
                    opacity: celebrationAnim,
                    transform: [
                      {
                        translateY: celebrationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  }}
                >
                  Quest Complete!
                </Animated.Text>

                <Animated.Text
                  style={{
                    fontSize: 18,
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 48,
                    opacity: celebrationAnim,
                  }}
                >
                  You collected {completionData?.noCount} NOs!
                </Animated.Text>

                {/* Accomplishments Card with slide up - 3D Glassmorphism */}
                <Animated.View
                  style={{
                    width: "100%",
                    backgroundColor: colors.card,
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 2,
                    borderColor: colors.cardBorder,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                    opacity: celebrationAnim,
                    transform: [
                      {
                        translateY: celebrationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: colors.text,
                      marginBottom: 24,
                      textAlign: "center",
                    }}
                  >
                    Accomplishments
                  </Text>

                  {/* XP & Points Earned - Gradient Cards */}
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                    <LinearGradient
                      colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.15)"]}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 215, 0, 0.3)",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 28,
                          fontWeight: "bold",
                          textShadowColor: colors.warning + "80",
                          textShadowOffset: { width: 0, height: 3 },
                          textShadowRadius: 8,
                        }}
                      >
                        +{savedQuestData?.quest.xpReward || 0}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                          textShadowColor: colors.shadow,
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        XP
                      </Text>
                    </LinearGradient>
                    <LinearGradient
                      colors={["rgba(255, 107, 53, 0.15)", "rgba(255, 140, 66, 0.15)"]}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 107, 53, 0.3)",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 28,
                          fontWeight: "bold",
                          textShadowColor: colors.secondary + "80",
                          textShadowOffset: { width: 0, height: 3 },
                          textShadowRadius: 8,
                        }}
                      >
                        +{savedQuestData?.quest.pointReward || 0}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                          textShadowColor: colors.shadow,
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        Points
                      </Text>
                    </LinearGradient>
                  </View>

                  {/* Total Stats - Glassmorphism Cards */}
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(126, 63, 228, 0.1)",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 28,
                          fontWeight: "bold",
                          textShadowColor: colors.primary + "80",
                          textShadowOffset: { width: 0, height: 3 },
                          textShadowRadius: 8,
                        }}
                      >
                        {statsData?.totalXP || 0}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                          textShadowColor: colors.shadow,
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        Total XP
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(0, 217, 255, 0.1)",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(0, 217, 255, 0.3)",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 28,
                          fontWeight: "bold",
                          textShadowColor: colors.info + "80",
                          textShadowOffset: { width: 0, height: 3 },
                          textShadowRadius: 8,
                        }}
                      >
                        {statsData?.totalPoints || 0}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                          textShadowColor: colors.shadow,
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        Total Points
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Share to Community Button */}
                <Animated.View
                  style={{
                    marginTop: 32,
                    width: "100%",
                    opacity: celebrationAnim,
                  }}
                >
                  <Pressable
                    onPress={handleShareToCommunity}
                    disabled={shareToCommunityMutation.isPending}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 16,
                      paddingHorizontal: 32,
                      borderRadius: 24,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                      opacity: shareToCommunityMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {shareToCommunityMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Share2 size={22} color={colors.text} />
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 18,
                            fontWeight: "700",
                          }}
                        >
                          Share to Community
                        </Text>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Tap to continue */}
                <Animated.Text
                  style={{
                    marginTop: 24,
                    fontSize: 18,
                    color: colors.text,
                    fontWeight: "600",
                    textAlign: "center",
                    opacity: celebrationAnim,
                    textShadowColor: colors.shadow,
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  Tap to continue
                </Animated.Text>
              </Animated.View>
            )}

          </SafeAreaView>
        </Pressable>
        </LinearGradient>
      </Modal>

      {/* Loading Screen Modal */}
      <Modal
        visible={showLoading}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.modalOverlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              opacity: loadingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }}
          >
            {/* Animated Trophy */}
            <Animated.View
              style={{
                marginBottom: 32,
                transform: [
                  {
                    scale: loadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA500", "#FF8C00"]}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trophy size={60} color={colors.text} />
              </LinearGradient>
            </Animated.View>

            {/* Loading Text */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Quest Complete!
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Calculating rewards...
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.modalOverlay,
            justifyContent: "flex-end",
          }}
          onPress={() => setShowCategoryModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: colors.text }}>
              Select Category
            </Text>
            <ScrollView>
              {["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"].map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                  style={{
                    backgroundColor: selectedCategory === category ? getCategoryColor(category) + "20" : colors.surface,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: selectedCategory === category ? getCategoryColor(category) : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: selectedCategory === category ? "700" : "600",
                      color: selectedCategory === category ? getCategoryColor(category) : colors.text,
                      textAlign: "center",
                    }}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Difficulty Selection Modal */}
      <Modal
        visible={showDifficultyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.modalOverlay,
            justifyContent: "flex-end",
          }}
          onPress={() => setShowDifficultyModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: colors.text }}>
              Select Difficulty
            </Text>
            {["EASY", "MEDIUM", "HARD", "EXPERT"].map((difficulty) => (
              <Pressable
                key={difficulty}
                onPress={() => {
                  setSelectedDifficulty(difficulty);
                  setShowDifficultyModal(false);
                }}
                style={{
                  backgroundColor: selectedDifficulty === difficulty ? getDifficultyColor(difficulty) + "30" : colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: selectedDifficulty === difficulty ? "700" : "600",
                    color: selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : colors.text,
                    textAlign: "center",
                  }}
                >
                  {difficulty}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
