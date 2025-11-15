import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Star, ChevronLeft, CheckCircle, XCircle, Activity } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RootStackScreenProps } from "@/navigation/types";

interface GrowthAchievement {
  id: string;
  type: string;
  description: string;
  earnedAt: string;
  journalEntry: {
    id: string;
    aiSummary: string;
    userEditedSummary: string | null;
    outcome: string;
    createdAt: string;
  };
}

interface GetGrowthAchievementsResponse {
  achievements: GrowthAchievement[];
  stats: {
    totalAchievements: number;
    goldStars: number;
    silverStars: number;
    bronzeStars: number;
  };
}

type Props = RootStackScreenProps<"GrowthAchievements">;

export default function GrowthAchievementsScreen({ navigation }: Props) {
  const { data } = useQuery({
    queryKey: ["growth-achievements"],
    queryFn: () => api.get<GetGrowthAchievementsResponse>("/api/journal/achievements"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <ChevronLeft size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Growth & Achievements</Text>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Stats Cards */}
          {data && (
            <View className="mb-6">
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <Text className="text-xl font-bold text-white mb-4">Your Stats</Text>

                <View className="flex-row justify-between">
                  {/* Total */}
                  <View className="items-center flex-1">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "rgba(126, 63, 228, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Star size={28} color="#7E3FE4" fill="#7E3FE4" />
                    </View>
                    <Text className="text-2xl font-bold text-white">
                      {data.stats.totalAchievements}
                    </Text>
                    <Text className="text-sm text-white/60">Total</Text>
                  </View>

                  {/* Gold Stars */}
                  <View className="items-center flex-1">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "rgba(255, 215, 0, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Star size={28} color="#FFD700" fill="#FFD700" />
                    </View>
                    <Text className="text-2xl font-bold text-white">{data.stats.goldStars}</Text>
                    <Text className="text-sm text-white/60">Gold</Text>
                  </View>

                  {/* Silver Stars */}
                  <View className="items-center flex-1">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "rgba(192, 192, 192, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Star size={28} color="#C0C0C0" fill="#C0C0C0" />
                    </View>
                    <Text className="text-2xl font-bold text-white">{data.stats.silverStars}</Text>
                    <Text className="text-sm text-white/60">Silver</Text>
                  </View>

                  {/* Bronze Stars */}
                  <View className="items-center flex-1">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "rgba(205, 127, 50, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Star size={28} color="#CD7F32" fill="#CD7F32" />
                    </View>
                    <Text className="text-2xl font-bold text-white">{data.stats.bronzeStars}</Text>
                    <Text className="text-sm text-white/60">Bronze</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Achievements List */}
          <Text className="text-xl font-bold text-white mb-4">Recent Achievements</Text>

          {data?.achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              {/* Achievement Header */}
              <View className="flex-row items-center mb-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor:
                      achievement.type === "gold_star"
                        ? "rgba(255, 215, 0, 0.2)"
                        : achievement.type === "silver_star"
                          ? "rgba(192, 192, 192, 0.2)"
                          : "rgba(205, 127, 50, 0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Star
                    size={24}
                    color={
                      achievement.type === "gold_star"
                        ? "#FFD700"
                        : achievement.type === "silver_star"
                          ? "#C0C0C0"
                          : "#CD7F32"
                    }
                    fill={
                      achievement.type === "gold_star"
                        ? "#FFD700"
                        : achievement.type === "silver_star"
                          ? "#C0C0C0"
                          : "#CD7F32"
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-white font-semibold text-base">
                    {achievement.description}
                  </Text>
                  <Text className="text-white/60 text-sm">
                    {new Date(achievement.earnedAt).toLocaleDateString()} at{" "}
                    {new Date(achievement.earnedAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {/* Journal Entry Summary */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <View className="flex-row items-center mb-2">
                  {achievement.journalEntry.outcome === "YES" && (
                    <CheckCircle size={16} color="#FF3B30" />
                  )}
                  {achievement.journalEntry.outcome === "NO" && (
                    <XCircle size={16} color="#4CAF50" />
                  )}
                  {achievement.journalEntry.outcome === "ACTIVITY" && (
                    <Activity size={16} color="#00D9FF" />
                  )}
                  <Text className="text-white/60 text-xs ml-2">
                    {achievement.journalEntry.outcome}
                  </Text>
                </View>
                <Text className="text-white/80 text-sm">
                  {achievement.journalEntry.userEditedSummary ||
                    achievement.journalEntry.aiSummary}
                </Text>
              </View>
            </View>
          ))}

          {data?.achievements.length === 0 && (
            <View className="items-center py-12">
              <Star size={64} color="rgba(255, 255, 255, 0.2)" />
              <Text className="text-white/60 text-center mt-4 text-base">
                No achievements yet.{"\n"}Start journaling to earn your first star!
              </Text>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
