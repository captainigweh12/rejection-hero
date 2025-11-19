import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Heart, Trophy, Clock, Target, CheckCircle, XCircle, Sparkles } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

type Props = RootStackScreenProps<"FriendQuestView">;

interface FriendQuestData {
  userQuest: {
    id: string;
    status: string;
    noCount: number;
    yesCount: number;
    actionCount: number;
    startedAt: string | null;
    completedAt: string | null;
  };
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    goalType: string;
    goalCount: number;
    xpReward: number;
    pointReward: number;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    Profile: {
      displayName: string;
      avatar: string | null;
    } | null;
  };
}

export default function FriendQuestViewScreen({ route, navigation }: Props) {
  const { userQuestId, userId } = route.params;
  const { colors } = useTheme();

  const { data: questData, isLoading } = useQuery<FriendQuestData>({
    queryKey: ["friend-quest", userQuestId],
    queryFn: async () => {
      return api.get<FriendQuestData>(`/api/quests/friend/${userQuestId}`);
    },
  });

  const handleChat = () => {
    const user = questData?.user;
    if (user) {
      navigation.navigate("Chat", {
        userId: user.id,
        userName: user.Profile?.displayName || user.name || user.email?.split("@")[0] || "Friend",
        userAvatar: user.Profile?.avatar || null,
      });
    }
  };

  const handleSupport = () => {
    Alert.alert(
      "Send Support",
      "Send words of encouragement to your friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Support",
          onPress: () => {
            // Navigate to chat with friend
            const user = questData?.user;
            if (user) {
              navigation.navigate("Chat", {
                userId: user.id,
                userName: user.Profile?.displayName || user.name || user.email?.split("@")[0] || "Friend",
                userAvatar: user.Profile?.avatar || null,
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#7E3FE4" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!questData) {
    return (
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
              Quest Not Found
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              This quest may have been completed or removed.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              className="mt-6 px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { userQuest, quest, user } = questData;
  const userName = user.Profile?.displayName || user.name || user.email?.split("@")[0] || "Friend";

  // Calculate progress
  const getProgress = () => {
    switch (quest.goalType) {
      case "COLLECT_NOS":
        return { current: userQuest.noCount, total: quest.goalCount, label: "NOs collected" };
      case "COLLECT_YES":
        return { current: userQuest.yesCount, total: quest.goalCount, label: "YESes collected" };
      case "TAKE_ACTION":
        return { current: userQuest.actionCount, total: quest.goalCount, label: "Actions taken" };
      default:
        return { current: 0, total: quest.goalCount, label: "Progress" };
    }
  };

  const progress = getProgress();
  const progressPercent = Math.min(100, (progress.current / progress.total) * 100);
  const isCompleted = userQuest.status === "COMPLETED";

  return (
    <LinearGradient colors={colors.background} className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center px-6 py-4 border-b"
          style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {userName}&apos;s Quest
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              View Only
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Quest Info Card */}
          <View
            className="p-6 rounded-2xl mb-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                  {quest.title}
                </Text>
                <Text className="text-base mb-3" style={{ color: colors.textSecondary }}>
                  {quest.description}
                </Text>
              </View>
              {isCompleted && (
                <View className="ml-4">
                  <CheckCircle size={32} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Quest Meta */}
            <View className="flex-row flex-wrap gap-3 mb-4">
              <View
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(126, 63, 228, 0.2)" }}
              >
                <Text className="text-xs font-semibold" style={{ color: "#7E3FE4" }}>
                  {quest.category}
                </Text>
              </View>
              <View
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(255, 107, 53, 0.2)" }}
              >
                <Text className="text-xs font-semibold" style={{ color: "#FF6B35" }}>
                  {quest.difficulty}
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {progress.label}
                </Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {progress.current} / {progress.total}
                </Text>
              </View>
              <View
                className="h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                <LinearGradient
                  colors={isCompleted ? ["#4CAF50", "#66BB6A"] : ["#7E3FE4", "#00D9FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                  }}
                />
              </View>
            </View>

            {/* Rewards */}
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-2">
                <Trophy size={16} color="#FFD700" />
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {quest.xpReward} XP
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#00D9FF" />
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {quest.pointReward} Points
                </Text>
              </View>
            </View>
          </View>

          {/* Status Card */}
          <View
            className="p-4 rounded-2xl mb-4"
            style={{
              backgroundColor: isCompleted
                ? "rgba(76, 175, 80, 0.15)"
                : "rgba(126, 63, 228, 0.15)",
              borderWidth: 1,
              borderColor: isCompleted ? "#4CAF50" : "#7E3FE4",
            }}
          >
            <View className="flex-row items-center gap-3">
              {isCompleted ? (
                <>
                  <CheckCircle size={24} color="#4CAF50" />
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#4CAF50" }}>
                      Quest Completed!
                    </Text>
                    {userQuest.completedAt && (
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        Completed on {new Date(userQuest.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Clock size={24} color="#7E3FE4" />
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#7E3FE4" }}>
                      Quest In Progress
                    </Text>
                    {userQuest.startedAt && (
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        Started on {new Date(userQuest.startedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleChat}
              className="flex-row items-center justify-center py-4 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <MessageCircle size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-semibold text-base">Chat with {userName}</Text>
            </Pressable>

            <Pressable
              onPress={handleSupport}
              className="flex-row items-center justify-center py-4 rounded-xl"
              style={{
                backgroundColor: "rgba(255, 107, 53, 0.2)",
                borderWidth: 1,
                borderColor: "#FF6B35",
              }}
            >
              <Heart size={20} color="#FF6B35" style={{ marginRight: 8 }} />
              <Text className="font-semibold text-base" style={{ color: "#FF6B35" }}>
                Send Support
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

