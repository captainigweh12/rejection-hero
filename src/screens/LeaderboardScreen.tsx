import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Trophy, Crown, Medal, Award, TrendingUp } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from "@/lib/useSession";
import type { GetLeaderboardResponse } from "@/shared/contracts";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Leaderboard">;

type Period = "day" | "week" | "month" | "all";

export default function LeaderboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { data: sessionData } = useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");

  const { data: leaderboardData, isLoading } = useQuery<GetLeaderboardResponse>({
    queryKey: ["leaderboard", selectedPeriod],
    queryFn: async () => {
      return api.get<GetLeaderboardResponse>(`/api/stats/leaderboard?period=${selectedPeriod}`);
    },
    enabled: !!sessionData?.user,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={24} color="#FFD700" />;
    if (rank === 2) return <Medal size={24} color="#C0C0C0" />;
    if (rank === 3) return <Award size={24} color="#CD7F32" />;
    return <Trophy size={20} color={colors.textSecondary} />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.textSecondary;
  };

  const periods: Array<{ key: Period; label: string }> = [
    { key: "day", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>Leaderboard</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                Compete with warriors worldwide
              </Text>
            </View>
          </View>

          {/* Period Selector */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              paddingVertical: 12,
              gap: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            {periods.map((period) => (
              <Pressable
                key={period.key}
                onPress={() => setSelectedPeriod(period.key)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: selectedPeriod === period.key ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedPeriod === period.key ? colors.primary : colors.cardBorder,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selectedPeriod === period.key ? "white" : colors.textSecondary,
                  }}
                >
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Current User Rank Card */}
          {leaderboardData && (
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 16,
                padding: 16,
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Your Rank</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.primary }}>
                      #{leaderboardData.currentUserRank}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      of {leaderboardData.totalUsers} warriors
                    </Text>
                  </View>
                  {selectedPeriod !== "all" && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      {leaderboardData.leaderboard.find((u) => u.isCurrentUser)?.questsCompleted || 0} quests completed
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={28} color={colors.primary} />
                </View>
              </View>
            </View>
          )}

          {/* Leaderboard List */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 16 }}>
            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : leaderboardData?.leaderboard.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Trophy size={64} color={colors.textSecondary} />
                <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                  No rankings yet
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
                  Complete quests to climb the leaderboard!
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {leaderboardData?.leaderboard.map((user) => (
                  <Pressable
                    key={user.userId}
                    onPress={() => {
                      // Navigate to user profile if needed
                    }}
                    style={{
                      backgroundColor: user.isCurrentUser ? colors.primary + "15" : colors.card,
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: user.isCurrentUser ? 2 : 1,
                      borderColor: user.isCurrentUser ? colors.primary : colors.cardBorder,
                      shadowColor: user.isCurrentUser ? colors.primary : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: user.isCurrentUser ? 4 : 1,
                    }}
                  >
                    {/* Rank */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: user.rank <= 3 ? getRankColor(user.rank) + "20" : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        borderWidth: user.rank <= 3 ? 2 : 1,
                        borderColor: user.rank <= 3 ? getRankColor(user.rank) : colors.cardBorder,
                      }}
                    >
                      {user.rank <= 3 ? (
                        getRankIcon(user.rank)
                      ) : (
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: user.rank <= 3 ? getRankColor(user.rank) : colors.text,
                          }}
                        >
                          {user.rank}
                        </Text>
                      )}
                    </View>

                    {/* User Info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: user.isCurrentUser ? colors.primary : colors.text,
                          }}
                        >
                          {user.userName}
                        </Text>
                        {user.isCurrentUser && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: colors.primary,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "600", color: "white" }}>YOU</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
                        {selectedPeriod === "all" ? (
                          <>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              {user.totalXP.toLocaleString()} XP
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              🔥 {user.currentStreak} streak
                            </Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {user.questsCompleted || 0} quest{user.questsCompleted !== 1 ? "s" : ""} completed
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Score Badge */}
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: user.rank <= 3 ? getRankColor(user.rank) + "20" : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: user.rank <= 3 ? getRankColor(user.rank) : colors.text,
                        }}
                      >
                        {selectedPeriod === "all"
                          ? user.totalXP.toLocaleString()
                          : user.questsCompleted || 0}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

