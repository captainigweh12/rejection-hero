import React from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetUserQuestsResponse,
  RecordQuestActionRequest,
  RecordQuestActionResponse,
} from "@/shared/contracts";

type Props = RootStackScreenProps<"QuestDetail">;

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { userQuestId } = route.params;
  const queryClient = useQueryClient();

  const { data: questsData, isLoading } = useQuery<GetUserQuestsResponse>({
    queryKey: ["quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
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

  if (isLoading) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7E3FE4" />
        </View>
      </LinearGradient>
    );
  }

  if (!userQuest) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-bold mb-4">Quest not found</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="bg-purple-600 px-8 py-4 rounded-full"
          >
            <Text className="text-white font-bold text-lg">Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const quest = userQuest.quest;
  const progress =
    quest.goalType === "COLLECT_NOS"
      ? (userQuest.noCount / quest.goalCount) * 100
      : (userQuest.yesCount / quest.goalCount) * 100;

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 pb-32">
        {/* Quest Info */}
        <Text className="text-white text-3xl font-bold mb-4">{quest.title}</Text>
        <Text className="text-white/90 text-lg mb-8">{quest.description}</Text>

        {/* Goal */}
        <View
          className="px-6 py-4 rounded-2xl mb-6"
          style={{
            backgroundColor: "#00D9FF20",
            borderWidth: 2,
            borderColor: "#00D9FF",
          }}
        >
          <Text className="text-white text-xl text-center font-bold">
            Goal: Collect {quest.goalCount} {quest.goalType === "COLLECT_NOS" ? "NO's" : "YES's"}
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-8">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white font-semibold">Progress</Text>
            <Text className="text-white font-semibold">
              {quest.goalType === "COLLECT_NOS" ? userQuest.noCount : userQuest.yesCount}/{quest.goalCount}
            </Text>
          </View>
          <View className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-green-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-green-500/20 px-4 py-6 rounded-2xl">
            <Text className="text-green-400 text-center text-sm mb-2">NOs Collected</Text>
            <Text className="text-white text-center text-4xl font-bold">{userQuest.noCount}</Text>
          </View>
          <View className="flex-1 bg-red-500/20 px-4 py-6 rounded-2xl">
            <Text className="text-red-400 text-center text-sm mb-2">YESes</Text>
            <Text className="text-white text-center text-4xl font-bold">{userQuest.yesCount}</Text>
          </View>
        </View>

        {/* Rewards Preview */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">Rewards</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-pink-500/20 px-4 py-4 rounded-2xl">
              <Text className="text-pink-400 text-center text-lg font-bold">
                +{quest.xpReward} XP
              </Text>
            </View>
            <View className="flex-1 bg-orange-500/20 px-4 py-4 rounded-2xl">
              <Text className="text-orange-400 text-center text-lg font-bold">
                +{quest.pointReward} pts
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View
          className="p-6 rounded-2xl mb-8"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        >
          <Text className="text-white font-bold text-lg mb-2">How to complete:</Text>
          <Text className="text-white/70 text-base">
            1. Go out and complete the challenge{"\n"}
            2. Tap the buttons below after each attempt{"\n"}
            3. Track your progress as you go{"\n"}
            4. Earn rewards when you hit your goal!
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-gray-900/95">
        <View className="flex-row gap-4">
          {/* NO Button */}
          <Pressable
            onPress={() => recordMutation.mutate({ action: "NO" })}
            disabled={recordMutation.isPending}
            className="flex-1 py-6 rounded-2xl flex-row items-center justify-center gap-3"
            style={{
              backgroundColor: "#00D9FF",
              opacity: recordMutation.isPending ? 0.5 : 1,
            }}
          >
            {recordMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={28} color="#fff" strokeWidth={3} />
                <Text className="text-white text-xl font-bold">NO</Text>
              </>
            )}
          </Pressable>

          {/* YES Button */}
          <Pressable
            onPress={() => recordMutation.mutate({ action: "YES" })}
            disabled={recordMutation.isPending}
            className="flex-1 py-6 rounded-2xl flex-row items-center justify-center gap-3"
            style={{
              backgroundColor: "#FF6B35",
              opacity: recordMutation.isPending ? 0.5 : 1,
            }}
          >
            {recordMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <XCircle size={28} color="#fff" strokeWidth={3} />
                <Text className="text-white text-xl font-bold">YES</Text>
              </>
            )}
          </Pressable>
        </View>
        <Text className="text-white/50 text-xs text-center mt-3">
          Remember: Every NO is a step closer to your goal!
        </Text>
      </View>
    </LinearGradient>
  );
}
