import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Target, Award, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";

type Props = RootStackScreenProps<"QuestWeeklyAchievements">;

interface WeeklyAchievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  icon: "trophy" | "target" | "award" | "star";
  completed: boolean;
}

interface WeeklyData {
  achievements: WeeklyAchievement[];
  weeklyNoCount: number;
  weeklyQuestCount: number;
}

export default function QuestWeeklyAchievementsScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { weeklyData, onContinue } = route.params;
  const data = weeklyData as WeeklyData;

  // Animation values
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const achievementAnims = useRef(
    data.achievements.map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      progress: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Main card entrance
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

    // Staggered achievement animations
    achievementAnims.forEach((anim, index) => {
      const delay = index * 150;

      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.progress, {
          toValue: 1,
          duration: 1000,
          delay: delay + 200,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, []);

  const getIcon = (iconType: string) => {
    const iconProps = { size: 24, color: "#FFD700" };
    switch (iconType) {
      case "trophy":
        return <Trophy {...iconProps} fill="#FFD700" />;
      case "target":
        return <Target {...iconProps} fill="#FFD700" />;
      case "award":
        return <Award {...iconProps} fill="#FFD700" />;
      default:
        return <Star {...iconProps} fill="#FFD700" />;
    }
  };

  return (
    <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={{
              alignItems: "center",
              marginBottom: 32,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: "900",
                color: colors.text,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Weekly Achievements
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Your progress this week
            </Text>
          </Animated.View>

          {/* Achievements List */}
          {data.achievements.map((achievement, index) => {
            const anim = achievementAnims[index];
            const progressPercentage = Math.min((achievement.progress / achievement.target) * 100, 100);

            return (
              <Animated.View
                key={achievement.id}
                style={{
                  marginBottom: 16,
                  opacity: anim.opacity,
                  transform: [{ scale: anim.scale }],
                }}
              >
                <LinearGradient
                  colors={[colors.card, colors.card + "DD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: achievement.completed ? 2 : 1,
                    borderColor: achievement.completed ? "#FFD700" : colors.cardBorder,
                    shadowColor: achievement.completed ? "#FFD700" : colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: achievement.completed
                          ? "rgba(255, 215, 0, 0.2)"
                          : "rgba(126, 63, 228, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {getIcon(achievement.icon)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: colors.text,
                          marginBottom: 4,
                        }}
                      >
                        {achievement.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                        }}
                      >
                        {achievement.description}
                      </Text>
                    </View>
                    {achievement.completed && (
                      <View
                        style={{
                          backgroundColor: "#FFD700",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: "#000" }}>✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View>
                    <View
                      style={{
                        height: 8,
                        backgroundColor: colors.cardBorder,
                        borderRadius: 4,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <Animated.View
                        style={{
                          height: "100%",
                          width: anim.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", `${progressPercentage}%`],
                          }),
                          backgroundColor: achievement.completed ? "#FFD700" : colors.primary,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        textAlign: "right",
                      }}
                    >
                      {achievement.progress} / {achievement.target}
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            );
          })}

          {/* Continue Button */}
          <Animated.View
            style={{
              marginTop: 24,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }}
          >
            <Pressable
              testID="weekly-continue-button"
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
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

