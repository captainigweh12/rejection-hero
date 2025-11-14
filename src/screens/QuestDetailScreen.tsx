import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Flame, Trophy, Sparkles, Clock } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetUserQuestsResponse,
  RecordQuestActionRequest,
  RecordQuestActionResponse,
  GetUserStatsResponse,
  GenerateQuestRequest,
  GenerateQuestResponse,
} from "@/shared/contracts";

type Props = RootStackScreenProps<"QuestDetail">;

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { userQuestId: initialUserQuestId } = route.params;
  const [currentUserQuestId, setCurrentUserQuestId] = useState(initialUserQuestId);
  const queryClient = useQueryClient();
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [celebrationAnim] = useState(new Animated.Value(0));
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes default
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

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
        // Show completion celebration
        setCompletionData(data);
        setShowCompletion(true);

        // Trigger animation
        Animated.sequence([
          Animated.spring(celebrationAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start();
      }
    },
  });

  const handleGenerateNext = () => {
    if (!userQuest) return;

    setIsGeneratingNext(true);

    // Get next difficulty level
    const difficulties = ["EASY", "MEDIUM", "HARD", "EXPERT"];
    const currentDifficultyIndex = difficulties.indexOf(userQuest.quest.difficulty);
    const nextDifficulty = difficulties[Math.min(currentDifficultyIndex + 1, difficulties.length - 1)];

    generateNextMutation.mutate({
      category: userQuest.quest.category,
      difficulty: nextDifficulty,
    });
  };

  const userQuest = questsData?.activeQuests.find((q) => q.id === currentUserQuestId);

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </View>
    );
  }

  if (!userQuest) {
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

  const quest = userQuest.quest;
  const progress =
    quest.goalType === "COLLECT_NOS"
      ? (userQuest.noCount / quest.goalCount) * 100
      : (userQuest.yesCount / quest.goalCount) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header with Exit and Timer */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <X size={24} color="#1C1C1E" />
          </Pressable>

          {/* Timer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "white",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Clock size={20} color={timeRemaining < 60 ? "#FF3B30" : "#FF6B35"} />
            <Text
              style={{
                color: timeRemaining < 60 ? "#FF3B30" : "#1C1C1E",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              height: 12,
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
                borderRadius: 999,
              }}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: "#666", fontSize: 14, fontWeight: "600" }}>
              {userQuest.noCount}/{quest.goalCount} NOs
            </Text>
            <Text style={{ color: "#666", fontSize: 14, fontWeight: "600" }}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* Quest Card */}
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {/* Category Badge */}
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: getCategoryColor(quest.category) + "20",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: getCategoryColor(quest.category),
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {quest.category} • {quest.difficulty}
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{
                color: "#1C1C1E",
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 16,
                lineHeight: 32,
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
              }}
            >
              {quest.description}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: "#F5F5F7",
          }}
        >
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* NO Button (Green) */}
            <Pressable
              onPress={() => recordMutation.mutate({ action: "NO" })}
              disabled={recordMutation.isPending}
              style={{
                flex: 1,
                backgroundColor: "#10B981",
                paddingVertical: 20,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: recordMutation.isPending ? 0.5 : 1,
                shadowColor: "#10B981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {recordMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>NO</Text>
              )}
            </Pressable>

            {/* YES Button (Red) */}
            <Pressable
              onPress={() => recordMutation.mutate({ action: "YES" })}
              disabled={recordMutation.isPending}
              style={{
                flex: 1,
                backgroundColor: "#EF4444",
                paddingVertical: 20,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: recordMutation.isPending ? 0.5 : 1,
                shadowColor: "#EF4444",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {recordMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>YES</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Completion Modal */}
      <Modal
        visible={showCompletion}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              width: "85%",
              backgroundColor: "white",
              borderRadius: 32,
              padding: 32,
              alignItems: "center",
              transform: [
                {
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            }}
          >
            {/* Animated Trophy Icon */}
            <Animated.View
              style={{
                marginBottom: 24,
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
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: "center",
                  justifyContent: "center",
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
              </View>
            </Animated.View>

            {/* Quest Completed */}
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#1C1C1E",
                marginBottom: 12,
              }}
            >
              Quest Complete!
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#666",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              You collected {completionData?.noCount} NOs!
            </Text>

            {/* Streak Display */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#FFF7ED",
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 20,
                marginBottom: 24,
              }}
            >
              <Flame size={32} color="#FF6B35" />
              <View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FF6B35" }}>
                  {statsData?.currentStreak || 1}
                </Text>
                <Text style={{ fontSize: 14, color: "#92400E" }}>day streak</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={{ width: "100%", gap: 12 }}>
              <Pressable
                onPress={handleGenerateNext}
                disabled={isGeneratingNext}
                style={{
                  backgroundColor: "#FF6B35",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isGeneratingNext ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                      Generating...
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="white" />
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                      Next Quest
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowCompletion(false);
                  navigation.goBack();
                }}
                style={{
                  backgroundColor: "#E5E7EB",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#1C1C1E", fontSize: 18, fontWeight: "600" }}>
                  Back to Home
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
