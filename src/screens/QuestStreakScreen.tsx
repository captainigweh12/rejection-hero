import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");

type Props = RootStackScreenProps<"QuestStreak">;

interface StreakData {
  currentStreak: number;
  previousStreak: number;
  streakIncreased: boolean;
}

export default function QuestStreakScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { streakData, onContinue } = route.params;
  const data = streakData as StreakData;

  // Animation values
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(0)).current;
  const flamePulse = useRef(new Animated.Value(0)).current;
  const streakCounter = useRef(new Animated.Value(data.previousStreak)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const [displayStreak, setDisplayStreak] = useState(data.previousStreak);

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

    // Flame entrance with bounce
    Animated.sequence([
      Animated.spring(flameScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(flamePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(flamePulse, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Animated counter
    Animated.timing(streakCounter, {
      toValue: data.currentStreak,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Progress bar fill
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 1200,
      delay: 300,
      useNativeDriver: false,
    }).start();

    // Update display streak
    const listener = streakCounter.addListener(({ value }) => {
      setDisplayStreak(Math.floor(value));
    });

    return () => {
      streakCounter.removeListener(listener);
    };
  }, []);

  const flamePulseScale = flamePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const progressPercentage = Math.min((data.currentStreak / 100) * 100, 100);

  return (
    <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          {/* Flame Icon with pulse animation */}
          <Animated.View
            style={{
              marginBottom: 32,
              transform: [
                { scale: Animated.multiply(flameScale, flamePulseScale) },
              ],
            }}
          >
            <LinearGradient
              colors={["#FF6B35", "#FF8C42", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#FF6B35",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 12,
                borderWidth: 3,
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <Flame size={70} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
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
                shadowColor: "#FF6B35",
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
                🔥 Streak Update!
              </Text>

              {/* Streak Counter */}
              <View style={{ alignItems: "center", marginVertical: 24 }}>
                <Text
                  style={{
                    fontSize: 72,
                    fontWeight: "900",
                    color: "#FF6B35",
                    textAlign: "center",
                    letterSpacing: -2,
                  }}
                >
                  {displayStreak}
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
                  Day{displayStreak !== 1 ? "s" : ""} Streak
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    height: 12,
                    backgroundColor: colors.cardBorder,
                    borderRadius: 6,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      width: progressWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", `${progressPercentage}%`],
                      }),
                      backgroundColor: "#FF6B35",
                      borderRadius: 6,
                    }}
                  />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Current</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Goal: 100 days</Text>
                </View>
              </View>

              {/* Streak Message */}
              {data.streakIncreased ? (
                <View
                  style={{
                    backgroundColor: "rgba(255, 107, 53, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: "rgba(255, 107, 53, 0.3)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <TrendingUp size={20} color="#FF6B35" />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FF6B35", marginLeft: 8 }}>
                      Streak Increased!
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Keep it going! Your consistency is building unstoppable momentum.
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "rgba(0, 217, 255, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: "rgba(0, 217, 255, 0.3)",
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
                    Maintain your streak by completing quests daily!
                  </Text>
                </View>
              )}

              {/* Continue Button */}
              <Pressable
                testID="streak-continue-button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onContinue();
                }}
                style={{
                  backgroundColor: "#FF6B35",
                  borderRadius: 20,
                  paddingVertical: 18,
                  alignItems: "center",
                  shadowColor: "#FF6B35",
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

