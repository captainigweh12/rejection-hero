import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");

type Props = RootStackScreenProps<"QuestLeaderboardPosition">;

interface LeaderboardData {
  currentRank: number;
  previousRank: number;
  rankChanged: boolean;
  rankDirection: "up" | "down" | "same";
  totalXP: number;
  totalPoints: number;
}

export default function QuestLeaderboardPositionScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { leaderboardData, onContinue } = route.params;
  const data = leaderboardData as LeaderboardData;

  // Animation values
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const rankSlide = useRef(new Animated.Value(50)).current;
  const rankCounter = useRef(new Animated.Value(data.previousRank)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  const [displayRank, setDisplayRank] = useState(data.previousRank);

  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Card entrance
    Animated.spring(cardScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Rank slide-up animation
    Animated.spring(rankSlide, {
      toValue: 0,
      tension: 50,
      friction: 7,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Badge scale animation
    Animated.spring(badgeScale, {
      toValue: 1,
      tension: 40,
      friction: 6,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Animated rank counter
    Animated.timing(rankCounter, {
      toValue: data.currentRank,
      duration: 1500,
      delay: 400,
      useNativeDriver: false,
    }).start();

    // Update display rank
    const listener = rankCounter.addListener(({ value }) => {
      setDisplayRank(Math.floor(value));
    });

    return () => {
      rankCounter.removeListener(listener);
    };
  }, []);

  const getRankColor = () => {
    if (data.currentRank <= 3) return "#FFD700";
    if (data.currentRank <= 10) return "#C0C0C0";
    if (data.currentRank <= 50) return "#CD7F32";
    return colors.primary;
  };

  const getRankLabel = () => {
    if (data.currentRank === 1) return "🥇 #1";
    if (data.currentRank === 2) return "🥈 #2";
    if (data.currentRank === 3) return "🥉 #3";
    return `#${data.currentRank}`;
  };

  const getRankChangeIcon = () => {
    if (data.rankDirection === "up") return <TrendingUp size={24} color="#10B981" />;
    if (data.rankDirection === "down") return <TrendingDown size={24} color="#EF4444" />;
    return <Minus size={24} color={colors.textSecondary} />;
  };

  const getRankChangeText = () => {
    if (data.rankDirection === "up") {
      return `Moved up ${data.previousRank - data.currentRank} position${data.previousRank - data.currentRank > 1 ? "s" : ""}!`;
    }
    if (data.rankDirection === "down") {
      return `Moved down ${data.currentRank - data.previousRank} position${data.currentRank - data.previousRank > 1 ? "s" : ""}`;
    }
    return "Rank maintained";
  };

  return (
    <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          {/* Rank Badge with 3D effect */}
          <Animated.View
            style={{
              marginBottom: 32,
              transform: [{ scale: badgeScale }],
            }}
          >
            <LinearGradient
              colors={[getRankColor(), getRankColor() + "CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: getRankColor(),
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 24,
                elevation: 12,
                borderWidth: 4,
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <Trophy size={70} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          {/* Main Card */}
          <Animated.View
            style={{
              width: "100%",
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }}
          >
            <LinearGradient
              colors={[colors.card, colors.card + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 32,
                padding: 32,
                borderWidth: 2,
                borderColor: colors.cardBorder,
                shadowColor: getRankColor(),
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Title */}
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Leaderboard Position
              </Text>

              {/* Rank Display */}
              <Animated.View
                style={{
                  alignItems: "center",
                  marginVertical: 24,
                  transform: [{ translateY: rankSlide }],
                }}
              >
                <Text
                  style={{
                    fontSize: 64,
                    fontWeight: "900",
                    color: getRankColor(),
                    textAlign: "center",
                    letterSpacing: -2,
                  }}
                >
                  {getRankLabel()}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Global Ranking
                </Text>
              </Animated.View>

              {/* Rank Change Indicator */}
              {data.rankChanged && (
                <View
                  style={{
                    backgroundColor:
                      data.rankDirection === "up"
                        ? "rgba(16, 185, 129, 0.15)"
                        : data.rankDirection === "down"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(126, 63, 228, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor:
                      data.rankDirection === "up"
                        ? "rgba(16, 185, 129, 0.3)"
                        : data.rankDirection === "down"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(126, 63, 228, 0.3)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getRankChangeIcon()}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color:
                        data.rankDirection === "up"
                          ? "#10B981"
                          : data.rankDirection === "down"
                          ? "#EF4444"
                          : colors.text,
                      marginLeft: 8,
                    }}
                  >
                    {getRankChangeText()}
                  </Text>
                </View>
              )}

              {/* Stats Grid */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(126, 63, 228, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
                    Total XP
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#7E3FE4" }}>
                    {data.totalXP.toLocaleString()}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 215, 0, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255, 215, 0, 0.3)",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
                    Total Points
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FFD700" }}>
                    {data.totalPoints.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Continue Button */}
              <Pressable
                testID="leaderboard-continue-button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onContinue();
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  paddingVertical: 18,
                  alignItems: "center",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF" }}>
                  Continue →
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

