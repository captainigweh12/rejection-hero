import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Animated,
  Switch,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Trophy,
  Diamond,
  Bell,
  Menu,
  Plus,
  Zap,
  X,
  User,
  Settings,
  HelpCircle,
  UserPlus,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  FolderOpen,
  Globe,
  LogOut,
  Sun,
  Video,
  ChevronRight,
  Shield,
  MessageCircle,
  Heart,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  GetUserQuestsResponse,
  GetUserStatsResponse,
  GetReflectionPromptResponse,
  GetCourageBoostResponse,
  GetWeeklyForecastResponse,
  GetProfileResponse,
  GetActiveChallengeResponse,
  SwapQuestRequest,
  SwapQuestResponse,
} from "@/shared/contracts";

type Props = BottomTabScreenProps<"HomeTab">;

export default function HomeScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [questReminders, setQuestReminders] = useState(false);
  const [selectedFriendQuest, setSelectedFriendQuest] = useState<any>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [showFriendsQuests, setShowFriendsQuests] = useState(true);
  const [isRefreshingQuests, setIsRefreshingQuests] = useState(false);

  // Debug log - can be removed in production
  // console.log("[HomeScreen] Rendering - User logged in:", !!sessionData?.user);

  const { data: questsData, isLoading: questsLoading, error: questsError, refetch: refetchQuests } = useQuery<GetUserQuestsResponse>({
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

  const { data: profileData } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch active challenge
  const { data: challengeData } = useQuery<GetActiveChallengeResponse>({
    queryKey: ["active-challenge"],
    queryFn: async () => {
      return api.get<GetActiveChallengeResponse>("/api/challenges/active");
    },
    enabled: !!sessionData?.user,
    refetchInterval: 60000, // Refetch every minute to update current day
  });

  const { data: reflectionPrompt } = useQuery<GetReflectionPromptResponse>({
    queryKey: ["reflectionPrompt"],
    queryFn: async () => {
      return api.get<GetReflectionPromptResponse>("/api/stats/reflection-prompt");
    },
    enabled: !!sessionData?.user,
  });

  const { data: weeklyForecast } = useQuery<GetWeeklyForecastResponse>({
    queryKey: ["weeklyForecast"],
    queryFn: async () => {
      return api.get<GetWeeklyForecastResponse>("/api/stats/weekly-forecast");
    },
    enabled: !!sessionData?.user,
  });

  const activeQuests = questsData?.activeQuests || [];
  const queuedQuests = questsData?.queuedQuests || [];

  // Swap quest mutation
  const swapQuestMutation = useMutation({
    mutationFn: async (data: SwapQuestRequest) => {
      return api.post<SwapQuestResponse>("/api/quests/swap", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      Alert.alert("Success", "Quests swapped successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.toString() || "Failed to swap quests";
      Alert.alert("Error", errorMessage);
    },
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

  const handleDeleteQuest = async (userQuestId: string, questTitle: string) => {
    Alert.alert(
      "Delete Quest",
      `Are you sure you want to delete "${questTitle}" from your queue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/quests/${userQuestId}`);
              // Refetch quests to update the UI
              refetchQuests();
            } catch (error) {
              Alert.alert("Error", "Failed to delete quest. Please try again.");
              console.error("Delete quest error:", error);
            }
          },
        },
      ]
    );
  };

  const handleRefreshAllQuests = async () => {
    setIsRefreshingQuests(true);
    try {
      const response = await api.post<any>("/api/quests/refresh-all", {
        count: 3,
      });

      if (response.success) {
        console.log(`[HomeScreen] Refreshed quests: ${response.newQuestCount} new quests generated`);
        // Refetch quests to update the UI
        refetchQuests();
        Alert.alert("Success", `Generated ${response.newQuestCount} new quests!`);
      }
    } catch (error) {
      console.error("[HomeScreen] Refresh quests error:", error);
      Alert.alert("Error", "Failed to refresh quests. Please try again.");
    } finally {
      setIsRefreshingQuests(false);
    }
  };

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
            Welcome to Rejection Hero!
          </Text>
          <Text className="text-white/70 text-lg text-center mb-8">
            Transform rejection into growth. Start your epic journey to overcome fear and build
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
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Gaming-Style Header with Profile */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            {/* Left: Hamburger Menu */}
            <Pressable onPress={() => setShowMenu(true)} style={{ width: 40 }}>
              <Menu size={24} color={colors.text} />
            </Pressable>

            {/* Center: Modern Gaming Logo with Gradient */}
            <LinearGradient
              colors={["#FF6B35", "#FFD700", "#00D9FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 12, padding: 2 }}
            >
              <View style={{ backgroundColor: colors.backgroundSolid, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "900",
                  letterSpacing: 1,
                  textTransform: "uppercase"
                }}>
                  REJECTION HERO
                </Text>
              </View>
            </LinearGradient>

            {/* Right: Notifications */}
            <Pressable style={{ width: 40, alignItems: "flex-end" }}>
              <Bell size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Gaming Profile Card */}
          <Pressable
            onPress={() => navigation.navigate("ProfileTab")}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 16,
              borderWidth: 2,
              borderColor: colors.cardBorder,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {/* 3D Avatar with Level Badge */}
              <View style={{ position: "relative" }}>
                <LinearGradient
                  colors={["#FF6B35", "#7E3FE4", "#00D9FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    padding: 3,
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 37,
                      backgroundColor: colors.backgroundSolid,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {profileData?.avatar ? (
                      <Image
                        source={{ uri: profileData.avatar }}
                        style={{ width: 70, height: 70, borderRadius: 35 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={["#FF6B35", "#FF8C61"]}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 35,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <User size={36} color={colors.text} strokeWidth={2.5} />
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>

                {/* Level Badge */}
                <View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    backgroundColor: "#FFD700",
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderWidth: 2,
                    borderColor: colors.backgroundSolid,
                    shadowColor: "#FFD700",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: "#000", fontSize: 12, fontWeight: "bold" }}>
                    {Math.floor((statsData?.totalXP || 0) / 100) + 1}
                  </Text>
                </View>
              </View>

              {/* User Info & Stats */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
                  {sessionData?.user?.name || "Quest Warrior"}
                </Text>

                {/* 3D Stats Row */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {/* Streak */}
                  <View
                    style={{
                      backgroundColor: "rgba(255, 107, 53, 0.2)",
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderWidth: 1,
                      borderColor: "rgba(255, 107, 53, 0.4)",
                    }}
                  >
                    <Flame size={16} color="#FF6B35" fill="#FF6B35" />
                    <Text style={{ color: "#FF6B35", fontSize: 14, fontWeight: "bold" }}>
                      {statsData?.currentStreak || 0}
                    </Text>
                  </View>

                  {/* Trophy */}
                  <View
                    style={{
                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderWidth: 1,
                      borderColor: "rgba(255, 215, 0, 0.4)",
                    }}
                  >
                    <Trophy size={16} color="#FFD700" fill="#FFD700" />
                    <Text style={{ color: "#FFD700", fontSize: 14, fontWeight: "bold" }}>
                      {statsData?.trophies || 0}
                    </Text>
                  </View>

                  {/* Diamonds */}
                  <View
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderWidth: 1,
                      borderColor: "rgba(0, 217, 255, 0.4)",
                    }}
                  >
                    <Diamond size={16} color="#00D9FF" fill="#00D9FF" />
                    <Text style={{ color: "#00D9FF", fontSize: 14, fontWeight: "bold" }}>
                      {statsData?.diamonds || 0}
                    </Text>
                  </View>
                </View>

                {/* XP Progress Bar */}
                <View style={{ marginTop: 8 }}>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.cardBorder,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#7E3FE4", "#00D9FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${((statsData?.totalXP || 0) % 100)}%`,
                      }}
                    />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                    {(statsData?.totalXP || 0) % 100}/100 XP to Level {Math.floor((statsData?.totalXP || 0) / 100) + 2}
                  </Text>
                </View>

                {/* Confidence Meter - NEW */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
                      Confidence Meter
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ color: "#00D9FF", fontSize: 14, fontWeight: "bold" }}>
                        {statsData?.confidenceLevel || 50}%
                      </Text>
                      {statsData?.confidenceChange !== 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <TrendingUp size={12} color={statsData?.confidenceChange && statsData.confidenceChange > 0 ? "#4CAF50" : "#FF6B35"} />
                          <Text
                            style={{
                              color: statsData?.confidenceChange && statsData.confidenceChange > 0 ? "#4CAF50" : "#FF6B35",
                              fontSize: 11,
                              fontWeight: "600",
                              marginLeft: 2,
                            }}
                          >
                            {statsData?.confidenceChange && statsData.confidenceChange > 0 ? "+" : ""}
                            {statsData?.confidenceChange || 0}% this week
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.cardBorder,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#00D9FF", "#00F5A0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${statsData?.confidenceLevel || 50}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>

          {/* 100 Day Challenge Card */}
          {challengeData?.challenge && (
            <View style={{ paddingHorizontal: 24, paddingVertical: 8, marginTop: 20 }}>
              <Pressable
                onPress={() => {
                  // Navigate to quest if today's quest is available
                  if (challengeData.challenge?.todayQuest?.userQuestId) {
                    // Find the userQuest in activeQuests
                    const challengeUserQuest = activeQuests.find(
                      (uq) => uq.id === challengeData.challenge?.todayQuest?.userQuestId
                    );
                    if (challengeUserQuest) {
                      navigation.navigate("QuestDetail", { userQuestId: challengeUserQuest.id });
                    }
                  }
                }}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: colors.cardBorder,
                  shadowColor: "#7E3FE4",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <LinearGradient
                      colors={["#7E3FE4", "#00D9FF", "#FFD700"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trophy size={28} color="#FFF" fill="#FFF" />
                    </LinearGradient>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                        100 Day Challenge
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {challengeData.challenge.category} • Day {challengeData.challenge.currentDay} of 100
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>

                {/* Progress Bar */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
                      Progress
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
                      {challengeData.challenge.completedDays} / 100 days
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: colors.cardBorder,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#7E3FE4", "#00D9FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${(challengeData.challenge.completedDays / 100) * 100}%`,
                      }}
                    />
                  </View>
                </View>

                {/* Today's Quest Status */}
                {challengeData.challenge.todayQuest ? (
                  <View
                    style={{
                      backgroundColor: challengeData.challenge.todayQuest.status === "COMPLETED" 
                        ? "rgba(76, 175, 80, 0.1)" 
                        : challengeData.challenge.todayQuest.status === "ACTIVE"
                        ? "rgba(126, 63, 228, 0.1)"
                        : "rgba(255, 107, 53, 0.1)",
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: challengeData.challenge.todayQuest.status === "COMPLETED" 
                        ? "rgba(76, 175, 80, 0.3)" 
                        : challengeData.challenge.todayQuest.status === "ACTIVE"
                        ? "rgba(126, 63, 228, 0.3)"
                        : "rgba(255, 107, 53, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
                          Day {challengeData.challenge.currentDay} Quest
                        </Text>
                        {challengeData.challenge.todayQuest.quest && (
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={2}>
                            {challengeData.challenge.todayQuest.quest.title}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          backgroundColor: challengeData.challenge.todayQuest.status === "COMPLETED" 
                            ? "#4CAF50" 
                            : challengeData.challenge.todayQuest.status === "ACTIVE"
                            ? "#7E3FE4"
                            : "#FF6B35",
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold", textTransform: "uppercase" }}>
                          {challengeData.challenge.todayQuest.status === "COMPLETED" 
                            ? "✓ Done" 
                            : challengeData.challenge.todayQuest.status === "ACTIVE"
                            ? "Active"
                            : "Pending"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 107, 53, 0.1)",
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 107, 53, 0.3)",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: "center" }}>
                      Today's quest will be generated soon...
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* Active Quests */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 8, marginTop: 20 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              My Active Quests
            </Text>
            {questsLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={colors.secondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading quests...</Text>
              </View>
            ) : activeQuests.length === 0 ? (
              <View
                style={{
                  padding: 32,
                  borderRadius: 24,
                  alignItems: "center",
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>No Active Quests</Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
                  Start your rejection challenge journey! Tap the Create button to generate a quest
                  with AI.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("CreateQuest")}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: colors.secondary,
                  }}
                >
                  <Plus size={20} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>Create Quest</Text>
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
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
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
                        <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{quest.title}</Text>

                        {/* Description */}
                        <Text className="text-sm mb-4" style={{ color: colors.textSecondary }} numberOfLines={2}>
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
                          <Text className="text-center font-bold" style={{ color: colors.text }}>
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

          {/* Fear Zones Analyzer - NEW */}
          <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Fear Zones
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                {/* Easy Zone */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(76, 175, 80, 0.2)",
                      borderWidth: 2,
                      borderColor: "#4CAF50",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#4CAF50", fontSize: 20, fontWeight: "bold" }}>
                      {statsData?.easyZoneCount || 0}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#4CAF50",
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center" }}>
                    Easy Zone
                  </Text>
                </View>

                {/* Growth Zone */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                      borderWidth: 2,
                      borderColor: "#FFD700",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#FFD700", fontSize: 20, fontWeight: "bold" }}>
                      {statsData?.growthZoneCount || 0}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#FFD700",
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center" }}>
                    Growth Zone
                  </Text>
                </View>

                {/* Fear Zone */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(255, 107, 53, 0.2)",
                      borderWidth: 2,
                      borderColor: "#FF6B35",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#FF6B35", fontSize: 20, fontWeight: "bold" }}>
                      {statsData?.fearZoneCount || 0}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#FF6B35",
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center" }}>
                    Fear Zone
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI Reflection Prompt of the Day - NEW */}
          {reflectionPrompt && (
            <Pressable
              onPress={() => navigation.navigate("JournalTab")}
              style={{ paddingHorizontal: 24, marginTop: 20 }}
            >
              <LinearGradient
                colors={["rgba(126, 63, 228, 0.3)", "rgba(255, 107, 53, 0.3)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <FileText size={20} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
                    Reflection of the Day
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 }}>
                  {reflectionPrompt.prompt}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Tap to journal
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Weekly NO Forecast - NEW */}
          {weeklyForecast && (
            <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
              <View
                style={{
                  backgroundColor: "rgba(0, 217, 255, 0.1)",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(0, 217, 255, 0.3)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Calendar size={20} color="#00D9FF" />
                  <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
                    Weekly NO Forecast
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                  {weeklyForecast.forecast}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Suggested Target
                    </Text>
                    <Text style={{ color: "#00D9FF", fontSize: 18, fontWeight: "bold" }}>
                      {weeklyForecast.recommendedWeeklyTarget} NOs
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Trending
                    </Text>
                    <Text style={{ color: "#FFD700", fontSize: 14, fontWeight: "bold", textTransform: "capitalize" }}>
                      {weeklyForecast.trendingCategory}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Queued Quests Section */}
        {queuedQuests.length > 0 && (
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                Quest Queue
              </Text>
              <Pressable
                onPress={handleRefreshAllQuests}
                disabled={isRefreshingQuests}
                style={{
                  backgroundColor: "rgba(0, 217, 255, 0.2)",
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(0, 217, 255, 0.3)",
                }}
              >
                {isRefreshingQuests ? (
                  <ActivityIndicator size={18} color="#00D9FF" />
                ) : (
                  <RefreshCw size={18} color="#00D9FF" />
                )}
              </Pressable>
            </View>
            {queuedQuests.map((userQuest, index) => {
              const quest = userQuest.quest;
              return (
                <Pressable
                  key={userQuest.id}
                  onPress={() => {
                    // Allow user to start queued quest if they have less than 2 active quests
                    if (activeQuests.length < 2) {
                      navigation.navigate("QuestDetail", { userQuestId: userQuest.id });
                    } else {
                      Alert.alert(
                        "Quest Queue",
                        "You already have 2 active quests. Complete one to start this queued quest.",
                        [{ text: "OK" }]
                      );
                    }
                  }}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <View
                        style={{
                          backgroundColor: "rgba(255, 215, 0, 0.2)",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>
                          #{index + 1} IN QUEUE
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: `${getDifficultyColor(quest.difficulty)}20`,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: getDifficultyColor(quest.difficulty),
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {quest.difficulty}
                        </Text>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <Pressable
                      onPress={() => handleDeleteQuest(userQuest.id, quest.title)}
                      style={{
                        backgroundColor: "rgba(255, 59, 48, 0.2)",
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "rgba(255, 59, 48, 0.3)",
                      }}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </Pressable>
                  </View>

                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                    {quest.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
                    {quest.description}
                  </Text>

                  {/* Rewards */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 107, 53, 0.2)",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#FF6B35", textAlign: "center", fontWeight: "600" }}>
                        +{quest.xpReward} XP
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 215, 0, 0.2)",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#FFD700", textAlign: "center", fontWeight: "600" }}>
                        +{quest.pointReward} pts
                      </Text>
                    </View>
                  </View>

                  {activeQuests.length < 2 && (
                    <View
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.cardBorder,
                      }}
                    >
                      <Text style={{ color: "#00D9FF", fontSize: 12, textAlign: "center" }}>
                        Tap to start this quest
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Note about active quests */}
        <View className="px-6 pt-4">
          <Text className="text-white/50 text-xs text-center">
            1 slot for your quests • 1 slot for friend quests
          </Text>
          <Text className="text-white/50 text-xs text-center mt-1">
            Complete quests to unlock new ones from the queue
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
        </SafeAreaView>
      </LinearGradient>

      {/* Menu Drawer Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.modalOverlay }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowMenu(false)}
          />
          <View
            style={{
              width: "85%",
              height: "100%",
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: colors.backgroundSolid,
            }}
          >
              <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                  {/* Header with 3D Glass Effect */}
                  <View
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 20,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
                      Menu
                    </Text>
                    <Pressable
                      onPress={() => setShowMenu(false)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <X size={24} color={colors.text} />
                    </Pressable>
                  </View>

                  {/* User Profile Section with 3D Glass Morphism */}
                  <View
                    style={{
                      marginHorizontal: 20,
                      marginTop: 20,
                      padding: 20,
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: colors.cardBorder,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      {profileData?.avatar ? (
                        <Image
                          source={{ uri: profileData.avatar }}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={["#FF6B35", "#FF8C61"]}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <User size={32} color="#fff" />
                        </LinearGradient>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                          {sessionData?.user?.name || "Quest Warrior"}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View
                            style={{
                              backgroundColor: colors.primaryLight,
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                              Level {Math.floor((statsData?.totalXP || 0) / 100) + 1}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: "rgba(255, 215, 0, 0.3)",
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              borderWidth: 1,
                              borderColor: "rgba(255, 215, 0, 0.5)",
                            }}
                          >
                            <Flame size={14} color="#FFD700" />
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFD700" }}>
                              {statsData?.currentStreak || 0}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* PROFILE Section */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, letterSpacing: 1 }}>
                      PROFILE
                    </Text>
                  </View>

                  <View style={{ gap: 12, paddingHorizontal: 20 }}>
                    {/* Profile */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("ProfileTab");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 107, 53, 0.3)",
                        shadowColor: "#FF6B35",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255, 107, 53, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                          borderWidth: 2,
                          borderColor: "rgba(255, 107, 53, 0.4)",
                        }}
                      >
                        <User size={24} color="#FF6B35" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Profile
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Settings */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("Settings");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(0, 217, 255, 0.3)",
                        shadowColor: "#00D9FF",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
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
                          borderWidth: 2,
                          borderColor: "rgba(0, 217, 255, 0.4)",
                        }}
                      >
                        <Settings size={24} color="#00D9FF" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Settings
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Support */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("Support");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(76, 175, 80, 0.3)",
                        shadowColor: "#4CAF50",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(76, 175, 80, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                          borderWidth: 2,
                          borderColor: "rgba(76, 175, 80, 0.4)",
                        }}
                      >
                        <HelpCircle size={24} color="#4CAF50" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Support
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Invite Warriors */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("InviteWarriors");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        shadowColor: "#FFD700",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255, 215, 0, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                          borderWidth: 2,
                          borderColor: "rgba(255, 215, 0, 0.4)",
                        }}
                      >
                        <UserPlus size={24} color="#FFD700" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Invite Warriors
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  {/* ADVENTURE Section */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255, 255, 255, 0.6)", letterSpacing: 1 }}>
                      ADVENTURE
                    </Text>
                  </View>

                  <View style={{ gap: 12, paddingHorizontal: 20 }}>
                    {/* Quest Calendar */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("QuestCalendar");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        shadowColor: "#7E3FE4",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
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
                          borderWidth: 2,
                          borderColor: "rgba(126, 63, 228, 0.4)",
                        }}
                      >
                        <Calendar size={24} color="#7E3FE4" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Quest Calendar
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Leaderboard */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("GrowthAchievements");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        shadowColor: "#FFD700",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255, 215, 0, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                          borderWidth: 2,
                          borderColor: "rgba(255, 215, 0, 0.4)",
                        }}
                      >
                        <Trophy size={24} color="#FFD700" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Leaderboard
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Explore World */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("MapTab");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(0, 217, 255, 0.3)",
                        shadowColor: "#00D9FF",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
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
                          borderWidth: 2,
                          borderColor: "rgba(0, 217, 255, 0.4)",
                        }}
                      >
                        <Globe size={24} color="#00D9FF" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Explore World
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Manage Categories */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("ManageCategories");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 107, 53, 0.3)",
                        shadowColor: "#FF6B35",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255, 107, 53, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                          borderWidth: 2,
                          borderColor: "rgba(255, 107, 53, 0.4)",
                        }}
                      >
                        <FolderOpen size={24} color="#FF6B35" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Manage Categories
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  {/* COMMUNITY Section */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255, 255, 255, 0.6)", letterSpacing: 1 }}>
                      COMMUNITY
                    </Text>
                  </View>

                  <View style={{ gap: 12, paddingHorizontal: 20 }}>
                    {/* Friends */}
                    <Pressable
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate("Friends");
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        shadowColor: "#7E3FE4",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
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
                          borderWidth: 2,
                          borderColor: "rgba(126, 63, 228, 0.4)",
                        }}
                      >
                        <Users size={24} color="#7E3FE4" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                        Friends
                      </Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  {/* Logout */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 }}>
                    <Pressable
                      onPress={handleLogout}
                      style={{
                        backgroundColor: "rgba(255, 59, 48, 0.1)",
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 59, 48, 0.3)",
                      }}
                    >
                      <LogOut size={20} color="#FF3B30" />
                      <Text style={{ fontSize: 16, color: "#FF3B30", fontWeight: "600", marginLeft: 12 }}>
                        Sign Out
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </SafeAreaView>
          </View>
        </View>
      </Modal>
      {/* Settings Modal */}
      {showSettings && (
        <Modal
          visible={showSettings}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettings(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={() => setShowSettings(false)}
          >
            <Pressable
              style={{ flex: 1, justifyContent: "flex-end" }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={{ backgroundColor: "#E8E9ED", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" }}>
                <View style={{ backgroundColor: "white", paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>Settings</Text>
                  <Pressable onPress={() => setShowSettings(false)}>
                    <X size={24} color="#333" />
                  </Pressable>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                  {/* Account Section */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 16 }}>Account</Text>
                  </View>

                  {/* Appearance */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Appearance</Text>
                    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <Sun size={24} color="#333" />
                          <View>
                            <Text style={{ fontWeight: "600", fontSize: 16 }}>Theme</Text>
                            <Text style={{ color: "#999", fontSize: 14 }}>Light Mode</Text>
                          </View>
                        </View>
                        <Switch value={darkMode} onValueChange={setDarkMode} />
                      </View>
                    </View>
                  </View>

                  {/* Preferences */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Preferences</Text>
                    <Pressable style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Globe size={24} color="#333" />
                        <View>
                          <Text style={{ fontWeight: "600", fontSize: 16 }}>Language</Text>
                          <Text style={{ color: "#999", fontSize: 14 }}>English</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#999" />
                    </Pressable>
                  </View>

                  {/* Live Features */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Live Features</Text>
                    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                        <Video size={24} color="#333" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4 }}>Enable Live</Text>
                          <Text style={{ color: "#999", fontSize: 14 }}>
                            Configure backend and unlock livestreaming features
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          setShowSettings(false);
                          navigation.navigate("LiveTab");
                        }}
                        style={{
                          backgroundColor: "#FF6B35",
                          paddingVertical: 14,
                          borderRadius: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>Enable</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Notifications */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Notifications</Text>
                    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                        <Bell size={24} color="#333" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", fontSize: 16 }}>Quest Reminders</Text>
                          <Text style={{ color: "#999", fontSize: 14 }}>Get notified to complete daily quests</Text>
                        </View>
                      </View>
                      <Switch value={questReminders} onValueChange={setQuestReminders} />
                    </View>
                  </View>

                  {/* Legal */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Legal</Text>
                    <Pressable style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Shield size={24} color="#333" />
                        <View>
                          <Text style={{ fontWeight: "600", fontSize: 16 }}>Safety Guidelines</Text>
                          <Text style={{ color: "#999", fontSize: 14 }}>Read important safety information</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#999" />
                    </Pressable>
                  </View>

                  {/* Account Actions */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Account</Text>
                    <Pressable
                      onPress={handleLogout}
                      style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}
                    >
                      <Text style={{ color: "#FF3B30", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                        Sign Out
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
