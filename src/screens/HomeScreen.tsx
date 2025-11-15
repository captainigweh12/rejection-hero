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
import { useQuery } from "@tanstack/react-query";
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

  console.log("[HomeScreen] Rendering - User logged in:", !!sessionData?.user);

  const { data: questsData, isLoading: questsLoading, error: questsError } = useQuery<GetUserQuestsResponse>({
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
            Welcome to Go for No!
          </Text>
          <Text className="text-white/70 text-lg text-center mb-8">
            Transform rejection into growth. Start your journey to overcome fear and build
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
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Gaming-Style Header with Profile */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>Go for No</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Pressable>
                <Bell size={24} color="#fff" />
              </Pressable>
              <Pressable onPress={() => setShowMenu(true)}>
                <Menu size={24} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Gaming Profile Card */}
          <Pressable
            onPress={() => navigation.navigate("ProfileTab")}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 20,
              padding: 16,
              borderWidth: 2,
              borderColor: "rgba(126, 63, 228, 0.4)",
              shadowColor: "#7E3FE4",
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
                      backgroundColor: "#1A1A24",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
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
                      <User size={36} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
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
                    borderColor: "#1A1A24",
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
                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
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
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
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
                  <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 10, marginTop: 2 }}>
                    {(statsData?.totalXP || 0) % 100}/100 XP to Level {Math.floor((statsData?.totalXP || 0) / 100) + 2}
                  </Text>
                </View>

                {/* Confidence Meter - NEW */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontWeight: "600" }}>
                      Confidence Level
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
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
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

          {/* Fear Zones Analyzer - NEW */}
          <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Fear Zones
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
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
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, textAlign: "center" }}>
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
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, textAlign: "center" }}>
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
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, textAlign: "center" }}>
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
                  borderColor: "rgba(126, 63, 228, 0.5)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <FileText size={20} color="#7E3FE4" />
                  <Text style={{ color: "#7E3FE4", fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
                    Reflection of the Day
                  </Text>
                </View>
                <Text style={{ color: "white", fontSize: 15, lineHeight: 22, marginBottom: 8 }}>
                  {reflectionPrompt.prompt}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
                    Tap to journal
                  </Text>
                  <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" style={{ marginLeft: 4 }} />
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
                <Text style={{ color: "white", fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                  {weeklyForecast.forecast}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <View>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11 }}>
                      Suggested Target
                    </Text>
                    <Text style={{ color: "#00D9FF", fontSize: 18, fontWeight: "bold" }}>
                      {weeklyForecast.recommendedWeeklyTarget} NOs
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11 }}>
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

        {/* Active Quests */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            My Active Quests
          </Text>
          {questsLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", marginTop: 16 }}>Loading quests...</Text>
            </View>
          ) : activeQuests.length === 0 ? (
            <View
              style={{
                padding: 32,
                borderRadius: 24,
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>No Active Quests</Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", marginBottom: 24 }}>
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
                  backgroundColor: "#FF6B35",
                }}
              >
                <Plus size={20} color="#fff" />
                <Text style={{ color: "white", fontWeight: "bold" }}>Create Quest</Text>
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
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
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
                      <Text className="text-white text-2xl font-bold mb-2">{quest.title}</Text>

                      {/* Description */}
                      <Text className="text-white/70 text-sm mb-4" numberOfLines={2}>
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
                        <Text className="text-white text-center font-bold">
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

        {/* Queued Quests Section */}
        {queuedQuests.length > 0 && (
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              Quest Queue
            </Text>
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                  </View>

                  <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                    {quest.title}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 12 }}>
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
                        borderTopColor: "rgba(255, 255, 255, 0.1)",
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
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowMenu(false)}
          />
          <View
            style={{
              width: "85%",
              height: "100%",
              backgroundColor: colors.background,
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Header */}
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
                    }}
                  >
                    <X size={24} color={colors.text} />
                  </Pressable>
                </View>

                {/* User Profile Section */}
                <View
                  style={{
                    marginHorizontal: 20,
                    marginTop: 20,
                    padding: 20,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        {sessionData?.user?.name || "Quest Warrior"}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                            Level {Math.floor((statsData?.totalXP || 0) / 100) + 1}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: colors.warning + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Flame size={14} color={colors.warning} />
                          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
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

                <View style={{ gap: 8, paddingHorizontal: 20 }}>
                  {/* Profile & Settings */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      navigation.navigate("ProfileTab");
                    }}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <User size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Profile & Settings
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
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Settings size={20} color={colors.info} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Settings
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Help & Support */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <HelpCircle size={20} color={colors.success} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Help & Support
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Invite Warriors */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <UserPlus size={20} color={colors.warning} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Invite Warriors
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* ADVENTURE Section */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, letterSpacing: 1 }}>
                    ADVENTURE
                  </Text>
                </View>

                <View style={{ gap: 8, paddingHorizontal: 20 }}>
                  {/* Quest Calendar */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Calendar size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Quest Calendar
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Past Quests */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <FileText size={20} color={colors.info} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Past Quests
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Leaderboard */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Trophy size={20} color={colors.warning} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Leaderboard
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Growth & Achievements */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <TrendingUp size={20} color={colors.success} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Growth & Achievements
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* COMMUNITY Section */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, letterSpacing: 1 }}>
                    COMMUNITY
                  </Text>
                </View>

                <View style={{ gap: 8, paddingHorizontal: 20 }}>
                  {/* Groups */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      navigation.navigate("SwipeTab");
                    }}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Users size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Groups
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Manage Categories */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <FolderOpen size={20} color={colors.info} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Manage Categories
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>

                  {/* Explore World */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Globe size={20} color={colors.success} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: "600", flex: 1 }}>
                      Explore World
                    </Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* Log out */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                  <Pressable
                    onPress={async () => {
                      setShowMenu(false);
                      await authClient.signOut();
                    }}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: colors.error,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.error + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <LogOut size={20} color={colors.error} />
                    </View>
                    <Text style={{ fontSize: 16, color: colors.error, fontWeight: "700", flex: 1 }}>
                      Log out
                    </Text>
                  </Pressable>
                </View>

                {/* Version */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 20, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>
                    Version 1.0.0
                  </Text>
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
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Enable</Text>
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
