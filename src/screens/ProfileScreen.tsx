import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert, TextInput, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Shield,
  Zap,
  Video,
  Camera,
  Sparkles,
  Edit3,
  Save,
  X,
  Trophy,
  Flame,
  Star,
  Target,
  Award,
  TrendingUp,
  Upload,
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GetProfileResponse, GetUserStatsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"ProfileTab">;

export default function ProfileScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"quests" | "stats" | "about">("quests");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState("");

  const { data: profileData, isLoading: profileLoading } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
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

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await authClient.signOut();
          },
        },
      ]
    );
  };

  const handleSaveContext = () => {
    // TODO: Save user context to backend for AI quest generation
    setIsEditingAbout(false);
    Alert.alert(
      "Context Saved",
      "Your information will help Ben create more personalized quests for you!"
    );
  };

  const handleGenerateAvatar = async (style: string) => {
    setShowStyleModal(false);
    setShowAvatarModal(false);
    setIsGenerating(true);

    try {
      const response = await api.post<{ success: boolean; avatarUrl: string; message?: string }>(
        "/api/profile/generate-avatar",
        { style }
      );

      if (response.success && response.avatarUrl) {
        // Save the avatar to the profile
        await api.post("/api/profile", {
          displayName: profileData?.displayName || sessionData?.user?.email?.split("@")[0] || "Warrior",
          avatar: response.avatarUrl,
        });

        // Refetch profile to show new avatar
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        Alert.alert("Success!", "Your AI avatar has been generated and saved!");
      } else {
        Alert.alert("Error", response.message || "Failed to generate avatar. Please try again.");
      }
    } catch (error) {
      console.error("Error generating avatar:", error);
      Alert.alert("Error", "Failed to generate avatar. Please check your OpenAI API key in the ENV tab.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Shield size={64} color="#7E3FE4" />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 24, marginBottom: 16, textAlign: "center", color: "white" }}>
              Your Profile
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to view your profile, track your progress, and manage your account.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: "#7E3FE4",
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#7E3FE4" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const username = sessionData.user.email?.split("@")[0] || "Warrior";
  const level = Math.floor((statsData?.totalXP || 0) / 100) + 1;
  const xpProgress = ((statsData?.totalXP || 0) % 100) / 100;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Hero Header with Gradient */}
            <LinearGradient
              colors={["#7E3FE4", "#C45FD4", "#5B8DEF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingBottom: 80, paddingTop: 20 }}
            >
              {/* Settings Button */}
            <View style={{ paddingHorizontal: 20, alignItems: "flex-end", marginBottom: 20 }}>
              <Pressable
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings size={20} color="white" />
              </Pressable>
            </View>

            {/* Avatar & Level */}
            <View style={{ alignItems: "center" }}>
              <View style={{ position: "relative" }}>
                {/* Avatar with Glow */}
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: "white",
                    shadowColor: "#FFD700",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 10,
                    overflow: "hidden",
                  }}
                >
                  {profileData?.avatar ? (
                    <Image
                      source={{ uri: profileData.avatar }}
                      style={{ width: "100%", height: "100%", borderRadius: 70 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 64, fontWeight: "bold", color: "white" }}>
                      {username.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Camera Button */}
                <Pressable
                  onPress={() => setShowAvatarModal(true)}
                  style={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#7E3FE4",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: "white",
                  }}
                >
                  <Camera size={20} color="white" />
                </Pressable>

                {/* Level Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    backgroundColor: "#FFD700",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 16 }}>LV {level}</Text>
                </View>
              </View>

              {/* Username */}
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                  marginTop: 20,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  textShadowColor: "rgba(0, 0, 0, 0.3)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {username}
              </Text>

              {/* XP Progress Bar */}
              <View style={{ width: "80%", marginTop: 16 }}>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${xpProgress * 100}%`,
                      height: "100%",
                      backgroundColor: "#FFD700",
                    }}
                  />
                </View>
                <Text style={{ color: "white", fontSize: 12, textAlign: "center", marginTop: 6, fontWeight: "600" }}>
                  {(statsData?.totalXP || 0) % 100} / 100 XP to Level {level + 1}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Cards */}
          <View style={{ marginTop: -60, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Streak Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#FF6B35" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Flame size={24} color="#FF6B35" />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>
                  {statsData?.currentStreak || 0}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>Day Streak</Text>
              </View>

              {/* Quests Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#7E3FE4" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Target size={24} color="#7E3FE4" />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>
                  {Math.floor((statsData?.totalPoints || 0) / 100)}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>Quests Done</Text>
              </View>

              {/* Trophies Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#FF6B35" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Trophy size={24} color="#FF6B35" />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>
                  {statsData?.trophies || 0}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>Trophies</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              marginTop: 20,
              marginHorizontal: 20,
              borderRadius: 16,
              padding: 4,
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
            }}
          >
            <Pressable
              onPress={() => setSelectedTab("quests")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "quests" ? "#7E3FE4" : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "quests" ? "white" : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                Quests
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("stats")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "stats" ? "#7E3FE4" : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "stats" ? "white" : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                Stats
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("about")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "about" ? "#7E3FE4" : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "about" ? "white" : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                About
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {selectedTab === "quests" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* Live Streaming Card */}
              <LinearGradient
                colors={["#FF0000", "#FF4081"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Video size={24} color="white" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", flex: 1 }}>
                    Go Live
                  </Text>
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>BETA</Text>
                  </View>
                </View>
                <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
                  Stream your quest challenges live and connect with the rejection therapy community!
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("LiveTab")}
                  style={{
                    backgroundColor: "white",
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FF0000", fontWeight: "bold", fontSize: 16 }}>Start Streaming</Text>
                </Pressable>
              </LinearGradient>

              {/* Quick Actions */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 16 }}>
                  Quick Actions
                </Text>
                <View style={{ gap: 12 }}>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#7E3FE4" + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap size={20} color="#7E3FE4" />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white", flex: 1 }}>
                      View Active Quests
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#FF6B35" + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Award size={20} color="#FF6B35" />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white", flex: 1 }}>
                      View Achievements
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {selectedTab === "stats" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* Detailed Stats */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 20 }}>
                  Your Progress
                </Text>

                <View style={{ gap: 20 }}>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>Total XP</Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#7E3FE4" }}>
                        {statsData?.totalXP || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(((statsData?.totalXP || 0) / 10000) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: "#7E3FE4",
                        }}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>
                        Total Points
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#00D9FF" }}>
                        {statsData?.totalPoints || 0}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>
                        Longest Streak
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#FF6B35" }}>
                        {statsData?.longestStreak || 0} days
                      </Text>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600" }}>Diamonds</Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#00D9FF" }}>
                        {statsData?.diamonds || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Rank Card */}
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={32} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: "900", color: "white", marginBottom: 4 }}>
                      #{Math.floor(Math.random() * 1000) + 1}
                    </Text>
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.9)", fontWeight: "600" }}>
                      Global Ranking
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {selectedTab === "about" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* User Context Card */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#7E3FE4" + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={20} color="#7E3FE4" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
                      AI Quest Context
                    </Text>
                  </View>
                  <Pressable onPress={() => setIsEditingAbout(!isEditingAbout)}>
                    {isEditingAbout ? (
                      <X size={24} color="rgba(255, 255, 255, 0.6)" />
                    ) : (
                      <Edit3 size={20} color="#7E3FE4" />
                    )}
                  </Pressable>
                </View>

                <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginBottom: 16, lineHeight: 20 }}>
                  Tell Ben about yourself to get personalized quests tailored to your goals and interests!
                </Text>

                {isEditingAbout ? (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 8 }}>
                        About You
                      </Text>
                      <TextInput
                        value={userContext}
                        onChangeText={setUserContext}
                        placeholder="e.g., I'm a software developer looking to network..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: "white",
                          borderWidth: 1,
                          borderColor: "rgba(126, 63, 228, 0.3)",
                          textAlignVertical: "top",
                          minHeight: 100,
                        }}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 8 }}>
                        Your Goals
                      </Text>
                      <TextInput
                        value={goals}
                        onChangeText={setGoals}
                        placeholder="e.g., Get more confident in public speaking..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: "white",
                          borderWidth: 1,
                          borderColor: "rgba(126, 63, 228, 0.3)",
                          textAlignVertical: "top",
                          minHeight: 100,
                        }}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 8 }}>
                        Interests & Hobbies
                      </Text>
                      <TextInput
                        value={interests}
                        onChangeText={setInterests}
                        placeholder="e.g., Fitness, startups, travel, music..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={2}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: "white",
                          borderWidth: 1,
                          borderColor: "rgba(126, 63, 228, 0.3)",
                          textAlignVertical: "top",
                          minHeight: 80,
                        }}
                      />
                    </View>

                    <Pressable
                      onPress={handleSaveContext}
                      style={{
                        backgroundColor: "#7E3FE4",
                        paddingVertical: 16,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Save size={20} color="white" />
                      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Save Context</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 4 }}>
                        About You
                      </Text>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", lineHeight: 20 }}>
                        {userContext || "No information added yet"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 4 }}>
                        Your Goals
                      </Text>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", lineHeight: 20 }}>
                        {goals || "No goals added yet"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 4 }}>
                        Interests
                      </Text>
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", lineHeight: 20 }}>
                        {interests || "No interests added yet"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Account Info */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 16 }}>
                  Account Info
                </Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: 4 }}>
                      Email
                    </Text>
                    <Text style={{ fontSize: 16, color: "white" }}>{sessionData.user.email}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: 4 }}>
                      Member Since
                    </Text>
                    <Text style={{ fontSize: 16, color: "white" }}>
                      {new Date(sessionData.user.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sign Out */}
              <Pressable
                onPress={handleLogout}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: "#FF3B30",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FF3B30", fontWeight: "bold", fontSize: 16 }}>Sign Out</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </LinearGradient>

      {/* Avatar Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>Choose Avatar</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <X size={28} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>

            <View style={{ gap: 16 }}>
              <Pressable
                onPress={() => {
                  Alert.alert("Coming Soon", "Upload your own photo avatar!");
                  setShowAvatarModal(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "#7E3FE4" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={28} color="#7E3FE4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginBottom: 4 }}>
                    Upload Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                    Choose from gallery or take a photo
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowAvatarModal(false);
                  setShowStyleModal(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: "#7E3FE4",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "#7E3FE4" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={28} color="#7E3FE4" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
                      Generate AI Avatar
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#7E3FE4",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "900", color: "white" }}>NEW</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                    Create a gaming-style avatar with AI
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Style Selection Modal */}
      <Modal visible={showStyleModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>Choose Avatar Style</Text>
              <Pressable onPress={() => setShowStyleModal(false)}>
                <X size={28} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              <View style={{ gap: 12 }}>
                {[
                  { style: "gaming", icon: "🎮", title: "Gaming Warrior", desc: "Epic futuristic warrior with neon glow" },
                  { style: "anime", icon: "⚡", title: "Anime Hero", desc: "Bold anime character with determined look" },
                  { style: "warrior", icon: "⚔️", title: "Fantasy Warrior", desc: "Powerful warrior with glowing armor" },
                  { style: "ninja", icon: "🥷", title: "Stealth Ninja", desc: "Mysterious ninja in action pose" },
                  { style: "mage", icon: "🔮", title: "Mystical Mage", desc: "Wizard casting magical spells" },
                  { style: "cyborg", icon: "🤖", title: "Cyberpunk Cyborg", desc: "Half human, half machine with neon lights" },
                  { style: "fantasy", icon: "✨", title: "Fantasy Hero", desc: "Magical character with glowing aura" },
                  { style: "realistic", icon: "👤", title: "Realistic Photo", desc: "Professional photorealistic portrait" },
                ].map((item) => (
                  <Pressable
                    key={item.style}
                    onPress={() => handleGenerateAvatar(item.style)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "#7E3FE4" + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 2 }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>{item.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      {isGenerating && (
        <Modal visible transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                width: "100%",
                maxWidth: 300,
              }}
            >
              <ActivityIndicator size="large" color="#7E3FE4" />
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginTop: 24, textAlign: "center" }}>
                Generating Your Avatar
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginTop: 8, textAlign: "center" }}>
                This may take 10-20 seconds...
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
