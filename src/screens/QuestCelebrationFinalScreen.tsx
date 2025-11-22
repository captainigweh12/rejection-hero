import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Share2, Image as ImageIcon, FileText, ArrowRight, Home } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";

type Props = RootStackScreenProps<"QuestCelebrationFinal">;

interface CelebrationSummary {
  questTitle: string;
  xpEarned: number;
  pointsEarned: number;
  streak: number;
  rank: number;
  rankChange?: number;
}

export default function QuestCelebrationFinalScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { celebrationSummary, onShareToStory, onShareAsPost } = route.params;
  const data = celebrationSummary as CelebrationSummary;
  const nav = useNavigation();

  // Animation values
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnims = useRef(
    Array.from({ length: 4 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
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

    // Staggered button animations
    buttonAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleShareToStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onShareToStory();
  };

  const handleShareAsPost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onShareAsPost();
  };

  const handleContinueQuests = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nav.navigate("Tabs", { screen: "HomeTab" });
  };

  const handleBackToMain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nav.navigate("Tabs", { screen: "HomeTab" });
  };

  return (
    <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
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
                  fontSize: 32,
                  fontWeight: "900",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                🎊 Amazing Work!
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 32,
                }}
              >
                Share your accomplishment or continue your journey
              </Text>

              {/* Share Buttons */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Share Your Achievement
                </Text>

                {/* Share to Story */}
                <Animated.View
                  style={{
                    marginBottom: 12,
                    opacity: buttonAnims[0].opacity,
                    transform: [{ scale: buttonAnims[0].scale }],
                  }}
                >
                  <Pressable
                    testID="share-to-story-button"
                    onPress={handleShareToStory}
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.15)",
                      borderRadius: 20,
                      padding: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(0, 217, 255, 0.3)",
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(0, 217, 255, 0.2)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <ImageIcon size={24} color="#00D9FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                        Share to Story
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Create a story with your achievement
                      </Text>
                    </View>
                    <ArrowRight size={20} color={colors.textSecondary} />
                  </Pressable>
                </Animated.View>

                {/* Share as Post */}
                <Animated.View
                  style={{
                    opacity: buttonAnims[1].opacity,
                    transform: [{ scale: buttonAnims[1].scale }],
                  }}
                >
                  <Pressable
                    testID="share-as-post-button"
                    onPress={handleShareAsPost}
                    style={{
                      backgroundColor: "rgba(126, 63, 228, 0.15)",
                      borderRadius: 20,
                      padding: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(126, 63, 228, 0.2)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <FileText size={24} color="#7E3FE4" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                        Share as Post
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Post to your feed
                      </Text>
                    </View>
                    <ArrowRight size={20} color={colors.textSecondary} />
                  </Pressable>
                </Animated.View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12 }}>
                {/* Continue Quests */}
                <Animated.View
                  style={{
                    opacity: buttonAnims[2].opacity,
                    transform: [{ scale: buttonAnims[2].scale }],
                  }}
                >
                  <Pressable
                    onPress={handleContinueQuests}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 20,
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginRight: 8 }}>
                      Continue Quests
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </Pressable>
                </Animated.View>

                {/* Back to Main Menu */}
                <Animated.View
                  style={{
                    opacity: buttonAnims[3].opacity,
                    transform: [{ scale: buttonAnims[3].scale }],
                  }}
                >
                  <Pressable
                    onPress={handleBackToMain}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Home size={20} color={colors.text} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                      Back to Main Menu
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

