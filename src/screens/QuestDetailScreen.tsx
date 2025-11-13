import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Menu as MenuIcon, Flame, Trophy, Diamond } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetUserQuestsResponse,
  RecordQuestActionRequest,
  RecordQuestActionResponse,
  GetUserStatsResponse,
} from "@/shared/contracts";

type Props = RootStackScreenProps<"QuestDetail">;

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { userQuestId } = route.params;
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);

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

  const recordMutation = useMutation({
    mutationFn: async (data: RecordQuestActionRequest) => {
      return api.post<RecordQuestActionResponse>(
        `/api/quests/${userQuestId}/record`,
        data
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      if (data.completed) {
        // Show completion celebration
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    },
  });

  const userQuest = questsData?.activeQuests.find((q) => q.id === userQuestId);

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

  if (!userQuest) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
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

          {/* Right Icons */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable>
              <Bell size={24} color="#1C1C1E" />
            </Pressable>
            <Pressable>
              <MenuIcon size={24} color="#1C1C1E" />
            </Pressable>
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
                    NOs: {userQuest.noCount}/{quest.goalCount}
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
                    YES: {userQuest.yesCount}
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
    </View>
  );
}
