import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Diamond, Bell, Menu, Plus, Zap } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { GetUserQuestsResponse, GetUserStatsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"HomeTab">;

export default function HomeScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();

  const { data: questsData, isLoading: questsLoading, error: questsError } = useQuery<GetUserQuestsResponse>({
    queryKey: ["quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
    },
    enabled: !!sessionData?.user,
  });

  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      return api.get<GetUserStatsResponse>("/api/stats");
    },
    enabled: !!sessionData?.user,
  });

  const activeQuests = questsData?.activeQuests || [];

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

  if (!sessionData?.user) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: "rgba(255, 107, 53, 0.2)",
              borderWidth: 3,
              borderColor: "#FF6B35",
            }}
          >
            <Zap size={48} color="#FF6B35" fill="#FF6B35" />
          </View>
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            Welcome to Go for No!
          </Text>
          <Text className="text-white/70 text-lg text-center mb-8">
            Transform rejection into growth. Start your journey to overcome fear and build
            unstoppable confidence.
          </Text>
          <Pressable
            onPress={() => navigation.navigate("LoginModalScreen")}
            className="px-12 py-5 rounded-full"
            style={{ backgroundColor: "#FF6B35" }}
          >
            <Text className="text-white font-bold text-xl">Get Started</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("LoginModalScreen")} className="mt-4">
            <Text className="text-white/50 text-base">Already have an account? Log in</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        {/* Header */}
        <View className="pt-4 pb-2 px-6 flex-row justify-between items-center">
          <Text className="text-white text-2xl font-bold">Go for No</Text>
          <View className="flex-row items-center gap-4">
            <Pressable>
              <Bell size={24} color="#fff" />
            </Pressable>
            <Pressable>
              <Menu size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Stats Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Flame size={20} color="#FF6B35" />
            <Text className="text-white text-lg font-bold">{statsData?.currentStreak || 0}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Trophy size={20} color="#FFD700" />
            <Text className="text-white text-lg font-bold">{statsData?.trophies || 0}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Diamond size={20} color="#00D9FF" />
            <Text className="text-white text-lg font-bold">{statsData?.diamonds || 0}</Text>
          </View>
        </View>

        {/* Active Quests */}
        <View className="px-6 py-4">
          {questsLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text className="text-white/70 mt-4">Loading quests...</Text>
            </View>
          ) : activeQuests.length === 0 ? (
            <View
              className="p-8 rounded-3xl items-center"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <Text className="text-white text-xl font-bold mb-2">No Active Quests</Text>
              <Text className="text-white/70 text-center mb-6">
                Start your rejection challenge journey! Tap the Create button to generate a quest
                with AI.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("CreateQuest")}
                className="px-6 py-3 rounded-full flex-row items-center gap-2"
                style={{ backgroundColor: "#FF6B35" }}
              >
                <Plus size={20} color="#fff" />
                <Text className="text-white font-bold">Create Quest</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeQuests.map((userQuest) => {
                const quest = userQuest.quest;
                const progress =
                  quest.goalType === "COLLECT_NOS"
                    ? (userQuest.noCount / quest.goalCount) * 100
                    : (userQuest.yesCount / quest.goalCount) * 100;

                return (
                  <Pressable
                    key={userQuest.id}
                    onPress={() => navigation.navigate("QuestDetail", { userQuestId: userQuest.id })}
                    className="mb-4 rounded-3xl overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  >
                    <View className="p-6">
                      {/* Category & Difficulty */}
                      <View className="flex-row items-center gap-2 mb-3">
                        <View
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: getCategoryColor(quest.category) + "20" }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{ color: getCategoryColor(quest.category) }}
                          >
                            {quest.category}
                          </Text>
                        </View>
                        <View
                          className="px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: getDifficultyColor(quest.difficulty) + "20",
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{ color: getDifficultyColor(quest.difficulty) }}
                          >
                            {quest.difficulty}
                          </Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text className="text-white text-2xl font-bold mb-2">{quest.title}</Text>

                      {/* Description */}
                      <Text className="text-white/70 text-sm mb-4" numberOfLines={2}>
                        {quest.description}
                      </Text>

                      {/* Goal Progress */}
                      <View
                        className="px-4 py-2 rounded-2xl mb-3"
                        style={{
                          backgroundColor: "#00D9FF20",
                          borderWidth: 2,
                          borderColor: "#00D9FF",
                        }}
                      >
                        <Text className="text-white text-center font-bold">
                          Goal: Collect {quest.goalCount} {quest.goalType === "COLLECT_NOS" ? "NO's" : "YES's"}
                        </Text>
                      </View>

                      {/* Rewards */}
                      <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 bg-pink-500/20 px-3 py-2 rounded-xl">
                          <Text className="text-pink-400 text-center font-semibold">
                            +{quest.xpReward} XP
                          </Text>
                        </View>
                        <View className="flex-1 bg-orange-500/20 px-3 py-2 rounded-xl">
                          <Text className="text-orange-400 text-center font-semibold">
                            +{quest.pointReward} pts
                          </Text>
                        </View>
                      </View>

                      {/* Progress Tracker */}
                      <View className="flex-row gap-4">
                        <View className="flex-1 bg-green-500/20 px-4 py-2 rounded-xl">
                          <Text className="text-green-400 text-center text-sm font-bold">
                            NOs: {userQuest.noCount}/{quest.goalCount}
                          </Text>
                        </View>
                        <View className="flex-1 bg-red-500/20 px-4 py-2 rounded-xl">
                          <Text className="text-red-400 text-center text-sm font-bold">
                            YES: {userQuest.yesCount}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-2 bg-gray-800">
                      <View
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>

        {/* Note about active quests */}
        <View className="px-6">
          <Text className="text-white/50 text-xs text-center">
            Max 2 active quests • Extra quests go to queue
          </Text>
        </View>
      </ScrollView>

      {/* Floating Create Button */}
      <Pressable
        onPress={() => navigation.navigate("CreateQuest")}
        className="absolute bottom-24 right-6 w-16 h-16 rounded-full items-center justify-center"
        style={{
          backgroundColor: "#FF6B35",
          shadowColor: "#FF6B35",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={32} color="#fff" strokeWidth={3} />
      </Pressable>
    </LinearGradient>
  );
}
