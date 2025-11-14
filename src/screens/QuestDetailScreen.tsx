import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Menu as MenuIcon, Flame, Trophy, Diamond, Clock, Sparkles } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetUserQuestsResponse,
  RecordQuestActionRequest,
  RecordQuestActionResponse,
  GetUserStatsResponse,
  GenerateQuestRequest,
  GenerateQuestResponse,
  GetLeaderboardResponse,
} from "@/shared/contracts";

type Props = RootStackScreenProps<"QuestDetail">;

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { userQuestId: initialUserQuestId } = route.params;
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

  const userQuest = questsData?.activeQuests.find((q) => q.id === currentUserQuestId);

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
      queryClient.invalidateQueries({ queryKey: ["quests"] });

      // Auto-start the quest
      try {
        await api.post(`/api/quests/${data.userQuestId}/start`, {});
        queryClient.invalidateQueries({ queryKey: ["quests"] });

        // Update current quest ID to show the new quest
        setCurrentUserQuestId(data.userQuestId);
        setShowCompletion(false);
        setIsGeneratingNext(false);
        setTimeRemaining(300); // Reset timer
      } catch (error) {
        console.error("Failed to start next quest:", error);
        setIsGeneratingNext(false);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      if (data.completed) {
        // Refresh leaderboard data
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

        // Show loading screen first
        setShowLoading(true);

        // Start loading animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(loadingAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(loadingAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // After 2 seconds, show completion modal
        setTimeout(() => {
          setShowLoading(false);
          setCompletionData(data);
          setShowCompletion(true);

          // Trigger celebration animation
          Animated.sequence([
            Animated.spring(celebrationAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
          ]).start();

          // Reset page to accomplishments
          setCompletionPage("accomplishments");
        }, 2000);
      }
    },
  });

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
    });
  };

  const handleNextPage = () => {
    if (completionPage === "accomplishments") {
      setCompletionPage("leaderboard");
    } else if (completionPage === "leaderboard") {
      setCompletionPage("streak");
    } else if (completionPage === "streak") {
      // Navigate to next quest
      handleGenerateNext();
    }
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
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </View>
    );
  }

  if (!userQuest && !showLoading && !showCompletion) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ color: "#1C1C1E", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
              Quest not found
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: "#FF6B35", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Go Back</Text>
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
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ color: "#1C1C1E", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
              Quest not found
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: "#FF6B35", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Go Back</Text>
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
      : (displayQuest.yesCount / quest.goalCount) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Stats Bar */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Flame size={20} color="#FF6B35" />
              <Text style={{ color: "#1C1C1E", fontSize: 16, fontWeight: "600" }}>
                {statsData?.currentStreak || 0}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Trophy size={20} color="#FFD700" />
              <Text style={{ color: "#1C1C1E", fontSize: 16, fontWeight: "600" }}>
                {statsData?.trophies || 0}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Diamond size={20} color="#00D9FF" />
              <Text style={{ color: "#1C1C1E", fontSize: 16, fontWeight: "600" }}>
                {statsData?.diamonds || 0}
              </Text>
            </View>
          </View>

          {/* Timer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: timeRemaining < 60 ? "#FEE2E2" : "#FFF7ED",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Clock size={18} color={timeRemaining < 60 ? "#FF3B30" : "#FF6B35"} />
            <Text
              style={{
                color: timeRemaining < 60 ? "#FF3B30" : "#FF6B35",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <View
            style={{
              height: 8,
              backgroundColor: "#E5E7EB",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: getCategoryColor(quest.category),
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Back Button */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: "#1C1C1E",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                alignSelf: "flex-start",
              }}
            >
              <ArrowLeft size={18} color="white" />
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Main</Text>
            </Pressable>
          </View>

          {/* Quest Card */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 24,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Category & Difficulty Badges */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <View
                  style={{
                    backgroundColor: getCategoryColor(quest.category) + "20",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      color: getCategoryColor(quest.category),
                      fontSize: 14,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {quest.category}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: getDifficultyColor(quest.difficulty) + "30",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      color: getDifficultyColor(quest.difficulty),
                      fontSize: 14,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {quest.difficulty}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text
                style={{
                  color: "#1C1C1E",
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
                  color: "#666",
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
                  backgroundColor: "#10B981",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 16,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "#10B981",
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                  Goal: Collect {quest.goalCount} NO&apos;s
                </Text>
              </View>

              {/* Rewards */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FEF3C7",
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#92400E", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    +{quest.xpReward} XP
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FED7AA",
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#9A3412", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    +{quest.pointReward} pts
                  </Text>
                </View>
              </View>

              {/* Progress Indicators */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#D1FAE5",
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#065F46", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                    NOs: {displayQuest.noCount}/{quest.goalCount}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FEE2E2",
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#991B1B", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                    YES: {displayQuest.yesCount}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View
                style={{
                  height: 8,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    backgroundColor: "#10B981",
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </View>

              {/* See More */}
              <Pressable onPress={() => setShowMore(!showMore)}>
                <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "600" }}>
                  {showMore ? "See less" : "See more"}
                </Text>
              </Pressable>

              {/* View on Map Button */}
              {displayQuest.quest.latitude && displayQuest.quest.longitude && (
                <Pressable
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${displayQuest.quest.latitude},${displayQuest.quest.longitude}`;
                    // Open in browser
                    if (typeof window !== "undefined") {
                      window.open(url, "_blank");
                    }
                  }}
                  style={{
                    marginTop: 16,
                    backgroundColor: "#00D9FF",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    📍 View on Map
                  </Text>
                  {displayQuest.quest.location && (
                    <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 14 }}>
                      ({displayQuest.quest.location})
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Bottom Text */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ color: "#666", fontSize: 13, textAlign: "center", lineHeight: 18 }}>
              Complete your quests in order • Friend quests can be done anytime{"\n"}
              Max 2 active quests • Extra quests go to queue
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: "#F5F5F7",
          }}
        >
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* YES Button */}
            <Pressable
              onPress={() => recordMutation.mutate({ action: "YES" })}
              disabled={recordMutation.isPending}
              style={{
                flex: 1,
                backgroundColor: "#EF4444",
                paddingVertical: 20,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                opacity: recordMutation.isPending ? 0.5 : 1,
              }}
            >
              {recordMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>YES</Text>
              )}
            </Pressable>

            {/* NO Button */}
            <Pressable
              onPress={() => recordMutation.mutate({ action: "NO" })}
              disabled={recordMutation.isPending}
              style={{
                flex: 1,
                backgroundColor: "#10B981",
                paddingVertical: 20,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                opacity: recordMutation.isPending ? 0.5 : 1,
              }}
            >
              {recordMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>NO</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Completion Modal - Sequential Pages */}
      <Modal visible={showCompletion} transparent animationType="fade" onRequestClose={() => {}}>
        <Pressable
          onPress={handleNextPage}
          style={{
            flex: 1,
            backgroundColor: "#58CC02",
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Page 1: Accomplishments */}
            {completionPage === "accomplishments" && (
              <Animated.View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 32,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                {/* Trophy Icon */}
                <Animated.View
                  style={{
                    marginBottom: 40,
                    transform: [
                      {
                        rotate: celebrationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
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
                    }}
                  >
                    <Trophy size={70} color="white" />
                  </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  Quest Complete!
                </Text>

                <Text
                  style={{
                    fontSize: 18,
                    color: "rgba(255, 255, 255, 0.9)",
                    textAlign: "center",
                    marginBottom: 48,
                  }}
                >
                  You collected {completionData?.noCount} NOs!
                </Text>

                {/* Accomplishments */}
                <View
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderRadius: 24,
                    padding: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#1C1C1E",
                      marginBottom: 24,
                      textAlign: "center",
                    }}
                  >
                    Accomplishments
                  </Text>

                  {/* XP & Points Earned */}
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#FEF3C7",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#92400E", fontSize: 24, fontWeight: "bold" }}>
                        +{savedQuestData?.quest.xpReward || 0}
                      </Text>
                      <Text style={{ color: "#92400E", fontSize: 14 }}>XP</Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#FED7AA",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#9A3412", fontSize: 24, fontWeight: "bold" }}>
                        +{savedQuestData?.quest.pointReward || 0}
                      </Text>
                      <Text style={{ color: "#9A3412", fontSize: 14 }}>Points</Text>
                    </View>
                  </View>

                  {/* Total Stats */}
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F5F5F7",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#7E3FE4", fontSize: 24, fontWeight: "bold" }}>
                        {statsData?.totalXP || 0}
                      </Text>
                      <Text style={{ color: "#666", fontSize: 14 }}>Total XP</Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F5F5F7",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FF6B35", fontSize: 24, fontWeight: "bold" }}>
                        {statsData?.totalPoints || 0}
                      </Text>
                      <Text style={{ color: "#666", fontSize: 14 }}>Total Points</Text>
                    </View>
                  </View>
                </View>

                {/* Tap to continue */}
                <Text
                  style={{
                    marginTop: 32,
                    fontSize: 16,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  Tap to continue
                </Text>
              </Animated.View>
            )}

            {/* Page 2: Leaderboard */}
            {completionPage === "leaderboard" && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 32,
                }}
              >
                {/* Trophy Icon */}
                <View style={{ marginBottom: 32 }}>
                  <LinearGradient
                    colors={["#0EA5E9", "#0284C7"]}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trophy size={50} color="white" />
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 48,
                    textAlign: "center",
                  }}
                >
                  Leaderboard Position
                </Text>

                {/* User Position */}
                <View
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderRadius: 24,
                    padding: 32,
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <Text style={{ fontSize: 72, fontWeight: "bold", color: "#0C4A6E" }}>
                    #{leaderboardData?.currentUserRank || "-"}
                  </Text>
                  <Text style={{ fontSize: 16, color: "#0369A1", marginTop: 8 }}>
                    out of {leaderboardData?.totalUsers || 0} warriors
                  </Text>
                </View>

                {/* Top Users */}
                {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 && (
                  <View
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: 20,
                      padding: 20,
                      maxHeight: 250,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#1C1C1E",
                        marginBottom: 12,
                      }}
                    >
                      Top Warriors
                    </Text>
                    <ScrollView>
                      {leaderboardData.leaderboard.slice(0, 5).map((user) => (
                        <View
                          key={user.userId}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: "#E5E7EB",
                            backgroundColor: user.isCurrentUser ? "#FFF7ED" : "transparent",
                            paddingHorizontal: user.isCurrentUser ? 12 : 0,
                            borderRadius: user.isCurrentUser ? 12 : 0,
                            marginBottom: user.isCurrentUser ? 4 : 0,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                color: user.rank <= 3 ? "#FFD700" : "#666",
                                width: 30,
                              }}
                            >
                              #{user.rank}
                            </Text>
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#1C1C1E",
                                fontWeight: user.isCurrentUser ? "bold" : "normal",
                              }}
                            >
                              {user.userName}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: "#7E3FE4" }}>
                            {user.totalXP} XP
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Tap to continue */}
                <Text
                  style={{
                    marginTop: 32,
                    fontSize: 16,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  Tap to continue
                </Text>
              </View>
            )}

            {/* Page 3: Streak */}
            {completionPage === "streak" && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 32,
                }}
              >
                {/* Flame Icon */}
                <View style={{ marginBottom: 48 }}>
                  <LinearGradient
                    colors={["#FF6B35", "#FF8C42"]}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Flame size={80} color="white" />
                  </LinearGradient>
                </View>

                {/* Streak Number */}
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 24,
                    padding: 40,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text style={{ fontSize: 80, fontWeight: "bold", color: "#FF6B35" }}>
                    {statsData?.currentStreak || 1}
                  </Text>
                  <Text style={{ fontSize: 24, color: "#92400E", fontWeight: "600" }}>
                    day streak
                  </Text>
                </View>

                {/* Generating Next Quest */}
                {isGeneratingNext ? (
                  <View
                    style={{
                      marginTop: 48,
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: 20,
                      padding: 24,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      width: "100%",
                    }}
                  >
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={{ color: "#1C1C1E", fontSize: 16, fontWeight: "600", flex: 1 }}>
                      Generating your next challenge...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      marginTop: 48,
                      fontSize: 16,
                      color: "rgba(255, 255, 255, 0.8)",
                      textAlign: "center",
                    }}
                  >
                    Tap to start next quest
                  </Text>
                )}
              </View>
            )}
          </SafeAreaView>
        </Pressable>
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
            backgroundColor: "rgba(0, 0, 0, 0.8)",
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
                <Trophy size={60} color="white" />
              </LinearGradient>
            </Animated.View>

            {/* Loading Text */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "white",
                marginBottom: 16,
              }}
            >
              Quest Complete!
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#D1D5DB",
                textAlign: "center",
              }}
            >
              Calculating rewards...
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
