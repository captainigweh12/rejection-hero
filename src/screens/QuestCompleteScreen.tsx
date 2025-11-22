import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Sparkles, Star, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

type Props = RootStackScreenProps<"QuestComplete">;

interface QuestCompleteData {
  questTitle: string;
  questCategory: string;
  xpEarned: number;
  pointsEarned: number;
  noCount: number;
  yesCount: number;
  actionCount: number;
}

export default function QuestCompleteScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { questData, onContinue } = route.params;
  const data = questData as QuestCompleteData;

  // Animation values
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const trophyRotation = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 30 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Main card entrance animation - bouncy scale
    Animated.spring(cardScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Card opacity fade-in
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Trophy rotation animation
    Animated.sequence([
      Animated.timing(trophyRotation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(trophyRotation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti particles animation
    confettiAnims.forEach((anim, index) => {
      const delay = index * 30;
      const randomX = (Math.random() - 0.5) * width * 1.5;
      const randomY = height + Math.random() * 200;

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: randomY,
          duration: 2000 + Math.random() * 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: randomX,
          duration: 2000 + Math.random() * 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 800,
            delay: delay + 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000 + Math.random() * 1000,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const trophyRotate = trophyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "15deg"],
  });

  const confettiColors = ["#FFD700", "#FF6B35", "#00D9FF", "#7E3FE4", "#4CAF50", "#FF4081"];

  return (
    <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Confetti Particles */}
        {confettiAnims.map((anim, index) => {
          const size = 10 + Math.random() * 12;
          const startX = (index % 10) * (width / 10) + Math.random() * 50;
          const color = confettiColors[index % confettiColors.length];

          return (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                left: startX,
                top: -50,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 5,
              }}
            />
          );
        })}

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          {/* Trophy Icon with 3D effect and bounce */}
          <Animated.View
            style={{
              marginBottom: 32,
              transform: [
                { scale: cardScale },
                { rotate: trophyRotate },
              ],
            }}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 24,
                elevation: 12,
                borderWidth: 4,
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <Trophy size={80} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          {/* Main Card with 3D Glassmorphism */}
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
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Title */}
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "900",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 12,
                  letterSpacing: 0.5,
                }}
              >
                Quest Complete! 🎉
              </Text>

              {/* Quest Title */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.primary,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                {data.questTitle}
              </Text>

              {/* Stats Grid */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                {/* XP Earned */}
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "rgba(126, 63, 228, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Zap size={20} color="#7E3FE4" fill="#7E3FE4" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginLeft: 8 }}>
                      XP Earned
                    </Text>
                  </View>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#7E3FE4" }}>
                    +{data.xpEarned}
                  </Text>
                </View>

                {/* Points Earned */}
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "rgba(255, 215, 0, 0.15)",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255, 215, 0, 0.3)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Star size={20} color="#FFD700" fill="#FFD700" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginLeft: 8 }}>
                      Points
                    </Text>
                  </View>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFD700" }}>
                    +{data.pointsEarned}
                  </Text>
                </View>

                {/* NOs Collected */}
                {data.noCount > 0 && (
                  <View
                    style={{
                      flex: 1,
                      minWidth: "45%",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <Sparkles size={20} color="#10B981" fill="#10B981" />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginLeft: 8 }}>
                        NOs Collected
                      </Text>
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#10B981" }}>
                      {data.noCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Continue Button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onContinue();
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  paddingVertical: 18,
                  alignItems: "center",
                  marginTop: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF" }}>
                  Continue Celebration →
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

