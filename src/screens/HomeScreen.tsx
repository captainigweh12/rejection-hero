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
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import type { GetUserQuestsResponse, GetUserStatsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"HomeTab">;

export default function HomeScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [questReminders, setQuestReminders] = useState(false);

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

  const activeQuests = questsData?.activeQuests || [];

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
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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

        {/* Stats Bar */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Flame size={20} color="#FF6B35" />
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{statsData?.currentStreak || 0}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Trophy size={20} color="#FFD700" />
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{statsData?.trophies || 0}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Diamond size={20} color="#00D9FF" />
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{statsData?.diamonds || 0}</Text>
          </View>
        </View>

        {/* Active Quests */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
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

        {/* Note about active quests */}
        <View className="px-6">
          <Text className="text-white/50 text-xs text-center">
            Max 2 active quests • Extra quests go to queue
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
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onPress={() => setShowMenu(false)}
        >
          <Pressable
            style={{
              width: "80%",
              height: "100%",
              backgroundColor: "#FFFFFF",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
              <ScrollView style={{ flex: 1 }}>
                {/* Header */}
                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 20,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: "#E8E9ED",
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#0A0A0F" }}>
                    Menu
                  </Text>
                  <Pressable onPress={() => setShowMenu(false)}>
                    <X size={28} color="#0A0A0F" />
                  </Pressable>
                </View>

                {/* User Profile Section */}
                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#E8E9ED",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "#FF6B35",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={32} color="#fff" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0A0A0F" }}>
                        {sessionData?.user?.name || "Quest Warrior"}
                      </Text>
                      <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                        Level {Math.floor((statsData?.totalXP || 0) / 100) + 1}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Menu Items */}
                <View style={{ paddingVertical: 8 }}>
                  {/* PROFILE Section */}
                  <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", letterSpacing: 1 }}>
                      PROFILE
                    </Text>
                  </View>

                  {/* Profile & Settings */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      navigation.navigate("ProfileTab");
                    }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <User size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Profile & Settings
                    </Text>
                  </Pressable>

                  {/* Settings */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      setShowSettings(true);
                    }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Settings size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Settings
                    </Text>
                  </Pressable>

                  {/* Help & Support */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <HelpCircle size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Help & Support
                    </Text>
                  </Pressable>

                  {/* Invite Warriors */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <UserPlus size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Invite Warriors
                    </Text>
                  </Pressable>

                  {/* ADVENTURE Section */}
                  <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", letterSpacing: 1 }}>
                      ADVENTURE
                    </Text>
                  </View>

                  {/* Quest Calendar */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Calendar size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Quest Calendar
                    </Text>
                  </Pressable>

                  {/* Past Quests */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <FileText size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Past Quests
                    </Text>
                  </Pressable>

                  {/* Leaderboard */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Trophy size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Leaderboard
                    </Text>
                  </Pressable>

                  {/* Growth & Achievements */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <TrendingUp size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Growth & Achievements
                    </Text>
                  </Pressable>

                  {/* COMMUNITY Section */}
                  <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", letterSpacing: 1 }}>
                      COMMUNITY
                    </Text>
                  </View>

                  {/* Groups */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      navigation.navigate("SwipeTab");
                    }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Users size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Groups
                    </Text>
                  </Pressable>

                  {/* Manage Categories */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <FolderOpen size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Manage Categories
                    </Text>
                  </Pressable>

                  {/* Explore World */}
                  <Pressable
                    onPress={() => setShowMenu(false)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Globe size={24} color="#0A0A0F" />
                    <Text style={{ fontSize: 16, color: "#0A0A0F", fontWeight: "500" }}>
                      Explore World
                    </Text>
                  </Pressable>

                  {/* Log out */}
                  <Pressable
                    onPress={() => {
                      setShowMenu(false);
                      // TODO: Implement logout
                    }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      marginTop: 24,
                    }}
                  >
                    <LogOut size={24} color="#FF3B30" />
                    <Text style={{ fontSize: 16, color: "#FF3B30", fontWeight: "500" }}>
                      Log out
                    </Text>
                  </Pressable>

                  {/* Version */}
                  <View style={{ paddingHorizontal: 24, paddingVertical: 16, alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: "#999" }}>
                      Version 1.0.0
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Pressable>
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
